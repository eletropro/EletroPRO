import React, { useState } from 'react';
import { Transaction } from '../types';
import { db, auth } from '../firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TRANSACTION_CATEGORIES } from '../constants';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Wallet, Calendar, Tag, FileText, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

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

    try {
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
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este registro financeiro?')) {
      await deleteDoc(doc(db, 'transactions', id));
    }
  };

  return (
    <div className="space-y-12">
      {/* Add Transaction Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass bg-accent/10 p-8 rounded-[2.5rem] border-border/50"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            <Wallet size={24} fill="currentColor" />
          </div>
          <h2 className="text-2xl font-heading font-bold">Novo Registro</h2>
        </div>

        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
          <div className="space-y-3">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Tipo de Registro</Label>
            <div className="flex p-1 bg-background border border-border/50 rounded-2xl h-14">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl transition-all duration-300 font-bold text-sm ${
                  type === 'income' 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ArrowUpRight size={18} />
                Receita
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl transition-all duration-300 font-bold text-sm ${
                  type === 'expense' 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ArrowDownRight size={18} />
                Despesa
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Valor (R$)</Label>
            <Input 
              type="number" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              required 
              placeholder="0,00"
              className="h-14 rounded-2xl bg-background border-border/50 focus:ring-primary text-lg font-bold" 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-14 rounded-2xl bg-background border-border/50">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {TRANSACTION_CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Descrição</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Pagamento serviço X" className="h-14 rounded-2xl bg-background border-border/50" />
          </div>
          <Button type="submit" className="h-14 rounded-2xl font-bold shadow-xl shadow-primary/20">
            <Plus size={20} className="mr-2" /> Adicionar
          </Button>
        </form>
      </motion.div>

      {/* Transactions List */}
      <div className="space-y-6">
        <h3 className="text-xl font-heading font-bold px-2">Histórico Recente</h3>
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {transactions.map((t, index) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.03 }}
                className="group"
              >
                <div className="glass bg-accent/20 hover:bg-accent/40 transition-all duration-300 rounded-3xl p-6 border-border/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6 w-full sm:w-auto">
                    <div className={`p-4 rounded-2xl ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {t.type === 'income' ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold tracking-tight">{t.category}</span>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-md tracking-widest">
                          {t.type === 'income' ? 'Receita' : 'Despesa'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          <span>{format(new Date(t.date), "dd 'de' MMM", { locale: ptBR })}</span>
                        </div>
                        {t.description && (
                          <div className="flex items-center gap-1.5">
                            <FileText size={14} />
                            <span className="truncate max-w-[200px]">{t.description}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-8">
                    <div className={`text-2xl font-heading font-bold ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(t.id)}
                      className="rounded-xl hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={20} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {transactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="p-6 bg-accent/30 rounded-full text-muted-foreground">
                <Wallet size={48} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Nenhuma transação registrada</h3>
                <p className="text-muted-foreground">Comece a controlar suas finanças hoje mesmo.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
