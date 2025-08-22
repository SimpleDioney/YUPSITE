const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { getAsync, getAllAsync } = require('../utils/dbHelpers');

// SDK V3 do Mercado Pago
const { MercadoPagoConfig, Preference, Payment, MerchantOrder } = require('mercadopago');

// Validação da Chave de Acesso
if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    console.error("\nFATAL ERROR: A variável MERCADOPAGO_ACCESS_TOKEN não está definida no seu arquivo .env!");
}

const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    options: { timeout: 5000 }
});


// Rota para criar a preferência de pagamento
router.post('/create-preference', async (req, res) => {
    console.log("\n--- [INÍCIO] ROTA /create-preference ---");
    try {
        const { order_id, delivery_fee } = req.body;

        if (!order_id) {
            return res.status(400).json({ error: 'O ID do pedido é obrigatório.' });
        }

        const order = await getAsync('SELECT * FROM orders WHERE id = ?', [order_id]);
        const items = await getAllAsync('SELECT * FROM order_items WHERE order_id = ?', [order_id]);
        const user = await getAsync('SELECT * FROM users WHERE id = ?', [order?.user_id]);

        if (!order || !items || items.length === 0 || !user) {
            return res.status(404).json({ error: 'Dados do pedido, itens ou usuário não encontrados.' });
        }

        const preferenceItems = items.map(item => ({
            id: item.product_id.toString(),
            title: item.product_name,
            quantity: Number(item.quantity),
            unit_price: Number(item.price)
        }));

        if (delivery_fee && Number(delivery_fee) > 0) {
            preferenceItems.push({
                id: "delivery",
                title: "Taxa de Entrega",
                quantity: 1,
                unit_price: Number(delivery_fee)
            });
        }
        
        const preferenceBody = {
            items: preferenceItems,
            payer: {
                name: user.name,
                email: user.email,
            },
            back_urls: {
                success: `${process.env.FRONTEND_URL}/success`,
                failure: `${process.env.FRONTEND_URL}/failure`,
                pending: `${process.env.FRONTEND_URL}/pending`,
            },
            auto_return: "approved",
            notification_url: `${process.env.BACKEND_URL}/api/payment/webhook`,
            external_reference: String(order_id),
        };

        const preference = new Preference(client);
        const result = await preference.create({ body: preferenceBody });

        if (!result || !result.id) {
            throw new Error("A API do Mercado Pago não retornou um ID.");
        }
        
        res.status(200).json({ 
            preferenceId: result.id,
            init_point: result.init_point
        });

    } catch (error) {
        console.error("\n--- [ERRO GERAL] Falha em /create-preference ---");
        if (error.cause) {
            console.error("Causa do erro (API do MP):", JSON.stringify(error.cause, null, 2));
        } else {
            console.error("Erro completo:", error.message);
        }
        res.status(500).json({ error: 'Erro interno ao criar a preferência de pagamento.', details: error.message });
    }
});


// Rota para receber notificações do Mercado Pago (Webhook)
router.post('/webhook', async (req, res) => {
    const notification = req.body;
    console.log('\n--- [WEBHOOK] Notificação do Mercado Pago recebida ---', notification);

    try {
        let paymentId = null;

        // Extrai o ID do pagamento da notificação
        if (notification.type === 'payment' && notification.data?.id) {
            paymentId = notification.data.id;
        } else if (notification.topic === 'merchant_order') {
            const merchantOrder = new MerchantOrder(client);
            const orderResponse = await merchantOrder.get({ merchantOrderId: notification.resource.split('/').pop() });

            if (orderResponse?.payments?.length > 0) {
                paymentId = orderResponse.payments.pop().id;
            }
        }

        if (paymentId) {
            console.log(`[WEBHOOK] ID do pagamento extraído: ${paymentId}`);
            const payment = new Payment(client);
            const paymentInfo = await payment.get({ id: paymentId });
            
            if (paymentInfo) {
                const { status: paymentStatus, external_reference: orderId } = paymentInfo;

                if (!orderId) {
                    console.warn(`[WEBHOOK] Pagamento ${paymentId} não tem um ID de pedido (external_reference). Ignorando.`);
                } else {
                    console.log(`[WEBHOOK] Processando: Pedido ID=${orderId}, Status Pagamento=${paymentStatus}`);

                    // --- LÓGICA AJUSTADA AQUI ---
                    if (paymentStatus === 'approved') {
                        // 1. Se o pagamento foi APROVADO, atualiza os dois status
                        db.run(
                            'UPDATE orders SET payment_status = ?, status = ? WHERE id = ?',
                            ['approved', 'processing', orderId],
                            function(err) {
                                if (err) return console.error(`[WEBHOOK] Erro ao atualizar pedido ${orderId} para APROVADO:`, err.message);
                                console.log(`[WEBHOOK][SUCESSO] Pedido ${orderId} atualizado para PAGO e PROCESSANDO.`);
                                // AQUI VOCÊ PODE ADICIONAR A LÓGICA DE IMPRESSÃO
                            }
                        );
                    } else {
                        // 2. Para outros status (pending, rejected, etc.), atualiza apenas o status de pagamento
                        db.run(
                            'UPDATE orders SET payment_status = ? WHERE id = ?',
                            [paymentStatus, orderId],
                            function(err) {
                                if (err) return console.error(`[WEBHOOK] Erro ao atualizar o status de pagamento do pedido ${orderId}:`, err.message);
                                console.log(`[WEBHOOK][SUCESSO] Pedido ${orderId} atualizado para: ${paymentStatus}.`);
                            }
                        );
                    }
                }
            }
        } else {
            console.log('[WEBHOOK] Notificação não continha um ID de pagamento processável.');
        }

    } catch (error) {
        console.error('[WEBHOOK] Erro ao processar webhook:', error);
    }
    
    // Responde 200 OK para o Mercado Pago parar de enviar a notificação
    res.status(200).send('ok');
});

module.exports = router;