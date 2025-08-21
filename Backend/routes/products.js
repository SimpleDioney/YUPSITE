const express = require('express');
const db = require('../database/db');
const router = express.Router();

// Listar produtos ativos
router.get('/', (req, res) => {
  const { categoryId } = req.query;

  let query = `
    SELECT p.*, GROUP_CONCAT(c.name) as categories
    FROM products p
    LEFT JOIN product_categories pc ON p.id = pc.product_id
    LEFT JOIN categories c ON pc.category_id = c.id
    WHERE p.is_active = 1
  `;
  
  const params = [];

  if (categoryId) {
    query += ' AND p.id IN (SELECT product_id FROM product_categories WHERE category_id = ?)';
    params.push(categoryId);
  }

  query += ' GROUP BY p.id';

  db.all(query, params, (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
    const productsWithCategories = products.map(p => ({
      ...p,
      stock: Number(p.stock) || 0,
      price: Number(p.price) || 0,
      categories: p.categories ? p.categories.split(',') : []
    }));
    res.json(productsWithCategories);
  });
});


router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, photo, price, type, unit_value, stock, is_active } = req.body;

  const query = `
    UPDATE products
    SET 
      name = ?, 
      description = ?, 
      photo = ?, 
      price = ?, 
      type = ?, 
      unit_value = ?, 
      stock = ?, 
      is_active = ?
    WHERE id = ?
  `;

  const values = [
    name,
    description,
    photo,
    price,
    type,
    unit_value,
    stock,
    is_active,
    id
  ];

  db.run(query, values, function (err) {
    if (err) {
      console.error("Erro ao atualizar produto:", err);
      return res.status(500).json({ error: 'Erro ao atualizar produto' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json({ message: 'Produto atualizado com sucesso' });
  });
});

// Detalhes do produto
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM products WHERE id = ? AND is_active = 1', [id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar produto' });
    }
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json({
      ...product,
      stock: Number(product.stock) || 0,
      price: Number(product.price) || 0
    });
  });
});

module.exports = router;