import React, { useState, useEffect } from 'react';
import { XCircle, User, Package, Clock, FileText } from 'lucide-react';
import { fetchTableRecords } from '../api';

interface Props {
  client: any;
  onClose: () => void;
}

export default function ClientCRMModal({ client, onClose }: Props) {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [client]);

  const loadHistory = async () => {
    try {
      const data = await fetchTableRecords('Pedidos');
      // filter orders for this client
      const clientOrders = data.filter((p: any) => p.fields.Cliente === client.id || (Array.isArray(p.fields.Cliente) && p.fields.Cliente.includes(client.id)));
      setPedidos(clientOrders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = pedidos.reduce((acc, p) => acc + (p.fields.Total || 0), 0);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" /> Ficha CRM de Cliente
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-indigo-900">{client.fields.Nombre || client.fields.Name || 'Sin Nombre'}</h3>
              <p className="text-sm text-indigo-700 mt-1 flex items-center gap-2">
                <FileText className="w-4 h-4" /> RUT: {client.fields.RUT || '-'}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-indigo-700 mb-1">Total Comprado (Histórico)</p>
              <p className="text-2xl font-bold text-indigo-900">${totalSpent.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">Historial de Compras</h3>
            {loading ? (
              <p className="text-sm text-slate-500">Cargando historial...</p>
            ) : pedidos.length === 0 ? (
              <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg text-center border border-slate-100">Este cliente aún no tiene pedidos registrados.</p>
            ) : (
              <div className="space-y-3">
                {pedidos.map(p => (
                  <div key={p.id} className="bg-white border border-slate-200 rounded-lg p-4 flex justify-between items-center hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{p.fields['Estado del Pedido'] || p.fields.Estado}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {p.fields.Fecha || p.fields['Fecha del Pedido']}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">${(p.fields.Total || 0).toLocaleString()}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                        {p.fields['Estado de Pago'] || p.fields.Pago || 'Pendiente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
