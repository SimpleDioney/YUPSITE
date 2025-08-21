import { Link } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Price } from '@/components/ui/price';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  photo: string;
  stock: number;
  is_active: boolean;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Product stock:', product.stock); // Debug
    if (product.stock <= 0) {
      toast({
        title: 'Produto indisponível',
        description: 'Este produto está fora de estoque',
        variant: 'destructive',
      });
      return;
    }

        try {
      const item = {
        id: product.id,
        name: product.name,
        price: product.price,
        photo: product.photo,
        quantity: 1,
        stock: Number(product.stock) // Garantir que é número
      };
      console.log('Adding item to cart:', item); // Debug
      addItem(item);

      toast({
        title: 'Produto adicionado!',
        description: `${product.name} foi adicionado ao carrinho`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar produto',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!product.is_active) {
    return null;
  }

  return (
    <div className="group relative bg-card rounded-3xl border-2 border-primary shadow-card hover:shadow-hover transition-all duration-300 overflow-hidden">
      <Link to={`/products/${product.id}`} className="block">
        {/* Small badge in top right */}
        <div className="absolute top-3 right-3 z-10">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-xs text-primary-foreground font-bold">YUP</span>
          </div>
        </div>

        {/* Product Image */}
        <div className="aspect-square w-full overflow-hidden bg-muted p-4">
          <img
            src={product.photo 
    ? `http://localhost:3000/uploads/${product.photo}` 
    : "/placeholder.jpg"}
            alt={product.name}
            className="h-full w-full object-cover object-center rounded-2xl group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Product Info */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-1">
            {product.name}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
            {product.description}
          </p>
          
          <div className="flex items-center justify-between mb-4">
            <div className="text-left">
              <Price amount={product.price} size="sm" className="text-primary font-bold" />
              <div className="text-xs text-muted-foreground mt-1">
                Pc. {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/un
              </div>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="w-full rounded-full py-3 text-white font-bold text-sm"
            variant={product.stock <= 0 ? 'secondary' : 'default'}
          >
            {product.stock <= 0 ? 'INDISPONÍVEL' : 'ADICIONAR'}
          </Button>
        </div>
      </Link>
    </div>
  );
}