import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Price } from '@/components/ui/price';
import { productsAPI } from '@/services/api';
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

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        const response = await productsAPI.getById(id);
        setProduct(response.data);
      } catch (error) {
        console.error('Error fetching product:', error);
        navigate('/products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  const handleAddToCart = () => {
    if (!product) return;

    if (product.stock <= 0) {
      toast({
        title: 'Produto indisponível',
        description: 'Este produto está fora de estoque',
        variant: 'destructive',
      });
      return;
    }

    if (quantity > product.stock) {
      toast({
        title: 'Quantidade indisponível',
        description: `Apenas ${product.stock} unidades em estoque`,
        variant: 'destructive',
      });
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      photo: product.photo,
      quantity,
    });

    toast({
      title: 'Produto adicionado!',
      description: `${quantity}x ${product.name} adicionado ao carrinho`,
    });
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded-lg" />
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted rounded w-1/2" />
                <div className="h-20 bg-muted rounded" />
                <div className="h-12 bg-muted rounded w-1/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product || !product.is_active) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Produto não encontrado
          </h1>
          <Button onClick={() => navigate('/products')}>
            Voltar aos Produtos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            <img
              src={product.photo 
    ? `http://localhost:3000/uploads/${product.photo}` 
    : "/placeholder.jpg"}
              alt={product.name}
              className="h-full w-full object-cover object-center"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {product.name}
              </h1>
              <Price amount={product.price} size="sm" className="mt-2" />
            </div>

            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Descrição
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Stock Info */}
            <div>
              {product.stock > 0 ? (
                <p className="text-sm text-success">
                  ✓ {product.stock} unidades em estoque
                </p>
              ) : (
                <p className="text-sm text-destructive">
                  ✗ Produto fora de estoque
                </p>
              )}
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div>
                <h3 className="text-lg font-medium text-foreground mb-3">
                  Quantidade
                </h3>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-lg font-medium w-12 text-center">
                    {quantity}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={increaseQuantity}
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <div className="space-y-3">
              <Button
                size="xl"
                className="w-full"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                variant={product.stock > 0 ? 'gradient' : 'secondary'}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {product.stock > 0 ? 'Adicionar ao Carrinho' : 'Produto Indisponível'}
              </Button>
              
              {product.stock > 0 && (
                <p className="text-sm text-center text-muted-foreground">
                  Total: <Price amount={product.price * quantity} size="sm" />
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}