import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Cabeçalho da Página */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
              Política de Cookies
            </h1>
            <p className="text-lg text-muted-foreground">
              Última atualização: 5 de Agosto de 2025
            </p>
          </div>

          {/* Conteúdo da Política */}
          <div className="bg-card rounded-2xl p-6 md:p-10 border border-border/50 space-y-8">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">
                1. O que são Cookies?
              </h2>
              <p className="text-muted-foreground">
                Cookies são pequenos arquivos de texto que um site armazena no seu computador ou dispositivo móvel quando você o visita. Eles são essenciais para que o site funcione corretamente e de forma mais eficiente, além de fornecerem informações valiosas para os proprietários do site.
              </p>
            </div>

            <div className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground">
                2. Como Usamos os Cookies?
              </h2>
              <p className="text-muted-foreground">
                Nós utilizamos cookies para diversas finalidades, visando sempre aprimorar a sua experiência. Abaixo, detalhamos as categorias de cookies que utilizamos em nossa plataforma:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-3 pl-4">
                <li>
                  <strong>Cookies Estritamente Necessários:</strong> Estes são indispensáveis para o funcionamento do site. Eles permitem que você navegue e utilize funcionalidades essenciais, como o carrinho de compras e o acesso a áreas seguras (login). Sem eles, os serviços não podem ser prestados.
                </li>
                <li>
                  <strong>Cookies de Desempenho e Análise:</strong> Coletam informações anônimas sobre como os visitantes utilizam nosso site, como as páginas mais acessadas. Esses dados nos ajudam a entender o comportamento do usuário e a otimizar a plataforma.
                </li>
                <li>
                  <strong>Cookies de Funcionalidade:</strong> Permitem que o site se lembre de suas escolhas (como nome de usuário ou itens no carrinho) para oferecer uma experiência mais personalizada e conveniente.
                </li>
                <li>
                  <strong>Cookies de Publicidade:</strong> São utilizados para direcionar anúncios que sejam mais relevantes para você e seus interesses, tanto em nosso site quanto em outras plataformas.
                </li>
              </ul>
            </div>

            <div className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground">
                3. Como Gerenciar os Cookies
              </h2>
              <p className="text-muted-foreground">
                Você pode controlar e/ou deletar cookies como desejar. A maioria dos navegadores permite que você recuse ou aceite cookies através de suas configurações. No entanto, a desativação de cookies essenciais pode impactar a funcionalidade do nosso site e impedir a finalização de compras.
              </p>
              <p className="text-muted-foreground">
                Para mais informações sobre como gerenciar cookies nos principais navegadores, visite os links abaixo:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                  <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
                  <li><a href="https://support.mozilla.org/pt-BR/kb/impeca-que-sites-armazenem-cookies-e-dados-no-fir" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
                  <li><a href="https://support.microsoft.com/pt-br/windows/excluir-e-gerenciar-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
                  <li><a href="https://support.apple.com/pt-br/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari</a></li>
              </ul>
            </div>

            <div className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground">
                4. Alterações nesta Política
              </h2>
              <p className="text-muted-foreground">
                Podemos atualizar esta Política de Cookies periodicamente para refletir mudanças em nossas práticas ou por outras razões operacionais, legais ou regulatórias. Recomendamos que você revise esta página regularmente para se manter informado.
              </p>
            </div>

            <div className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground">
                5. Contato
              </h2>
              <p className="text-muted-foreground">
                Se tiver dúvidas sobre o nosso uso de cookies, entre em contato conosco através do e-mail: <span className="font-medium text-primary">contato@yupdistribuidora.com.br</span>.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}