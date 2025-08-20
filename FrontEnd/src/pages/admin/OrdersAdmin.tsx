import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Price } from '@/components/ui/price';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/services/api';
import { Package, Calendar, MapPin, User, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_photo: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  created_at: string;
  items: OrderItem[];
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels = {
  pending: 'Pendente',
  processing: 'Processando',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await adminAPI.getOrders();
      setOrders(response.data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar pedidos',
        description: 'Tente novamente mais tarde',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await adminAPI.updateOrderStatus(orderId, newStatus);
      fetchOrders();
      toast({
        title: 'Status atualizado!',
        description: 'O status do pedido foi alterado com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar status',
        description: 'Tente novamente mais tarde',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-primary">Gerenciar Pedidos</h2>
        <p className="text-muted-foreground">
          Visualize e gerencie todos os pedidos da loja
        </p>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-card rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-6 bg-muted rounded w-20" />
                </div>
                <div className="h-3 bg-muted rounded w-48" />
                <div className="h-8 bg-muted rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhum pedido encontrado
          </h3>
          <p className="text-muted-foreground">
            Os pedidos aparecerão aqui quando forem realizados
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border-2 border-primary overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Pedido</th>
                  <th className="text-left p-4 font-medium">Cliente</th>
                  <th className="text-left p-4 font-medium">Data</th>
                  <th className="text-left p-4 font-medium">Total</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t">
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">
                          #{String(order.id).padStart(8, '0')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{order.user_name}</div>
                        <div className="text-sm text-muted-foreground">{order.user_email}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {format(new Date(order.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </td>
                    <td className="p-4">
                      <Price amount={order.total_amount} size="sm" className="font-medium" />
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                          {statusLabels[order.status as keyof typeof statusLabels]}
                        </Badge>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value)}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="processing">Processando</SelectItem>
                            <SelectItem value="shipped">Enviado</SelectItem>
                            <SelectItem value="delivered">Entregue</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                    <td className="p-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleViewDetails(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              Detalhes do Pedido #{selectedOrder ? String(selectedOrder.id).padStart(8, '0') : ''}
            </DialogTitle>
            <DialogDescription>
              Informações completas do pedido selecionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Cliente</span>
                  </div>
                  <div>
                    <div className="font-medium">{selectedOrder.user_name}</div>
                    <div className="text-sm text-muted-foreground">{selectedOrder.user_email}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Data do Pedido</span>
                  </div>
                  <div className="text-sm">
                    {format(new Date(selectedOrder.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Endereço de Entrega</span>
                </div>
                <div className="text-sm bg-muted p-3 rounded-lg">
                  {selectedOrder.delivery_address}
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Itens do Pedido</span>
                </div>
                <div className="space-y-2">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                      <img
                        src={item.product_photo ? `http://localhost:3000/uploads/${item.product_photo}` : "/placeholder.jpg"}
                        alt={item.product_name}
                        className="w-12 h-12 object-cover rounded-lg"
                        onError={(e) => {
                          console.error('Erro ao carregar imagem:', item.product_photo);
                          const img = e.target as HTMLImageElement;
                          img.src = "/placeholder.jpg";
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.product_name}</div>
                        <div className="text-xs text-muted-foreground">
                          Quantidade: {item.quantity}
                        </div>
                      </div>
                      <div className="text-right">
                        <Price amount={item.price * item.quantity} size="sm" />
                        <div className="text-xs text-muted-foreground">
                          <Price amount={item.price} size="sm" /> cada
                        </div>
                      </div>
                    </div>
                  ))) : (
                    <div className="text-sm text-muted-foreground text-center p-4 bg-muted rounded-lg">
                      Nenhum item encontrado neste pedido
                    </div>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-medium">Total do Pedido</span>
                <Price amount={selectedOrder.total_amount} size="lg" className="font-bold" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}