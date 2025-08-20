import { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Price } from '@/components/ui/price';
import { useCartStore } from '@/store/cartStore';
import { useAuthUIStore } from "@/store/authUIStore";

import { useAuthStore } from '@/store/authStore';

export function CartDrawer() {
  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const totalPrice = useCartStore((state) => state.totalPrice);
  const closeCart = useCartStore((state) => state.closeCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const { openAuthModal } = useAuthUIStore();

  
  const { isAuthenticated } = useAuthStore();

  const handleCheckout = () => {
    closeCart();
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeCart}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <DialogPanel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-[100dvh] flex-col overflow-y-auto bg-background shadow-xl">
                    {/* Header */}
                    <div className="flex items-start justify-between p-4 border-b">
                      <DialogTitle className="text-lg font-medium text-foreground">
                        Carrinho de Compras
                      </DialogTitle>
                      <div className="ml-3 flex h-7 items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={closeCart}
                          className="h-8 w-8"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6">
                      {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">
                            Seu carrinho está vazio
                          </h3>
                          <p className="text-sm text-muted-foreground mb-6">
                            Adicione alguns produtos para começar suas compras
                          </p>
                          <Button onClick={closeCart} asChild>
                            <Link to="/">Continuar Comprando</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-6" key="cart-items-list">
                          {items.map((item) => (
                            <div key={item.id} className="flex items-center space-x-4">
                              {/* Product Image */}
                              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                                <img
                                  src={item.photo 
    ? `http://localhost:3000/uploads/${item.photo}` 
    : "/placeholder.jpg"}
                                  alt={item.name}
                                  className="h-full w-full object-cover object-center"
                                />
                              </div>

                              {/* Product Details */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-foreground truncate">
                                  {item.name}
                                </h4>
                                <Price amount={item.price} size="sm" className="mt-1" />
                                
                                {/* Quantity Controls */}
                                <div className="flex items-center mt-2 space-x-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  
                                  <span className="text-sm font-medium w-8 text-center">
                                    {item.quantity}
                                  </span>
                                  
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => removeItem(item.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              {/* Item Total */}
                              <div className="text-right">
                                <Price 
                                  amount={item.price * item.quantity} 
                                  size="sm" 
                                  className="font-medium"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    {items.length > 0 && (
                      <div className="border-t px-4 py-6 sm:px-6">
                        {/* Total */}
                        <div className="flex justify-between text-base font-medium text-foreground mb-4">
                          <span>Total</span>
                          <Price amount={totalPrice} size="lg" />
                        </div>
                        
                        <p className="mt-0.5 text-sm text-muted-foreground mb-6">
                          Frete calculado no checkout
                        </p>

                        {/* Checkout Button */}
                        {isAuthenticated ? (
                          <Button
                            className="w-full"
                            size="lg"
                            variant="gradient"
                            onClick={handleCheckout}
                            asChild
                          >
                            <Link to="/checkout">Finalizar Compra</Link>
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm text-center text-muted-foreground">
                              Faça login para finalizar sua compra
                            </p>
                            <Button
  className="w-full"
  size="lg"
  variant="outline"
  onClick={() => {
    closeCart();
    openAuthModal();
  }}
>
  Fazer Login
</Button>

                          </div>
                        )}

                        {/* Continue Shopping */}
                        <div className="mt-6 text-center text-sm">
                          <button
                            type="button"
                            className="font-medium text-primary hover:text-primary-hover"
                            onClick={closeCart}
                          >
                            Continuar comprando
                            <span aria-hidden="true"> &rarr;</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </DialogPanel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}