import React, { useState, useEffect } from 'react';
import { XCircle, FileText, Loader2, Settings, Plus, Trash2 } from 'lucide-react';
import { createRecords, fetchTableRecords } from '../api';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function FinanceModal({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [fetchingProveedores, setFetchingProveedores] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proveedores, setProveedores] = useState<any[]>([]);
  
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categories] = useState<string[]>([
    'Venta de Producto',
    'Compra de Inventario',
    'Nómina / Salarios',
    'Arriendo / Local',
    'Marketing / Publicidad',
    'Servicios (luz, internet...)',
    'Transporte / Envíos',
    'Impuestos',
    'Gastos Legales',
    'Pago a Inversionistas',
    'Otro'
  ]);
  
  const [formData, setFormData] = useState({
    Descripción: '',
    Tipo: '↗️ Ingreso',
    Categoría: '',
    Monto: '',
    Fecha: new Date().toISOString().split('T')[0],
    Proveedor: ''
  });

  useEffect(() => {
    if (formData.Tipo === '↘️ Egreso' && proveedores.length === 0) {
      loadProveedores();
    }
  }, [formData.Tipo]);

  const loadProveedores = async () => {
    setFetchingProveedores(true);
    try {
      const data = await fetchTableRecords('Proveedores');
      setProveedores(data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingProveedores(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Descripción || !formData.Monto || !formData.Categoría) {
      setError("Por favor completa los campos requeridos.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        Descripción: formData.Descripción,
        Tipo: formData.Tipo,
        Categoría: formData.Categoría,
        Monto: Number(formData.Monto),
        Fecha: formData.Fecha
      };

      if (formData.Tipo === 'Egreso' && formData.Proveedor) {
        payload.Proveedor = [formData.Proveedor];
      }

      await createRecords('Finanzas', [payload]);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" /> Registrar Movimiento
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo *</label>
              <select value={formData.Tipo} onChange={e => setFormData({...formData, Tipo: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:border-purple-500 focus:outline-none transition-colors">
                <option value="↗️ Ingreso">Ingreso</option>
                <option value="↘️ Egreso">Egreso (Gasto)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fecha *</label>
              <input required type="date" value={formData.Fecha} onChange={e => setFormData({...formData, Fecha: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:border-purple-500 focus:outline-none transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Descripción *</label>
            <input required type="text" value={formData.Descripción} onChange={e => setFormData({...formData, Descripción: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:border-purple-500 focus:outline-none transition-colors" placeholder="Ej. Venta en feria, Compra insumos..." />
          </div>

          <div className="grid grid-cols-2 gap-4 items-start">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Categoría *</label>
              </div>
              <select required value={formData.Categoría} onChange={e => setFormData({...formData, Categoría: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:border-purple-500 focus:outline-none transition-colors">
                <option value="">Selecciona...</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Monto Total *</label>
              <input required type="number" step="0.01" value={formData.Monto} onChange={e => setFormData({...formData, Monto: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:border-purple-500 focus:outline-none transition-colors" placeholder="Ej. 150.00" />
            </div>
          </div>

          {formData.Tipo === 'Egreso' && (
            <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl mt-2 animate-in slide-in-from-top-2">
              <label className="block text-[11px] font-bold text-purple-600 uppercase tracking-wider mb-1.5">Vincular Proveedor (Opcional)</label>
              <select value={formData.Proveedor} onChange={e => setFormData({...formData, Proveedor: e.target.value})} disabled={fetchingProveedores} className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-purple-500 focus:outline-none transition-colors">
                <option value="">-- No vincular a un proveedor --</option>
                {proveedores.map(prov => (
                  <option key={prov.id} value={prov.id}>{prov.fields.Nombre || prov.fields.Name || prov.id}</option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 flex items-center gap-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-sm disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Registrando...' : 'Registrar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
