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
  DialogFooter
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Interface atualizada para incluir todos os campos do cupom
interface Coupon {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  expires_at?: string | null;
  usage_limit?: number | null;
  times_used: number;
  is_active: boolean;
}

export function CouponsAdmin() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
        const { data } = await adminAPI.getCoupons();
        setCoupons(data);
    } catch (error) {
        toast({ title: "Erro ao carregar cupons", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!editingCoupon || !editingCoupon.code || !editingCoupon.discount_type || !editingCoupon.discount_value) {
        toast({ title: "Preencha os campos obrigatórios (Código, Tipo, Valor)", variant: "destructive" });
        return;
    }
    
    // Prepara os dados para enviar, convertendo campos vazios para null
    const couponData = {
        ...editingCoupon,
        expires_at: editingCoupon.expires_at || null,
        usage_limit: Number(editingCoupon.usage_limit) > 0 ? Number(editingCoupon.usage_limit) : null,
    };

    try {
        if (editingCoupon.id) {
            await adminAPI.updateCoupon(editingCoupon.id, couponData);
            toast({ title: "Cupom atualizado!" });
        } else {
            await adminAPI.createCoupon(couponData);
            toast({ title: "Cupom criado!" });
        }
        fetchCoupons();
        setIsDialogOpen(false);
    } catch (error) {
        toast({ title: "Erro ao salvar cupom", variant: "destructive" });
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja apagar este cupom?")) return;
    try {
        await adminAPI.deleteCoupon(id);
        toast({ title: "Cupom apagado!" });
        fetchCoupons();
    } catch (error) {
        toast({ title: "Erro ao apagar cupom", variant: "destructive" });
    }
  };

  const handleOpenDialog = (coupon: Coupon | null = null) => {
    setEditingCoupon(coupon || { discount_type: 'percentage', is_active: true });
    setIsDialogOpen(true);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gerenciar Cupons</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" /> Novo Cupom
        </Button>
      </div>

      <div className="bg-card rounded-lg border">
        {coupons.map((coupon, index) => (
          <div key={coupon.id} className={`flex items-center justify-between p-4 ${index < coupons.length - 1 ? 'border-b' : ''}`}>
            <div>
              <span className={`font-bold text-lg ${!coupon.is_active ? 'text-muted-foreground line-through' : ''}`}>{coupon.code}</span>
              <p className="text-sm text-muted-foreground">
                {coupon.discount_type === 'fixed' ? `R$${coupon.discount_value.toFixed(2)}` : `${coupon.discount_value}%`} de desconto
              </p>
              <p className="text-xs text-muted-foreground">
                Usado {coupon.times_used} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : ''} vezes
              </p>
            </div>
            <div className="space-x-2">
              <Button variant="outline" size="icon" onClick={() => handleOpenDialog(coupon)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={() => handleDelete(coupon.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCoupon?.id ? 'Editar' : 'Novo'} Cupom</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="code">Código</Label>
              <Input id="code" value={editingCoupon?.code || ''} onChange={e => setEditingCoupon({...editingCoupon, code: e.target.value.toUpperCase()})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Tipo</Label>
                    <Select value={editingCoupon?.discount_type} onValueChange={(value: 'percentage' | 'fixed') => setEditingCoupon({...editingCoupon, discount_type: value})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                            <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Valor do Desconto</Label>
                    <Input type="number" value={editingCoupon?.discount_value || ''} onChange={e => setEditingCoupon({...editingCoupon, discount_value: parseFloat(e.target.value)})} />
                </div>
            </div>
            {/* NOVOS CAMPOS ADICIONADOS AQUI */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="expires_at">Data de Expiração (Opcional)</Label>
                    <Input 
                      id="expires_at" 
                      type="date" 
                      value={editingCoupon?.expires_at?.toString().split('T')[0] || ''} 
                      onChange={e => setEditingCoupon({...editingCoupon, expires_at: e.target.value})} 
                    />
                </div>
                <div>
                    <Label htmlFor="usage_limit">Limite de Usos (Opcional)</Label>
                    <Input 
                      id="usage_limit" 
                      type="number" 
                      placeholder="Deixe em branco para ilimitado"
                      value={editingCoupon?.usage_limit || ''} 
                      onChange={e => setEditingCoupon({...editingCoupon, usage_limit: parseInt(e.target.value)})} 
                    />
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}