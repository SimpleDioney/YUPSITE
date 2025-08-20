import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { clearCart } = useCartStore();

  useEffect(() => {
    // Limpa o carrinho assim que a página de sucesso é montada
    clearCart();

    // Redireciona o usuário para a página de pedidos após 3 segundos
    const timer = setTimeout(() => {
      navigate('/my-orders');
    }, 3000);

    // Limpa o timer se o componente for desmontado antes do tempo
    return () => clearTimeout(timer);
  }, [clearCart, navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="text-center bg-card p-10 rounded-2xl shadow-lg max-w-md w-full">
          <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-6 animate-pulse" />
          <h1 className="text-3xl font-bold text-foreground mb-3">Pagamento Aprovado!</h1>
          <p className="text-muted-foreground mb-8">
            Seu pedido foi recebido com sucesso. Já estamos preparando tudo para você!
          </p>
          <p className="text-sm text-muted-foreground">
            Você será redirecionado em alguns segundos...
          </p>
          <Button 
            onClick={() => navigate('/my-orders')} 
            className="mt-4"
            variant="outline"
          >
            Ver Meus Pedidos
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
