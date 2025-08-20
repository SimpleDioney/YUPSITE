import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function PaymentFailurePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="text-center bg-card p-10 rounded-2xl shadow-lg max-w-md w-full">
          <XCircle className="h-20 w-20 text-destructive mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-foreground mb-3">Pagamento Recusado</h1>
          <p className="text-muted-foreground mb-8">
            Não foi possível processar seu pagamento. Por favor, verifique os dados ou tente com outro método de pagamento.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/checkout')} 
              className="flex-1"
            >
              Tentar Novamente
            </Button>
            <Button 
              onClick={() => navigate('/')} 
              className="flex-1"
              variant="outline"
            >
              Voltar para o Início
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
