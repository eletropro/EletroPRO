import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Budget, UserProfile } from '../types';

// Extend jsPDF type for autotable
interface jsPDFWithPlugin extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export const generateBudgetPDF = (budget: Budget, userProfile: UserProfile) => {
  const doc = new jsPDF() as jsPDFWithPlugin;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Background
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(245, 158, 11); // Amber 500
  doc.text('EletroPRO', 14, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('SISTEMA DE GESTÃO ELÉTRICA', 14, 32);

  // Budget Info (Right side)
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`ORÇAMENTO: #${budget.id.slice(0, 8).toUpperCase()}`, pageWidth - 14, 20, { align: 'right' });
  doc.text(`DATA: ${format(new Date(budget.date), 'dd/MM/yyyy', { locale: ptBR })}`, pageWidth - 14, 26, { align: 'right' });
  doc.text(`STATUS: ${budget.status.toUpperCase()}`, pageWidth - 14, 32, { align: 'right' });

  // Business Info
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('PRESTADOR:', 14, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(userProfile.businessName || userProfile.displayName || '', 14, 62);
  doc.text(userProfile.businessAddress || '', 14, 67);
  doc.text(`Tel: ${userProfile.businessPhone || ''}`, 14, 72);

  // Client Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('CLIENTE:', pageWidth / 2, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(budget.clientName, pageWidth / 2, 62);
  doc.text(budget.clientAddress || '', pageWidth / 2, 67);
  doc.text(`Tel: ${budget.clientPhone || ''}`, pageWidth / 2, 72);

  // Table
  const tableData = budget.items.map(item => [
    item.description,
    item.quantity.toString(),
    item.unit || 'un',
    `R$ ${item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    item.marketPrice ? `R$ ${item.marketPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-',
    `R$ ${item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['DESCRIÇÃO DOS SERVIÇOS', 'QTD', 'UNID', 'UNITÁRIO', 'REF. MERCADO', 'TOTAL']],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [30, 41, 59], 
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 15 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'right', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 25 }
    },
    styles: { fontSize: 8, cellPadding: 4 },
    foot: [['', '', '', '', 'VALOR TOTAL:', `R$ ${budget.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]],
    footStyles: { 
      fillColor: [241, 245, 249], 
      textColor: [15, 23, 42], 
      fontStyle: 'bold',
      fontSize: 11,
      halign: 'right'
    }
  });

  // Notes
  const finalY = doc.lastAutoTable.finalY + 15;
  if (budget.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('OBSERVAÇÕES:', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(budget.notes, pageWidth - 28);
    doc.text(splitNotes, 14, finalY + 7);
  }

  // Signature lines
  const sigY = Math.max(finalY + 40, 250);
  doc.setDrawColor(203, 213, 225);
  doc.line(14, sigY, 90, sigY);
  doc.line(pageWidth - 90, sigY, pageWidth - 14, sigY);
  
  doc.setFontSize(8);
  doc.text('ASSINATURA DO PRESTADOR', 52, sigY + 5, { align: 'center' });
  doc.text('ASSINATURA DO CLIENTE', pageWidth - 52, sigY + 5, { align: 'center' });

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Gerado por EletroPRO - Tecnologia para Eletricistas', pageWidth / 2, pageHeight - 10, { align: 'center' });

  doc.save(`orcamento_${budget.clientName.replace(/\s+/g, '_')}.pdf`);
};

export const generateReceiptPDF = (budget: Budget, userProfile: UserProfile) => {
  const doc = new jsPDF() as jsPDFWithPlugin;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Border
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(1);
  doc.rect(10, 10, pageWidth - 20, 130);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(30, 41, 59);
  doc.text('RECIBO', pageWidth / 2, 35, { align: 'center' });

  doc.setFontSize(32);
  doc.setTextColor(245, 158, 11);
  doc.text(`R$ ${budget.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth / 2, 55, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  
  const text = `Recebi(emos) de ${budget.clientName.toUpperCase()} a importância de R$ ${budget.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} referente aos serviços elétricos detalhados no orçamento #${budget.id.slice(0, 8).toUpperCase()}.`;
  const splitText = doc.splitTextToSize(text, pageWidth - 40);
  doc.text(splitText, 20, 75);

  doc.text(`Brasília, DF - ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, 20, 100);

  doc.line(pageWidth / 2 - 40, 125, pageWidth / 2 + 40, 125);
  doc.setFontSize(9);
  doc.text(userProfile.displayName || userProfile.businessName || 'ASSINATURA', pageWidth / 2, 130, { align: 'center' });

  doc.save(`recibo_${budget.clientName.replace(/\s+/g, '_')}.pdf`);
};
