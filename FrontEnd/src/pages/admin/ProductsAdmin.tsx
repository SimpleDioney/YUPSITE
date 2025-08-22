import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Price } from '@/components/ui/price';
import { useToast } from '@/hooks/use-toast';
import { productsAPI, adminAPI } from '@/services/api';
import { Plus, Edit, Trash2, Package, Upload, Minus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Checkbox } from '@/components/ui/checkbox'; // Importar Checkbox


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
  category_ids?: number[];
  brand_id?: number;
  brand_name?: string;
  preparation_instructions?: string;
}

interface Brand {
  id: number;
  name: string;
  description?: string;
}

interface Category {
  id: number;
  name: string;
}

export default function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); // State para todas as categorias
  const [brands, setBrands] = useState<Brand[]>([]); // State para todas as marcas
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]); // State para as categorias selecionadas no formulário
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    is_active: true,
    type: 'package',
    unit_value: '1',
    brand_id: '',
    preparation_instructions: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await adminAPI.getBrands();
      setBrands(response.data);
    } catch (error) {
      toast({ title: "Erro ao carregar marcas", variant: "destructive" });
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getProducts();
      setProducts(response.data);
    } catch (error) {
      toast({ title: 'Erro ao carregar produtos', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await adminAPI.getCategories(); // Esta chamada já existe no seu api.ts
      setCategories(response.data);
    } catch (error) {
      toast({ title: "Erro ao carregar categorias", variant: "destructive" });
    }
  };

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.price || !formData.unit_value) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('description', formData.description);
    submitData.append('price', formData.price);
    submitData.append('stock', formData.stock);
    submitData.append('type', formData.type);
    submitData.append('unit_value', formData.unit_value);
    submitData.append('is_active', formData.is_active.toString());
    submitData.append('category_ids', JSON.stringify(selectedCategories));
    submitData.append('brand_id', formData.brand_id);
    submitData.append('preparation_instructions', formData.preparation_instructions);

    if (photoFile) {
      submitData.append('photo', photoFile);
    }

    try {
      if (editingProduct) {
        await adminAPI.updateProduct(editingProduct.id, submitData);
        toast({
          title: 'Produto atualizado!',
          description: 'As alterações foram salvas com sucesso',
        });
      } else {
        await adminAPI.createProduct(submitData);
        toast({
          title: 'Produto criado!',
          description: 'O produto foi adicionado com sucesso',
        });
      }

      fetchProducts();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Erro ao salvar produto',
        description: 'Tente novamente mais tarde',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      is_active: product.is_active,
      type: product.type || 'package',
      unit_value: product.unit_value || '1',
      brand_id: product.brand_id?.toString() || '',
      preparation_instructions: product.preparation_instructions || '',
    });
    setSelectedCategories(product.category_ids || []);
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (productId: string) => {
    try {
      await adminAPI.toggleProductStatus(productId);
      fetchProducts();
      toast({
        title: 'Status atualizado!',
        description: 'O status do produto foi alterado',
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar status',
        description: 'Tente novamente mais tarde',
        variant: 'destructive',
      });
    }
  };

  const handleStockChange = async (productId: string, operation: 'add' | 'remove', quantity: number) => {
    try {
      if (operation === 'add') {
        await adminAPI.addStock(productId, quantity);
      } else {
        await adminAPI.removeStock(productId, quantity);
      }
      fetchProducts();
      toast({
        title: 'Estoque atualizado!',
        description: 'A quantidade em estoque foi alterada',
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar estoque',
        description: 'Tente novamente mais tarde',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      is_active: true,
      type: 'package',
      unit_value: '1',
      brand_id: '',
      preparation_instructions: '',
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setEditingProduct(null);
    setSelectedCategories([]); // Limpa as categorias selecionadas
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Gerenciar Produtos</h2>
          <p className="text-muted-foreground">Adicione, edite e gerencie os produtos da loja</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
              <DialogDescription>{editingProduct ? 'Faça as alterações necessárias' : 'Preencha as informações do novo produto'}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="preparation_instructions">Modo de Preparo</Label>
                <Textarea
                  id="preparation_instructions"
                  value={formData.preparation_instructions}
                  onChange={(e) => setFormData({ ...formData, preparation_instructions: e.target.value })}
                  placeholder="Descreva o modo de preparo do produto..."
                />
              </div>
              <div>
                <Label htmlFor="brand_id">Marca</Label>
                <select
                  id="brand_id"
                  className="w-full rounded-md border px-2 py-1"
                  value={formData.brand_id}
                  onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                >
                  <option value="">Selecione uma marca</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Categorias</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-2 border rounded-md mt-1">
                  {categories.map(category => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() => handleCategoryChange(category.id)}
                      />
                      <Label htmlFor={`category-${category.id}`} className="font-normal">{category.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock">Estoque inicial</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipo de unidade</Label>
                  <select
                    id="type"
                    className="w-full rounded-md border px-2 py-1"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'package' | 'kg' })}
                  >
                    <option value="package">Pacote</option>
                    <option value="kg">Kg</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="unit_value">Valor da unidade ({formData.type === 'package' ? 'cheio' : 'peso'})</Label>
                <Input
                  id="unit_value"
                  type="text"
                  inputMode={formData.type === 'package' ? 'numeric' : 'decimal'}
                  value={formData.unit_value}
                  onChange={(e) => setFormData({ ...formData, unit_value: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2 pt-4">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Produto ativo</Label>
              </div>
              <div>
                <Label htmlFor="photo">Foto do produto</Label>
                <div className="space-y-2">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setPhotoFile(file);
                      if (file) {
                        setPhotoPreview(URL.createObjectURL(file));
                      } else {
                        setPhotoPreview(null);
                      }
                    }}
                  />
                  {photoPreview && (
                    <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                          const input = document.getElementById('photo') as HTMLInputElement;
                          if (input) input.value = '';
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-card rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhum produto cadastrado
          </h3>
          <p className="text-muted-foreground">
            Comece criando seu primeiro produto
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border-2 border-primary overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Produto</th>
                  <th className="text-left p-4 font-medium">Preço</th>
                  <th className="text-left p-4 font-medium">Estoque</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={product.photo 
    ? `https://yup.notiffly.com.br/api/uploads/${product.photo}` 
    : "/placeholder.jpg"}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div>
                          <h3 className="font-medium text-foreground">{product.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Price amount={product.price} />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleStockChange(product.id, 'remove', 1)}
                          disabled={product.stock <= 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-12 text-center font-medium">{product.stock}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleStockChange(product.id, 'add', 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={product.is_active}
                          onCheckedChange={() => handleToggleActive(product.id)}
                        />
                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                          {product.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}