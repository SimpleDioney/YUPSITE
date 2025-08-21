import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/services/api';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Brand {
  id: number;
  name: string;
  description?: string;
}

export default function BrandsAdmin() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getBrands();
      setBrands(response.data);
    } catch (error) {
      toast({ title: 'Erro ao carregar marcas', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite o nome da marca',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingBrand) {
        await adminAPI.updateBrand(editingBrand.id, formData);
        toast({
          title: 'Marca atualizada!',
          description: 'As alterações foram salvas com sucesso',
        });
      } else {
        await adminAPI.createBrand(formData);
        toast({
          title: 'Marca criada!',
          description: 'A marca foi adicionada com sucesso',
        });
      }

      fetchBrands();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Erro ao salvar marca',
        description: 'Tente novamente mais tarde',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (brandId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta marca?')) return;

    try {
      await adminAPI.deleteBrand(brandId);
      toast({
        title: 'Marca excluída!',
        description: 'A marca foi removida com sucesso',
      });
      fetchBrands();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir marca',
        description: error.response?.data?.error || 'Tente novamente mais tarde',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    });
    setEditingBrand(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Gerenciar Marcas</h2>
          <p className="text-muted-foreground">Adicione, edite e gerencie as marcas dos produtos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              Nova Marca
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingBrand ? 'Editar Marca' : 'Nova Marca'}</DialogTitle>
              <DialogDescription>
                {editingBrand ? 'Faça as alterações necessárias' : 'Preencha as informações da nova marca'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva a marca..."
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingBrand ? 'Salvar Alterações' : 'Criar Marca'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Brands List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-card rounded-lg p-4">
              <div className="h-6 bg-muted rounded w-1/4 mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhuma marca cadastrada
          </h3>
          <p className="text-muted-foreground">
            Comece criando sua primeira marca
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="bg-card rounded-xl p-4 border-2 border-primary/10 hover:border-primary/20 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-foreground">{brand.name}</h3>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(brand)}
                    className="h-8 w-8 hover:text-primary"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(brand.id)}
                    className="h-8 w-8 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {brand.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {brand.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
