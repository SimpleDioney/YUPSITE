import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Price } from '@/components/ui/price';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { deliveryAPI, ordersAPI, paymentAPI } from '@/services/api';
import { ArrowLeft, CreditCard, MapPin, Package, Loader2 } from 'lucide-react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import { couponsAPI } from '@/services/api';

// Interface para a cotação de entrega
interface DeliveryQuote {
  fee: number;
  estimated_time: string;
}

// Inicialize o SDK com sua Public Key das variáveis de ambiente
// IMPORTANTE: Certifique-se de que REACT_APP_MERCADOPAGO_PUBLIC_KEY está no seu arquivo .env
initMercadoPago(import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY!, {
   locale: 'pt-BR'
});

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);
  
  // O estado agora armazena o ID da PREFERÊNCIA, não mais os dados do pagamento
  const [preferenceId, setPreferenceId] = useState<string | null>(null);

  // Efeito para verificar autenticação e se o carrinho não está vazio
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para finalizar sua compra',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    // Se o carrinho estiver vazio e não estivermos já na etapa final, redireciona
    if (items.length === 0 && step < 3) {
      navigate('/');
    }
  }, [isAuthenticated, items, navigate, toast, step]);

  // Efeito para limpar o carrinho após um pagamento bem-sucedido
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('status') === 'approved') {
        toast({
            title: "Pagamento Aprovado!",
            description: "Seu pedido foi recebido e já estamos preparando tudo.",
            className: "bg-green-600 text-white", // Toast de sucesso
        });
        clearCart();
        // Limpa os parâmetros da URL e redireciona para a página de pedidos
        navigate('/my-orders', { replace: true }); 
    }
  }, [clearCart, navigate, toast]);

  // Função para calcular o frete (sem alterações)
  const handleAddressSubmit = async () => {
    if (!deliveryAddress.trim()) {
      toast({ title: 'Endereço obrigatório', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await deliveryAPI.getQuote(deliveryAddress);
      setDeliveryQuote(response.data);
      setStep(2);
    } catch (error) {
      toast({ title: 'Erro ao calcular frete', description: 'Verifique o endereço e tente novamente.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Calcula o subtotal diretamente dos itens do carrinho
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsLoading(true);
        try {
            const response = await couponsAPI.applyCoupon(couponCode, subtotal);
            setDiscount(response.data.discount_amount);
            toast({ title: "Cupom aplicado com sucesso!" });
        } catch (error: any) {
            toast({ title: error.response?.data?.error || "Cupom inválido", variant: "destructive" });
            setDiscount(0);
        } finally {
            setIsLoading(false);
        }
    };


  // Função para criar o pedido e gerar a preferência de pagamento
  const handleProceedToPayment = async () => {
    setIsLoading(true);
    try {
      // Validar se há itens no carrinho
      if (items.length === 0) {
        toast({
          title: 'Carrinho vazio',
          description: 'Adicione produtos ao carrinho para continuar.',
          variant: 'destructive'
        });
        return;
      }

      // Cria o pedido no seu backend
      const orderData = {
        items: items.map(item => {
          // Tenta usar o ID do produto em diferentes formatos
          const itemId = item.productId || item.id;
          if (!itemId) {
            throw new Error(`Item sem ID válido: ${item.name}`);
          }
          const productId = parseInt(itemId);
          if (isNaN(productId)) {
            throw new Error(`ID inválido para o produto: ${item.name}`);
          }
          return { product_id: productId, quantity: item.quantity };
        }),
        coupon_code: discount > 0 ? couponCode : undefined,
        delivery_address: deliveryAddress,
        payment_method: 'mercadopago',
        delivery_fee: deliveryQuote?.fee || 0
      };
      
      const orderResponse = await ordersAPI.create(orderData);
      const createdOrderId = orderResponse.data.order_id;
      if (!createdOrderId) throw new Error("ID do pedido não foi retornado.");

      // Chama a nova rota do backend para criar a preferência
      const preferenceResponse = await paymentAPI.createPreference(createdOrderId, deliveryQuote?.fee || 0);
      if (!preferenceResponse.data.preferenceId) throw new Error("ID da preferência não foi retornado.");

      setPreferenceId(preferenceResponse.data.preferenceId);
      setStep(3); // Avança para a etapa de pagamento

    } catch (error) {
      console.error("Erro ao preparar pagamento:", error);
      // Log detalhado dos itens do carrinho para debug
      console.log("Items no carrinho:", items);
      toast({ 
        title: 'Erro ao iniciar pagamento', 
        description: error.response?.data?.error || 'Tente novamente.', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const totalWithDeliveryAndDiscount = totalPrice + (deliveryQuote?.fee || 0) - discount;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                if (step === 3) setPreferenceId(null); // Limpa a preferência ao voltar
                step === 1 ? navigate('/') : setStep(step - 1);
                }}
            >
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-primary">Finalizar Compra</h1>
        </div>

        {/* Indicador de Passos */}
        <div className="flex items-center justify-center mb-8">
           <div className="flex items-center space-x-4">
             <div className={`flex items-center justify-center w-10 h-10 rounded-full ${ step >= 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
               <MapPin className="h-5 w-5" />
             </div>
             <div className={`h-1 w-16 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
             <div className={`flex items-center justify-center w-10 h-10 rounded-full ${ step >= 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
               <Package className="h-5 w-5" />
             </div>
             <div className={`h-1 w-16 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
             <div className={`flex items-center justify-center w-10 h-10 rounded-full ${ step >= 3 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
               <CreditCard className="h-5 w-5" />
             </div>
           </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Conteúdo Principal Dinâmico */}
          <div className="space-y-6">
            
            {step === 1 && (
              <div className="bg-card rounded-2xl border-2 border-primary p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Endereço de Entrega</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Endereço completo</Label>
                    <Input
                      id="address"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Rua, número, bairro, cidade, CEP"
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={handleAddressSubmit} disabled={isLoading} className="w-full rounded-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Calculando...' : 'Calcular Frete'}
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && deliveryQuote && (
              <div className="bg-card rounded-2xl border-2 border-primary p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Opções de Entrega</h2>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Entrega Padrão</h3>
                        <p className="text-sm text-muted-foreground">{deliveryQuote.estimated_time}</p>
                      </div>
                      <Price amount={deliveryQuote.fee} />
                    </div>
                  </div>
                  <Button onClick={handleProceedToPayment} disabled={isLoading} className="w-full rounded-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Processando...' : 'Continuar para Pagamento'}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && preferenceId && (
              <div className="bg-card rounded-2xl border-2 border-primary p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Realizar Pagamento</h2>
                <p className="text-muted-foreground mb-4">
                  Clique no botão abaixo para concluir sua compra de forma segura no ambiente do Mercado Pago.
                </p>
                {/* O SDK do Mercado Pago renderiza o Checkout Pro aqui */}
                <Wallet 
                  initialization={{ preferenceId: preferenceId }} 
                />
              </div>
            )}
          </div>

          {/* Resumo do Pedido */}
          <div className="bg-card rounded-2xl border-2 border-primary p-6 h-fit">
            <h2 className="text-xl font-bold text-foreground mb-4">Resumo do Pedido</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <img src={item.photo 
    ? `http://localhost:3000/uploads/${item.photo}` 
    : "/placeholder.jpg"} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                  </div>
                  <Price amount={item.price * item.quantity} size="sm" />
                </div>
              ))}
              <Separator />
              <div className="flex gap-2">
                <Input placeholder="Código do cupom" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} />
                <Button onClick={handleApplyCoupon} disabled={isLoading}>Aplicar</Button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <Price amount={totalPrice} size="sm" />
                </div>
                {deliveryQuote && (
                  <div className="flex justify-between text-sm">
                    <span>Frete</span>
                    <Price amount={deliveryQuote.fee} size="sm" />
                  </div>
                )}
                <Separator />
                {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                        <span>Desconto</span>
                        <span>- <Price amount={discount} size="sm" /></span>
                    </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <Price amount={totalWithDeliveryAndDiscount} size="lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}