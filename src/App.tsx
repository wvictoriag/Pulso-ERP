/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, AlertCircle, Loader2, Table2, Search, RefreshCw, 
  Plus, LayoutDashboard, Users, Package, ShoppingCart, 
  Briefcase, FileText, Settings, Key, Calendar, Mail, 
  Phone, Building, MapPin, CheckCircle2, XCircle, Activity, Brain, LogIn, Download, Trash2, Edit, MessageCircle, Menu, X
} from 'lucide-react';
import ClientModal from './components/ClientModal';
import FinanceModal from './components/FinanceModal';
import SaleModal from './components/SaleModal';
import ImportWizard from './components/ImportWizard';
import ProductModal from './components/ProductModal';
import DashboardCharts from './components/DashboardCharts';
import GenericEditModal from './components/GenericEditModal';
import GenericCreateModal from './components/GenericCreateModal';
import { generateReceiptPDF } from './lib/pdfGenerator';
import Sidebar, { getTableIcon } from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TableViewer from './components/TableViewer';
import AuthScreen from './components/AuthScreen';
import ClientCRMModal from './components/ClientCRMModal';
import { auth } from './lib/firebase';
import { User } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [tables, setTables] = useState<string[]>([]);
  const [currentTable, setCurrentTable] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [isAddingTable, setIsAddingTable] = useState(false);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'dashboard'>('dashboard');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [viewingClient, setViewingClient] = useState<any>(null);
  const [stats, setStats] = useState({ ventasHoyTotal: 0, ventasHoyCount: 0, lowStockCount: 0 });

  const fetchStats = async () => {
    try {
      const res = await apiFetch('/api/stats');
      if (res.ok) {
        const json = await res.json();
        setStats(json);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    return auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  const apiFetch = async (url: string, options: any = {}) => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const token = await auth.currentUser.getIdToken();
    
    const headers: Record<string, string> = {
      ...options.headers,
      Authorization: `Bearer ${token}`
    };

    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    return fetch(url, {
      ...options,
      headers
    });
  };

  useEffect(() => {
    if (user) {
      apiFetch('/api/auth/sync', { method: 'POST' }).catch(console.error);
      fetchTables();
      fetchStats();
    }
  }, [user]);

  useEffect(() => {
    if (user && currentTable && tables.length > 0) {
      fetchData(currentTable);
      setSearchTerm('');
    }
  }, [currentTable, user]);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/tables');
      if (!res.ok) throw new Error('No se encontraron tablas o error auth');
      const json = await res.json();
      if (json.tables && json.tables.length > 0) {
        setTables(json.tables);
        setCurrentTable(json.tables[0]);
        setError(null);
      } else {
        throw new Error("No tables found");
      }
    } catch (e: any) {
      const fallback = ['Clientes', 'Proveedores', 'Productos', 'Pedidos', 'Finanzas'];
      setTables(fallback);
      setCurrentTable(fallback[0]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (tableName: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/table/${encodeURIComponent(tableName)}`);
      if (!res.ok) throw new Error('Error al obtener datos');
      const json = await res.json();
      setData(json.data || []);
    } catch (err: any) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar datos localmente (Debe estar antes de los retornos condicionales para respetar las reglas de React Hooks)
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lowerSearch = searchTerm.toLowerCase();
    
    return data.filter(record => {
      if (!record || !record.fields) return false;
      // Buscar en todos los campos del registro
      return Object.values(record.fields).some(val => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(lowerSearch);
      });
    });
  }, [data, searchTerm]);

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTableName.trim() && !tables.includes(newTableName.trim())) {
      setTables([...tables, newTableName.trim()]);
      setCurrentTable(newTableName.trim());
    }
    setNewTableName('');
    setIsAddingTable(false);
  };

  const deleteRecord = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este registro?')) return;
    try {
      const res = await apiFetch(`/api/table/${currentTable}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      fetchData(currentTable);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const exportToCSV = () => {
    if (!filteredData || filteredData.length === 0) return;
    
    // Obtener los headers
    const headers = Object.keys(data[0].fields);
    
    // Crear el contenido CSV
    const csvContent = [
      headers.join(','), // headers row
      ...filteredData.map(row => 
        headers.map(header => {
          let cell = row.fields[header] || '';
          if (typeof cell === 'object') cell = JSON.stringify(cell);
          // Escapar comillas dobles y envolver en comillas si hay comas o saltos de línea
          cell = String(cell).replace(/"/g, '""');
          return `"${cell}"`;
        }).join(',')
      )
    ].join('\n');

    // Descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentTable}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  if (!user) {
    return <AuthScreen />;
  }

  // Extraer un posible "Nombre" o identificador principal del registro
  const getRecordTitle = (record: any) => {
    const fields = record.fields;
    const nameKeys = ['Name', 'Nombre', 'Title', 'Título', 'Cliente', 'Producto', 'ID', 'Id'];
    for (const key of nameKeys) {
      if (fields[key]) return String(fields[key]);
    }
    // Si no hay campos conocidos, retorna el primer campo de tipo string
    const firstStringField = Object.keys(fields).find(k => typeof fields[k] === 'string');
    return firstStringField ? fields[firstStringField] : record.id;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 overflow-hidden">
      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        viewMode={viewMode}
        setViewMode={setViewMode}
        tables={tables}
        currentTable={currentTable}
        setCurrentTable={setCurrentTable}
        isAddingTable={isAddingTable}
        setIsAddingTable={setIsAddingTable}
        newTableName={newTableName}
        setNewTableName={setNewTableName}
        handleAddTable={handleAddTable}
      />

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
        {viewMode === 'dashboard' ? (
          <Dashboard 
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            stats={stats}
            setViewMode={setViewMode}
            setCurrentTable={setCurrentTable}
            apiFetch={apiFetch}
            setIsSaleModalOpen={setIsSaleModalOpen}
            setIsProductModalOpen={setIsProductModalOpen}
            setIsClientModalOpen={setIsClientModalOpen}
            setIsFinanceModalOpen={setIsFinanceModalOpen}
            setIsImportWizardOpen={setIsImportWizardOpen}
            tables={tables}
          />
        ) : (
          <TableViewer
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            currentTable={currentTable}
            loading={loading}
            error={error}
            data={data}
            filteredData={filteredData}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            setIsCreateModalOpen={setIsCreateModalOpen}
            exportToCSV={exportToCSV}
            fetchData={fetchData}
            getRecordTitle={getRecordTitle}
            deleteRecord={deleteRecord}
            setEditingRecord={setEditingRecord}
            generateReceiptPDF={generateReceiptPDF}
            setViewingClient={setViewingClient}
          />
        )}

        {viewingClient && (
          <ClientCRMModal
            client={viewingClient}
            onClose={() => setViewingClient(null)}
          />
        )}

        {isClientModalOpen && (
          <ClientModal 
            onClose={() => setIsClientModalOpen(false)} 
            onSuccess={() => { setIsClientModalOpen(false); if(currentTable === 'Clientes') fetchData('Clientes'); }} 
          />
        )}
        
        {isFinanceModalOpen && (
          <FinanceModal 
            onClose={() => setIsFinanceModalOpen(false)} 
            onSuccess={() => { setIsFinanceModalOpen(false); if(currentTable === 'Finanzas') fetchData('Finanzas'); }} 
          />
        )}
        
        {isSaleModalOpen && (
          <SaleModal 
            onClose={() => setIsSaleModalOpen(false)} 
            onSuccess={() => { setIsSaleModalOpen(false); if(currentTable === 'Pedidos' || currentTable === 'Líneas de Venta') fetchData(currentTable); }} 
          />
        )}

        {isImportWizardOpen && (
          <ImportWizard 
            onClose={() => setIsImportWizardOpen(false)} 
            onSuccess={() => { if(currentTable === 'Finanzas') fetchData('Finanzas'); }} 
          />
        )}
        {isCreateModalOpen && currentTable && (
          <GenericCreateModal
            tableName={currentTable}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={() => { setIsCreateModalOpen(false); fetchData(currentTable); fetchStats(); }}
            apiFetch={apiFetch}
          />
        )}
        {editingRecord && (
          <GenericEditModal
            tableName={currentTable}
            record={editingRecord}
            onClose={() => setEditingRecord(null)}
            onSuccess={() => { setEditingRecord(null); fetchData(currentTable); fetchStats(); }}
            apiFetch={apiFetch}
          />
        )}
        {isProductModalOpen && (
          <ProductModal 
            onClose={() => setIsProductModalOpen(false)} 
            onSuccess={() => { if(currentTable === 'Productos' || currentTable === 'Inventario') fetchTables(); fetchStats(); }} 
          />
        )}

      </main>

      <style>{`
        /* Minimalist Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(203, 213, 225, 0.4);
          border-radius: 20px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(148, 163, 184, 0.6);
        }
      `}</style>
    </div>
  );
}
