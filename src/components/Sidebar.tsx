import React from 'react';
import { Activity, X, LayoutDashboard, Plus, Database, Users, Package, ShoppingCart, Briefcase, FileText, Table2 } from 'lucide-react';

export const getTableIcon = (tableName: string, className = "w-4 h-4") => {
  const lower = tableName.toLowerCase();
  if (lower.includes('client') || lower.includes('user') || lower.includes('empleado')) return <Users className={className} />;
  if (lower.includes('inventari') || lower.includes('product') || lower.includes('item')) return <Package className={className} />;
  if (lower.includes('venta') || lower.includes('pedid') || lower.includes('order')) return <ShoppingCart className={className} />;
  if (lower.includes('proyect') || lower.includes('tare')) return <Briefcase className={className} />;
  if (lower.includes('factur') || lower.includes('recib')) return <FileText className={className} />;
  return <Table2 className={className} />;
};

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (val: boolean) => void;
  viewMode: 'table' | 'dashboard';
  setViewMode: (val: 'table' | 'dashboard') => void;
  tables: string[];
  currentTable: string;
  setCurrentTable: (val: string) => void;
  isAddingTable: boolean;
  setIsAddingTable: (val: boolean) => void;
  newTableName: string;
  setNewTableName: (val: string) => void;
  handleAddTable: (e: React.FormEvent) => void;
}

export default function Sidebar({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  viewMode,
  setViewMode,
  tables,
  currentTable,
  setCurrentTable,
  isAddingTable,
  setIsAddingTable,
  newTableName,
  setNewTableName,
  handleAddTable
}: SidebarProps) {
  return (
    <>
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-30 flex-shrink-0 border-r border-slate-800 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between gap-3 bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="bg-[#0055A5] rounded-lg p-1.5 shadow-sm">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-50 text-[16px] tracking-wide">Pulso ERP</span>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 py-5 flex flex-col gap-0.5 overflow-y-auto custom-scrollbar px-3">
          
          <button
            onClick={() => { setViewMode('dashboard'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-all duration-200 mb-4 ${
              viewMode === 'dashboard' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${viewMode === 'dashboard' ? 'text-white' : 'opacity-70'}`} />
            <span>Panel de Inicio</span>
          </button>

          <div className="px-3 text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-3 mt-2">
            Módulos de Datos
          </div>

          {tables.map(table => (
            <button
              key={table}
              onClick={() => {
                setCurrentTable(table);
                setViewMode('table');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-200 ${
                currentTable === table && viewMode === 'table'
                  ? 'bg-blue-600/10 text-blue-400 font-semibold' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {getTableIcon(table, `w-4 h-4 ${currentTable === table && viewMode === 'table' ? 'opacity-100 text-blue-500' : 'opacity-70'}`)}
              <span className="truncate">{table}</span>
            </button>
          ))}
          
          <button 
            onClick={() => setIsAddingTable(!isAddingTable)}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-[13px] font-medium text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors mt-2 border border-dashed border-slate-700/50"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir tabla manual</span>
          </button>

          {isAddingTable && (
            <form onSubmit={handleAddTable} className="px-2 mt-2">
              <input
                type="text"
                autoFocus
                placeholder="Nombre de la nueva tabla..."
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className="w-full bg-slate-950 text-xs text-slate-200 px-3 py-2 rounded border border-slate-700 focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
              />
            </form>
          )}
        </nav>

        <div className="p-4 border-t border-white/5 bg-slate-950/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <Database className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-300">Base de Datos SQL</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Activa y Conectada
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
