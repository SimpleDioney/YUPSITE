import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/logo.svg";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      {/* Container principal com padding inferior reduzido para aproximar as seções finais */}
      <div className="container mx-auto px-4 pt-16 pb-8">
        {/* Seção Principal do Rodapé */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-6">
            <img src={logo} alt="YUP" className="h-12 w-auto brightness-0 invert" />
            <p className="text-background/80 leading-relaxed">
              Criando experiências gastronômicas especiais com produtos
              e ingredientes selecionados.
            </p>
            <div className="flex space-x-4">
              <a href="https://instagram.com/yupalimentos" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="text-background hover:text-primary hover:bg-background/10">
                  <Instagram className="w-5 h-5" />
                </Button>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6">Links Rápidos</h3>
            <div className="space-y-3">
              <a href="/products" className="block text-background/80 hover:text-primary transition-colors">
                Produtos
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-6">Contato</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-primary" />
                <span className="text-background/80">(43) 8874-2317</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary" />
                <span className="text-background/80">contato@yupdistribuidora.com.br</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <span className="text-background/80">
                  Rua Fortaleza, 74<br />
                  Londrina, PR
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra Inferior com Copyright e Links Legais */}
        <div className="border-t border-background/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-background/60 text-sm">
              © {new Date().getFullYear()} YUP. Todos os direitos reservados.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="/privacidade" className="text-background/60 hover:text-primary transition-colors">
                Política de Privacidade
              </a>
              <a href="/termos" className="text-background/60 hover:text-primary transition-colors">
                Termos de Uso
              </a>
              <a href="/cookies" className="text-background/60 hover:text-primary transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* --- SEÇÃO DE CRÉDITOS ULTRA-FINA --- */}
      <div className="border-t border-background/10">
        {/* Padding vertical mínimo (py-2) para a barra mais fina possível */}
        <div className="container mx-auto px-4 py-1">
          <div className="text-center text-sm text-background/70">
            <span>
              Desenvolvido por{' '}
              <a
                href="https://dioney.notiffly.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-background/90 hover:text-primary transition-colors"
              >
                Dioney Gabriel
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};