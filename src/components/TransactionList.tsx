import React, { useState } from 'react';
import { Transaction } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TRANSACTION_CATEGORIES } from '../constants';
import { db, auth } from '../firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { format } from 'date-fns';

interface TransactionListProps {
  transactions: Transaction[];
}

export default function TransactionList({ transactions }: TransactionListProps) {
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !amount || !category) return;

    await addDoc(collection(db, 'transactions'), {
      userId: auth.currentUser.uid,
      type,
      amount: Number(amount),
      category,
      description,
      date: new Date().toISOString(),
      createdAt: serverTimestamp()
    });

    setAmount('');
    setCategory('');
    setDescription('');
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'transactions', id));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-muted p-4 rounded-lg">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v: any) => setType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Receita</SelectItem>
              <SelectItem value="expense">Despesa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Valor</Label>
          <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_CATEGORIES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Descrição</Label>
          <Input value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <Button type="submit">
          <Plus className="mr-2 h-4 w-4" /> Adicionar
        </Button>
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{format(new Date(t.date), 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  {t.type === 'income' ? (
                    <div className="flex items-center text-green-600">
                      <ArrowUpCircle className="mr-2 h-4 w-4" /> Receita
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <ArrowDownCircle className="mr-2 h-4 w-4" /> Despesa
                    </div>
                  )}
                </TableCell>
                <TableCell>{t.category}</TableCell>
                <TableCell>{t.description}</TableCell>
                <TableCell className={t.type === 'income' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                  R$ {t.amount.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
