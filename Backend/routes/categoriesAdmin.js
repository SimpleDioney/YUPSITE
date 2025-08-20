const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { getAsync, runAsync, getAllAsync } = require('../utils/dbHelpers');
const router = express.Router();

// Middleware para todas as rotas de admin de categorias
router.use(authMiddleware, adminMiddleware);

// Criar nova categoria
router.post('/', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'O nome da categoria é obrigatório.' });
    }
    try {
        const result = await runAsync('INSERT INTO categories (name) VALUES (?)', [name]);
        res.status(201).json({ id: result.lastID, name, message: 'Categoria criada com sucesso!' });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ error: 'Esta categoria já existe.' });
        }
        res.status(500).json({ error: 'Erro ao criar a categoria.' });
    }
});

// Listar todas as categorias
router.get('/', async (req, res) => {
    try {
        // CORRIGIDO: Usar getAllAsync em vez de getAsync
        const categories = await getAllAsync('SELECT * FROM categories ORDER BY name', []);
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar categorias.' });
    }
});

// Atualizar uma categoria
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'O nome da categoria é obrigatório.' });
    }
    try {
        const result = await runAsync('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada.' });
        }
        res.json({ message: 'Categoria atualizada com sucesso.' });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ error: 'Esta categoria já existe.' });
        }
        res.status(500).json({ error: 'Erro ao atualizar a categoria.' });
    }
});

// Apagar uma categoria
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await runAsync('BEGIN TRANSACTION');
        // Remove as associações da categoria com os produtos
        await runAsync('DELETE FROM product_categories WHERE category_id = ?', [id]);
        // Remove a categoria
        const result = await runAsync('DELETE FROM categories WHERE id = ?', [id]);
        await runAsync('COMMIT');

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada.' });
        }
        res.json({ message: 'Categoria removida com sucesso.' });
    } catch (error) {
        await runAsync('ROLLBACK');
        res.status(500).json({ error: 'Erro ao remover a categoria.' });
    }
});

module.exports = router;