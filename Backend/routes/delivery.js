const express = require('express');
const router = express.Router();
const uberDelivery = require('../services/uberDelivery');
const { runAsync, getAsync } = require('../utils/dbHelpers');
const notificationService = require('../services/notifications');
const { authMiddleware } = require('../middleware/auth');
const axios = require('axios');
const { URLSearchParams } = require('url');
const db = require('../database/db');

// Obter token de acesso do Uber
async function getUberToken() {
  try {
    const params = new URLSearchParams();
    params.append('client_id', process.env.UBER_CLIENT_ID);
    params.append('client_secret', process.env.UBER_CLIENT_SECRET);
    params.append('grant_type', 'client_credentials');
    params.append('scope', 'eats.deliveries');

    const response = await axios.post('https://auth.uber.com/oauth/v2/token', params);
    
    return response.data.access_token;
  } catch (error) {
    if (error.response) {
      console.error('Erro da API da Uber:', error.response.data);
    }
    console.error('Erro ao obter token Uber:', error.message);
    throw error;
  }
}

// Criar entrega - Lógica final para Admin e Cliente
router.post('/create-delivery', authMiddleware, async (req, res) => {
    const { order_id, dropoff_address } = req.body;
    const user = req.user;

    // Constrói a query SQL base
    let sql = `
      SELECT 
         o.*, 
         u.name as user_name, 
         u.phone as user_phone,
         u.email as user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`;
    
    const params = [order_id];

    // Se o requisitante não for admin, garante que ele só possa acessar seus próprios pedidos
    if (!user.is_admin) {
        sql += ` AND o.user_id = ?`;
        params.push(user.id);
    }
  
    // 1. Buscamos o pedido e os dados do usuário (cliente)
    db.get(sql, params, (err, order) => {
        if (err || !order) {
          return res.status(404).json({ error: 'Pedido não encontrado ou acesso não autorizado.' });
        }
  
        // 2. Buscar os itens do pedido
        db.all(
          `SELECT oi.quantity, p.name, p.price, o.total as order_total 
           FROM order_items oi 
           JOIN products p ON oi.product_id = p.id 
           JOIN orders o ON oi.order_id = o.id
           WHERE oi.order_id = ?`,
          [order_id],
          async (err, items) => {
            if (err || !items || items.length === 0) {
              return res.status(500).json({ error: 'Itens do pedido não encontrados para criar a entrega.' });
            }

            const orderTotal = items[0].order_total;
  
            try {
              const token = await getUberToken();
              
              const deliveryData = {
                pickup_address: process.env.PICKUP_ADDRESS,
                pickup_name: 'YUP', // Nome da sua loja
                pickup_phone_number: '+554388742317', // Telefone da sua loja
                dropoff_address: dropoff_address || order.delivery_address, // Prioriza endereço do body, senão usa o do pedido
                dropoff_name: order.user_name,
                dropoff_phone_number: order.user_phone || '+554388742317', // Telefone do cliente
                manifest_total_value: parseFloat(orderTotal.toFixed(2)),
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
  
              // Salvar ID da entrega, status e o LINK DE RASTREAMENTO
              db.run(
                'UPDATE orders SET delivery_id = ?, delivery_status = ?, status = ?, delivery_tracking_url = ? WHERE id = ?',
                [
                    response.data.id, 
                    response.data.status, 
                    'out_for_delivery', 
                    response.data.tracking_url,
                    order_id
                ]
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
      fee: response.data.fee / 100, // Convertendo de centavos
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

        const order = await uberDelivery.updateDeliveryStatus(delivery_id, status);

        if (status === 'delivered') {
            await runAsync('UPDATE orders SET status = ? WHERE delivery_id = ?', ['delivered', delivery_id]);
        }
        else if (status === 'failed' || status === 'cancelled') {
            await runAsync('UPDATE orders SET status = ? WHERE delivery_id = ?', ['delivery_failed', delivery_id]);
        }
        else if (status === 'picking_up' || status === 'in_transit') {
            await runAsync('UPDATE orders SET status = ? WHERE delivery_id = ?', ['out_for_delivery', delivery_id]);
        }

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

        // Se você tiver uma função para buscar o status atual na Uber, pode usá-la aqui
        // const currentStatus = await uberDelivery.getDeliveryStatus(order.delivery_id);

        res.json({
            delivery_status: order.delivery_status, // Retorna o último status salvo
            tracking_url: order.delivery_tracking_url
        });
    } catch (error) {
        console.error('Erro ao buscar status da entrega:', error);
        res.status(500).json({ error: 'Erro ao buscar status da entrega' });
    }
});

module.exports = router;