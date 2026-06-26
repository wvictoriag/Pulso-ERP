import React, { useState, useMemo } from 'react';
import { Menu, Plus, Search, Download, RefreshCw, Database, LayoutDashboard, Loader2, AlertCircle, Settings, Table2, FileText, CheckCircle2, XCircle, Calendar, MessageCircle, Edit, Trash2, Columns, List, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { getTableIcon } from './Sidebar';

interface TableViewerProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (val: boolean) => void;
  currentTable: string;
  loading: boolean;
  error: string | null;
  data: any[];
  filteredData: any[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  setIsCreateModalOpen: (val: boolean) => void;
  exportToCSV: () => void;
  fetchData: (table: string) => void;
  getRecordTitle: (record: any) => string;
  deleteRecord: (id: number) => void;
  setEditingRecord: (record: any) => void;
  generateReceiptPDF: (record: any) => void;
  setViewingClient?: (record: any) => void;
}

const PEDIDOS_STATES = ['💬 Cotización', '📦 Preparación', '🚚 En Camino', '✅ Entregado', '❌ Cancelado'];

export default function TableViewer({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  currentTable,
  loading,
  error,
  data,
  filteredData,
  searchTerm,
  setSearchTerm,
  setIsCreateModalOpen,
  exportToCSV,
  fetchData,
  getRecordTitle,
  deleteRecord,
  setEditingRecord,
  generateReceiptPDF,
  setViewingClient
}: TableViewerProps) {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // sort data
  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a.fields[sortConfig.key];
        let bVal = b.fields[sortConfig.key];
        if (aVal === undefined || aVal === null) aVal = '';
        if (bVal === undefined || bVal === null) bVal = '';

        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderKanban = () => {
    return (
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-start h-full">
        {PEDIDOS_STATES.map(status => {
          const columnItems = filteredData.filter(d => d.fields['Estado del Pedido'] === status);
          return (
            <div key={status} className="bg-slate-100/50 rounded-xl min-w-[280px] w-[280px] flex flex-col h-full border border-slate-200 shrink-0">
              <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-100 rounded-t-xl">
                <h3 className="font-semibold text-slate-700 text-[13px] flex items-center gap-2">
                  {status}
                  <span className="bg-slate-200/70 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{columnItems.length}</span>
                </h3>
              </div>
              <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
                {columnItems.map(record => (
                  <div key={record.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-[10px] text-slate-400 font-medium">#{record.id}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingRecord(record)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="font-medium text-slate-800 text-[13px] mb-1 line-clamp-2">
                      {record.fields['Cliente'] ? `Cliente: ${record.fields['Cliente']}` : 'Sin Cliente'}
                    </div>
                    <div className="text-slate-500 text-[11px] mb-3 font-mono">
                      {record.fields['Número de OC'] || 'Sin OC'}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="font-semibold text-slate-700 text-sm">${Number(record.fields['Total'] || 0).toLocaleString()}</span>
                      <span className="text-[10px] px-2 py-1 bg-blue-50/50 text-blue-600 rounded font-medium border border-blue-100/50">{record.fields['Estado de Pago']}</span>
                    </div>
                  </div>
                ))}
                {columnItems.length === 0 && (
                  <div className="text-center p-4 text-slate-400 text-[11px] border-2 border-dashed border-slate-200 rounded-lg">
                    Sin pedidos
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Cabecera superior ERP */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 text-slate-500 hover:text-blue-600 bg-transparent rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          {currentTable && (
            <>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                {getTableIcon(currentTable, "w-5 h-5")}
              </div>
              <div>
                <h1 className="text-[17px] font-semibold text-slate-800 leading-none mb-1">
                  {currentTable}
                </h1>
                <div className="text-[11px] font-medium text-slate-500 capitalize flex items-center gap-2">
                  Módulo de Gestión
                  {loading && <span className="text-blue-500 animate-pulse">Sincronizando...</span>}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {currentTable === 'Pedidos' && (
            <div className="hidden md:flex bg-slate-100 p-1 rounded-lg mr-2">
              <button 
                onClick={() => setViewMode('table')} 
                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <List className="w-4 h-4" /> Tabla
              </button>
              <button 
                onClick={() => setViewMode('kanban')} 
                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${viewMode === 'kanban' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Columns className="w-4 h-4" /> Kanban
              </button>
            </div>
          )}
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!currentTable}
            className="p-2 text-white bg-blue-600 hover:bg-blue-700 border border-blue-600 rounded-md transition-all flex items-center gap-2 shadow-sm"
            title={`Nuevo registro en ${currentTable}`}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline text-xs font-semibold">Nuevo</span>
          </button>
          <div className="relative group">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={data.length === 0 && !loading && !error}
              className="pl-8 md:pl-9 pr-2 md:pr-4 py-1.5 bg-slate-100/70 border-transparent focus:bg-white border focus:border-blue-300 rounded-md text-[13px] w-24 sm:w-32 md:w-64 transition-all outline-none text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <button 
            onClick={exportToCSV}
            disabled={filteredData.length === 0}
            className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 rounded-md transition-all disabled:opacity-50 flex items-center gap-2"
            title="Exportar a CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline text-xs font-semibold">CSV</span>
          </button>
          <button 
            onClick={() => fetchData(currentTable)}
            disabled={loading || !currentTable}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-md transition-all disabled:opacity-50 flex items-center gap-2"
            title="Sincronizar Datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline text-xs font-semibold">Sincronizar</span>
          </button>
        </div>
      </header>

      {/* Zona de contenido principal */}
      <div className="flex-1 overflow-auto bg-slate-50 p-4 md:p-6 relative">
        <div className="max-w-[1600px] mx-auto flex flex-col h-full gap-5">
          
          {/* Tarjetas de Estadísticas tipo ERP (Solo se muestran si hay datos) */}
          {!error && !loading && data.length > 0 && viewMode === 'table' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Registros</p>
                  <h3 className="text-2xl font-bold text-slate-800">{data.length}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Database className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Registros Filtrados</p>
                  <h3 className="text-2xl font-bold text-slate-800">{filteredData.length}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Search className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Columnas</p>
                  <h3 className="text-2xl font-bold text-slate-800">{Object.keys(data[0]?.fields || {}).length}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
              </div>
            </div>
          )}

          {/* Contenedor de la Tabla/Vista de Datos */}
          {loading ? (
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center p-12 text-slate-400 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="font-medium text-sm">Cargando base de datos segura...</p>
            </div>
          ) : error ? (
            <div className="mx-auto max-w-2xl w-full mt-8 p-6 bg-red-50/50 border border-red-100 rounded-xl text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 tracking-tighter shadow-sm">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-[15px] font-bold text-red-900 mb-2">
                Error de Conexión
              </h3>
              <div className="text-[13px] text-red-700 leading-relaxed mb-6 space-y-2 max-w-md mx-auto">
                <p>{error}</p>
              </div>
              <div className="bg-white rounded-lg p-5 text-left border border-red-100 shadow-sm inline-block w-full">
                <h4 className="text-[11px] font-bold uppercase text-slate-500 mb-3 tracking-wider flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5" /> Pasos de Resolución
                </h4>
                <ul className="text-[13px] text-slate-700 space-y-2.5">
                  <li className="flex gap-2"><span className="text-red-400 font-bold">•</span> Verifica en los Ajustes (⚙️) que <b>AIRTABLE_API_KEY</b> empiece con "pat...".</li>
                  <li className="flex gap-2"><span className="text-red-400 font-bold">•</span> Verifica que el <b>AIRTABLE_BASE_ID</b> empiece con "app...".</li>
                  <li className="flex gap-2"><span className="text-red-400 font-bold">•</span> Asegúrate de haber asignado los permisos <b>data.records:read</b> y <b>schema.bases:read</b> a tu token.</li>
                </ul>
              </div>
            </div>
          ) : viewMode === 'kanban' && currentTable === 'Pedidos' ? (
            renderKanban()
          ) : (
            <div className="flex-1 bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-200 flex flex-col min-h-[400px]">
              {data.length === 0 ? (
                <div className="flex-1 p-16 text-center flex flex-col items-center justify-center">
                  <Table2 className="w-12 h-12 text-slate-200 mb-4" />
                  <h3 className="text-[15px] font-semibold text-slate-800 mb-1">Módulo Vacío</h3>
                  <p className="text-slate-500 text-[13px] max-w-sm">
                    La conexión fue exitosa, pero aún no hay registros dados de alta en este módulo.
                  </p>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="flex-1 p-16 text-center flex flex-col items-center justify-center">
                  <Search className="w-12 h-12 text-slate-200 mb-4" />
                  <h3 className="text-slate-800 font-semibold text-[15px]">Sin resultados</h3>
                  <p className="text-slate-500 text-[13px] mt-1">
                    Ningún registro coincide con el término "{searchTerm}"
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left text-[13px] whitespace-nowrap min-w-max border-collapse">
                    <thead className="bg-[#f9fafb] border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                      <tr>
                        {Object.keys(data[0].fields).map(column => (
                          <th 
                            key={column} 
                            onClick={() => requestSort(column)}
                            className="px-5 py-3 font-semibold text-slate-600 text-[11px] tracking-wider uppercase border-r border-slate-100 last:border-r-0 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                          >
                            <div className="flex items-center justify-between gap-1">
                              {column}
                              <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronUp className={`w-3 h-3 -mb-1 ${sortConfig?.key === column && sortConfig.direction === 'asc' ? 'text-blue-600 opacity-100' : 'text-slate-400'}`} />
                                <ChevronDown className={`w-3 h-3 ${sortConfig?.key === column && sortConfig.direction === 'desc' ? 'text-blue-600 opacity-100' : 'text-slate-400'}`} />
                              </div>
                            </div>
                          </th>
                        ))}
                        <th className="px-5 py-3 font-semibold text-slate-400 text-[11px] tracking-wider uppercase bg-white/50 border-r border-slate-100">
                          Sys_ID
                        </th>
                        <th className="px-5 py-3 font-semibold text-slate-600 text-[11px] tracking-wider uppercase bg-white/50 text-right">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedData.map((record) => (
                        <tr key={record.id} className="hover:bg-blue-50/40 transition-colors group">
                          {Object.keys(data[0].fields).map(column => {
                            const cellValue = record.fields[column];
                            let displayValue: React.ReactNode = <span className="text-slate-400">-</span>;
                            
                            // Formateadores de tipo de datos ERP
                            if (cellValue !== undefined && cellValue !== null) {
                              if (Array.isArray(cellValue)) {
                                // Attachments o Links
                                if (cellValue.length > 0 && typeof cellValue[0] === 'object' && cellValue[0].url) {
                                  displayValue = (
                                    <div className="flex gap-2">
                                      {(cellValue as any[]).map((file, i) => (
                                        <a key={i} href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-slate-100 text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md text-[11px] font-medium border border-slate-200 transition-colors">
                                          <FileText className="w-3 h-3" />
                                          <span className="max-w-[100px] truncate">{file.filename || 'Archivo'}</span>
                                        </a>
                                      ))}
                                    </div>
                                  );
                                } else {
                                  // Multiple Selects or Linked records badges
                                  displayValue = (
                                    <div className="flex gap-1.5 flex-wrap">
                                      {cellValue.map((item, i) => (
                                        <span key={i} className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-[11px] font-medium shadow-sm">
                                          {String(item)}
                                        </span>
                                      ))}
                                    </div>
                                  );
                                }
                              } else if (typeof cellValue === 'object') {
                                // Objetos genéricos por seguridad
                                displayValue = <span className="font-mono text-slate-500 text-[11px]">{JSON.stringify(cellValue)}</span>;
                              } else if (typeof cellValue === 'boolean') {
                                // Booleans check/cross
                                displayValue = cellValue ? (
                                  <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                                    <CheckCircle2 className="w-4 h-4" /> <span>Sí</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-slate-400">
                                    <XCircle className="w-4 h-4" /> <span>No</span>
                                  </div>
                                );
                              } else if (typeof cellValue === 'number') {
                                // Números limpios
                                displayValue = <span className="font-mono font-medium text-slate-700">{cellValue}</span>;
                              } else if (String(cellValue).match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
                                // Fechas ISO
                                displayValue = (
                                  <div className="flex items-center gap-1.5 text-slate-600">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    {new Date(cellValue).toLocaleDateString()}
                                  </div>
                                );
                              } else if (String(cellValue).match(/^\d{4}-\d{2}-\d{2}$/)) {
                                 // Fechas cortas
                                 displayValue = (
                                  <div className="flex items-center gap-1.5 text-slate-600">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    {cellValue}
                                  </div>
                                );
                              } else {
                                // Strings normales
                                displayValue = <span className="text-slate-700 font-medium">{String(cellValue)}</span>;
                              }
                            }

                            return (
                              <td key={column} className="px-5 py-3 max-w-[300px] truncate border-r border-slate-50 last:border-r-0">
                                {displayValue}
                              </td>
                            );
                          })}
                          
                          <td className="px-4 py-3 bg-slate-50/50 text-slate-300 font-mono text-[10px] group-hover:text-blue-300 transition-colors w-[120px] border-r border-slate-50">
                            {record.id}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {(currentTable === 'Pedidos' || currentTable === 'Ventas' || currentTable === 'Líneas de Venta') && (
                                <button onClick={() => generateReceiptPDF(record.fields || record)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Descargar Recibo">
                                  <FileText className="w-4 h-4" />
                                </button>
                              )}
                              {((currentTable === 'Clientes' || currentTable === 'Proveedores') && record.fields['Teléfono']) && (
                                <a href={`https://wa.me/${String(record.fields['Teléfono']).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Enviar WhatsApp">
                                  <MessageCircle className="w-4 h-4" />
                                </a>
                              )}
                              {((currentTable === 'Pedidos' || currentTable === 'Ventas')) && (
                                <button 
                                  onClick={() => {
                                    const phone = window.prompt('Ingrese el número de WhatsApp (ej. 56912345678):');
                                    if (phone) {
                                      const total = record.fields['Total'] || 0;
                                      const body = `Hola! Tu recibo por $${Number(total).toLocaleString()} está confirmado. Gracias por tu compra!`;
                                      window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(body)}`, '_blank');
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Notificar por WhatsApp">
                                  <MessageCircle className="w-4 h-4" />
                                </button>
                              )}
                              {currentTable === 'Clientes' && setViewingClient && (
                                <button onClick={() => setViewingClient(record)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Ver Historial CRM">
                                  <Users className="w-4 h-4" />
                                </button>
                              )}
                              <button onClick={() => setEditingRecord(record)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Editar Registro">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteRecord(record.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Eliminar Registro">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-white sticky bottom-0">
                    <span className="text-xs text-slate-500">
                      Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, sortedData.length)} de {sortedData.length} registros
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-xs font-medium text-slate-700 px-2">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

