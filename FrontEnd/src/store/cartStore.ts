import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;  // ID do produto como string
  name: string;
  photo: string;
  price: number;
  quantity: number;
  type?: 'package' | 'kg';
  unit_value?: string;
  stock: number;  // Campo de estoque não é mais opcional
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  subtotal: number; // Preço total dos itens
  deliveryFee: number | null;
  totalPrice: number; // subtotal + frete - desconto
  isOpen: boolean;
  coupon: {
    code: string | null;
    discount: number;
    discount_type: 'fixed' | 'percentage' | null;
  };
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  setDeliveryFee: (fee: number | null) => void;
  applyCoupon: (couponData: { code: string; discount: number; discount_type: 'fixed' | 'percentage' }) => void;
  removeCoupon: () => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

// Função auxiliar para recalcular totais
const calculateTotals = (items: CartItem[], deliveryFee: number | null, coupon: CartState['coupon']) => {
  // Garantir que todos os valores sejam números
  const subtotal = items.reduce((acc, item) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;
    return acc + (price * quantity);
  }, 0);

  let totalDiscount = 0;
  const discount = Number(coupon.discount) || 0;

  if (coupon.code) {
    if (coupon.discount_type === 'percentage') {
      totalDiscount = subtotal * (discount / 100);
    } else {
      totalDiscount = discount;
    }
  }

  const fee = Number(deliveryFee) || 0;
  const totalPrice = subtotal + fee - totalDiscount;
  const totalItems = items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);

  return { subtotal, totalPrice, totalItems };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      subtotal: 0,
      deliveryFee: null,
      totalPrice: 0,
      isOpen: false,
      coupon: { code: null, discount: 0, discount_type: null },

      // Ação para adicionar item
      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id);
          let newItems;

          // Garantir que o preço e quantidade sejam números
          const safeItem = {
            ...item,
            id: item.id,
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            stock: Number(item.stock)
          };

          console.log('Safe item:', safeItem); // Debug
          
          // Verificar se há estoque suficiente
          if (existingItem) {
            console.log('Existing item:', existingItem); // Debug
            const newQuantity = existingItem.quantity + safeItem.quantity;
            const stock = Number(safeItem.stock);
            
            if (isNaN(stock) || stock <= 0) {
              throw new Error('Produto sem estoque disponível');
            }
            
            if (newQuantity > stock) {
              throw new Error(`Apenas ${stock} unidades disponíveis em estoque`);
            }
            
            newItems = state.items.map((i) =>
              i.id === item.id
                ? { ...i, quantity: newQuantity, stock }
                : i
            );
          } else {
            const stock = Number(safeItem.stock);
            
            if (isNaN(stock) || stock <= 0) {
              throw new Error('Produto sem estoque disponível');
            }
            
            if (safeItem.quantity > stock) {
              throw new Error(`Apenas ${stock} unidades disponíveis em estoque`);
            }
            
            newItems = [...state.items, { ...safeItem, stock }];
          }

          const { subtotal, totalPrice, totalItems } = calculateTotals(newItems, state.deliveryFee, state.coupon);
          return { items: newItems, subtotal, totalPrice, totalItems };
        });
      },

      // Ação para remover item
      removeItem: (itemId) => {
        set((state) => {
          const newItems = state.items.filter((i) => i.id !== itemId);
          const { subtotal, totalPrice, totalItems } = calculateTotals(newItems, state.deliveryFee, state.coupon);
          return { items: newItems, subtotal, totalPrice, totalItems };
        });
      },
      
      // Ação para atualizar quantidade
      updateQuantity: (itemId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            // Remove o item se a quantidade for 0 ou menor
            const newItems = state.items.filter((i) => i.id !== itemId);
            const { subtotal, totalPrice, totalItems } = calculateTotals(newItems, state.deliveryFee, state.coupon);
            return { items: newItems, subtotal, totalPrice, totalItems };
          }

          const item = state.items.find(i => i.id === itemId);
          if (!item) return state;

          console.log('Updating quantity for item:', item); // Debug
          const stock = Number(item.stock);

          if (isNaN(stock) || stock <= 0) {
            throw new Error('Produto sem estoque disponível');
          }

          // Verificar estoque
          if (quantity > stock) {
            throw new Error(`Apenas ${stock} unidades disponíveis em estoque`);
          }
          
          const newItems = state.items.map((i) =>
            i.id === itemId ? { ...i, quantity, stock } : i
          );
          const { subtotal, totalPrice, totalItems } = calculateTotals(newItems, state.deliveryFee, state.coupon);
          return { items: newItems, subtotal, totalPrice, totalItems };
        });
      },
      
      // Definir taxa de entrega
      setDeliveryFee: (fee) => {
        set((state) => {
          const { subtotal, totalPrice, totalItems } = calculateTotals(state.items, fee, state.coupon);
          return { deliveryFee: fee, subtotal, totalPrice, totalItems };
        });
      },
      
      // Aplicar cupom
      applyCoupon: (couponData) => {
        set((state) => {
            const newCoupon = {
                code: couponData.code,
                discount: couponData.discount,
                discount_type: couponData.discount_type
            };
            const { subtotal, totalPrice, totalItems } = calculateTotals(state.items, state.deliveryFee, newCoupon);
            return { coupon: newCoupon, subtotal, totalPrice, totalItems };
        });
      },

      // Remover cupom
      removeCoupon: () => {
        set((state) => {
            const noCoupon = { code: null, discount: 0, discount_type: null };
            const { subtotal, totalPrice, totalItems } = calculateTotals(state.items, state.deliveryFee, noCoupon);
            return { coupon: noCoupon, subtotal, totalPrice, totalItems };
        });
      },

      // Limpar carrinho
      clearCart: () => {
        set({
          items: [],
          totalItems: 0,
          subtotal: 0,
          deliveryFee: null,
          totalPrice: 0,
          isOpen: false,
          coupon: { code: null, discount: 0, discount_type: null },
        });
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'cart-storage', // Nome para o localStorage
    }
  )
);