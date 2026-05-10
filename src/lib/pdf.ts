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
  doc.text(`ORÇAMENTO: #${budgetDisplayId}`, pageWidth - 14, 18, { align: 'right' });
  doc.text(`DATA: ${format(new Date(budget.date), 'dd/MM/yyyy', { locale: ptBR })}`, pageWidth - 14, 24, { align: 'right' });
  doc.text(`VALIDADE: ${budget.validity || '15 dias'}`, pageWidth - 14, 30, { align: 'right' });
  doc.text(`STATUS: ${statusMap[budget.status] || budget.status.toUpperCase()}`, pageWidth - 14, 36, { align: 'right' });

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

  // Notes & Payment
  let currentY = doc.lastAutoTable.finalY + 15;
  
  if (budget.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('OBSERVAÇÕES:', 14, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(budget.notes, pageWidth - 28);
    doc.text(splitNotes, 14, currentY + 7);
    currentY += (splitNotes.length * 5) + 12;
  }

  if (userProfile.paymentMethods) {
    if (currentY > 230) { doc.addPage(); currentY = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('MÉTODOS DE PAGAMENTO ACEITOS:', 14, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitPayments = doc.splitTextToSize(userProfile.paymentMethods, pageWidth - 28);
    doc.text(splitPayments, 14, currentY + 7);
  }

  // Signature lines
  const sigY = Math.max(currentY + 40, 250);
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
  const budgetDisplayId = budget.budgetNumber ? budget.budgetNumber.toString().padStart(4, '0') : budget.id.slice(0, 8).toUpperCase();

  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', pageWidth / 2, 25, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`REFERÊNCIA: ORÇAMENTO Nº ${budgetDisplayId}`, pageWidth / 2, 35, { align: 'center' });

  let y = 60;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10.5);
  
  const addSectionTitle = (title: string) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
  };

  const addParagraph = (text: string) => {
    const splitText = doc.splitTextToSize(text, pageWidth - 28);
    if (y + (splitText.length * 5) > 280) { doc.addPage(); y = 20; }
    doc.text(splitText, 14, y);
    y += (splitText.length * 5) + 6;
  };

  // 1. Partes
  addSectionTitle('1. DAS PARTES');
  const providerInfo = [
    userProfile.businessName || userProfile.displayName || '____________________',
    userProfile.businessCpfCnpj ? `inscrito(a) sob o CPF/CNPJ nº ${userProfile.businessCpfCnpj}` : 'portador(a) do CPF/CNPJ nº ____________________',
    userProfile.businessAddress ? `com sede/domicílio em ${userProfile.businessAddress}` : 'com endereço em ____________________'
  ].join(', ');

  addParagraph(`CONTRATADA: ${providerInfo}, doravante denominada simplesmente CONTRATADA.`);
  addParagraph(`CONTRATANTE: ${budget.clientName.toUpperCase()}, portador(a) do CPF/CNPJ nº ____________________, residente e domiciliado(a) em ${budget.clientAddress || '____________________'}, doravante denominado simplesmente CONTRATANTE.`);

  // 2. Objeto
  addSectionTitle('2. DO OBJETO');
  const itemsList = budget.items.map(item => `- ${item.quantity} ${item.unit || 'un'} de ${item.description}`).join('\n');
  const objetoText = `O presente instrumento tem como objeto a prestação, pela CONTRATADA, de serviços elétricos profissionais consistindo em:\n${itemsList}\n\nTodos os serviços serão executados em estrita observância às normas técnicas de segurança (NBR 5410) e especificações do fabricante.`;
  addParagraph(objetoText);

  // 3. Valor e Pagamento
  addSectionTitle('3. DO PREÇO E DAS CONDIÇÕES DE PAGAMENTO');
  addParagraph(`Pela execução dos serviços objeto deste contrato, o(a) CONTRATANTE pagará à CONTRATADA a importância total de R$ ${budget.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`);
  
  let paymentText = budget.notes || 'Conforme acordado entre as partes';
  if (userProfile.paymentMethods) {
    paymentText += `\n\nMÉTODOS DE PAGAMENTO ACEITOS:\n${userProfile.paymentMethods}`;
  }
  addParagraph(`O pagamento será efetuado da seguinte forma: ${paymentText}. Em caso de atraso, poderá ser aplicada multa de 2% e juros moratórios de 1% ao mês.`);

  // 4. Obrigações
  addSectionTitle('4. DAS OBRIGAÇÕES');
  addParagraph('CONTRATADA: Executar os serviços com zelo, técnica e materiais adequados (quando inclusos), cumprindo o cronograma estabelecido.');
  addParagraph('CONTRATANTE: Proporcionar livre acesso ao local da execução, fornecer os materiais necessários (quando não inclusos na contratação) e efetuar o pagamento nos prazos estipulados.');

  // 5. Garantia
  addSectionTitle('5. DA GARANTIA');
  addParagraph('A CONTRATADA concede garantia de 90 (noventa) dias sobre a mão de obra executada, contados da data de conclusão dos serviços. A garantia não cobre danos decorrentes de mau uso, sobrecarga do sistema provocada pelo usuário ou intervenções de terceiros não autorizados.');

  // 6. Foro
  addSectionTitle('6. DO FORO');
  addParagraph('As partes elegem o foro da Comarca onde se localiza o imóvel objeto da prestação dos serviços para dirimir quaisquer controvérsias oriundas deste contrato.');

  y += 10;
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  doc.text(`Local e data: ___________________________, ${today}.`, 14, y);

  y += 35;
  if (y > 270) { doc.addPage(); y = 35; }
  doc.setDrawColor(30, 41, 59);
  doc.line(14, y, 90, y);
  doc.line(pageWidth - 90, y, pageWidth - 14, y);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRATADA', 52, y + 5, { align: 'center' });
  doc.text('CONTRATANTE', pageWidth - 52, y + 5, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(userProfile.businessName || userProfile.displayName || '', 52, y + 10, { align: 'center' });
  doc.text(budget.clientName.toUpperCase(), pageWidth - 52, y + 10, { align: 'center' });

  doc.save(`contrato_${budget.clientName.replace(/\s+/g, '_')}.pdf`);
};

export const generateReceiptPDF = (budget: Budget, userProfile: UserProfile, customAmount?: number) => {
  const doc = new jsPDF() as jsPDFWithPlugin;
  const pageWidth = doc.internal.pageSize.getWidth();

  const finalAmount = customAmount !== undefined ? customAmount : budget.totalAmount;

  // Header Background
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('RECIBO DE PAGAMENTO', pageWidth / 2, 25, { align: 'center' });

  // Border
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.5);
  doc.rect(10, 50, pageWidth - 20, 100);

  doc.setFontSize(32);
  doc.setTextColor(245, 158, 11);
  doc.text(`R$ ${finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth / 2, 75, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  
  const budgetDisplayId = budget.budgetNumber ? budget.budgetNumber.toString().padStart(4, '0') : budget.id.slice(0, 8).toUpperCase();
  const text = `Recebi(emos) de ${budget.clientName.toUpperCase()}, a importância supra de R$ ${finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} referente aos serviços elétricos descritos no orçamento #${budgetDisplayId}.`;
  
  const splitText = doc.splitTextToSize(text, pageWidth - 40);
  doc.text(splitText, 20, 95);

  doc.setFontSize(10);
  doc.text(`Local e data: ___________________________, ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, 20, 120);

  // Signature
  doc.line(pageWidth / 2 - 40, 140, pageWidth / 2 + 40, 140);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(userProfile.businessName || userProfile.displayName || 'ASSINATURA', pageWidth / 2, 145, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(userProfile.businessCpfCnpj || '', pageWidth / 2, 149, { align: 'center' });

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Este recibo comprova o pagamento parcial ou total dos serviços citados.', pageWidth / 2, pageHeight - 15, { align: 'center' });

  doc.save(`recibo_${budget.clientName.replace(/\s+/g, '_')}.pdf`);
};
