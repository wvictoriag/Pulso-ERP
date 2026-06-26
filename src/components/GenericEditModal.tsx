import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  tableName: string;
  record: any;
  onClose: () => void;
  onSuccess: () => void;
  apiFetch: (url: string, options?: any) => Promise<any>;
}

const getOptionsForField = (table: string, field: string): string[] | null => {
  if (table === 'Clientes' && field === 'Tipo de Cliente') return ['Colegio', 'Corporación Educacional', 'Fundación', 'Centro Médico', 'Particular', 'Empresa', 'Otro'];
  if ((table === 'Clientes' || table === 'Proveedores') && field === 'Condición de Pago') return ['30 días', 'Contra Recepción de Factura', 'Al Contado', 'Transferencia Previa'];
  if (table === 'Pedidos' && field === 'Estado del Pedido') return ['💬 Cotización', '📦 Preparación', '🚚 En Camino', '✅ Entregado', '❌ Cancelado'];
  if (table === 'Pedidos' && field === 'Canal de Venta') return ['Directo', 'MercadoLibre', 'Sitio Web', 'Licitación'];
  if (table === 'Pedidos' && field === 'Estado de Pago') return ['⏳ Pendiente', '💳 Pagado', '🏦 Transferencia'];
  if (table === 'Finanzas' && field === 'Tipo') return ['Ingreso', 'Gasto'];
  if (table === 'Finanzas' && field === 'Método de Pago') return ['Transferencia', 'Efectivo', 'Tarjeta', 'Cheque'];
  return null;
};

export default function GenericEditModal({ tableName, record, onClose, onSuccess, apiFetch }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({ ...record.fields });

  const [relationalData, setRelationalData] = useState<{ clientes: any[], proveedores: any[] }>({ clientes: [], proveedores: [] });

  useEffect(() => {
    const loadRelations = async () => {
      try {
        if (tableName === 'Pedidos' || tableName === 'Ventas') {
          const res = await apiFetch('/api/table/Clientes');
          if (res.ok) {
            const json = await res.json();
            setRelationalData(prev => ({ ...prev, clientes: json.data || [] }));
          }
        }
        if (tableName === 'Finanzas') {
          const res = await apiFetch('/api/table/Proveedores');
          if (res.ok) {
            const json = await res.json();
            setRelationalData(prev => ({ ...prev, proveedores: json.data || [] }));
          }
        }
      } catch (e) {
        console.error("Error loading relations", e);
      }
    };
    loadRelations();
  }, [tableName, apiFetch]);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/table/${tableName}/${record.id}`, {
        method: 'PUT',
        body: JSON.stringify({ fields: formData }),
      });
      if (!res.ok) throw new Error('Error al actualizar el registro');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800">Editar {tableName} #{record.id}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form id="edit-form" onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(formData).map((key) => {
              const value = formData[key];
              const isBool = typeof value === 'boolean';
              const isNumber = typeof value === 'number';
              const isObj = typeof value === 'object' && value !== null;
              const options = getOptionsForField(tableName, key);
              const isFullWidth = ['Descripción', 'Dirección'].includes(key) || isObj;
              
              const isClienteRel = key === 'Cliente' && (tableName === 'Pedidos' || tableName === 'Ventas');
              const isProveedorRel = key === 'Proveedor' && tableName === 'Finanzas';

              if (isObj) {
                  return (
                      <div key={key} className={isFullWidth ? 'md:col-span-2' : ''}>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{key}</label>
                        <textarea 
                            value={JSON.stringify(value, null, 2)}
                            onChange={(e) => {
                                try {
                                    handleChange(key, JSON.parse(e.target.value));
                                } catch (e) {
                                    // Let them type invalid JSON temporarily, handled on blur
                                }
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                            rows={3}
                        />
                      </div>
                  );
              }

              return (
                <div key={key} className={isFullWidth ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{key}</label>
                  {isClienteRel ? (
                    <select
                      value={value ?? ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="">Selecciona un cliente...</option>
                      {relationalData.clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.fields.Nombre || `Cliente #${c.id}`}</option>
                      ))}
                    </select>
                  ) : isProveedorRel ? (
                    <select
                      value={value ?? ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="">Selecciona un proveedor...</option>
                      {relationalData.proveedores.map(p => (
                        <option key={p.id} value={p.id}>{p.fields.Nombre || `Proveedor #${p.id}`}</option>
                      ))}
                    </select>
                  ) : options ? (
                    <select
                      value={value ?? ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="" disabled>Seleccionar...</option>
                      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : isBool ? (
                    <select
                      value={value ? 'true' : 'false'}
                      onChange={(e) => handleChange(key, e.target.value === 'true')}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  ) : (
                    <input
                      type={isNumber ? 'number' : (key === 'Fecha' ? 'date' : 'text')}
                      value={value ?? ''}
                      onChange={(e) => handleChange(key, isNumber ? Number(e.target.value) : e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required={!['RUT', 'Giro', 'Dirección', 'Ciudad', 'Nombre de Contacto', 'Email de Contacto', 'Teléfono', 'Email', 'Número de OC', 'Nombre de Solicitante', 'Email de Solicitante', 'Cliente', 'Proveedor'].includes(key)}
                    />
                  )}
                </div>
              );
            })}
          </form>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            form="edit-form"
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
