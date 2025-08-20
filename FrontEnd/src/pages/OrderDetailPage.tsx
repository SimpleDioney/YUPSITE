import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Price } from '@/components/ui/price';
import { ordersAPI } from '@/services/api';
import { Package, Calendar, MapPin, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  status: string;
  total_amount: number;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
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

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await ordersAPI.getById(id!);
        setOrder(response.data);
      } catch (error) {
        console.error('Error fetching order:', error);
        setError('Não foi possível carregar os detalhes do pedido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64" />
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {error || 'Pedido não encontrado'}
          </h2>
          <Button asChild className="mt-4">
            <Link to="/my-orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Meus Pedidos
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" asChild>
            <Link to="/my-orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Pedido #{String(order.id).padStart(8, '0')}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                {statusLabels[order.status as keyof typeof statusLabels]}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {format(new Date(order.created_at + 'Z'), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Order Items */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-card rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Itens do Pedido</h2>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-background rounded-lg border hover:border-primary transition-colors">
                    <div className="relative h-24 w-24 flex-shrink-0">
                      <img
                        src={item.product_photo ? `http://localhost:3000/uploads/${item.product_photo}` : "/placeholder.jpg"}
                        alt={item.product_name}
                        className="h-full w-full object-cover rounded-lg"
                        onError={(e) => {
                          console.error('Erro ao carregar imagem:', item.product_photo);
                          const img = e.target as HTMLImageElement;
                          img.src = "/placeholder.jpg";
                        }}
                      />
                      <div className="absolute -top-2 -right-2 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="font-medium text-foreground text-lg">
                        {item.product_name}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Price amount={item.price} size="sm" /> por unidade
                      </div>
                    </div>
                    <div className="text-right">
                      <Price amount={item.price * item.quantity} size="lg" className="font-bold text-primary" />
                      <div className="text-xs text-muted-foreground mt-1">
                        Total do item
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <div className="bg-card rounded-lg overflow-hidden">
              <div className="bg-primary/10 p-4">
                <h2 className="text-lg font-semibold text-primary">Resumo do Pedido</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Subtotal dos produtos</span>
                    </div>
                    <Price amount={Math.abs(order.subtotal)} size="sm" />
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Frete</span>
                    </div>
                    <Price amount={Math.abs(order.delivery_fee)} size="sm" />
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Desconto aplicado</span>
                      </div>
                      <span>- <Price amount={Math.abs(order.discount_amount)} size="sm" className="text-green-600" /></span>
                    </div>
                  )}
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-lg">Total do pedido</span>
                    <Price amount={Math.abs(order.total_amount)} size="lg" className="font-bold text-primary" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg overflow-hidden">
              <div className="bg-primary/10 p-4">
                <h2 className="text-lg font-semibold text-primary">Endereço de Entrega</h2>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground">
                      {order.delivery_address}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      O prazo de entrega será calculado após a confirmação do pagamento
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
