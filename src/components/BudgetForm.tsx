import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { Budget, BudgetItem, Client } from '../types';
import { BRASILIA_PRICES } from '../constants';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Trash2, Search, Zap, X, Save, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BudgetFormProps {
  budget?: Budget;
  clients: Client[];
  onSuccess: () => void;
  onClose: () => void;
}

export default function BudgetForm({ budget, clients, onSuccess, onClose }: BudgetFormProps) {
  const [clientName, setClientName] = useState(budget?.clientName || '');
  const [clientPhone, setClientPhone] = useState(budget?.clientPhone || '');
  const [clientAddress, setClientAddress] = useState(budget?.clientAddress || '');
  const [items, setItems] = useState<BudgetItem[]>(budget?.items || []);
  const [notes, setNotes] = useState(budget?.notes || '');
  const [searchTerm, setSearchTerm] = useState('');

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setClientName(client.name);
      setClientPhone(client.phone || '');
      setClientAddress(client.address || '');
    }
  };

  const addItem = (item: Partial<BudgetItem>) => {
    const newItem: BudgetItem = {
      description: item.description || '',
      quantity: item.quantity || 1,
      unit: item.unit || 'un',
      unitPrice: item.unitPrice || 0,
      marketPrice: item.marketPrice || item.unitPrice || 0,
      total: (item.quantity || 1) * (item.unitPrice || 0)
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof BudgetItem, value: string | number) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    
    if (field === 'quantity') item.quantity = Number(value);
    if (field === 'unitPrice') item.unitPrice = Number(value);
    if (field === 'marketPrice') item.marketPrice = Number(value);
    if (field === 'description') item.description = String(value);
    if (field === 'unit') item.unit = String(value);
    
    item.total = item.quantity * item.unitPrice;
    newItems[index] = item;
    setItems(newItems);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    const budgetData: any = {
      userId: auth.currentUser.uid,
      clientName,
      clientPhone,
      clientAddress,
      date: new Date().toISOString(),
      items,
      totalAmount,
      status: budget?.status || 'pending',
      notes,
      updatedAt: serverTimestamp()
    };

    try {
      if (budget?.id) {
        await updateDoc(doc(db, 'budgets', budget.id), budgetData);
      } else {
        // Get the next budget number
        const q = query(
          collection(db, 'budgets'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('budgetNumber', 'desc'),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        let nextNumber = 1;
        if (!querySnapshot.empty) {
          const lastBudget = querySnapshot.docs[0].data() as Budget;
          nextNumber = (lastBudget.budgetNumber || 0) + 1;
        }
        budgetData.budgetNumber = nextNumber;
        await addDoc(collection(db, 'budgets'), budgetData);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving budget:", error);
    }
  };

  const filteredPrices = BRASILIA_PRICES.filter(p => 
    p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            <Zap size={24} fill="currentColor" />
          </div>
          <h2 className="text-2xl font-heading font-bold">
            {budget ? 'Editar Orçamento' : 'Novo Orçamento'}
          </h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
          <X size={24} />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Client Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Selecionar Cliente</Label>
            <Select onValueChange={handleClientSelect}>
              <SelectTrigger className="h-14 rounded-2xl bg-accent/20 border-border/50 focus:ring-primary">
                <SelectValue placeholder="Escolha um cliente..." />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Nome do Cliente</Label>
            <Input value={clientName} onChange={e => setClientName(e.target.value)} required className="h-14 rounded-2xl bg-accent/20 border-border/50" />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Telefone</Label>
            <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="h-14 rounded-2xl bg-accent/20 border-border/50" />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Endereço</Label>
            <Input value={clientAddress} onChange={e => setClientAddress(e.target.value)} className="h-14 rounded-2xl bg-accent/20 border-border/50" />
          </div>
        </div>

        {/* Suggestions Section */}
        <Card className="border-border bg-accent/10 rounded-[2rem] overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-lg font-heading font-bold flex items-center gap-2">
                <Calculator size={20} className="text-primary" />
                Sugestões de Preços (Brasília)
              </CardTitle>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar serviço..." 
                  className="pl-10 h-10 rounded-xl bg-background border-border/50"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {filteredPrices.map((p, i) => (
                <button 
                  key={i} 
                  type="button" 
                  className="flex flex-col items-start p-4 rounded-2xl bg-background border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                  onClick={() => addItem({ 
                    description: p.description, 
                    unitPrice: p.avgPrice, 
                    unit: p.unit, 
                    marketPrice: p.avgPrice 
                  })}
                >
                  <span className="text-[10px] uppercase text-primary font-bold tracking-wider mb-1">{p.category}</span>
                  <span className="font-bold text-sm mb-1 group-hover:text-primary transition-colors">{p.description}</span>
                  <span className="text-xs text-muted-foreground">R$ {p.avgPrice.toFixed(2)} / {p.unit}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-heading font-bold">Itens do Orçamento</h3>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => addItem({ description: '', quantity: 1, unit: 'un', unitPrice: 0 })}
              className="rounded-xl border-primary/30 text-primary hover:bg-primary/10"
            >
              <Plus size={18} className="mr-2" /> Adicionar Manual
            </Button>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col lg:flex-row gap-4 p-6 rounded-3xl bg-accent/20 border border-border/50 relative group"
                >
                  <div className="flex-1 space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Descrição do Serviço</Label>
                    <Input value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} className="h-12 rounded-xl bg-background border-border/50" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Qtd</Label>
                      <Input type="number" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} className="h-12 rounded-xl bg-background border-border/50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Unid</Label>
                      <Input value={item.unit} onChange={e => updateItem(index, 'unit', e.target.value)} className="h-12 rounded-xl bg-background border-border/50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Unitário</Label>
                      <Input type="number" value={item.unitPrice} onChange={e => updateItem(index, 'unitPrice', e.target.value)} className="h-12 rounded-xl bg-background border-border/50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Total</Label>
                      <div className="h-12 flex items-center px-4 rounded-xl bg-primary/10 text-primary font-bold">
                        R$ {item.total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeItem(index)}
                    className="absolute -top-2 -right-2 p-2 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Section */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex-1 w-full space-y-2">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Observações Adicionais</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: Garantia de 90 dias, validade do orçamento..." className="h-14 rounded-2xl bg-accent/20 border-border/50" />
          </div>
          <div className="flex flex-col items-end gap-4 min-w-[240px]">
            <div className="text-right">
              <p className="text-sm text-muted-foreground uppercase font-bold tracking-widest">Valor Total do Orçamento</p>
              <p className="text-5xl font-heading font-bold text-primary">
                R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Button type="submit" className="w-full h-16 rounded-2xl text-xl font-bold shadow-2xl shadow-primary/30 hover:scale-105 transition-all">
              <Save size={24} className="mr-2" /> Salvar Orçamento
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
