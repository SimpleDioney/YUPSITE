const express = require('express');
const router = express.Router();
const uberDelivery = require('../services/uberDelivery');
const { runAsync, getAsync } = require('../utils/dbHelpers');
const notificationService = require('../services/notifications');
const { authMiddleware } = require('../middleware/auth');
const axios = require('axios');
const { URLSearchParams } = require('url')
const db = require('../database/db');

// Obter token de acesso do Uber
async function getUberToken() {
  try {
    // Transforma o objeto em dados de formulário
    const params = new URLSearchParams();
    params.append('client_id', process.env.UBER_CLIENT_ID);
    params.append('client_secret', process.env.UBER_CLIENT_SECRET);
    params.append('grant_type', 'client_credentials');
    params.append('scope', 'eats.deliveries');

    // Envia os parâmetros formatados
    const response = await axios.post('https://auth.uber.com/oauth/v2/token', params);
    
    return response.data.access_token;
  } catch (error) {
    // Adiciona um log mais detalhado do erro da Uber, se existir
    if (error.response) {
      console.error('Erro da API da Uber:', error.response.data);
    }
    console.error('Erro ao obter token Uber:', error.message);
    throw error;
  }
}

// Criar entrega
router.post('/create-delivery', authMiddleware, async (req, res) => {
    const { order_id, pickup_address, dropoff_address } = req.body;
    const user_id = req.user.id;
  
    // 1. Buscamos o pedido e os dados do usuário (cliente) de uma só vez
    db.get(
      `SELECT 
         o.*, 
         u.name as user_name, 
         u.phone as user_phone,
         u.email as user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ? AND o.user_id = ?`,
      [order_id, user_id],
      (err, order) => {
        if (err || !order) {
          return res.status(404).json({ error: 'Pedido ou usuário não encontrado.' });
        }
  
        // 2. Buscar os itens do pedido
        db.all(
          `SELECT oi.quantity, p.name, p.price 
           FROM order_items oi 
           JOIN products p ON oi.product_id = p.id 
           WHERE oi.order_id = ?`,
          [order_id],
          async (err, items) => {
            if (err || !items || items.length === 0) {
              return res.status(500).json({ error: 'Itens do pedido não encontrados para criar a entrega.' });
            }
  
            try {
              const token = await getUberToken();
              
              // 3. Montar o corpo da requisição com a ESTRUTURA FINAL E CORRETA
              const deliveryData = {
                pickup_address: process.env.PICKUP_ADDRESS,
                pickup_name: 'YUP', // Nome da sua loja
                pickup_phone_number: '+554388742317', // Telefone da sua loja
                dropoff_address: dropoff_address || order.delivery_address,
                dropoff_name: order.user_name, // Nome do cliente, vindo do banco
                dropoff_phone_number: order.user_phone || '+5511988888888', // Telefone do cliente, vindo do banco
                manifest_total_value: parseFloat(order.total.toFixed(2)),
                manifest_items: items.map(item => ({
                  name: item.name,
                  quantity: item.quantity,
                  size: "small",
                  price: parseFloat(item.price.toFixed(2))
                }))
              };
  
              const response = await axios.post(
                'https://api.uber.com/v1/customers/' + process.env.UBER_CUSTOMER_ID + '/deliveries',
                deliveryData,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
  
              // Salvar ID da entrega no banco
              db.run(
                'UPDATE orders SET delivery_id = ?, delivery_status = ? WHERE id = ?',
                [response.data.id, response.data.status, order_id]
              );
  
              res.json({
                delivery_id: response.data.id,
                status: response.data.status,
                tracking_url: response.data.tracking_url
              });
  
            } catch (error) {
              console.error('Erro ao criar entrega:', error.response?.data || error.message);
              res.status(500).json({ error: 'Erro ao criar entrega', details: error.response?.data || error.message });
            }
          }
        );
      }
    );
  });
// Obter cotação de entrega
router.post('/delivery-quote', authMiddleware, async (req, res) => {
  const { dropoff_address } = req.body;

  const pickup_address = process.env.PICKUP_ADDRESS;

  if (!dropoff_address) {
    return res.status(400).json({ error: 'Endereço de entrega (dropoff_address) é obrigatório.' });
  }

  try {
    const token = await getUberToken();
    
    const response = await axios.post(
      `https://api.uber.com/v1/customers/${process.env.UBER_CUSTOMER_ID}/delivery_quotes`,
      {
        pickup_address,
        dropoff_address
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      fee: response.data.fee / 100, // Convertendo de centavos para reais
      estimated_minutes: response.data.estimated_minutes,
      currency: response.data.currency
    });
  } catch (error) {
    console.error('Erro ao obter cotação:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Erro ao obter cotação de entrega',
      details: error.response?.data || error.message
    });
  }
});

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