const { getAsync } = require('../utils/dbHelpers');

class NotificationService {
    constructor() {
        this.statusMessages = {
            // Mensagens de pagamento
            'pending': 'Aguardando pagamento',
            'approved': 'Pagamento aprovado',
            'rejected': 'Pagamento recusado',
            'cancelled': 'Pedido cancelado',
            
            // Mensagens de preparação
            'preparing': 'Pedido em preparação',
            
            // Mensagens de entrega
            'requested': 'Buscando entregador',
            'picking_up': 'Entregador a caminho do restaurante',
            'in_transit': 'Pedido a caminho',
            'delivered': 'Pedido entregue',
            'delivery_failed': 'Falha na entrega'
        };
    }

    async notifyStatusChange(orderId, newStatus) {
        try {
            // Buscar informações do pedido e do cliente
            const order = await getAsync(
                `SELECT o.*, u.email, u.name, u.phone 
                 FROM orders o 
                 JOIN users u ON o.user_id = u.id 
                 WHERE o.id = ?`,
                [orderId]
            );

            if (!order) {
                throw new Error('Pedido não encontrado');
            }

            const statusMessage = this.statusMessages[newStatus] || 'Status atualizado';

            // Notificar o cliente
            await this.notifyCustomer(order, statusMessage);

            // Notificar o admin
            await this.notifyAdmin(order, statusMessage);

            return true;
        } catch (error) {
            console.error('Erro ao enviar notificações:', error);
            throw error;
        }
    }

    async notifyCustomer(order, message) {
        // TODO: Implementar integração com serviço de e-mail
        console.log(`[EMAIL] Para: ${order.email}
            Assunto: Atualização do seu pedido #${order.id}
            Mensagem: ${message}`);

        // TODO: Implementar integração com serviço de SMS
        if (order.phone) {
            console.log(`[SMS] Para: ${order.phone}
                Mensagem: Pedido #${order.id}: ${message}`);
        }

        // TODO: Implementar notificações em tempo real (WebSocket/SSE)
        console.log(`[REALTIME] User: ${order.user_id}
            Tipo: ORDER_UPDATE
            Dados: { orderId: ${order.id}, status: "${message}" }`);
    }

    async notifyAdmin(order, message) {
        // TODO: Implementar notificações para o painel admin
        console.log(`[ADMIN] 
            Tipo: ORDER_UPDATE
            Pedido: #${order.id}
            Cliente: ${order.name}
            Status: ${message}`);

        // TODO: Implementar notificações em tempo real para o painel admin
        console.log(`[REALTIME-ADMIN] 
            Tipo: ORDER_UPDATE
            Dados: { 
                orderId: ${order.id}, 
                status: "${message}",
                customer: "${order.name}"
            }`);
    }
}

module.exports = new NotificationService();
