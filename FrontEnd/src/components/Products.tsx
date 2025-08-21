import { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/hooks/use-toast";

// Define the type for a single product to avoid using 'any'
interface Product {
  id: number;
  name: string;
  description: string;
  photo: string;
  price: number; // Price is expected in cents from the API
  type: string;
  unit_value: string;
  stock: number;
}

export const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const { addItem } = useCartStore();
  const { toast } = useToast();

  useEffect(() => {
    axios.get("http://localhost:3000/api/products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Erro ao carregar produtos:", err));
  }, []);

  return (
    <section id="products" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            Nossos Produtos
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
            Sabores que encantam
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Cada produto é cuidadosamente preparado com ingredientes selecionados 
            e muito amor para proporcionar momentos especiais.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {products.map((product) => (
            <Card key={product.id} className="group overflow-hidden border-orange-200 hover:shadow-orange transition-all duration-300 hover:-translate-y-2">
              <div className="relative overflow-hidden">
                <img 
                  src={product.photo 
    ? `http://localhost:3000/uploads/${product.photo}` 
    : "/placeholder.jpg"}
                  alt={product.name}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {/* Type (usado como Tag) */}
                <div className="absolute top-4 left-4">
  <span className="bg-gradient-orange text-white px-3 py-1 rounded-full text-xs font-medium capitalize">
    {product.type === 'package'
      ? `Pacote com ${product.unit_value}un`
      : `Pacote com ${product.unit_value}kg`}
  </span>
</div>

                {/* Unit Price */}
                <div className="absolute top-4 right-4">
                  <span className="bg-white/90 text-orange-800 px-3 py-1 rounded-full text-sm font-bold">
                    R$ {(product.price).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
              
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-2">{product.name}</h3>
                <p className="text-muted-foreground mb-4">{product.description}</p>
                
                {/* Stock Status */}
                <div className="flex items-center gap-2 mb-4">
                  {product.stock > 0 ? (
                    <div className="flex items-center gap-1.5 text-success text-sm">
                      <div className="w-2 h-2 rounded-full bg-success" />
                      <span>Em Estoque</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-destructive text-sm">
                      <div className="w-2 h-2 rounded-full bg-destructive" />
                      <span>Indisponível</span>
                    </div>
                  )}
                </div>
                
                <Button
                  variant={product.stock > 0 ? "warm" : "secondary"}
                  disabled={product.stock <= 0}
                  className="w-full group"
                  onClick={() => {
                    try {
                      if (product.stock <= 0) {
                        toast({
                          title: 'Produto indisponível',
                          description: 'Este produto está fora de estoque',
                          variant: 'destructive',
                        });
                        return;
                      }

                      addItem({
                        id: product.id.toString(),
                        name: product.name,
                        price: product.price, 
                        photo: product.photo,
                        quantity: 1,
                        stock: product.stock
                      });

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
                  }}
                >
                  Adicionar ao Pedido
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/products">
            <Button variant="gradient" size="xl">
              Ver Todos os Produtos
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
