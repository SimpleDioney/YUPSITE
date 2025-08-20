const express = require('express');
const { getAllAsync } = require('../utils/dbHelpers');
const router = express.Router();

// ROTA PÚBLICA - Listar todas as categorias ativas
router.get('/', async (req, res) => {
    try {
        // Esta rota é pública e não requer autenticação
        const categories = await getAllAsync('SELECT * FROM categories ORDER BY name', []);
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar categorias.' });
    }
});

module.exports = router;