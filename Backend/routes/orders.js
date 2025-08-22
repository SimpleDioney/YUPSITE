const express = require('express');
const { authMiddleware, printerMiddleware } = require('../middleware/auth');
const db = require('../database/db');
const { getAsync, runAsync } = require('../utils/dbHelpers');
const { validateCoupon } = require('./coupons'); // Importa a função de validação de cupom
const router = express.Router();

// Criar pedido (requer autenticação)
router.post('/', authMiddleware, async (req, res) => {
  const { items, delivery_address, payment_method, coupon_code, delivery_fee } = req.body;
  const user_id = req.user.id;

  if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Pedido deve conter pelo menos um item' });
  }

  try {
      await runAsync('BEGIN TRANSACTION');

      // 1. Calcular o subtotal e validar estoque
      let subtotal = 0;
      for (const item of items) {
          const product = await getAsync('SELECT * FROM products WHERE id = CAST(? AS INTEGER) AND is_active = 1', [item.product_id]);
          if (!product) throw new Error(`Produto não encontrado: id ${item.product_id}`);
          if (product.stock < item.quantity) throw new Error(`Estoque insuficiente para ${product.name}`);
          
          subtotal += product.price * item.quantity;
          item.price = product.price; // Garante o preço do momento da compra
      }

      // 2. Validar o cupom
      let discountAmount = 0;
      let validCoupon = null;
      const safeDeliveryFee = delivery_fee || 0;

      if (coupon_code) {
          const couponValidation = await validateCoupon(coupon_code, subtotal);
          if (!couponValidation.isValid) {
              await runAsync('ROLLBACK');
              return res.status(400).json({ error: couponValidation.message });
          }
          discountAmount = couponValidation.discountAmount;
          validCoupon = couponValidation.coupon;
      }

      // 3. Calcular o total final
      let finalTotal = subtotal + safeDeliveryFee - discountAmount;

      // 4. Criar o pedido
      const insertOrder = await runAsync(
          'INSERT INTO orders (user_id, total, subtotal, delivery_address, payment_method, coupon_code, discount_amount, delivery_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [user_id, finalTotal, subtotal, delivery_address, payment_method, validCoupon ? validCoupon.code : null, discountAmount, delivery_fee || 0]
      );
      const order_id = insertOrder.lastID;

      // 5. Adicionar itens do pedido (com nome e foto) e atualizar estoque
      for (const item of items) {
          // Busca o produto novamente para garantir que temos nome e foto
          const product = await getAsync('SELECT name, photo FROM products WHERE id = ?', [item.product_id]);
          
          // --- A CORREÇÃO ESTÁ AQUI ---
          // Adicionamos 'product_name' e 'product_photo' na inserção
          await runAsync(
              'INSERT INTO order_items (order_id, product_id, quantity, price, product_name) VALUES (?, ?, ?, ?, ?)',
              [order_id, item.product_id, item.quantity, item.price, product.name]
          );

          // Atualiza o estoque
          await runAsync(
              'UPDATE products SET stock = stock - ? WHERE id = ?',
              [item.quantity, item.product_id]
          );
      }

      // 6. Incrementar o uso do cupom
      if (validCoupon) {
          await runAsync('UPDATE coupons SET times_used = times_used + 1 WHERE id = ?', [validCoupon.id]);
      }

      await runAsync('COMMIT');

      res.status(201).json({
          message: 'Pedido criado com sucesso',
          order_id,
          total: finalTotal,
      });
  } catch (error) {
      await runAsync('ROLLBACK');
      console.error("Erro ao criar pedido:", error); // Adicionado log de erro
      res.status(400).json({ error: error.message || 'Erro ao criar pedido' });
  }
});


// Listar pedidos do usuário (sem alterações)
router.get('/my-orders', authMiddleware, (req, res) => {
  const user_id = req.user.id;

  db.all(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [user_id],
    (err, orders) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar pedidos' });
      }
      // Converter valores numéricos
      const ordersWithNumericValues = orders.map(order => {
        const total = parseFloat(order.total || 0);
        const deliveryFee = parseFloat(order.delivery_fee || 0);
        const discountAmount = parseFloat(order.discount_amount || 0);
        return {
          ...order,
          total_amount: total,
          delivery_fee: deliveryFee,
          discount_amount: discountAmount,
          subtotal: total + discountAmount - deliveryFee // Subtotal = total + desconto - frete
        };
      });
      res.json(ordersWithNumericValues);
    }
  );
});


router.get('/to-print', printerMiddleware, (req, res) => {
    const sql = `
        SELECT o.*, 
               u.name as user_name, 
               u.phone as user_phone,
               u.address as user_address
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.payment_status = 'approved' AND o.is_printed = 0
    `;
    db.all(sql, [], (err, orders) => {
        if (err) {
            console.error('Erro ao buscar pedidos para impressão:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        const promises = orders.map(order => {
            return new Promise((resolve, reject) => {
                db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id], (err, items) => {
                    if (err) return reject(err);
                    order.items = items;
                    resolve(order);
                });
            });
        });
        Promise.all(promises)
            .then(completedOrders => res.json(completedOrders))
            .catch(error => {
                console.error('Erro ao buscar itens dos pedidos:', error);
                res.status(500).json({ error: 'Erro ao buscar itens dos pedidos' });
            });
    });
});

// ROTA PUT PARA MARCAR UM PEDIDO COMO IMPRESSO
// Adicionamos o 'printerMiddleware' para proteger a rota
router.put('/:id/mark-as-printed', printerMiddleware, (req, res) => {
    const { id } = req.params;
    db.run('UPDATE orders SET is_printed = 1 WHERE id = ?', [id], function(err) {
        if (err) {
            console.error(`Erro ao marcar pedido #${id} como impresso:`, err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }
        res.json({ success: true, message: `Pedido #${id} marcado como impresso.` });
    });
});

// Detalhes do pedido (sem alterações)
router.get('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  db.get(
    'SELECT * FROM orders WHERE id = ? AND (user_id = ? OR ?)',
    [id, user_id, req.user.is_admin ? 1 : 0],
    (err, order) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar pedido' });
      }
      if (!order) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }

      console.log('Buscando pedido:', id);
      // Buscar itens do pedido
      db.all(
        `SELECT 
           oi.id,
           oi.order_id,
           oi.product_id,
           oi.quantity,
           oi.price,
           p.name as product_name,
           p.photo as product_photo
         FROM order_items oi 
         JOIN products p ON oi.product_id = CAST(p.id AS TEXT)
         WHERE oi.order_id = ?`,
        [id],
        (err, items) => {
          if (err) {
            console.error('Erro ao buscar itens:', err);
            return res.status(500).json({ error: 'Erro ao buscar itens do pedido' });
          }
          console.log('Itens encontrados:', items);
          
          // Converter valores numéricos do pedido e dos itens
          const total = parseFloat(order.total || 0);
          const deliveryFee = parseFloat(order.delivery_fee || 0);
          const discountAmount = parseFloat(order.discount_amount || 0);
          const orderWithNumericValues = {
            ...order,
            total_amount: total,
            delivery_fee: deliveryFee,
            discount_amount: discountAmount,
            subtotal: parseFloat(order.subtotal || 0), // Usar o subtotal armazenado
            items: items.map(item => ({
              ...item,
              price: parseFloat(item.price || 0),
              quantity: parseInt(item.quantity || 0)
            }))
          };
          res.json(orderWithNumericValues);
        }
      );
    }
  );
});

module.exports = router;
