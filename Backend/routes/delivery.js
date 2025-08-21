const express = require('express');
const router = express.Router();
const uberDelivery = require('../services/uberDelivery');
const { runAsync, getAsync } = require('../utils/dbHelpers');
const notificationService = require('../services/notifications');

// Webhook para receber atualizações de status da entrega do Uber
router.post('/uber/webhook', async (req, res) => {
    try {
        const { delivery_id, status } = req.body;

        if (!delivery_id || !status) {
            return res.status(400).json({ error: 'Dados inválidos' });
        }

        // Atualizar status da entrega
        const order = await uberDelivery.updateDeliveryStatus(delivery_id, status);

        // Se o pedido foi entregue, atualizar o status geral do pedido
        if (status === 'delivered') {
            await runAsync(
                'UPDATE orders SET status = ? WHERE delivery_id = ?',
                ['delivered', delivery_id]
            );
        }
        // Se houve um problema na entrega
        else if (status === 'failed' || status === 'cancelled') {
            await runAsync(
                'UPDATE orders SET status = ? WHERE delivery_id = ?',
                ['delivery_failed', delivery_id]
            );
        }
        // Se o entregador está a caminho
        else if (status === 'picking_up' || status === 'in_transit') {
            await runAsync(
                'UPDATE orders SET status = ? WHERE delivery_id = ?',
                ['out_for_delivery', delivery_id]
            );
        }

        // Notificar cliente e admin sobre a atualização do status
        await notificationService.notifyStatusChange(order.id, status);

        res.json({ success: true });
    } catch (error) {
        console.error('Erro no webhook do Uber:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para buscar status atual da entrega
router.get('/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await getAsync(
            'SELECT delivery_id, delivery_status, delivery_tracking_url FROM orders WHERE id = ?',
            [orderId]
        );

        if (!order) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        if (!order.delivery_id) {
            return res.status(400).json({ error: 'Pedido não possui entrega associada' });
        }

        const currentStatus = await uberDelivery.getDeliveryStatus(order.delivery_id);

        res.json({
            delivery_status: currentStatus,
            tracking_url: order.delivery_tracking_url
        });
    } catch (error) {
        console.error('Erro ao buscar status da entrega:', error);
        res.status(500).json({ error: 'Erro ao buscar status da entrega' });
    }
});

module.exports = router;