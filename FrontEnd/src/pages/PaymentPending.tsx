import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function PaymentPendingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="text-center bg-card p-10 rounded-2xl shadow-lg max-w-md w-full">
          <AlertTriangle className="h-20 w-20 text-yellow-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-foreground mb-3">Pagamento Pendente</h1>
          <p className="text-muted-foreground mb-8">
            Seu pagamento está sendo processado. Avisaremos assim que for aprovado. Você pode acompanhar o status na seção "Meus Pedidos".
          </p>
          <Button 
            onClick={() => navigate('/my-orders')} 
            className="w-full"
          >
            Acompanhar Pedido
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
