import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, ShoppingBag, CreditCard, Activity, CalendarDays,
  Package, AlertCircle, PieChart as PieChartIcon, Zap, Target
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import mockDataRaw from '../../Data/mock_data.json';

// Type definitions based on mock_data
interface Venta {
  fecha: string;
  producto: number;
  cantidad: number;
  nombreCliente: string;
  edadCliente: number;
  precioTotal: number;
}

interface Producto {
  productoId: number;
  nombre: string;
  categoria?: string;
  precio: number;
  costo: number; // added for margin calculation
}

const augmentedProductos: Producto[] = mockDataRaw.tienda.productos.map((p: any) => {
  const hash = p.productoId * 17 % 100;
  const costMultiplier = 0.5 + (hash / 100) * 0.35;
  const costo = Math.round(p.precio * costMultiplier);
  return { ...p, costo, categoria: p.categoria || 'Sin Categoría' };
});

const mockData = {
  tienda: { ...mockDataRaw.tienda, productos: augmentedProductos },
  ventasPorProducto: mockDataRaw.ventasPorProducto as Venta[]
};

type Period = 'today' | 'week' | 'month';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

export function Dashboard() {
  const [period, setPeriod] = useState<Period>('month');
  const [topTenView, setTopTenView] = useState<'units' | 'revenue'>('revenue');

  const { currentMetrics, previousMetrics, maxDateStr } = useMemo(() => {
    const sales = mockData.ventasPorProducto;
    if (!sales.length) return { currentMetrics: null, previousMetrics: null, maxDateStr: '' };

    const dates = sales.map(s => new Date(s.fecha).getTime());
    const maxDate = new Date(Math.max(...dates));
    
    const getPeriodDates = (p: Period, isPrevious: boolean) => {
      const end = new Date(maxDate);
      const start = new Date(maxDate);
      
      let days = 1;
      if (p === 'week') days = 7;
      if (p === 'month') days = 30;

      if (isPrevious) {
        end.setDate(end.getDate() - days);
        start.setDate(start.getDate() - (days * 2) + 1);
      } else {
        start.setDate(start.getDate() - days + 1);
      }
      
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      return { start, end };
    };

    const calculateMetrics = (p: Period, isPrev: boolean) => {
      const { start, end } = getPeriodDates(p, isPrev);
      const filteredSales = sales.filter(s => {
        const d = new Date(s.fecha);
        return d >= start && d <= end;
      });

      const totalVentas = filteredSales.reduce((sum, s) => sum + s.precioTotal, 0);
      const numeroTransacciones = filteredSales.length;
      const ticketPromedio = numeroTransacciones > 0 ? totalVentas / numeroTransacciones : 0;
      
      const clientes = new Set(filteredSales.map(s => s.nombreCliente));
      const clientesUnicos = clientes.size;

      // Product Stats Initialization
      const productoStats: Record<number, { qty: number, total: number }> = {};
      augmentedProductos.forEach(prod => {
        productoStats[prod.productoId] = { qty: 0, total: 0 };
      });
      
      filteredSales.forEach(s => {
        if (productoStats[s.producto]) {
          productoStats[s.producto].qty += s.cantidad;
          productoStats[s.producto].total += s.precioTotal;
        }
      });
      
      // Detailed Product Array
      const allStats = Object.entries(productoStats)
        .map(([id, data]) => {
          const prod = augmentedProductos.find(pr => pr.productoId === Number(id));
          return { 
            id: Number(id), 
            ...data, 
            nombre: prod?.nombre || 'Desconocido', 
            categoria: prod?.categoria || 'Sin Categoría', 
            precio: prod?.precio || 0 
          };
        });

      // Top Product Name
      let topProduct = { id: 0, qty: 0, total: 0 };
      Object.entries(productoStats).forEach(([id, data]) => {
        if (data.total > topProduct.total) topProduct = { id: Number(id), qty: data.qty, total: data.total };
      });
      const topProductName = topProduct.id ? augmentedProductos.find(p => p.productoId === topProduct.id)?.nombre : 'N/A';

      // Advanced Analytics
      const topByUnits = [...allStats].sort((a,b) => b.qty - a.qty).slice(0, 10);
      const topByRevenue = [...allStats].sort((a,b) => b.total - a.total).slice(0, 10);
      
      // Sleeping Products
      const sortedByVol = [...allStats].sort((a,b) => a.qty - b.qty);
      const sleepingProducts = sortedByVol.slice(0, Math.ceil(sortedByVol.length * 0.2));
      
      // Category Sales
      const catSales: Record<string, number> = {};
      filteredSales.forEach(s => {
         const prod = augmentedProductos.find(pr=>pr.productoId === s.producto);
         if (prod) {
           const cat = prod.categoria || 'Sin Categoría';
           catSales[cat] = (catSales[cat] || 0) + s.precioTotal;
         }
      });
      const categoryData = Object.entries(catSales).map(([name, value]) => ({ name, value })).sort((a,b)=>b.value-a.value);
      
      // Rotation Velocity
      const durationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const velocityData = allStats.filter(s => s.qty > 0).map(s => ({
           nombre: s.nombre,
           velocidad: s.qty / durationDays,
           qty: s.qty
      })).sort((a,b) => b.velocidad - a.velocidad).slice(0, 10);
        
      // Margin vs Volume
      const scatterData = allStats.map(s => {
         const prod = augmentedProductos.find(pr=>pr.productoId === s.id);
         const marginPct = prod ? ((prod.precio - prod.costo) / prod.precio) * 100 : 0;
         return {
           nombre: s.nombre,
           volumen: s.qty,
           margen: marginPct,
           revenue: s.total,
           z: s.total 
         };
      }).filter(s => s.volumen > 0);

      return {
        totalVentas, numeroTransacciones, ticketPromedio, clientesUnicos, topProductName, topProductTotal: topProduct.total,
        topByUnits, topByRevenue, sleepingProducts, categoryData, velocityData, scatterData
      };
    };

    return {
      currentMetrics: calculateMetrics(period, false),
      previousMetrics: calculateMetrics(period, true),
      maxDateStr: maxDate.toISOString().split('T')[0]
    };
  }, [period]);

  if (!currentMetrics || !previousMetrics) return <div>No hay datos disponibles.</div>;

  const getChange = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? 100 : 0;
    return ((current - prev) / prev) * 100;
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);
  const formatCompactNumber = (val: number) => new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(val);

  const StatCard = ({ title, value, change, icon: Icon, subtitle }: { title: string, value: string | number, change?: number, icon: any, subtitle?: string }) => {
    const isPositive = change !== undefined && change >= 0;
    return (
      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</CardTitle>
          <div className="p-2.5 rounded-full bg-emerald-100/50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Icon className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</div>
          {(change !== undefined || subtitle) && (
            <p className="flex items-center text-xs mt-3">
              {change !== undefined && (
                <span className={`flex items-center font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(change).toFixed(1)}%
                </span>
              )}
              <span className="text-slate-500 ml-2">{subtitle || 'vs periodo anterior'}</span>
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg shadow-emerald-500/20 text-white">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              5ALES Dashboard
            </h2>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
              <CalendarDays className="w-3.5 h-3.5" /> Última actualización: {maxDateStr}
            </p>
          </div>
        </div>
        
        <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl backdrop-blur-sm border border-slate-200/50">
          {(['today', 'week', 'month'] as const).map((p) => (
            <button
              key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                period === p ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {p === 'today' ? 'Hoy' : p === 'week' ? 'Esta Semana' : 'Este Mes'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Ventas Totales" value={formatCurrency(currentMetrics.totalVentas)} change={getChange(currentMetrics.totalVentas, previousMetrics.totalVentas)} icon={DollarSign} />
        <StatCard title="Ticket Promedio" value={formatCurrency(currentMetrics.ticketPromedio)} change={getChange(currentMetrics.ticketPromedio, previousMetrics.ticketPromedio)} icon={CreditCard} subtitle="por transacción" />
        <StatCard title="Transacciones" value={currentMetrics.numeroTransacciones} change={getChange(currentMetrics.numeroTransacciones, previousMetrics.numeroTransacciones)} icon={ShoppingBag} />
        <StatCard title="Clientes Únicos" value={currentMetrics.clientesUnicos} change={getChange(currentMetrics.clientesUnicos, previousMetrics.clientesUnicos)} icon={Users} subtitle="compradores distintos" />
      </div>

      {/* Análisis de Productos Title */}
      <div className="pt-6 pb-2">
        <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <Package className="w-6 h-6 text-emerald-600" /> Análisis de Productos
        </h3>
        <p className="text-slate-500 text-sm">Información estratégica para decisiones de compra y espacio en estantería.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Top 10 Productos */}
        <Card className="lg:col-span-2 border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Top 10 Productos</CardTitle>
              <CardDescription>Los artículos más populares del período.</CardDescription>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button 
                onClick={() => setTopTenView('units')}
                className={`px-3 py-1 text-xs font-medium rounded-md ${topTenView === 'units' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
              >
                Por Unidades
              </button>
              <button 
                onClick={() => setTopTenView('revenue')}
                className={`px-3 py-1 text-xs font-medium rounded-md ${topTenView === 'revenue' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
              >
                Por Ingresos
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTenView === 'units' ? currentMetrics.topByUnits : currentMetrics.topByRevenue} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" tickFormatter={topTenView === 'revenue' ? formatCompactNumber : undefined} fontSize={12} stroke="#94a3b8" />
                  <YAxis type="category" dataKey="nombre" width={150} fontSize={11} stroke="#94a3b8" tick={{fill: '#64748b'}} />
                  <RechartsTooltip 
                    formatter={(value: any) => topTenView === 'revenue' ? formatCurrency(value) : [value, 'Unidades']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey={topTenView === 'units' ? 'qty' : 'total'} fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Ventas por Categoría */}
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><PieChartIcon className="w-5 h-5" /> Ventas por Categoría</CardTitle>
            <CardDescription>Distribución de ingresos.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[300px]">
            {currentMetrics.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentMetrics.categoryData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {currentMetrics.categoryData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400">Sin datos de categoría</p>
            )}
          </CardContent>
        </Card>

        {/* Productos Durmientes */}
        <Card className="border-rose-100 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <AlertCircle className="w-5 h-5" /> Productos Durmientes
            </CardTitle>
            <CardDescription>El 20% con menor movimiento (Capital inmovilizado).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {currentMetrics.sleepingProducts.length === 0 ? (
                <p className="text-sm text-slate-500">No hay productos durmientes.</p>
              ) : (
                currentMetrics.sleepingProducts.map((p) => (
                  <div key={p.id} className="flex justify-between items-center p-2 rounded-md bg-white/60 dark:bg-slate-900/50 border border-rose-100/50">
                    <div className="truncate pr-4">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{p.nombre}</p>
                      <p className="text-xs text-slate-500">{p.categoria}</p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="text-sm font-bold text-rose-600">{p.qty} un.</p>
                      <p className="text-xs text-slate-400">{formatCurrency(p.total)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Margen vs Volumen Scatter */}
        <Card className="lg:col-span-2 border-slate-200/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Target className="w-5 h-5 text-blue-500" /> Margen vs. Volumen</CardTitle>
            <CardDescription>Visualiza qué productos traen volumen vs. margen.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" dataKey="volumen" name="Volumen (unidades)" stroke="#94a3b8" fontSize={12} tickCount={6} />
                  <YAxis type="number" dataKey="margen" name="Margen (%)" unit="%" stroke="#94a3b8" fontSize={12} tickCount={6} />
                  <ZAxis type="number" dataKey="z" range={[50, 400]} name="Ingresos Totales" />
                  <RechartsTooltip 
                    cursor={{ strokeDasharray: '3 3' }} 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700">
                            <p className="font-bold text-sm mb-1">{data.nombre}</p>
                            <p className="text-xs text-slate-500">Volumen: <span className="font-medium text-slate-700 dark:text-slate-300">{data.volumen} un.</span></p>
                            <p className="text-xs text-slate-500">Margen: <span className="font-medium text-slate-700 dark:text-slate-300">{data.margen.toFixed(1)}%</span></p>
                            <p className="text-xs text-slate-500">Ingresos: <span className="font-medium text-emerald-600">{formatCurrency(data.revenue)}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="Productos" data={currentMetrics.scatterData} fill="#3b82f6" opacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500 px-8">
              <span>← Menos Ventas</span>
              <span>Más Ventas →</span>
            </div>
          </CardContent>
        </Card>

        {/* Velocidad de Rotación */}
        <Card className="lg:col-span-3 border-slate-200/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> Velocidad de Rotación</CardTitle>
            <CardDescription>Unidades vendidas por día. Ayuda a predecir inventario.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {currentMetrics.velocityData.map((v, i) => (
                <div key={i} className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-xl p-3 flex flex-col justify-between">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2 leading-tight mb-2">{v.nombre}</p>
                  <div className="mt-auto">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">{v.velocidad.toFixed(1)}</p>
                    <p className="text-[10px] text-amber-700/60 uppercase tracking-wider font-semibold">Unidades / Día</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
