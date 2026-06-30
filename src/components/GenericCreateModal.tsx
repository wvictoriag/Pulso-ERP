import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, AlertCircle, Loader2, Upload, Sparkles } from 'lucide-react';

interface Props {
  tableName: string;
  onClose: () => void;
  onSuccess: () => void;
  apiFetch: (url: string, options?: any) => Promise<any>;
}

// Configuración básica para generar campos vacíos según la tabla
const getEmptyFields = (table: string) => {
  switch (table) {
    case 'Productos': return { Nombre: '', Descripción: '', Categoría: '', Precio: 0, Costo: 0, Stock: 0 };
    case 'Clientes': return { Nombre: '', RUT: '', Giro: '', Dirección: '', Ciudad: '', 'Nombre de Contacto': '', 'Email de Contacto': '', 'Tipo de Cliente': 'Colegio', 'Condición de Pago': '30 días', Teléfono: '', Email: '' };
    case 'Proveedores': return { Nombre: '', RUT: '', Giro: '', Dirección: '', Ciudad: '', 'Condición de Pago': '30 días', Moneda: 'CLP', Teléfono: '', Email: '' };
    case 'Finanzas': return { Descripción: '', Tipo: 'Gasto', Categoría: '', 'Método de Pago': 'Transferencia', Monto: 0, Fecha: new Date().toISOString().split('T')[0], Proveedor: '' };
    case 'Pedidos': return { 'Número de OC': '', Cliente: '', 'Nombre de Solicitante': '', 'Email de Solicitante': '', 'Estado del Pedido': '💬 Cotización', 'Canal de Venta': 'Directo', 'Estado de Pago': '⏳ Pendiente', Fecha: new Date().toISOString().split('T')[0], Total: 0 };
    default: return { Nombre: '' };
  }
};

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

export default function GenericCreateModal({ tableName, onClose, onSuccess, apiFetch }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>(getEmptyFields(tableName));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = () => reject(new Error('Error al leer el archivo localmente'));
        reader.readAsDataURL(file);
      });

      const res = await apiFetch('/api/parse-document', {
        method: 'POST',
        body: JSON.stringify({
          fileBase64: base64Data,
          mimeType: file.type,
          tableName
        })
      });

      const contentType = res.headers.get('content-type');
      if (!res.ok) {
        let errorMsg = 'Error al procesar el documento';
        if (contentType && contentType.includes('application/json')) {
          const errBody = await res.json().catch(() => ({}));
          errorMsg = errBody.error || errorMsg;
        }
        throw new Error(errorMsg);
      }
      
      if (contentType && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.data) {
           setFormData(prev => ({ ...prev, ...json.data }));
        }
      } else {
        throw new Error('Respuesta del servidor no es JSON');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al procesar el documento');
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Usamos el endpoint de batch insert
      const res = await apiFetch(`/api/table/${tableName}`, {
        method: 'POST',
        body: JSON.stringify({ records: [{ fields: formData }] }),
      });
      if (!res.ok) throw new Error('Error al crear el registro');
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
          <h2 className="text-lg font-semibold text-slate-800">Nuevo registro en {tableName}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="mb-6 flex items-center justify-between bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <div>
              <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Auto-completar con IA
              </h3>
              <p className="text-xs text-blue-700 mt-1">Sube un PDF o imagen (ej: Orden de Compra) para extraer datos automáticamente.</p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="application/pdf,image/*" 
              onChange={handleFileUpload} 
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsing}
              className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isParsing ? 'Analizando...' : 'Subir Documento'}
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form id="create-form" onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(formData).map((key) => {
              const value = formData[key];
              const isNumber = typeof value === 'number';
              const options = getOptionsForField(tableName, key);
              const isFullWidth = ['Descripción', 'Dirección'].includes(key);
              
              const isClienteRel = key === 'Cliente' && (tableName === 'Pedidos' || tableName === 'Ventas');
              const isProveedorRel = key === 'Proveedor' && tableName === 'Finanzas';

              return (
                <div key={key} className={isFullWidth ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{key}</label>
                  {isClienteRel ? (
                    <select
                      value={value}
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
                      value={value}
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
                      value={value}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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
            form="create-form"
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Crear Registro
          </button>
        </div>
      </div>
    </div>
  );
}
