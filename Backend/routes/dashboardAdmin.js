const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { getAsync, getAllAsync } = require('../utils/dbHelpers'); // Adicionar getAllAsync
const router = express.Router();

// Middleware para todas as rotas do dashboard
router.use(authMiddleware, adminMiddleware);

// Rota principal do dashboard que agrega todos os dados
router.get('/', async (req, res) => {
    try {
        // Card 1: Faturação Total
        const totalRevenue = await getAsync("SELECT SUM(total) as total FROM orders WHERE payment_status = 'approved'", []);

        // Card 2: Número Total de Pedidos
        const totalOrders = await getAsync("SELECT COUNT(id) as count FROM orders", []);

        // Card 3: Novos Clientes (últimos 30 dias)
        const newUsers = await getAsync("SELECT COUNT(id) as count FROM users WHERE created_at >= date('now', '-30 days')", []);

        // Card 4: Pedidos Pendentes
        const pendingOrders = await getAsync("SELECT COUNT(id) as count FROM orders WHERE status = 'pending'", []);

        // Tabela: Produtos Mais Vendidos
        const topSellingProducts = await getAllAsync(`
            SELECT p.name, SUM(oi.quantity) as total_sold
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            GROUP BY p.name
            ORDER BY total_sold DESC
            LIMIT 5
        `, []);

        // Tabela: Últimos Pedidos
        const recentOrders = await getAllAsync(`
            SELECT o.id, u.name as user_name, o.total, o.status, o.created_at
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT 5
        `, []);

        res.json({
            totalRevenue: totalRevenue.total || 0,
            totalOrders: totalOrders.count || 0,
            newUsers: newUsers.count || 0,
            pendingOrders: pendingOrders.count || 0,
            topSellingProducts: topSellingProducts || [],
            recentOrders: recentOrders || []
        });

    } catch (error) {
        res.status(500).json({ error: 'Erro ao carregar dados do dashboard.', details: error.message });
    }
});

module.exports = router;