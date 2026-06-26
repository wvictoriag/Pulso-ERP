import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { auth } from '../lib/firebase';
import { TrendingUp, PieChart as PieChartIcon, Package, Users } from 'lucide-react';

export default function DashboardCharts({ apiFetch }: { apiFetch: (url: string) => Promise<any> }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const res = await apiFetch('/api/charts');
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (auth.currentUser) fetchCharts();
  }, [apiFetch]);

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400">Cargando gráficos...</div>;
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Flujo de Caja (Ingresos vs Gastos)</h3>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthlyCashflow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
              <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
            <Package className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Top 5 Productos Más Vendidos</h3>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.topProducts} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`${value} unidades`, 'Ventas']}
              />
              <Bar dataKey="quantity" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Ranking de Mejores Clientes</h3>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.topClients} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
              <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total Comprado']}
              />
              <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
