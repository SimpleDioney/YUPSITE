const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { getAsync, runAsync } = require('../utils/dbHelpers'); // Funções importadas
const db = require('../database/db');
const router = express.Router();

// Configure o cliente do Mercado Pago
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
const preference = new Preference(client);
const payment = new Payment(client);

// Rota para criar a PREFERÊNCIA de pagamento
router.post(
  '/create-preference',
  authMiddleware,
  [
    body('order_id').isInt().withMessage('O ID do pedido é inválido.'),
    body('delivery_fee').isFloat({ min: 0 }).withMessage('A taxa de entrega é inválida.')
  ],
  async (req, res) => {
    // --- LOG 1: VERIFICAR DADOS DE ENTRADA ---
    console.log('--- NOVA REQUISIÇÃO /create-preference ---');
    console.log('Dados recebidos do frontend:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { order_id, delivery_fee } = req.body;
    const user_id = req.user.id;

    try {
      // --- LOG 2: VERIFICAR VARIÁVEIS DE AMBIENTE ---
      console.log('Verificando variáveis de ambiente:');
      console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
      console.log('BACKEND_URL:', process.env.BACKEND_URL);

      if (!process.env.FRONTEND_URL || !process.env.BACKEND_URL) {
          console.error('ERRO CRÍTICO: Variáveis FRONTEND_URL ou BACKEND_URL não estão definidas no arquivo .env!');
          return res.status(500).json({ error: 'Erro de configuração do servidor.' });
      }

      const orderQuery = `
        SELECT o.*, u.email, u.name, o.discount_amount, o.coupon_code
        FROM orders o 
        JOIN users u ON o.user_id = u.id 
        WHERE o.id = ? AND o.user_id = ?
      `;
      const order = await getAsync(orderQuery, [order_id, user_id]);

      if (!order) {
        return res.status(404).json({ error: 'Pedido não encontrado ou não pertence a este usuário.' });
      }

      const itemsQuery = `
          SELECT p.name as title, oi.quantity, oi.price as unit_price
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ?
      `;
      const itemsResult = await new Promise((resolve, reject) => {
          db.all(itemsQuery, [order_id], (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
          });
      });
      
      if (!itemsResult || itemsResult.length === 0) {
        return res.status(400).json({ error: 'O pedido não contém itens.' });
      }
      
      const items = itemsResult.map(item => ({
        ...item,
        unit_price: Number(item.unit_price.toFixed(2)),
      }));

      // Adiciona taxa de entrega se houver
      if (delivery_fee > 0) {
        items.push({
          title: 'Taxa de Entrega',
          quantity: 1,
          unit_price: Number(delivery_fee.toFixed(2)),
        });
      }

      // Adiciona desconto do cupom se houver
      if (order.discount_amount > 0) {
        items.push({
          title: `Desconto${order.coupon_code ? ` (${order.coupon_code})` : ''}`,
          quantity: 1,
          unit_price: -Number(order.discount_amount.toFixed(2)), // Valor negativo para desconto
        });
      }

      const preferenceData = {
        body: {
          items: items,
          payer: {
            name: order.name.split(' ')[0],
            surname: order.name.split(' ').slice(1).join(' ') || 'N/A',
            email: order.email,
          },
          back_urls: {
            success: `${process.env.FRONTEND_URL}/success`,
            failure: `${process.env.FRONTEND_URL}/failure`,
            pending: `${process.env.FRONTEND_URL}/pending`,
          },
          auto_return: 'approved',
          notification_url: `${process.env.BACKEND_URL}/api/payment/webhook`,
          external_reference: order_id.toString(),
        }
      };
      
      // --- LOG 3: OBJETO FINAL ENVIADO PARA O MERCADO PAGO ---
      console.log('Objeto final que será enviado para a API do Mercado Pago:');
      console.log(JSON.stringify(preferenceData.body, null, 2)); // Log apenas do 'body' para clareza

      const requestOptions = {
          idempotencyKey: crypto.randomBytes(16).toString('hex')
      };

      // --- CORREÇÃO APLICADA AQUI ---
      // Juntamos o body da preferência e as opções da requisição em um único objeto.
      const preferencePayload = {
        body: preferenceData.body,
        requestOptions: requestOptions
      };

      // Passamos o objeto único para a função create.
      const preferenceResponse = await preference.create(preferencePayload);
      // --- FIM DA CORREÇÃO ---


      console.log('Preferência criada com sucesso. ID:', preferenceResponse.id);
      res.json({
        preferenceId: preferenceResponse.id,
        init_point: preferenceResponse.init_point,
      });

    } catch (error) {
      console.error('Erro detalhado ao criar preferência de pagamento:', error);
      const errorMessage = error.cause?.[0]?.description || error.message || 'Erro desconhecido ao criar pagamento.';
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: errorMessage });
    }
  }
);


// --- ROTAS DE STATUS E WEBHOOK (com logs adicionados) ---

router.get('/status/:paymentId', authMiddleware, async (req, res) => {
    console.log(`Recebida verificação de status para o pagamento ID: ${req.params.paymentId}`);
    try {
        const paymentDetails = await payment.get({ id: req.params.paymentId });
        res.json({ status: paymentDetails.status, external_reference: paymentDetails.external_reference });
    } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error);
        res.status(error.statusCode || 500).json({ error: 'Erro ao verificar status' });
    }
});

router.post('/webhook', async (req, res) => {
  console.log('--- WEBHOOK MERCADO PAGO RECEBIDO ---');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  const topic = req.body.topic || req.query.topic;

  if (topic === 'payment') {
      const paymentId = req.body.data?.id || req.query.id;
      if (!paymentId) {
          console.log('Webhook de pagamento recebido sem ID. Ignorando.');
          return res.sendStatus(200);
      }

      console.log(`Processando webhook para o pagamento ID: ${paymentId}`);
      try {
          const paymentResult = await payment.get({ id: paymentId });
          const order_id = paymentResult.external_reference;
          const status = paymentResult.status;

          if (order_id && status) {
              await runAsync(
                  'UPDATE orders SET payment_status = ? WHERE id = ?',
                  [status, order_id]
              );
              console.log(`Pedido ${order_id} atualizado para o status de pagamento: ${status}`);
          }
      } catch (error) {
          console.error(`Erro no webhook ao processar pagamento ${paymentId}:`, error);
          return res.sendStatus(500);
      }
  }
  res.sendStatus(200);
});

module.exports = router;