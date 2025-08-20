const express = require('express');
const { authMiddleware } = require('../middleware/auth');
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

    // 1. Calcular o total bruto (sem desconto)
    let subtotal = 0;
    for (const item of items) {
      const product = await getAsync('SELECT * FROM products WHERE id = CAST(? AS INTEGER) AND is_active = 1', [item.product_id]);
      if (!product) throw new Error(`Produto não encontrado: id ${item.product_id}`);
      if (product.stock < item.quantity) throw new Error(`Estoque insuficiente para ${product.name}`);
      subtotal += product.price * item.quantity;
      item.price = product.price; // Armazena o preço no momento da compra
    }

    // 2. Validar o cupom e calcular o desconto
    let discountAmount = 0;
    let validCoupon = null;
    const safeDeliveryFee = delivery_fee || 0;

    if (coupon_code) {
        const couponValidation = await validateCoupon(coupon_code, subtotal);
        if (!couponValidation.isValid) {
            // Se o cupom for inválido, interrompe a transação.
            await runAsync('ROLLBACK');
            return res.status(400).json({ error: couponValidation.message });
        }
        discountAmount = couponValidation.discountAmount;
        validCoupon = couponValidation.coupon;
    }

    // Calcula o total final: subtotal + frete - desconto
    let finalTotal = subtotal + safeDeliveryFee - discountAmount;

    // 3. Criar o pedido no banco de dados com os valores corretos
    const insertOrder = await runAsync(
      'INSERT INTO orders (user_id, total, subtotal, delivery_address, payment_method, coupon_code, discount_amount, delivery_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, finalTotal, subtotal, delivery_address, payment_method, validCoupon ? validCoupon.code : null, discountAmount, delivery_fee || 0]
    );

    const order_id = insertOrder.lastID;

    // 4. Adicionar itens e atualizar o estoque
    for (const item of items) {
      // Buscar o produto novamente para ter certeza que temos todos os dados
      const product = await getAsync('SELECT * FROM products WHERE id = ?', [item.product_id]);
      await runAsync(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [order_id, item.product_id, item.quantity, item.price]
      );

      await runAsync(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // 5. Incrementar o uso do cupom, se um foi usado
    if (validCoupon) {
        await runAsync(
            'UPDATE coupons SET times_used = times_used + 1 WHERE id = ?',
            [validCoupon.id]
        );
    }

    await runAsync('COMMIT');

    res.status(201).json({
      message: 'Pedido criado com sucesso',
      order_id,
      total: finalTotal,
    });
  } catch (error) {
    await runAsync('ROLLBACK');
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