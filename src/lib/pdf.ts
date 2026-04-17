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
  const statusMap: Record<string, string> = {
    'pending': 'PENDENTE',
    'approved': 'APROVADO',
    'completed': 'CONCLUÍDO',
    'cancelled': 'CANCELADO'
  };

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const budgetDisplayId = budget.budgetNumber ? budget.budgetNumber.toString().padStart(4, '0') : budget.id.slice(0, 8).toUpperCase();
  doc.text(`ORÇAMENTO: #${budgetDisplayId}`, pageWidth - 14, 20, { align: 'right' });
  doc.text(`DATA: ${format(new Date(budget.date), 'dd/MM/yyyy', { locale: ptBR })}`, pageWidth - 14, 26, { align: 'right' });
  doc.text(`STATUS: ${statusMap[budget.status] || budget.status.toUpperCase()}`, pageWidth - 14, 32, { align: 'right' });

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

export const generateContractPDF = (budget: Budget, userProfile: UserProfile) => {
  const doc = new jsPDF() as jsPDFWithPlugin;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', pageWidth / 2, 25, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`CONTRATO Nº ${budget.budgetNumber ? budget.budgetNumber.toString().padStart(4, '0') : budget.id.slice(0, 8).toUpperCase()}`, pageWidth / 2, 35, { align: 'center' });

  let y = 60;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  
  const addSectionTitle = (title: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
  };

  const addParagraph = (text: string) => {
    const splitText = doc.splitTextToSize(text, pageWidth - 28);
    doc.text(splitText, 14, y);
    y += (splitText.length * 5) + 5;
  };

  // 1. Partes
  addSectionTitle('1. DAS PARTES');
  addParagraph(`CONTRATADA: ${userProfile.businessName || userProfile.displayName || '____________________'}, inscrito(a) sob o CNPJ/CPF ${userProfile.businessCpfCnpj || '____________________'}, com sede em ${userProfile.businessAddress || '____________________'}.`);
  addParagraph(`CONTRATANTE: ${budget.clientName.toUpperCase()}, residente em ${budget.clientAddress || '____________________'}.`);

  // 2. Objeto
  addSectionTitle('2. DO OBJETO');
  addParagraph('O presente contrato tem como objeto a prestação de serviços elétricos profissionais, conforme detalhado no orçamento anexo, incluindo instalação, manutenção e/ou reparos de sistemas elétricos conforme as normas técnicas vigentes (NBR 5410).');

  // 3. Valor e Pagamento
  addSectionTitle('3. DO VALOR E FORMA DE PAGAMENTO');
  addParagraph(`O valor total dos serviços contratados é de R$ ${budget.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. O pagamento será realizado conforme acordado entre as partes, sendo as observações de pagamento: ${budget.notes || 'Conforme orçamento'}.`);

  // 4. Prazos
  addSectionTitle('4. DOS PRAZOS');
  addParagraph('A execução dos serviços terá início na data acordada após a assinatura deste instrumento, com prazo estimado de conclusão condicionado às condições do local e fornecimento de materiais.');

  // 5. Garantia
  addSectionTitle('5. DA GARANTIA');
  addParagraph('A CONTRATADA oferece garantia de 90 (noventa) dias sobre a mão de obra executada, contados a partir da data de entrega dos serviços, não cobrindo danos por mau uso, variações da concessionária de energia ou intervenção de terceiros.');

  // 6. Foro
  addSectionTitle('6. DO FORO');
  addParagraph('As partes elegem o foro da Comarca de Brasília-DF para dirimir quaisquer dúvidas oriundas deste contrato.');

  y += 20;
  doc.text(`Brasília, ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.`, 14, y);

  y += 40;
  doc.line(14, y, 90, y);
  doc.line(pageWidth - 90, y, pageWidth - 14, y);
  doc.text('CONTRATADA', 52, y + 5, { align: 'center' });
  doc.text('CONTRATANTE', pageWidth - 52, y + 5, { align: 'center' });

  doc.save(`contrato_${budget.clientName.replace(/\s+/g, '_')}.pdf`);
};

export const generateReceiptPDF = (budget: Budget, userProfile: UserProfile, customAmount?: number) => {
  const doc = new jsPDF() as jsPDFWithPlugin;
  const pageWidth = doc.internal.pageSize.getWidth();

  const finalAmount = customAmount !== undefined ? customAmount : budget.totalAmount;

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
  doc.text(`R$ ${finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth / 2, 55, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  
  const budgetDisplayId = budget.budgetNumber ? budget.budgetNumber.toString().padStart(4, '0') : budget.id.slice(0, 8).toUpperCase();
  const text = `Recebi(emos) de ${budget.clientName.toUpperCase()} a importância de R$ ${finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} referente aos serviços elétricos detalhados no orçamento #${budgetDisplayId}.`;
  const splitText = doc.splitTextToSize(text, pageWidth - 40);
  doc.text(splitText, 20, 75);

  doc.text(`Brasília, DF - ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, 20, 100);

  doc.line(pageWidth / 2 - 40, 125, pageWidth / 2 + 40, 125);
  doc.setFontSize(9);
  doc.text(userProfile.displayName || userProfile.businessName || 'ASSINATURA', pageWidth / 2, 130, { align: 'center' });

  doc.save(`recibo_${budget.clientName.replace(/\s+/g, '_')}.pdf`);
};
