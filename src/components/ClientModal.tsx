import React, { useState } from 'react';
import { XCircle, UserPlus, Loader2 } from 'lucide-react';
import { createRecords } from '../api';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ClientModal({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    Nombre: '',
    Teléfono: '',
    Email: '',
    Ciudad: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createRecords('Clientes', [formData]);
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
            <UserPlus className="w-5 h-5 text-emerald-600" /> Nuevo Cliente
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{error}</div>}
          
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre Completo / Empresa *</label>
            <input required type="text" value={formData.Nombre} onChange={e => setFormData({...formData, Nombre: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors" placeholder="Ej. Juan Pérez" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Teléfono</label>
            <input type="text" value={formData.Teléfono} onChange={e => setFormData({...formData, Teléfono: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors" placeholder="+56 9 1234 5678" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
            <input type="email" value={formData.Email} onChange={e => setFormData({...formData, Email: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors" placeholder="correo@ejemplo.com" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ciudad</label>
            <input type="text" value={formData.Ciudad} onChange={e => setFormData({...formData, Ciudad: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors" placeholder="Ej. Santiago" />
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 flex items-center gap-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Guardando...' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
