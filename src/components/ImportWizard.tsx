import React, { useState } from 'react';
import { XCircle, CheckCircle2, AlertCircle, RefreshCw, Clipboard, Trash2, FileText } from 'lucide-react';
import { createRecords } from '../api';

interface ImportItem {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
  tipo: '↗️ Ingreso' | '↘️ Egreso';
  categoria: string;
  estado?: string;
  seleccionado: boolean;
  imported?: boolean;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
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
];

export default function ImportWizard({ onClose, onSuccess }: Props) {
  // Estado para pegar datos personalizados del usuario
  const [pastedText, setPastedText] = useState('');
  const [pastedItems, setPastedItems] = useState<ImportItem[]>([]);
  const [pasteType, setPasteType] = useState<'↗️ Ingreso' | '↘️ Egreso'>('↘️ Egreso');
  const [pasteCategory, setPasteCategory] = useState('Compra de Inventario');

  const [importing, setImporting] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Procesador de pegado de Google Sheets (TSV / Tablas)
  const handleProcessPastedText = () => {
    if (!pastedText.trim()) return;
    
    const rows = pastedText.split('\n');
    const parsed: ImportItem[] = [];
    
    rows.forEach((row, idx) => {
      if (!row.trim()) return;
      const cols = row.split('\t');
      
      // Heuristic parsing:
      // Column 0: Fecha (por ejemplo 15-05-2026, 16-jul)
      // Column 1: Concepto/Descripción
      // Column 2: Monto (ej 205000 o $205.000)
      // Column 3: Estado (opcional, ej Pagado, Pendiente)
      
      const rawFecha = cols[0] ? cols[0].trim() : '';
      const rawDesc = cols[1] ? cols[1].trim() : 'Fila sin descripción';
      const rawMonto = cols[2] ? cols[2].trim() : '0';
      const rawEstado = cols[3] ? cols[3].trim() : 'Pagado';

      if (rawFecha.toLowerCase().includes('fecha')) return; // Cabecera de tabla

      // Formatear Fecha
      let formattedFecha = new Date().toISOString().split('T')[0];
      try {
        if (rawFecha) {
          const parts = rawFecha.replace(/\//g, '-').split('-');
          if (parts.length === 3) {
            // DD-MM-YYYY o YYYY-MM-DD
            if (parts[0].length === 4) {
              formattedFecha = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            } else {
              formattedFecha = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          } else if (parts.length === 2) {
            // DD-Month (ej: "16-jul")
            const monthsMap: Record<string, string> = {
              'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04', 'may': '05', 'jun': '06',
              'jul': '07', 'ago': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
            };
            const dd = parts[0].padStart(2, '0');
            const mmText = parts[1].toLowerCase().substring(0, 3);
            const mm = monthsMap[mmText] || '01';
            // Inferir año basándose en el mes
            const year = parseInt(mm) >= 7 ? '2025' : '2026';
            formattedFecha = `${year}-${mm}-${dd}`;
          }
        }
      } catch (err) {
        console.error("Error parseando fecha", err);
      }

      // Parser de Montos
      const cleanMonto = parseInt(rawMonto.replace(/[$\s.,]/g, ''), 10) || 0;

      parsed.push({
        id: `pasted-${idx}-${Date.now()}`,
        fecha: formattedFecha,
        descripcion: rawDesc,
        monto: cleanMonto,
        tipo: pasteType,
        categoria: pasteCategory,
        estado: rawEstado,
        seleccionado: true
      });
    });

    if (parsed.length > 0) {
      setPastedItems(parsed);
      setErrorMsg(null);
    } else {
      setErrorMsg("No se detectó ningún dato válido para estructurar. Asegúrate de copiar las columnas desde tu Google Sheets (Fecha, Concepto, Monto, Estado).");
    }
  };

  const handleImportSelected = async () => {
    const listToImport = pastedItems.filter(i => i.seleccionado && !i.imported);

    if (listToImport.length === 0) {
      setErrorMsg("Por favor, selecciona al menos una fila que no haya sido importada aún.");
      return;
    }

    setImporting(true);
    setErrorMsg(null);
    let success = 0;

    try {
      // Formatear payload compatible con la base de datos PostgreSQL
      const payloadRecords = listToImport.map(item => ({
        'Descripción': item.descripcion,
        'Tipo': item.tipo === '↗️ Ingreso' ? 'Ingreso' : 'Gasto',
        'Categoría': item.categoria,
        'Monto': Number(item.monto),
        'Fecha': item.fecha,
        'Método de Pago': 'Transferencia'
      }));

      await createRecords('Finanzas', payloadRecords);
      success = listToImport.length;

      // Marcar como importados localmente para evitar re-envíos
      setPastedItems(prev => prev.map(i => {
        if (listToImport.some(l => l.id === i.id)) {
          return { ...i, imported: true, seleccionado: false };
        }
        return i;
      }));

      setSuccessCount(prev => prev + success);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error al realizar la importación masiva en la base de datos.");
    } finally {
      setImporting(false);
    }
  };

  const selectedCount = pastedItems.filter(i => i.seleccionado && !i.imported).length;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Encabezado */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clipboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Importador de Google Sheets</h2>
              <p className="text-xs text-slate-500">Agrega tu historial financiero para iniciar tu base de datos de manera organizada</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Alertas */}
        {errorMsg && (
          <div className="px-6 py-3 bg-red-50 text-red-700 text-sm border-b border-red-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}
        {successCount > 0 && (
          <div className="px-6 py-3 bg-emerald-50 text-emerald-800 text-sm border-b border-emerald-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>¡Se importaron exitosamente <b>{successCount}</b> registros! Ya puedes visualizarlos en tu panel financiero.</span>
          </div>
        )}

        {/* Cuerpo Principal */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 min-h-0 bg-white">
          <div className="flex-1 flex gap-6 min-h-0">
            
            {/* Formulario de Procesado */}
            <div className="w-1/3 flex flex-col gap-4">
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col gap-2.5">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5"><FileText className="w-4 h-4 text-blue-500" /> Instrucciones de Copiado</h4>
                <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-snug">
                  <li>Selecciona y copia las columnas en tu Google Sheets en este orden exacto: <b>Fecha, Concepto, Monto</b>.</li>
                  <li>Pega el texto copiado en el cuadro de abajo.</li>
                  <li>Selecciona el tipo de movimiento y la categoría por defecto.</li>
                  <li>Haz clic en <b>Procesar y Estructurar</b> para previsualizar antes de importar.</li>
                </ol>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tipo de Movimiento</label>
                  <select value={pasteType} onChange={e => setPasteType(e.target.value as any)} className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:border-blue-500 focus:outline-none bg-slate-50">
                    <option value="↘️ Egreso">↙️ Egreso (Gasto)</option>
                    <option value="↗️ Ingreso">↗️ Ingreso (Venta)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Categoría por Defecto</label>
                  <select value={pasteCategory} onChange={e => setPasteCategory(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:border-blue-500 focus:outline-none bg-slate-50">
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pega tus filas aquí:</label>
                <textarea
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  placeholder="16-jul	Compras iniciales y gastos operacionales	205000&#10;20-ago	Gastos empaques	52000..."
                  className="flex-1 w-full border border-slate-200 rounded-xl p-3 text-xs font-mono focus:border-blue-500 focus:outline-none resize-none bg-slate-50"
                />
              </div>

              <button
                onClick={handleProcessPastedText}
                disabled={!pastedText.trim()}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Procesar y Estructurar
              </button>
            </div>

            {/* Lista previsualizada paste */}
            <div className="flex-1 flex flex-col border border-slate-200 rounded-2xl overflow-hidden min-h-0 shadow-sm">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Previsualización estructurada para el sistema:</span>
                <span className="text-[11px] font-bold text-slate-500">{pastedItems.filter(i => !i.imported).length} filas detectadas</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 w-8 text-center">S</th>
                      <th className="py-2.5 px-3 w-28">Fecha</th>
                      <th className="py-2.5 px-3">Descripción</th>
                      <th className="py-2.5 px-3 w-32">Categoría</th>
                      <th className="py-2.5 px-3 w-28 text-right">Monto</th>
                      <th className="py-2.5 px-3 w-16 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pastedItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-20 text-center text-slate-400">
                          Pega tus filas desde Google Sheets en el área izquierda y haz clic en "Procesar" para ver los resultados aquí de forma organizada.
                        </td>
                      </tr>
                    ) : (
                      pastedItems.map(item => (
                        <tr key={item.id} className={`hover:bg-slate-50/50 ${item.imported ? 'opacity-40 bg-slate-50' : ''}`}>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              disabled={item.imported}
                              checked={item.seleccionado}
                              onChange={() => {
                                setPastedItems(prev => prev.map(p => p.id === item.id ? { ...p, seleccionado: !p.seleccionado } : p));
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="date"
                              disabled={item.imported}
                              value={item.fecha}
                              onChange={e => {
                                setPastedItems(prev => prev.map(p => p.id === item.id ? { ...p, fecha: e.target.value } : p));
                              }}
                              className="w-full text-xs border border-slate-100 rounded px-1 py-0.5"
                            />
                          </td>
                          <td className="py-2.5 px-3 font-medium">
                            <input
                              type="text"
                              disabled={item.imported}
                              value={item.descripcion}
                              onChange={e => {
                                setPastedItems(prev => prev.map(p => p.id === item.id ? { ...p, descripcion: e.target.value } : p));
                              }}
                              className="w-full text-xs border border-slate-100 rounded px-1 py-0.5"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <select
                              disabled={item.imported}
                              value={item.categoria}
                              onChange={e => {
                                setPastedItems(prev => prev.map(p => p.id === item.id ? { ...p, categoria: e.target.value } : p));
                              }}
                              className="w-full text-[10px] border-slate-100 rounded px-1 py-0.5 bg-transparent"
                            >
                              {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-0.5 font-bold text-slate-800">
                              <span>$</span>
                              <input
                                type="number"
                                disabled={item.imported}
                                value={item.monto}
                                onChange={e => {
                                  setPastedItems(prev => prev.map(p => p.id === item.id ? { ...p, monto: parseInt(e.target.value, 10) || 0 } : p));
                                }}
                                className="w-20 text-right font-bold border-slate-100 rounded px-1 py-0.5"
                              />
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {item.imported ? (
                              <span className="text-emerald-600 font-bold text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded-full">Guardado</span>
                            ) : (
                              <button
                                onClick={() => setPastedItems(prev => prev.filter(p => p.id !== item.id))}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

        {/* Acciones de Guardado */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            <span>Puedes procesar y editar cuantas veces desees antes de guardar permanentemente</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleImportSelected}
              disabled={importing || selectedCount === 0}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 shadow"
            >
              {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              {importing ? 'Importando registros...' : `Importar ${selectedCount} Registros`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
