import React from 'react';
import { Budget, UserProfile } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { FileDown, Receipt, Edit, Trash2 } from 'lucide-react';
import { generateBudgetPDF, generateReceiptPDF } from '../lib/pdf';
import { format } from 'date-fns';
import { db } from '../firebase';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface BudgetListProps {
  budgets: Budget[];
  userProfile: UserProfile;
  onEdit: (budget: Budget) => void;
}

export default function BudgetList({ budgets, userProfile, onEdit }: BudgetListProps) {
  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este orçamento?')) {
      await deleteDoc(doc(db, 'budgets', id));
    }
  };

  const updateStatus = async (id: string, status: Budget['status']) => {
    await updateDoc(doc(db, 'budgets', id), { status });
  };

  const getStatusBadge = (status: Budget['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[status]}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {budgets.map((budget) => (
            <TableRow key={budget.id}>
              <TableCell className="font-medium">{budget.clientName}</TableCell>
              <TableCell>{format(new Date(budget.date), 'dd/MM/yyyy')}</TableCell>
              <TableCell>R$ {budget.totalAmount.toFixed(2)}</TableCell>
              <TableCell>{getStatusBadge(budget.status)}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="ghost" size="icon" onClick={() => generateBudgetPDF(budget, userProfile)} title="Baixar PDF">
                  <FileDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => generateReceiptPDF(budget, userProfile)} title="Gerar Recibo">
                  <Receipt className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onEdit(budget)} title="Editar">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(budget.id)} title="Excluir">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
