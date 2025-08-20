const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const db = require('../database/db');
const { getAsync, runAsync, getAllAsync } = require('../utils/dbHelpers'); // Adicionar getAllAsync
const router = express.Router();

// Middleware para todas as rotas de admin de cupons
router.use(authMiddleware, adminMiddleware);

// ROTA ADMIN - Criar um novo cupom
router.post('/', async (req, res) => {
    const { code, discount_type, discount_value, expires_at, usage_limit } = req.body;

    if (!code || !discount_type || !discount_value) {
        return res.status(400).json({ error: 'Código, tipo de desconto e valor são obrigatórios.' });
    }

    try {
        const result = await runAsync(
            'INSERT INTO coupons (code, discount_type, discount_value, expires_at, usage_limit) VALUES (?, ?, ?, ?, ?)',
            [code.toUpperCase(), discount_type, discount_value, expires_at, usage_limit]
        );
        res.status(201).json({ id: result.lastID, message: 'Cupom criado com sucesso!' });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ error: 'Este código de cupom já existe.' });
        }
        res.status(500).json({ error: 'Erro ao criar o cupom.', details: error.message });
    }
});

// ROTA ADMIN - Listar todos os cupons
router.get('/', async (req, res) => {
  try {
    // CORRIGIDO: Usar getAllAsync em vez de getAsync
    const coupons = await getAllAsync('SELECT * FROM coupons ORDER BY created_at DESC', []);
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cupons.', details: error.message });
  }
});

// ROTA ADMIN - Atualizar um cupom
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { code, discount_type, discount_value, expires_at, usage_limit, is_active } = req.body;

    try {
        const result = await runAsync(
            `UPDATE coupons SET 
                code = ?, 
                discount_type = ?, 
                discount_value = ?, 
                expires_at = ?, 
                usage_limit = ?, 
                is_active = ? 
             WHERE id = ?`,
            [code.toUpperCase(), discount_type, discount_value, expires_at, usage_limit, is_active, id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Cupom não encontrado.' });
        }
        res.json({ message: 'Cupom atualizado com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar o cupom.', details: error.message });
    }
});

// ROTA ADMIN - Apagar um cupom
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await runAsync('DELETE FROM coupons WHERE id = ?', [id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Cupom não encontrado.' });
        }
        res.json({ message: 'Cupom removido com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao remover o cupom.', details: error.message });
    }
});


module.exports = router;