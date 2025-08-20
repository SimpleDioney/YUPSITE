import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI, categoriesAPI } from '@/services/api';
import { useCartStore } from '@/store/cartStore'; // Removido Product, pois não está exportado do store

// Defina a interface Product localmente se não estiver disponível no store
interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  photo?: string;
  type?: string;
  unit_value?: number;
}
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, SlidersHorizontal, ArrowRight, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Price } from '@/components/ui/price'; // Adicionado para consistência de preço

interface Category {
  id: number;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { toast } = useToast();
  const { addItem } = useCartStore();

  // Busca categorias uma vez quando o componente é montado
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const categoriesResponse = await categoriesAPI.getAll();
        setCategories(categoriesResponse.data);
      } catch (error) {
        console.error("Erro ao buscar categorias:", error);
        toast({ title: "Erro ao carregar filtros", variant: "destructive" });
      }
    };
    fetchInitialData();
  }, []);

  // Busca produtos sempre que a categoria selecionada muda
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await productsAPI.getAll(selectedCategory);
        setProducts(response.data);
      } catch (error) {
        toast({
          title: 'Erro ao carregar produtos',
          description: 'Tente novamente mais tarde',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory]);

  // Aplica filtros de busca e preço no lado do cliente
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(
        product =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (priceRange.min) {
      const minPrice = parseFloat(priceRange.min);
      filtered = filtered.filter(product => product.price >= minPrice);
    }
    if (priceRange.max) {
      const maxPrice = parseFloat(priceRange.max);
      filtered = filtered.filter(product => product.price <= maxPrice);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, priceRange]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
  };

  const handleAddToCart = (product: Product) => {
    if (!product.id) {
      toast({
        title: 'Erro ao adicionar produto',
        description: 'Produto inválido',
        variant: 'destructive',
      });
      return;
    }

    // Garantir que o ID seja uma string válida
    if (!product.id) {
      toast({
        title: 'Erro ao adicionar produto',
        description: 'Produto inválido',
        variant: 'destructive',
      });
      return;
    }

    const cartItem = {
      id: product.id.toString(), // ID é obrigatório e deve ser string
      productId: product.id.toString(), // Mantemos o productId para compatibilidade
      name: product.name,
      price: product.price,
      photo: product.photo,
      quantity: 1,
      type: product.type,
      unit_value: product.unit_value?.toString(),
    };
    
    // Validar o item antes de adicionar
    if (!cartItem.id) {
      toast({
        title: 'Erro ao adicionar produto',
        description: 'ID do produto inválido',
        variant: 'destructive',
      });
      return;
    }
    
    addItem(cartItem);
    
    toast({
      title: 'Produto adicionado!',
      description: `${product.name} foi adicionado ao carrinho`,
    });
  };

  const activeFiltersCount = [searchTerm, selectedCategory, priceRange.min, priceRange.max].filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-card rounded-2xl p-4 space-y-4">
                  <div className="w-full h-48 bg-muted rounded-xl" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Todos os Produtos
          </h1>
          <p className="text-lg text-muted-foreground">
            Descubra nossos deliciosos produtos artesanais
          </p>
        </div>

        <div className="bg-card rounded-2xl p-6 mb-8 border-2 border-primary/10">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Filtros</h3>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro ativo' : 'filtros ativos'}
              </Badge>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Categoria</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border rounded-md bg-input"
              >
                <option value="">Todas as categorias</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Preço Mínimo</label>
              <Input
                type="number"
                step="0.01"
                placeholder="R$ 0,00"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Preço Máximo</label>
              <Input
                type="number"
                step="0.01"
                placeholder="R$ 0,00"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              />
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>

        <div className="mb-6">
          <p className="text-muted-foreground">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
          </p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-card rounded-2xl p-8 max-w-md mx-auto">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                Tente ajustar os filtros ou buscar por outros termos
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group overflow-hidden border-orange-200 hover:shadow-orange transition-all duration-300 hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img 
                    src={product.photo 
                      ? `http://localhost:3000/uploads/${product.photo}` 
                      : "/placeholder.jpg"}
                    alt={product.name}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-gradient-orange text-white px-3 py-1 rounded-full text-xs font-medium capitalize">
                      {product.type === 'package'
                        ? `Pacote com ${product.unit_value}un`
                        : `Pacote com ${product.unit_value}kg`}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="bg-white/90 text-orange-800 px-3 py-1 rounded-full text-sm font-bold">
                      <Price amount={product.price} />
                    </span>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">{product.name}</h3>
                  <p className="text-muted-foreground mb-4 line-clamp-2">{product.description}</p>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="warm" 
                      className="flex-1 group"
                      onClick={() => handleAddToCart(product)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <Link to={`/products/${product.id}`}>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}