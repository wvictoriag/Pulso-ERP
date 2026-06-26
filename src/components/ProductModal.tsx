import React, { useState, useEffect } from 'react';
import { XCircle, Package, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { createRecords, fetchTableRecords } from '../api';

export default function ProductModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    precio: 0,
    costo: 0,
    stock: 0,
    esKit: false
  });

  const [componentes, setComponentes] = useState<{productoId: number, cantidad: number}[]>([]);

  useEffect(() => {
    fetchTableRecords('Productos').then(setProductos).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        Nombre: formData.nombre,
        Descripción: formData.descripcion,
        Categoría: formData.categoria,
        Precio: formData.precio,
        Costo: formData.costo,
        Stock: formData.stock,
        'Es Kit': formData.esKit
      };

      if (formData.esKit && componentes.length > 0) {
        payload['Componentes del Kit'] = JSON.stringify(componentes);
      }

      await createRecords('Productos', [payload]);
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error guardando el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Nuevo Producto / Kit</h2>
              <p className="text-xs text-slate-500">Añade stock e inventario al catálogo.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full"><XCircle className="w-6 h-6" /></button>
        </div>
        <div className="overflow-y-auto custom-scrollbar p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre del Producto *</label>
                <input type="text" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Descripción</label>
                <input type="text" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Categoría / Tipo</label>
                <input type="text" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none" placeholder="Ej. Terapia Ocupacional, Escolar" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Precio de Venta ($) *</label>
                <input type="number" required min="0" value={formData.precio || ''} onChange={e => setFormData({...formData, precio: parseInt(e.target.value) || 0})} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Costo Unitario ($) *</label>
                <input type="number" required min="0" value={formData.costo || ''} onChange={e => setFormData({...formData, costo: parseInt(e.target.value) || 0})} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none" />
              </div>
              
              <div className="col-span-2 border-t border-slate-100 pt-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.esKit} onChange={e => setFormData({...formData, esKit: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                  <span className="text-sm font-semibold text-slate-800">Este producto es un Kit / Combo</span>
                </label>
                <p className="text-xs text-slate-500 mt-1 ml-6">Si se vende un kit, se descontará stock de los componentes individuales.</p>
              </div>

              {!formData.esKit && (
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Stock Físico *</label>
                  <input type="number" required min="0" value={formData.stock || ''} onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none" />
                </div>
              )}

              {formData.esKit && (
                <div className="col-span-2 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Componentes del Kit</label>
                  {componentes.map((comp, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select required value={comp.productoId || ''} onChange={e => {
                        const newC = [...componentes];
                        newC[idx].productoId = parseInt(e.target.value);
                        setComponentes(newC);
                      }} className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:border-blue-500 outline-none">
                        <option value="">Selecciona componente...</option>
                        {productos.filter(p => !p.fields['Es Kit']).map(p => (
                          <option key={p.id} value={p.id}>{p.fields.Nombre || p.fields.Name}</option>
                        ))}
                      </select>
                      <input type="number" required min="1" placeholder="Cant" value={comp.cantidad || ''} onChange={e => {
                        const newC = [...componentes];
                        newC[idx].cantidad = parseInt(e.target.value) || 1;
                        setComponentes(newC);
                      }} className="w-24 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:border-blue-500 outline-none" />
                      <button type="button" onClick={() => setComponentes(componentes.filter((_, i) => i !== idx))} className="p-2 text-slate-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setComponentes([...componentes, {productoId: 0, cantidad: 1}])} className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Añadir componente
                  </button>
                </div>
              )}
            </div>
            
            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
              <button type="submit" disabled={loading || (formData.esKit && componentes.length === 0)} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg flex items-center gap-2 shadow-sm">
                {loading && <RefreshCw className="w-4 h-4 animate-spin" />} Guardar Producto
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
