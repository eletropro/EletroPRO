import React from 'react';
import { Budget, UserProfile } from '../types';
import { Button } from './ui/button';
import { FileDown, Receipt, Edit, Trash2, Calendar, User, DollarSign, CheckCircle2, Clock, XCircle, MoreVertical, FileText, ScrollText } from 'lucide-react';
import { generateBudgetPDF, generateReceiptPDF, generateContractPDF } from '../lib/pdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { db } from '../firebase';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface BudgetListProps {
  budgets: Budget[];
  userProfile: UserProfile;
  onEdit: (budget: Budget) => void;
}

export default function BudgetList({ budgets, userProfile, onEdit }: BudgetListProps) {
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = React.useState(false);
  const [receiptAmount, setReceiptAmount] = React.useState('');
  const [selectedBudget, setSelectedBudget] = React.useState<Budget | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este orçamento?')) {
      await deleteDoc(doc(db, 'budgets', id));
    }
  };

  const handleReceiptClick = (budget: Budget) => {
    setSelectedBudget(budget);
    setReceiptAmount(budget.totalAmount.toString());
    setIsReceiptDialogOpen(true);
  };

  const confirmReceipt = () => {
    if (selectedBudget) {
      generateReceiptPDF(selectedBudget, userProfile, Number(receiptAmount));
      setIsReceiptDialogOpen(false);
    }
  };

  const safeFormatDate = (dateStr: string) => {
    try {
      if (!dateStr) return 'Data N/D';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Data Inválida';
      return format(d, "dd 'de' MMMM", { locale: ptBR });
    } catch (e) {
      return 'Erro na data';
    }
  };

  const statusConfig = {
    pending: { label: 'Pendente', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    approved: { label: 'Aprovado', icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    completed: { label: 'Concluído', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    cancelled: { label: 'Cancelado', icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' }
  };

  if (budgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="p-6 bg-accent/30 rounded-full text-muted-foreground">
          <FileText size={48} />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold">Nenhum orçamento encontrado</h3>
          <p className="text-muted-foreground">Comece criando seu primeiro orçamento profissional.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AnimatePresence mode="popLayout">
        {budgets.map((budget, index) => {
          const status = statusConfig[budget.status];
          return (
            <motion.div
              key={budget.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className="group relative"
            >
              <div className="glass bg-accent/20 hover:bg-accent/40 transition-all duration-300 rounded-[2rem] p-6 border-border/50 hover:border-primary/30 shadow-xl hover:shadow-primary/5">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${status.bg} ${status.color}`}>
                      <status.icon size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold tracking-tight">{budget.clientName}</h3>
                        {budget.budgetNumber && (
                          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-md font-bold">
                            #{budget.budgetNumber.toString().padStart(4, '0')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar size={14} />
                        <span>{safeFormatDate(budget.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status.bg} ${status.color}`}>
                    {status.label}
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Valor Total</p>
                    <p className="text-3xl font-heading font-bold text-primary">
                      R$ {budget.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => generateBudgetPDF(budget, userProfile)}
                      className="rounded-xl hover:bg-primary/10 hover:text-primary"
                      title="Baixar PDF Orçamento"
                    >
                      <FileDown size={20} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => generateContractPDF(budget, userProfile)}
                      className="rounded-xl hover:bg-primary/10 hover:text-blue-500"
                      title="Gerar Contrato"
                    >
                      <ScrollText size={20} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleReceiptClick(budget)}
                      className="rounded-xl hover:bg-primary/10 hover:text-emerald-500"
                      title="Gerar Recibo"
                    >
                      <Receipt size={20} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEdit(budget)}
                      className="rounded-xl hover:bg-primary/10 hover:text-primary"
                      title="Editar"
                    >
                      <Edit size={20} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(budget.id)}
                      className="rounded-xl hover:bg-destructive/10 hover:text-destructive"
                      title="Excluir"
                    >
                      <Trash2 size={20} />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        {selectedBudget && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Gerar Recibo</DialogTitle>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Confirme ou altere o valor recebido para o recibo de <strong>{selectedBudget.clientName}</strong>.
              </p>
              <div className="space-y-2">
                <Label htmlFor="amount">Valor Recebido (R$)</Label>
                <Input 
                  id="amount"
                  type="number"
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReceiptDialogOpen(false)}>Cancelar</Button>
              <Button onClick={confirmReceipt}>Gerar PDF do Recibo</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
