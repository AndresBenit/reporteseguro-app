import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Icon } from '../common/Icons';
import { supabase } from '../../services/supabase';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const InventarioDashboard = () => {
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    mes: new Date().getMonth() + 1,
    año: new Date().getFullYear(),
    categoria: 'todos'
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [productosRes, movimientosRes] = await Promise.all([
        supabase.from('epp_productos').select('*').eq('activo', true),
        supabase.from('movimientos_inventario').select('*')
          .gte('created_at', `${filtros.año}-01-01`)
          .lte('created_at', `${filtros.año}-12-31`)
      ]);

      if (productosRes.error) throw productosRes.error;
      if (movimientosRes.error) throw movimientosRes.error;

      setProductos(productosRes.data || []);
      setMovimientos(movimientosRes.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const estadisticas = useMemo(() => {
    if (!productos.length) return { totalProductos: 0, stockTotal: 0, alertasStock: 0, valorInventario: 0 };

    const totalProductos = productos.length;
    const stockTotal = productos.reduce((sum, p) => sum + (p.stock_actual || 0), 0);
    const alertasStock = productos.filter(p => (p.stock_actual || 0) <= (p.stock_minimo || 0)).length;
    const valorInventario = productos.reduce((sum, p) => sum + ((p.stock_actual || 0) * (p.precio_unitario || 0)), 0);

    return { totalProductos, stockTotal, alertasStock, valorInventario };
  }, [productos]);

  const datosStockStatus = useMemo(() => {
    if (!productos.length) return [];

    const stockNormal = productos.filter(p => (p.stock_actual || 0) > (p.stock_minimo || 0)).length;
    const stockBajo = productos.filter(p => (p.stock_actual || 0) <= (p.stock_minimo || 0) && (p.stock_actual || 0) > 0).length;
    const sinStock = productos.filter(p => (p.stock_actual || 0) === 0).length;

    return [
      { name: 'Stock Normal', value: stockNormal, color: '#10b981' },
      { name: 'Stock Bajo', value: stockBajo, color: '#f59e0b' },
      { name: 'Sin Stock', value: sinStock, color: '#ef4444' }
    ];
  }, [productos]);

  const datosMovimientosMes = useMemo(() => {
    if (!movimientos.length) return [];

    const movimientosPorMes = {};
    movimientos.forEach(mov => {
      const fecha = new Date(mov.created_at);
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

      if (!movimientosPorMes[mesKey]) {
        movimientosPorMes[mesKey] = { mes: mesKey, entradas: 0, salidas: 0 };
      }

      if (mov.tipo_movimiento === 'entrada') {
        movimientosPorMes[mesKey].entradas += mov.cantidad || 0;
      } else {
        movimientosPorMes[mesKey].salidas += mov.cantidad || 0;
      }
    });

    return Object.values(movimientosPorMes).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [movimientos]);

  const productosStockBajo = useMemo(() => {
    return productos
      .filter(p => (p.stock_actual || 0) <= (p.stock_minimo || 0))
      .sort((a, b) => (a.stock_actual || 0) - (b.stock_actual || 0))
      .slice(0, 5);
  }, [productos]);

  const tarjetasEstadisticas = [
    {
      titulo: 'Total Productos',
      valor: estadisticas.totalProductos,
      icono: 'Package',
      color: 'from-blue-500 to-blue-600',
      formato: 'numero'
    },
    {
      titulo: 'Stock Total',
      valor: estadisticas.stockTotal,
      icono: 'Archive',
      color: 'from-emerald-500 to-emerald-600',
      formato: 'numero'
    },
    {
      titulo: 'Alertas de Stock',
      valor: estadisticas.alertasStock,
      icono: 'AlertTriangle',
      color: 'from-amber-500 to-amber-600',
      formato: 'numero'
    },
    {
      titulo: 'Valor Inventario',
      valor: estadisticas.valorInventario,
      icono: 'DollarSign',
      color: 'from-green-500 to-green-600',
      formato: 'moneda'
    }
  ];

  const formatearValor = (valor, formato) => {
    switch (formato) {
      case 'moneda':
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0
        }).format(valor);
      case 'numero':
        return new Intl.NumberFormat('es-CO').format(valor);
      default:
        return valor;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2 text-slate-600">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Cargando dashboard de inventario...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Icon name="Filter" size={20} className="text-slate-500" />
            <span className="font-medium text-slate-700">Filtros:</span>
          </div>

          <select
            value={filtros.año}
            onChange={(e) => setFiltros(prev => ({ ...prev, año: parseInt(e.target.value) }))}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(año => (
              <option key={año} value={año}>{año}</option>
            ))}
          </select>

          <button
            onClick={cargarDatos}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Icon name="RefreshCw" size={16} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tarjetasEstadisticas.map((tarjeta, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{tarjeta.titulo}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {formatearValor(tarjeta.valor, tarjeta.formato)}
                </p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-r ${tarjeta.color} rounded-xl flex items-center justify-center`}>
                <Icon name={tarjeta.icono} size={24} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado del Stock */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Estado del Stock</h3>
            <Icon name="PieChart" size={20} className="text-slate-500" />
          </div>

          {datosStockStatus.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosStockStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {datosStockStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <Icon name="Package" size={48} className="mx-auto mb-2 opacity-50" />
                <p>No hay datos de productos</p>
              </div>
            </div>
          )}
        </div>

        {/* Movimientos por Mes */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Movimientos por Mes</h3>
            <Icon name="TrendingUp" size={20} className="text-slate-500" />
          </div>

          {datosMovimientosMes.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosMovimientosMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={2} name="Entradas" />
                  <Line type="monotone" dataKey="salidas" stroke="#ef4444" strokeWidth={2} name="Salidas" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <Icon name="ArrowUpDown" size={48} className="mx-auto mb-2 opacity-50" />
                <p>No hay movimientos registrados</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alertas de Stock Bajo */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Alertas de Stock Bajo
          </h3>
          <div className="flex items-center space-x-2">
            <Icon name="AlertTriangle" size={20} className="text-amber-500" />
            <span className="text-sm font-medium text-amber-600">
              {productosStockBajo.length} productos necesitan reabastecimiento
            </span>
          </div>
        </div>

        {productosStockBajo.length > 0 ? (
          <div className="space-y-3">
            {productosStockBajo.map((producto) => (
              <div key={producto.id} className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Icon name="Package" size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">{producto.nombre}</h4>
                    <p className="text-sm text-slate-600">{producto.descripcion}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-600">Stock:</span>
                    <span className="font-bold text-amber-600">{producto.stock_actual || 0}</span>
                    <span className="text-sm text-slate-500">/ min: {producto.stock_minimo || 0}</span>
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    Precio: {formatearValor(producto.precio_unitario || 0, 'moneda')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Icon name="CheckCircle" size={48} className="mx-auto mb-2 text-green-500" />
            <p className="font-medium">¡Excelente! Todos los productos tienen stock suficiente</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventarioDashboard;