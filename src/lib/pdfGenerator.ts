import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateReceiptPDF = (saleData: any) => {
  const doc = new jsPDF();
  
  // Safe extraction
  const fecha = saleData['Fecha'] || saleData.fecha || new Date().toLocaleDateString();
  const estado = saleData['Estado de Pago'] || saleData.estadoPago || '';
  const canal = saleData['Canal de Venta'] || saleData.canal || '';
  const itemsRaw = saleData['Líneas de Venta'] || saleData.items || [];
  const total = saleData['Total'] || saleData.total || 0;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Recibo de Venta', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Fecha: ${fecha}`, 14, 30);
  doc.text(`Estado: ${estado}`, 14, 36);
  doc.text(`Canal: ${canal}`, 14, 42);

  // Items if any
  let yPos = 50;
  
  let items = [];
  try {
    if (typeof itemsRaw === 'string') {
        items = JSON.parse(itemsRaw);
    } else if (Array.isArray(itemsRaw)) {
        items = itemsRaw;
    }
  } catch(e) {}
  
  if (items && items.length > 0) {
    const tableData = items.map((item: any) => [
      item.nombre || item.producto || 'Producto',
      item.cantidad || 1,
      `$${(item.precio || 0).toLocaleString()}`,
      `$${((item.cantidad || 1) * (item.precio || 0)).toLocaleString()}`
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Descripción', 'Cant.', 'Precio Unit.', 'Subtotal']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }, // blue-500
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Total
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total: $${total.toLocaleString()}`, 14, yPos);
  
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('¡Gracias por su compra!', 14, yPos + 20);

  doc.save(`Recibo_${new Date().getTime()}.pdf`);
};
