const axios = require('axios');
const { runAsync, getAsync } = require('../utils/dbHelpers');

class UberDeliveryService {
    constructor() {
        this.apiKey = process.env.UBER_API_KEY;
        this.baseUrl = process.env.UBER_API_URL || 'https://api.uber.com/v1/delivery';
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async requestDelivery(orderId) {
        try {
            // Buscar informações do pedido
            const order = await getAsync(
                `SELECT o.*, u.name as customer_name, u.phone as customer_phone 
                 FROM orders o 
                 JOIN users u ON o.user_id = u.id 
                 WHERE o.id = ?`,
                [orderId]
            );

            if (!order) {
                throw new Error('Pedido não encontrado');
            }

            // Criar payload para a API do Uber
            const deliveryRequest = {
                pickup: {
                    location: {
                        address: process.env.STORE_ADDRESS,
                        name: process.env.STORE_NAME,
                        phone: process.env.STORE_PHONE
                    }
                },
                dropoff: {
                    location: {
                        address: order.delivery_address,
                        name: order.customer_name,
                        phone: order.customer_phone
                    }
                },
                order_reference: orderId.toString()
            };

            // Fazer requisição para a API do Uber
            const response = await this.client.post('/requests', deliveryRequest);

            // Salvar informações da entrega
            await runAsync(
                `UPDATE orders SET 
                    delivery_id = ?,
                    delivery_status = ?,
                    delivery_tracking_url = ?
                 WHERE id = ?`,
                [
                    response.data.id,
                    'requested',
                    response.data.tracking_url,
                    orderId
                ]
            );

            return {
                success: true,
                delivery_id: response.data.id,
                tracking_url: response.data.tracking_url
            };

        } catch (error) {
            console.error('Erro ao solicitar entrega:', error);
            throw error;
        }
    }

    async updateDeliveryStatus(deliveryId, status) {
        try {
            // Atualizar status no banco de dados
            await runAsync(
                'UPDATE orders SET delivery_status = ? WHERE delivery_id = ?',
                [status, deliveryId]
            );

            // Buscar o pedido atualizado
            const order = await getAsync(
                'SELECT id, status, delivery_status FROM orders WHERE delivery_id = ?',
                [deliveryId]
            );

            return order;
        } catch (error) {
            console.error('Erro ao atualizar status da entrega:', error);
            throw error;
        }
    }

    async getDeliveryStatus(deliveryId) {
        try {
            const response = await this.client.get(`/requests/${deliveryId}`);
            return response.data.status;
        } catch (error) {
            console.error('Erro ao buscar status da entrega:', error);
            throw error;
        }
    }
}

module.exports = new UberDeliveryService();
