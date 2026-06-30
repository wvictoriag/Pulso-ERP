import React, { useState } from 'react';
import { Menu, Brain, ShoppingCart, AlertCircle, Activity, Package, Users, FileText, Database, Download } from 'lucide-react';
import DashboardCharts from './DashboardCharts';
import { getTableIcon } from './Sidebar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DashboardProps {
  setIsMobileMenuOpen: (open: boolean) => void;
  stats: any;
  setViewMode: (mode: 'table' | 'dashboard') => void;
  setCurrentTable: (table: string) => void;
  apiFetch: any;
  setIsSaleModalOpen: (open: boolean) => void;
  setIsProductModalOpen: (open: boolean) => void;
  setIsClientModalOpen: (open: boolean) => void;
  setIsFinanceModalOpen: (open: boolean) => void;
  setIsImportWizardOpen: (open: boolean) => void;
  tables: string[];
}

export default function Dashboard({
  setIsMobileMenuOpen,
  stats,
  setViewMode,
  setCurrentTable,
  apiFetch,
  setIsSaleModalOpen,
  setIsProductModalOpen,
  setIsClientModalOpen,
  setIsFinanceModalOpen,
  setIsImportWizardOpen,
  tables
}: DashboardProps) {
  const [exporting, setExporting] = useState(false);

  const exportEstadoResultados = async () => {
    setExporting(true);
    try {
      const res = await apiFetch('/api/charts');
      const data = await res.json();
      
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('Estado de Resultados', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 30);

      const tableData = data.monthlyCashflow.map((m: any) => [
        m.name,
        `$${m.Ingresos.toLocaleString()}`,
        `$${m.Gastos.toLocaleString()}`,
        `$${(m.Ingresos - m.Gastos).toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['Mes', 'Ingresos', 'Gastos', 'Utilidad']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
      });

      doc.save(`Estado_Resultados_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Error al exportar reporte.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:text-blue-600 bg-white rounded-lg border border-slate-200"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="w-16 h-16 bg-[#0055A5]/10 rounded-2xl flex items-center justify-center text-[#0055A5] hidden md:flex">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 mb-1">Hola, Equipo Pulso</h1>
              <p className="text-slate-500 text-sm">Gestiona ventas, inventario y finanzas de productos sensoriales sin fricción.</p>
            </div>
          </div>
          <button 
            onClick={exportEstadoResultados}
            disabled={exporting}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exportando...' : 'Estado de Resultados (PDF)'}
          </button>
        </header>

        {/* KPIs (Dashboard) */}
        <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-slate-500">Ventas (Hoy)</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-800">${stats.ventasHoyTotal.toLocaleString()}</span>
              <span className="text-sm font-medium text-emerald-500">{stats.ventasHoyCount} ventas</span>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                <AlertCircle className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-slate-500">Stock Bajo</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-800">{stats.lowStockCount}</span>
              <span className="text-sm font-medium text-slate-500">productos necesitan reposición</span>
            </div>
            {stats.lowStockCount > 0 && (
                <button onClick={() => { setViewMode('table'); setCurrentTable('Productos'); }} className="mt-4 text-xs font-semibold text-orange-600 hover:text-orange-700 text-left">
                  Ver productos {'->'}
                </button>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-slate-500">Estado del Sistema</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-lg font-bold text-slate-800">Operativo</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Base de datos sincronizada.</p>
          </div>
        </div>

        {/* Módulo de Gráficos Inteligentes */}
        <DashboardCharts apiFetch={apiFetch} />

        {/* Acciones Rápidas */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <button 
              onClick={() => setIsSaleModalOpen(true)}
              className="flex flex-col items-start p-5 bg-white rounded-xl border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group/card"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4 group-hover/card:scale-110 transition-transform">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800">Nueva Venta</h3>
              <p className="text-xs text-slate-500 text-left mt-1">Registra venta y actualiza stock.</p>
            </button>
            <button 
              onClick={() => setIsProductModalOpen(true)}
              className="flex flex-col items-start p-5 bg-white rounded-xl border border-orange-100 shadow-sm hover:shadow-md hover:border-orange-300 transition-all group/card"
            >
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 mb-4 group-hover/card:scale-110 transition-transform">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800">Añadir Producto</h3>
              <p className="text-xs text-slate-500 text-left mt-1">Ingresa inventario al catálogo.</p>
            </button>
            <button 
              onClick={() => setIsClientModalOpen(true)}
              className="flex flex-col items-start p-5 bg-white rounded-xl border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group/card"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 group-hover/card:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800">Nuevo Cliente</h3>
              <p className="text-xs text-slate-500 text-left mt-1">Directorio de colegios y familias.</p>
            </button>
            <button 
              onClick={() => setIsFinanceModalOpen(true)}
              className="flex flex-col items-start p-5 bg-white rounded-xl border border-purple-100 shadow-sm hover:shadow-md hover:border-purple-300 transition-all group/card"
            >
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mb-4 group-hover/card:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800">Registro Finanzas</h3>
              <p className="text-xs text-slate-500 text-left mt-1">Anota ingresos o compras de proveedores.</p>
            </button>
            <button 
              onClick={() => setIsImportWizardOpen(true)}
              className="flex flex-col items-start p-5 bg-[#E6F4EA] rounded-xl border border-emerald-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all group/card text-left"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4 group-hover/card:scale-110 transition-transform">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-emerald-900">Importador</h3>
              <p className="text-xs text-emerald-700 text-left mt-1">Carga desde Google Sheets.</p>
            </button>
          </div>
        </div>

        {/* Resumen de Módulos (Solo accesos directos al ERP central) */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Base de Datos (Tablas del ERP)</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {tables.map(table => (
              <button
                key={table}
                onClick={() => {
                  setCurrentTable(table);
                  setViewMode('table');
                }}
                className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="text-slate-400">
                  {getTableIcon(table, "w-4 h-4")}
                </div>
                <span className="text-[13px] font-medium text-slate-700">{table}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
