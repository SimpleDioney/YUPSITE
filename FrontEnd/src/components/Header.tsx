import { Button } from "@/components/ui/button";
import { ShoppingCart, Menu, X, User, LogOut } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.svg";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuthUIStore } from "@/store/authUIStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthModalOpen, openAuthModal, closeAuthModal } = useAuthUIStore();

  const { totalItems, toggleCart } = useCartStore();
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <header className="bg-background border-b border-orange-200 sticky top-0 z-50 backdrop-blur-sm bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/">
              <img src={logo} alt="YUP" className="h-10 w-auto" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-foreground hover:text-primary transition-colors"
            >
              Início
            </Link>
            <Link
              to="/products"
              className="text-foreground hover:text-primary transition-colors"
            >
              Produtos
            </Link>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={toggleCart}
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link to="/profile">
                    <DropdownMenuItem>Perfil</DropdownMenuItem>
                  </Link>
                  <Link to="/my-orders">
                    <DropdownMenuItem>Meus Pedidos</DropdownMenuItem>
                  </Link>
                  {user?.is_admin && (
                    <Link to="/admin">
                      <DropdownMenuItem>Admin</DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" size="sm" onClick={openAuthModal}>
                Entrar
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-orange-200">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                className="text-foreground hover:text-primary transition-colors"
              >
                Início
              </Link>
              <Link
                to="/products"
                className="text-foreground hover:text-primary transition-colors"
              >
                Produtos
              </Link>
              <Button
                variant="ghost"
                className="w-full relative"
                onClick={toggleCart}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Carrinho
                {totalItems > 0 && (
                  <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </Button>

              {isAuthenticated ? (
                <>
                  <Link to="/profile">
                    <Button variant="ghost" className="w-full">
                      Perfil
                    </Button>
                  </Link>
                  <Link to="/my-orders">
                    <Button variant="ghost" className="w-full">
                      Meus Pedidos
                    </Button>
                  </Link>
                  {user?.is_admin && (
                    <Link to="/admin">
                      <Button variant="ghost" className="w-full">
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={logout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </Button>
                </>
              ) : (
                <Button variant="default" size="sm" onClick={openAuthModal}>
                  Entrar
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </header>
  );
};