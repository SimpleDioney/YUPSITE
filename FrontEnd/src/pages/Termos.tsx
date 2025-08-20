import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Cabeçalho da Página */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
              Termos e Condições de Uso
            </h1>
            <p className="text-lg text-muted-foreground">
              Última atualização: 5 de Agosto de 2025
            </p>
          </div>

          {/* Conteúdo dos Termos */}
          <div className="bg-card rounded-2xl p-6 md:p-10 border border-border/50 space-y-8">
            <p className="text-muted-foreground">
              Bem-vindo(a) à nossa loja! Estes Termos de Uso ("Termos") regem seu acesso e uso do nosso site, serviços e produtos. Ao acessar ou usar nossa plataforma, você concorda em cumprir e estar vinculado a estes Termos. Por favor, leia-os com atenção.
            </p>

            <div className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground">
                1. Aceitação dos Termos
              </h2>
              <p className="text-muted-foreground">
                Ao criar uma conta, fazer um pedido ou de outra forma utilizar nosso site, você confirma que leu, entendeu e concorda em estar sujeito a estes Termos. Se você não concordar com qualquer parte dos termos, não deverá utilizar nossos serviços.
              </p>
            </div>

            <div className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground">
                2. Uso do Site
              </h2>
              <p className="text-muted-foreground">
                Você concorda em usar o site apenas para fins legais e de maneira que não infrinja os direitos de, restrinja ou iniba o uso e gozo do site por qualquer terceiro. Comportamentos proibidos incluem assediar ou causar angústia a qualquer outra pessoa, transmitir conteúdo obsceno ou ofensivo ou interromper o fluxo normal de diálogo dentro do nosso site.
              </p>
            </div>

            <div className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground">
                3. Produtos, Preços e Pagamentos
              </h2>
              <p className="text-muted-foreground">
                Esforçamo-nos para exibir com a maior precisão possível as cores e imagens dos nossos produtos. Não podemos garantir que a exibição de qualquer cor no monitor do seu computador será precisa.
              </p>
              <p className="text-muted-foreground">
                Os preços de nossos produtos estão sujeitos a alterações sem aviso prévio. Reservamo-nos o direito de, a qualquer momento, modificar ou descontinuar o Serviço (ou qualquer parte ou conteúdo do mesmo) sem aviso prévio. Todos os pagamentos devem ser recebidos integralmente antes do envio de qualquer pedido.
              </p>
            </div>

            <div className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground">
                4. Contas de Usuário
              </h2>
              <p className="text-muted-foreground">
                Se você criar uma conta em nosso site, você é responsável por manter a segurança de sua conta e é totalmente responsável por todas as atividades que ocorrem sob a conta. Você deve nos notificar imediatamente sobre qualquer uso não autorizado de sua conta ou qualquer outra violação de segurança.
              </p>
            </div>

            <div className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground">
                5. Propriedade Intelectual
              </h2>
              <p className="text-muted-foreground">
                O Serviço e seu conteúdo original, recursos e funcionalidades são e permanecerão propriedade exclusiva de nossa empresa e de seus licenciadores. O Serviço é protegido por direitos autorais, marcas registradas e outras leis do Brasil. Nossas marcas registradas não podem ser usadas em conexão com qualquer produto ou serviço sem o nosso consentimento prévio por escrito.
              </p>
            </div>

            <div className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground">
                6. Limitação de Responsabilidade
              </h2>
              <p className="text-muted-foreground">
                Em nenhuma circunstância nossa empresa, nem seus diretores, funcionários, parceiros ou afiliados, serão responsáveis por quaisquer danos indiretos, incidentais, especiais ou consequenciais, incluindo, sem limitação, perda de lucros, dados ou uso, resultantes do seu acesso ou uso ou incapacidade de acessar ou usar o Serviço.
              </p>
            </div>

            <div className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground">
                7. Alterações nos Termos
              </h2>
              <p className="text-muted-foreground">
                Reservamo-nos o direito, a nosso exclusivo critério, de modificar ou substituir estes Termos a qualquer momento. Se uma revisão for material, tentaremos fornecer um aviso com pelo menos 30 dias de antecedência antes que quaisquer novos termos entrem em vigor.
              </p>
            </div>

            <div className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground">
                8. Contato
              </h2>
              <p className="text-muted-foreground">
                Se você tiver alguma dúvida sobre estes Termos, entre em contato conosco através do e-mail: contato@yupdistribuidora.com.br.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}