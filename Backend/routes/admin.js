const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { runAsync, getAsync, getAllAsync } = require('../utils/dbHelpers'); // Adicionar getAllAsync se não estiver lá
const { STOCK_MOVEMENT_TYPES } = require('../utils/constants');
const db = require('../database/db');
const router = express.Router();

// Middleware para todas as rotas admin
router.use(authMiddleware, adminMiddleware);

// Adicionar produto
router.post('/products', upload.single('photo'), async (req, res) => {
  const { name, description, price, type, unit_value, stock, category_ids } = req.body;
  const photo = req.file ? req.file.filename : null;

  try {
    await runAsync('BEGIN TRANSACTION');

    const result = await runAsync(
      'INSERT INTO products (name, description, photo, price, type, unit_value, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, photo, price, type, unit_value, stock]
    );
    const productId = result.lastID;

    // Associar categorias
    if (category_ids) {
      const ids = JSON.parse(category_ids);
      for (const category_id of ids) {
        await runAsync('INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)', [productId, category_id]);
      }
    }

    await runAsync('COMMIT');
    res.status(201).json({ id: productId, message: 'Produto adicionado com sucesso' });
  } catch (error) {
    await runAsync('ROLLBACK');
    res.status(500).json({ error: 'Erro ao adicionar produto', details: error.message });
  }
});

// Ver todos os produtos (admin)
router.get('/products', async (req, res) => {
  try {
    // A consulta agora junta as categorias e agrupa-as para cada produto
    const products = await getAllAsync(`
      SELECT p.*, GROUP_CONCAT(c.id) as category_ids
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    
    const formattedProducts = products.map(p => ({
      ...p,
      price: p.price,
      category_ids: p.category_ids ? p.category_ids.split(',').map(Number) : []
    }));

    res.json(formattedProducts);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

router.put('/products/:id', upload.single('photo'), async (req, res) => {
  const { id } = req.params;
  const { name, description, price, type, unit_value, stock, is_active, category_ids } = req.body;
  const hasNewPhoto = req.file;

  try {
    // Inicia a transação para garantir a consistência dos dados
    await runAsync('BEGIN TRANSACTION');

    // Busca o nome da foto antiga para poder excluí-la se uma nova for enviada
    const product = await getAsync('SELECT photo FROM products WHERE id = ?', [id]);
    if (!product) {
      await runAsync('ROLLBACK');
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    let photoToUpdate = product.photo;
    if (hasNewPhoto) {
        photoToUpdate = req.file.filename;
        // Aqui você poderia adicionar a lógica para remover a foto antiga do sistema de arquivos
    }

    // Atualiza os dados principais do produto
    await runAsync(
      `UPDATE products SET
        name = ?,
        description = ?,
        price = ?,
        type = ?,
        unit_value = ?,
        stock = ?,
        is_active = ?,
        photo = ?
      WHERE id = ?`,
      [name, description, price, type, unit_value, stock, is_active === 'true' ? 1 : 0, photoToUpdate, id]
    );

    // Atualiza as categorias (remove as antigas e insere as novas)
    await runAsync('DELETE FROM product_categories WHERE product_id = ?', [id]);
    if (category_ids) {
      const ids = JSON.parse(category_ids);
      for (const category_id of ids) {
        await runAsync('INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)', [id, category_id]);
      }
    }

    // Confirma a transação
    await runAsync('COMMIT');

    res.json({ message: 'Produto atualizado com sucesso' });
  } catch (error) {
    // Em caso de erro, desfaz todas as alterações
    await runAsync('ROLLBACK');
    res.status(500).json({ error: 'Erro ao atualizar produto', details: error.message });
  }
});

// Adicionar estoque
router.post('/stock/add', (req, res) => {
  const { product_id, quantity, reason } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Adicionar movimento de estoque
    db.run(
      'INSERT INTO stock_movements (product_id, quantity, type, reason) VALUES (?, ?, ?, ?)',
      [product_id, quantity, STOCK_MOVEMENT_TYPES.ADD, reason], // Alterado
      (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Erro ao adicionar estoque' });
        }
      }
    );

    // Atualizar estoque do produto
    db.run(
      'UPDATE products SET stock = stock + ? WHERE id = ?',
      [quantity, product_id],
      (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Erro ao atualizar estoque' });
        }
        
        db.run('COMMIT');
        res.json({ message: 'Estoque adicionado com sucesso' });
      }
    );
  });
});

// Remover estoque
router.post('/stock/remove', (req, res) => {
  const { product_id, quantity, reason } = req.body;

  db.get('SELECT stock FROM products WHERE id = ?', [product_id], (err, product) => {
    if (err || !product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Estoque insuficiente' });
    }

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Adicionar movimento de estoque
      db.run(
        'INSERT INTO stock_movements (product_id, quantity, type, reason) VALUES (?, ?, ?, ?)',
        [product_id, quantity, STOCK_MOVEMENT_TYPES.REMOVE, reason], // Alterado
        (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Erro ao remover estoque' });
          }
        }
      );

      // Atualizar estoque do produto
      db.run(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [quantity, product_id],
        (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Erro ao atualizar estoque' });
          }
          
          db.run('COMMIT');
          res.json({ message: 'Estoque removido com sucesso' });
        }
      );
    });
  });
});

// Ativar/Desativar produto
router.patch('/products/:id/toggle', (req, res) => {
  const { id } = req.params;

  db.get('SELECT is_active FROM products WHERE id = ?', [id], (err, product) => {
    if (err || !product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const newStatus = !product.is_active;
    
    db.run(
      'UPDATE products SET is_active = ? WHERE id = ?',
      [newStatus ? 1 : 0, id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Erro ao atualizar status do produto' });
        }
        res.json({
          message: `Produto ${newStatus ? 'ativado' : 'desativado'} com sucesso`,
          is_active: newStatus
        });
      }
    );
  });
});

// Ver todos os pedidos
router.get('/orders', async (req, res) => {
  try {
    // Primeiro, buscar todos os pedidos com informações do usuário
    const orders = await getAllAsync(`
      SELECT 
        o.*,
        u.name as user_name,
        u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    // Para cada pedido, buscar seus itens
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const items = await getAllAsync(`
        SELECT 
          oi.*,
          p.name as product_name,
          p.photo as product_photo
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);

      return {
        ...order,
        total_amount: parseFloat(order.total || 0),
        delivery_fee: parseFloat(order.delivery_fee || 0),
        discount_amount: parseFloat(order.discount_amount || 0),
        items: items.map(item => ({
          ...item,
          price: parseFloat(item.price || 0),
          quantity: parseInt(item.quantity || 0)
        }))
      };
    }));

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

// Atualizar status do pedido
router.patch('/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.run(
    'UPDATE orders SET status = ? WHERE id = ?',
    [status, id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao atualizar status do pedido' });
      }
      res.json({ message: 'Status do pedido atualizado com sucesso' });
    }
  );
});

// Ver mensagens de chat
router.get('/chat/messages', (req, res) => {
  const query = `
    SELECT m.*, 
           s.name as sender_name, s.email as sender_email,
           r.name as receiver_name, r.email as receiver_email
    FROM messages m
    JOIN users s ON m.sender_id = s.id
    JOIN users r ON m.receiver_id = r.id
    ORDER BY m.created_at DESC
  `;

  db.all(query, (err, messages) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }
    res.json(messages);
  });
});

module.exports = router;
