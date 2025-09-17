import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Icon } from '../common/Icons';
import { supabase } from '../../lib/supabase';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#06b6d4'];

const CapacitacionesDashboard = () => {
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    año: new Date().getFullYear(),
    tipo: 'todos',
    area: 'todas'
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [capacitacionesRes, asistenciasRes] = await Promise.all([
        supabase.from('capacitaciones_sst').select('*')
          .gte('fecha_realizacion', `${filtros.año}-01-01`)
          .lte('fecha_realizacion', `${filtros.año}-12-31`)
          .order('fecha_realizacion', { ascending: false }),
        supabase.from('asistencia_capacitaciones').select(`
          *,
          capacitaciones_sst(titulo, tipo_capacitacion),
          colaboradores(nombre_completo)
        `)
      ]);

      if (capacitacionesRes.error) throw capacitacionesRes.error;
      if (asistenciasRes.error) throw asistenciasRes.error;

      setCapacitaciones(capacitacionesRes.data || []);
      setAsistencias(asistenciasRes.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const isVencida = (fechaVencimiento) => {
    if (!fechaVencimiento) return false;
    return new Date(fechaVencimiento) < new Date();
  };

  const isProximaVencer = (fechaVencimiento) => {
    if (!fechaVencimiento) return false;
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diasRestantes = (vencimiento - hoy) / (1000 * 60 * 60 * 24);
    return diasRestantes > 0 && diasRestantes <= 30;
  };

  const estadisticas = useMemo(() => {
    if (!capacitaciones.length) return {
      totalCapacitaciones: 0,
      vigentes: 0,
      proximasVencer: 0,
      vencidas: 0,
      horasTotales: 0,
      promedioDuracion: 0
    };

    const vigentes = capacitaciones.filter(c => !isVencida(c.fecha_vencimiento)).length;
    const proximasVencer = capacitaciones.filter(c => isProximaVencer(c.fecha_vencimiento)).length;
    const vencidas = capacitaciones.filter(c => isVencida(c.fecha_vencimiento)).length;
    const horasTotales = capacitaciones.reduce((sum, c) => sum + (c.duracion_horas || 0), 0);
    const promedioDuracion = capacitaciones.length > 0 ? horasTotales / capacitaciones.length : 0;

    return {
      totalCapacitaciones: capacitaciones.length,
      vigentes,
      proximasVencer,
      vencidas,
      horasTotales,
      promedioDuracion
    };
  }, [capacitaciones]);

  const datosEstadoVencimiento = useMemo(() => {
    if (!capacitaciones.length) return [];

    return [
      { name: 'Vigentes', value: estadisticas.vigentes, color: '#10b981' },
      { name: 'Próximas a Vencer', value: estadisticas.proximasVencer, color: '#f59e0b' },
      { name: 'Vencidas', value: estadisticas.vencidas, color: '#ef4444' }
    ].filter(item => item.value > 0);
  }, [estadisticas]);

  const datosPorTipo = useMemo(() => {
    if (!capacitaciones.length) return [];

    const tipos = {};
    capacitaciones.forEach(cap => {
      const tipo = cap.tipo_capacitacion || 'Sin clasificar';
      tipos[tipo] = (tipos[tipo] || 0) + 1;
    });

    return Object.entries(tipos).map(([tipo, cantidad]) => ({
      tipo: tipo.length > 20 ? tipo.substring(0, 20) + '...' : tipo,
      cantidad
    })).sort((a, b) => b.cantidad - a.cantidad);
  }, [capacitaciones]);

  const datosCapacitacionesMes = useMemo(() => {
    if (!capacitaciones.length) return [];

    const meses = {};
    capacitaciones.forEach(cap => {
      if (cap.fecha_realizacion) {
        const fecha = new Date(cap.fecha_realizacion);
        const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

        if (!meses[mesKey]) {
          meses[mesKey] = { mes: mesKey, capacitaciones: 0, horas: 0 };
        }

        meses[mesKey].capacitaciones += 1;
        meses[mesKey].horas += cap.duracion_horas || 0;
      }
    });

    return Object.values(meses).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [capacitaciones]);

  const capacitacionesProximasVencer = useMemo(() => {
    return capacitaciones
      .filter(c => isProximaVencer(c.fecha_vencimiento))
      .sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento))
      .slice(0, 5);
  }, [capacitaciones]);

  const tarjetasEstadisticas = [
    {
      titulo: 'Total Capacitaciones',
      valor: estadisticas.totalCapacitaciones,
      icono: 'GraduationCap',
      color: 'from-emerald-500 to-emerald-600',
      formato: 'numero'
    },
    {
      titulo: 'Capacitaciones Vigentes',
      valor: estadisticas.vigentes,
      icono: 'CheckCircle',
      color: 'from-green-500 to-green-600',
      formato: 'numero'
    },
    {
      titulo: 'Próximas a Vencer',
      valor: estadisticas.proximasVencer,
      icono: 'AlertTriangle',
      color: 'from-amber-500 to-amber-600',
      formato: 'numero'
    },
    {
      titulo: 'Horas de Capacitación',
      valor: estadisticas.horasTotales,
      icono: 'Clock',
      color: 'from-blue-500 to-blue-600',
      formato: 'horas'
    }
  ];

  const formatearValor = (valor, formato) => {
    switch (formato) {
      case 'horas':
        return `${valor.toFixed(1)} hrs`;
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
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
          <span>Cargando dashboard de capacitaciones...</span>
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
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(año => (
              <option key={año} value={año}>{año}</option>
            ))}
          </select>

          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="todos">Todos los tipos</option>
            <option value="Seguridad Industrial">Seguridad Industrial</option>
            <option value="Uso de EPP">Uso de EPP</option>
            <option value="Primeros Auxilios">Primeros Auxilios</option>
            <option value="Trabajo en Alturas">Trabajo en Alturas</option>
          </select>

          <button
            onClick={cargarDatos}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
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
        {/* Estado de Vencimiento */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Estado de Certificaciones</h3>
            <Icon name="PieChart" size={20} className="text-slate-500" />
          </div>

          {datosEstadoVencimiento.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosEstadoVencimiento}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {datosEstadoVencimiento.map((entry, index) => (
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
                <Icon name="GraduationCap" size={48} className="mx-auto mb-2 opacity-50" />
                <p>No hay datos de capacitaciones</p>
              </div>
            </div>
          )}
        </div>

        {/* Capacitaciones por Tipo */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Capacitaciones por Tipo</h3>
            <Icon name="BarChart" size={20} className="text-slate-500" />
          </div>

          {datosPorTipo.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosPorTipo} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="tipo" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <Icon name="BarChart" size={48} className="mx-auto mb-2 opacity-50" />
                <p>No hay datos por tipo</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tendencia de Capacitaciones */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Tendencia de Capacitaciones por Mes</h3>
          <Icon name="TrendingUp" size={20} className="text-slate-500" />
        </div>

        {datosCapacitacionesMes.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datosCapacitacionesMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="capacitaciones"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Cantidad de Capacitaciones"
                />
                <Line
                  type="monotone"
                  dataKey="horas"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Horas de Capacitación"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <Icon name="TrendingUp" size={48} className="mx-auto mb-2 opacity-50" />
              <p>No hay datos de tendencias</p>
            </div>
          </div>
        )}
      </div>

      {/* Alertas de Capacitaciones Próximas a Vencer */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Capacitaciones Próximas a Vencer
          </h3>
          <div className="flex items-center space-x-2">
            <Icon name="AlertTriangle" size={20} className="text-amber-500" />
            <span className="text-sm font-medium text-amber-600">
              {capacitacionesProximasVencer.length} capacitaciones requieren renovación
            </span>
          </div>
        </div>

        {capacitacionesProximasVencer.length > 0 ? (
          <div className="space-y-3">
            {capacitacionesProximasVencer.map((capacitacion) => {
              const diasRestantes = Math.ceil((new Date(capacitacion.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24));

              return (
                <div key={capacitacion.id} className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Icon name="GraduationCap" size={20} className="text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{capacitacion.titulo}</h4>
                      <p className="text-sm text-slate-600">{capacitacion.tipo_capacitacion}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-600">Vence en:</span>
                      <span className="font-bold text-amber-600">{diasRestantes} días</span>
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      {new Date(capacitacion.fecha_vencimiento).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Icon name="CheckCircle" size={48} className="mx-auto mb-2 text-green-500" />
            <p className="font-medium">¡Excelente! Todas las capacitaciones están vigentes</p>
            <p className="text-sm mt-1">No hay capacitaciones próximas a vencer en los próximos 30 días</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CapacitacionesDashboard;