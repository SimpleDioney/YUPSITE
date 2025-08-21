const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const db = require('../database/db');
const router = express.Router();

// Middleware para todas as rotas admin
router.use(authMiddleware, adminMiddleware);

// Criar marca
router.post('/', (req, res) => {
  const { name, description } = req.body;

  db.run(
    'INSERT INTO brands (name, description) VALUES (?, ?)',
    [name, description],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Já existe uma marca com este nome' });
        }
        return res.status(500).json({ error: 'Erro ao criar marca' });
      }
      res.status(201).json({ id: this.lastID, message: 'Marca criada com sucesso' });
    }
  );
});

// Atualizar marca
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  db.run(
    'UPDATE brands SET name = ?, description = ? WHERE id = ?',
    [name, description, id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Já existe uma marca com este nome' });
        }
        return res.status(500).json({ error: 'Erro ao atualizar marca' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Marca não encontrada' });
      }
      res.json({ message: 'Marca atualizada com sucesso' });
    }
  );
});

// Excluir marca
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT COUNT(*) as count FROM products WHERE brand_id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao verificar produtos da marca' });
    }

    if (result.count > 0) {
      return res.status(400).json({ error: 'Não é possível excluir uma marca que possui produtos associados' });
    }

    db.run('DELETE FROM brands WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao excluir marca' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Marca não encontrada' });
      }
      res.json({ message: 'Marca excluída com sucesso' });
    });
  });
});

module.exports = router;
