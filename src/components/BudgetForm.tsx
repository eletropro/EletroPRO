import React, { useState, useEffect } from 'react';
import { db, auth } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Budget, BudgetItem, OperationType, Client } from '@/types';
import { BRASILIA_PRICES } from '@/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Search, User } from 'lucide-react';

interface BudgetFormProps {
  budget?: Budget;
  clients: Client[];
  onSuccess: () => void;
}

export default function BudgetForm({ budget, clients, onSuccess }: BudgetFormProps) {
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

    const budgetData = {
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-2">
          <Label>Selecionar Cliente</Label>
          <Select onValueChange={handleClientSelect}>
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="Escolha um cliente..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Nome do Cliente</Label>
          <Input value={clientName} onChange={e => setClientName(e.target.value)} required className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Endereço</Label>
          <Input value={clientAddress} onChange={e => setClientAddress(e.target.value)} className="h-11 rounded-xl" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sugestões de Preços (Brasília)</CardTitle>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar serviço..." 
              className="pl-8"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="max-h-48 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredPrices.map((p, i) => (
              <Button 
                key={i} 
                type="button" 
                variant="outline" 
                className="justify-start text-xs h-auto py-2"
                onClick={() => addItem({ 
                  description: p.description, 
                  unitPrice: p.avgPrice, 
                  unit: p.unit, 
                  marketPrice: p.avgPrice 
                })}
              >
                <div className="text-left">
                  <div className="text-[10px] uppercase text-amber-600 font-bold">{p.category}</div>
                  <div className="font-bold">{p.description}</div>
                  <div className="text-muted-foreground">R$ {p.avgPrice.toFixed(2)} / {p.unit}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto border rounded-xl">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="min-w-[200px]">Descrição</TableHead>
              <TableHead className="w-20">Qtd</TableHead>
              <TableHead className="w-24">Unid</TableHead>
              <TableHead className="w-32">Unitário</TableHead>
              <TableHead className="w-32">Ref. BSB</TableHead>
              <TableHead className="w-32">Total</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} className="h-9" />
                </TableCell>
                <TableCell>
                  <Input type="number" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} className="h-9" />
                </TableCell>
                <TableCell>
                  <Input value={item.unit} onChange={e => updateItem(index, 'unit', e.target.value)} className="h-9" />
                </TableCell>
                <TableCell>
                  <Input type="number" value={item.unitPrice} onChange={e => updateItem(index, 'unitPrice', e.target.value)} className="h-9" />
                </TableCell>
                <TableCell>
                  <div className="text-xs text-slate-500 font-medium">R$ {item.marketPrice?.toFixed(2)}</div>
                </TableCell>
                <TableCell className="font-bold text-amber-600">
                  R$ {item.total.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} className="h-8 w-8">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" onClick={() => addItem({ description: '', quantity: 1, unit: 'un', unitPrice: 0 })}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Item
        </Button>
        <div className="text-2xl font-bold">
          Total: R$ {totalAmount.toFixed(2)}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: Garantia de 90 dias, validade do orçamento..." />
      </div>

      <Button type="submit" className="w-full">Salvar Orçamento</Button>
    </form>
  );
}
