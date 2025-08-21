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
  type?: 'package' | 'kg';
  unit_value?: string;
  brand_name?: string;
  preparation_instructions?: string;
  categories?: string[];
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

    try {
      console.log('Product stock:', product.stock); // Debug
      const item = {
        id: product.id,
        name: product.name,
        price: product.price,
        photo: product.photo,
        quantity,
        stock: Number(product.stock) // Garantir que é número
      };
      console.log('Adding item to cart:', item); // Debug
      addItem(item);

      toast({
        title: 'Produto adicionado!',
        description: `${quantity}x ${product.name} adicionado ao carrinho`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar produto',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

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
      {/* Hero Section with Image */}
      <div className="relative h-[40vh] md:h-[50vh] lg:h-[60vh] xl:h-[70vh] overflow-hidden">
        {/* Back Button - Absolute positioned */}
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-sm hover:bg-white/90"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        {/* Product Image with Overlay */}
        <div className="relative w-full h-full">
          <img
            src={product.photo 
              ? `http://localhost:3000/uploads/${product.photo}` 
              : "/placeholder.jpg"}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
      </div>

      {/* Product Details Section */}
      <div className="relative -mt-20 bg-background rounded-t-[2rem] min-h-[60vh]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column - Product Info */}
            <div className="space-y-6">
              {/* Header */}
              <div>
                {product.categories && product.categories.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {product.categories.map((category, index) => (
                      <span key={index} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                        {category}
                      </span>
                    ))}
                  </div>
                )}
                <h1 className="text-3xl font-bold text-foreground">
                  {product.name}
                </h1>
                {product.brand_name && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">por</span>
                    <span className="text-sm font-medium text-primary">{product.brand_name}</span>
                  </div>
                )}
              </div>

              {/* Description Card */}
              <div className="bg-card rounded-xl p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Sobre o Produto
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Product Details */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  {/* Type and Unit */}
                  {product.type && product.unit_value && (
                    <div>
                      <span className="text-sm text-muted-foreground block mb-1">
                        Quantidade por Pacote
                      </span>
                      <span className="font-medium">
                        {product.type === 'package' ? `${product.unit_value} unidades` : `${product.unit_value}kg`}
                      </span>
                    </div>
                  )}
                  
                  {/* Stock Status */}
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">
                      Disponibilidade
                    </span>
                    {product.stock > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        <span className="font-medium text-success">
                          Em Estoque
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-destructive" />
                        <span className="font-medium text-destructive">
                          Indisponível
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Preparation Instructions */}
              {product.preparation_instructions && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-6 border border-orange-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-orange-500 rounded-full p-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-orange-900">
                        Modo de Preparo
                      </h3>
                      <p className="text-sm text-orange-700">
                        Siga estas instruções para o melhor resultado
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {product.preparation_instructions.split('\n').map((instruction, index) => (
                      instruction.trim() && (
                        <div key={index} className="flex items-start gap-4 bg-white/50 rounded-lg p-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-orange-900">{index + 1}</span>
                          </div>
                          <p className="text-orange-900 flex-1">{instruction.trim()}</p>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Purchase Section */}
            <div>
              <div className="sticky top-8 bg-card rounded-xl border-2 border-primary/10 overflow-hidden">
                {/* Price Section */}
                <div className="p-6 bg-primary/5">
                  <div className="flex items-end gap-2 mb-1">
                    <Price amount={product.price} size="xl" className="text-3xl font-bold text-primary" />
                    <span className="text-sm text-muted-foreground mb-1">por unidade</span>
                  </div>
                  {product.stock > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {product.stock} unidades disponíveis
                    </p>
                  )}
                </div>

                {product.stock > 0 ? (
                  <div className="p-6 space-y-6">
                    {/* Quantity Selector */}
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">
                        Quantidade Desejada
                      </label>
                      <div className="flex items-center justify-center bg-background rounded-lg p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={decreaseQuantity}
                          disabled={quantity <= 1}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        
                        <span className="w-20 text-center text-lg font-medium">
                          {quantity}
                        </span>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={increaseQuantity}
                          disabled={quantity >= product.stock}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="bg-background rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Subtotal</span>
                        <Price amount={product.price * quantity} size="lg" className="text-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Frete calculado no checkout
                      </p>
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handleAddToCart}
                      variant="gradient"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Adicionar ao Carrinho
                    </Button>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="bg-destructive/10 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="font-medium text-destructive">
                            Produto Indisponível
                          </p>
                          <p className="text-sm text-destructive/80">
                            Este produto está temporariamente fora de estoque
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      className="w-full"
                      variant="secondary"
                      disabled
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Indisponível
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}