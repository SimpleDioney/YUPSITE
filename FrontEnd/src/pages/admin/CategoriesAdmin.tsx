import { useState, useEffect } from 'react';
import { adminAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';

interface Category {
  id: number;
  name: string;
}

export function CategoriesAdmin() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await adminAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      toast({ title: "Erro ao carregar categorias", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      toast({ title: "O nome da categoria é obrigatório", variant: "destructive" });
      return;
    }

    try {
      if (editingCategory) {
        await adminAPI.updateCategory(editingCategory.id, { name: categoryName });
        toast({ title: "Categoria atualizada!" });
      } else {
        await adminAPI.createCategory({ name: categoryName });
        toast({ title: "Categoria criada!" });
      }
      fetchCategories();
      handleDialogClose();
    } catch (error) {
      toast({ title: "Erro ao salvar categoria", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja apagar esta categoria?")) return;

    try {
      await adminAPI.deleteCategory(id);
      toast({ title: "Categoria apagada!" });
      fetchCategories();
    } catch (error) {
      toast({ title: "Erro ao apagar categoria", variant: "destructive" });
    }
  };

  const handleOpenDialog = (category: Category | null = null) => {
    setEditingCategory(category);
    setCategoryName(category ? category.name : '');
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setCategoryName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gerenciar Categorias</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" /> Nova Categoria
        </Button>
      </div>

      <div className="bg-card rounded-lg border">
        {categories.map((cat, index) => (
          <div key={cat.id} className={`flex items-center justify-between p-4 ${index < categories.length - 1 ? 'border-b' : ''}`}>
            <span className="font-medium">{cat.name}</span>
            <div className="space-x-2">
              <Button variant="outline" size="icon" onClick={() => handleOpenDialog(cat)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={() => handleDelete(cat.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar' : 'Nova'} Categoria</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Nome da categoria"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}