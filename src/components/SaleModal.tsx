import React, { useState, useEffect } from 'react';
import { XCircle, ShoppingCart, Loader2, Plus, Trash2, FileText } from 'lucide-react';
import { createRecords, fetchTableRecords } from '../api';
import { generateReceiptPDF } from '../lib/pdfGenerator';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function SaleModal({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  
  const [pedidoData, setPedidoData] = useState({
    Cliente: '',
    Fecha: new Date().toISOString().split('T')[0],
    Canal: 'Directo',
    'Estado del Pedido': '✅ Entregado',
    Pago: '💳 Pagado'
  });

  const [items, setItems] = useState<{productoId: string, cantidad: number, precio: number, nombre?: string, descripcion?: string}[]>([
    { productoId: '', cantidad: 1, precio: 0, nombre: '', descripcion: '' }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cliData, prodData] = await Promise.all([
        fetchTableRecords('Clientes'),
        fetchTableRecords('Productos')
      ]);
      setClientes(cliData);
      setProductos(prodData);
    } catch (err) {
      console.error(err);
      setError("Error cargando clientes y productos");
    } finally {
      setFetchingData(false);
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = productos.find(p => p.id === productId);
    const newItems = [...items];
    newItems[index].productoId = productId;
    newItems[index].precio = product ? Number(product.fields.Precio || 0) : 0;
    newItems[index].nombre = product ? (product.fields.Nombre || product.fields.Name) : '';
    newItems[index].descripcion = product ? product.fields.Descripción : '';
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => acc + (item.cantidad * item.precio), 0);
  };

  const calculateIVA = () => {
    // Chile IVA is 19%
    return Math.round(calculateSubtotal() * 0.19);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateIVA();
  };

  const handleGenerateQuote = () => {
    const client = clientes.find(c => c.id === pedidoData.Cliente);
    const clientName = client ? (client.fields.Nombre || client.fields.Name || client.id) : '';
    const clientRut = client ? client.fields.RUT : '';
    const clientEmail = client ? (client.fields['Email de Contacto'] || client.fields.Email) : '';
    const clientPhone = client ? client.fields.Teléfono : '';
    const clientGiro = client ? client.fields.Giro : '';
    const clientAddress = client ? client.fields.Dirección : '';
    const clientCity = client ? client.fields.Ciudad : '';

    const doc = new jsPDF();
    
    // Config colors
    const PRIMARY_COLOR: [number, number, number] = [35, 62, 60]; // Dark green from screenshot
    
    // Header Background
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Header Text
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('PULSO BIENESTAR', 80, 20);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Tu bienestar sensorial', 80, 27);
    
    // Dates & Quote Number
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    // Use format dd/mm/yyyy
    const [y, m, d] = pedidoData.Fecha.split('-');
    const formattedDate = `${d}/${m}/${y}`;
    doc.text(`Fecha: ${formattedDate}`, 14, 50);
    
    // Generate a quote number (e.g., YYYYMMDD + random)
    const quoteNum = `${y}${m}${d}${Math.floor(Math.random() * 100)}`;
    doc.text(`N° Cotización: ${quoteNum}`, 140, 50);
    
    // Company Info Box
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(14, 55, 182, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Pulso SpA', 16, 61);
    doc.text('78.195.248-6', 16, 66);
    doc.text('Dirección: Hijuela 26 SN, Sector Collimallin, Temuco', 16, 71);
    doc.text('Teléfono: 951759877', 16, 76);
    doc.text('Correo: pulsobienestarsensorial@gmail.com', 16, 81);
    
    // Client Info Box (Bordered)
    doc.setDrawColor(...PRIMARY_COLOR);
    doc.setLineWidth(0.5);
    doc.rect(14, 85, 182, 30);
    doc.setTextColor(40, 40, 40);
    doc.text(`Cliente: ${clientName}`, 16, 91);
    doc.text(`Rut: ${clientRut || '-'}`, 16, 98);
    doc.text(`E-mail: ${clientEmail || '-'}`, 16, 105);
    doc.text(`Teléfono: ${clientPhone || '-'}`, 16, 112);
    
    doc.text(`Giro: ${clientGiro || '-'}`, 110, 91);
    doc.text(`Dirección: ${clientAddress || '-'}`, 110, 98);
    doc.text(`Comuna: ${clientCity || '-'}`, 110, 105);

    // Table Data
    const tableData = items.filter(i => i.productoId && i.cantidad > 0).map(i => [
      i.nombre || 'Producto',
      i.cantidad.toString(),
      i.descripcion || '',
      `$${i.precio.toLocaleString('es-CL')}`,
      `$${(i.cantidad * i.precio).toLocaleString('es-CL')}`
    ]);

    autoTable(doc, {
      startY: 120,
      head: [['Producto', 'Cant', 'Descripción', 'Valor unitario\nneto ($)', 'Subtotal\nNeto ($)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: PRIMARY_COLOR, textColor: 255, fontStyle: 'normal' },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 80 },
        3: { cellWidth: 26, halign: 'center' },
        4: { cellWidth: 26, halign: 'center' }
      },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 120;
    
    // Totals Box
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    
    // Right side totals table
    const tableW = 60;
    const rightX = 196 - tableW; // end at 196 (same as right margin approx)
    const rowH = 8;
    
    // Subtotal
    doc.rect(rightX, finalY, tableW / 2, rowH);
    doc.rect(rightX + tableW / 2, finalY, tableW / 2, rowH);
    doc.setFont(undefined, 'bold');
    doc.text('Subtotal', rightX + (tableW / 4), finalY + 5, { align: 'center' });
    doc.setFont(undefined, 'normal');
    doc.text(`$${calculateSubtotal().toLocaleString('es-CL')}`, rightX + (tableW * 3/4), finalY + 5, { align: 'center' });
    
    // IVA
    doc.rect(rightX, finalY + rowH, tableW / 2, rowH);
    doc.rect(rightX + tableW / 2, finalY + rowH, tableW / 2, rowH);
    doc.setFont(undefined, 'bold');
    doc.text('IVA (19%)', rightX + (tableW / 4), finalY + rowH + 5, { align: 'center' });
    doc.setFont(undefined, 'normal');
    doc.text(`$${calculateIVA().toLocaleString('es-CL')}`, rightX + (tableW * 3/4), finalY + rowH + 5, { align: 'center' });

    // Total
    doc.rect(rightX, finalY + rowH * 2, tableW / 2, rowH);
    doc.rect(rightX + tableW / 2, finalY + rowH * 2, tableW / 2, rowH);
    doc.setFont(undefined, 'bold');
    doc.text('Total', rightX + (tableW / 4), finalY + rowH * 2 + 5, { align: 'center' });
    doc.text(`$${calculateTotal().toLocaleString('es-CL')}`, rightX + (tableW * 3/4), finalY + rowH * 2 + 5, { align: 'center' });

    // Footer Notes
    const notesY = finalY + rowH * 3 + 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Notas:', 14, notesY);
    doc.text('- Cotización válida por 30 días. Despacho incluído en Temuco.', 20, notesY + 6);
    doc.text('- Entrega 15 días hábiles posterior a la fecha de la Orden de Compra.', 20, notesY + 12);

    doc.save(`Cotizacion_${clientName.replace(/\s+/g, '_')}_${quoteNum}.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedidoData.Cliente) {
      setError("Debes seleccionar un cliente");
      return;
    }
    const validItems = items.filter(i => i.productoId && i.cantidad > 0);
    if (validItems.length === 0) {
      setError("Debes agregar al menos un producto válido");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Create Pedido
      const pedidoPayload = {
        Cliente: [pedidoData.Cliente],
        'Fecha del Pedido': pedidoData.Fecha,
        'Canal de Venta': pedidoData.Canal,
        'Estado del Pedido': pedidoData['Estado del Pedido'],
        'Estado de Pago': pedidoData.Pago,
        'Líneas de Venta': validItems.map(item => ({
          Producto: [item.productoId],
          Cantidad: Number(item.cantidad),
          'Precio Unitario': item.precio,
          'Total Línea': item.cantidad * item.precio
        })),
        Subtotal: calculateSubtotal(),
        IVA: calculateIVA(),
        Total: calculateTotal()
      };
      await createRecords('Pedidos', [pedidoPayload]);
      
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" /> Nueva Venta B2B/B2C
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        
        {fetchingData ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
            {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{error}</div>}
            
            {/* Detalles del Pedido */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">Datos del Pedido</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cliente *</label>
                  <select required value={pedidoData.Cliente} onChange={e => setPedidoData({...pedidoData, Cliente: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors">
                    <option value="">Selecciona un cliente...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.fields.Nombre || c.fields.Name || c.id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fecha *</label>
                  <input required type="date" value={pedidoData.Fecha} onChange={e => setPedidoData({...pedidoData, Fecha: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Canal de Venta</label>
                  <select value={pedidoData.Canal} onChange={e => setPedidoData({...pedidoData, Canal: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors">
                    <option value="Directo">Directo</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Web / Tienda Online">Web / Tienda Online</option>
                    <option value="Feria / Evento">Feria / Evento</option>
                    <option value="Referido">Referido</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Estado de Pago</label>
                  <select value={pedidoData.Pago} onChange={e => setPedidoData({...pedidoData, Pago: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors">
                    <option value="💳 Pagado">💳 Pagado</option>
                    <option value="⏳ Pendiente">⏳ Pendiente</option>
                    <option value="🏦 Transferencia">🏦 Transferencia</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Productos */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">Líneas de Productos</h3>
              
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="flex-1">
                      <select required value={item.productoId} onChange={e => handleProductChange(index, e.target.value)} className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm bg-white focus:border-blue-500 focus:outline-none">
                        <option value="">Selecciona producto...</option>
                        {productos.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.fields.Nombre || p.fields.Name || p.id} - ${p.fields.Precio || 0}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <input type="number" min="1" required value={item.cantidad} onChange={e => {
                        const newItems = [...items];
                        newItems[index].cantidad = Number(e.target.value);
                        setItems(newItems);
                      }} className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm bg-white focus:border-blue-500 focus:outline-none" placeholder="Cant." />
                    </div>
                    <div className="w-28 pt-1.5 font-medium text-slate-700 text-sm text-right">
                      ${(item.cantidad * item.precio).toFixed(2)}
                    </div>
                    <button type="button" onClick={() => {
                        // Allow delete only if more than 1
                        if (items.length > 1) {
                          setItems(items.filter((_, i) => i !== index));
                        }
                      }} 
                      className={`p-1.5 mt-0.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors ${items.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" onClick={() => setItems([...items, {productoId: '', cantidad: 1, precio: 0}])} className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Añadir otro producto
              </button>
            </div>

            {/* Totales */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center text-slate-600 text-sm">
                <span>Subtotal:</span>
                <span>${calculateSubtotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 text-sm">
                <span>IVA (19%):</span>
                <span>${calculateIVA().toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-200 my-1"></div>
              <div className="flex justify-between items-center">
                <span className="text-blue-800 font-semibold text-lg">Total a Pagar:</span>
                <span className="text-2xl font-bold text-blue-900">${calculateTotal().toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <button type="button" onClick={handleGenerateQuote} className="px-4 py-2 flex items-center gap-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-sm">
                <FileText className="w-4 h-4" /> Generar Cotización PDF
              </button>
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="px-5 py-2 flex items-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'Procesando...' : 'Completar Venta / Pedido'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
