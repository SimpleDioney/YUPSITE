import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Cabeçalho da Página */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
              Política de Privacidade
            </h1>
            <p className="text-lg text-muted-foreground">
              Última atualização: 5 de Agosto de 2025
            </p>
          </div>

          {/* Conteúdo da Política */}
          <div className="bg-card rounded-2xl p-6 md:p-10 border border-border/50 space-y-8">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">
                1. Introdução
              </h2>
              <p className="text-muted-foreground">
                Sua privacidade é de extrema importância para nós. Esta Política de Privacidade descreve como suas informações pessoais são coletadas, usadas e compartilhadas quando você visita ou realiza uma compra em nosso site, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
            </div>

            <div className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground">
                2. Coleta de Informações
              </h2>
              <p className="text-muted-foreground">
                Coletamos informações de diversas formas para fornecer e melhorar nossos serviços:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 pl-4">
                <li>
                  <strong>Informações Fornecidas por Você:</strong> Ao criar uma conta, fazer um pedido ou nos contatar, você nos fornece dados como nome, e-mail, telefone, endereço de entrega e dados de pagamento.
                </li>
                <li>
                  <strong>Informações Coletadas Automaticamente:</strong> Ao navegar em nosso site, coletamos dados sobre seu dispositivo, como endereço IP, navegador, fuso horário e cookies, para otimizar sua experiência.
                </li>
              </ul>
            </div>

            <div className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground">
                3. Como Usamos Suas Informações
              </h2>
              <p className="text-muted-foreground">
                As informações coletadas são utilizadas para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 pl-4">
                <li>Processar e enviar seus pedidos.</li>
                <li>Gerenciar sua conta e personalizar sua experiência.</li>
                <li>Comunicar novidades, ofertas e informações importantes sobre nossos serviços.</li>
                <li>Prevenir fraudes e garantir a segurança de nossa plataforma.</li>
                <li>Cumprir obrigações legais e regulatórias.</li>
              </ul>
            </div>

            <div className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground">
                4. Compartilhamento de Informações
              </h2>
              <p className="text-muted-foreground">
                Não comercializamos suas informações pessoais. O compartilhamento de dados ocorre apenas com parceiros essenciais para nossa operação, como intermediadores de pagamento e transportadoras, que se comprometem a seguir as normas de segurança e privacidade.
              </p>
            </div>

            <div className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground">
                5. Segurança dos Dados
              </h2>
              <p className="text-muted-foreground">
                Adotamos medidas de segurança técnicas e administrativas para proteger seus dados. Transações financeiras são protegidas com criptografia (SSL). Ainda assim, nenhum sistema é 100% infalível, mas nos comprometemos com as melhores práticas para garantir a segurança.
              </p>
            </div>

            <div className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground">
                6. Seus Direitos (LGPD)
              </h2>
              <p className="text-muted-foreground">
                Você, como titular dos dados, tem o direito de solicitar o acesso, a correção, a anonimização, o bloqueio ou a eliminação de seus dados. Para exercer seus direitos, entre em contato conosco através dos canais informados ao final desta política.
              </p>
            </div>
            
            <div className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground">
                7. Cookies
              </h2>
              <p className="text-muted-foreground">
                Utilizamos cookies para melhorar sua experiência de navegação, lembrar suas preferências e otimizar o desempenho do site. Você pode gerenciar o uso de cookies através das configurações do seu navegador.
              </p>
            </div>

            <div className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground">
                8. Alterações nesta Política
              </h2>
              <p className="text-muted-foreground">
                Podemos atualizar esta política periodicamente para refletir mudanças em nossas práticas ou por razões legais. Recomendamos que você revise esta página com frequência.
              </p>
            </div>

            <div className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground">
                9. Contato
              </h2>
              <p className="text-muted-foreground">
                Para mais informações sobre nossas práticas de privacidade ou para exercer seus direitos, entre em contato conosco pelo e-mail: <span className="font-medium text-primary">contato@yupdistribuidora.com.br</span>.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}