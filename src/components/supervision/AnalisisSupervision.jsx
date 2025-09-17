import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { useReportes } from '../../hooks/useReportes';
import { dbHelpers } from '../../services/supabase';
import { Icon } from '../common/Icons';

const AnalisisSupervision = () => {
  // Hooks para datos
  const { reportes, loading: reportesLoading } = useReportes();
  const [supervisionCampo, setSupervisionCampo] = useState([]);
  const [abordajesCampo, setAbordajesCampo] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para filtros
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 30);
    return fecha.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [tipoReporteSeleccionado, setTipoReporteSeleccionado] = useState('todos');

  // Cargar datos de supervision y abordajes
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [supervisionData, abordajesData] = await Promise.all([
          dbHelpers.getAll('supervision_campo', { orderBy: 'created_at', ascending: false }),
          dbHelpers.getAll('abordajes_campo', { orderBy: 'created_at', ascending: false })
        ]);
        setSupervisionCampo(supervisionData || []);
        setAbordajesCampo(abordajesData || []);
      } catch (error) {
        console.error('Error fetching supervision data:', error);
        setSupervisionCampo([]);
        setAbordajesCampo([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Combinar todos los datos en formato unificado
  const todosLosReportes = useMemo(() => {
    const reportesIncidencia = (reportes || []).filter(r =>
      r.tipo_reporte === 'incidencia' || r.tipo === 'incidencia'
    ).map(r => ({
      ...r,
      fuente: 'reportes',
      categoria: 'incidencia',
      created_at: r.created_at || r.fecha,
      descripcion: r.descripcion_incidente || r.descripcion,
      area: r.area,
      reportante: r.reportante,
      estado: r.estado || 'pendiente'
    }));

    const reportesSupervision = (supervisionCampo || []).map(r => ({
      ...r,
      fuente: 'supervision_campo',
      categoria: 'supervision',
      descripcion: r.hallazgo,
      area: r.lugar_labor,
      reportante: r.supervisor_reporta,
      estado: r.estado || 'pendiente'
    }));

    const reportesAbordajes = (abordajesCampo || []).map(r => ({
      ...r,
      fuente: 'abordajes_campo',
      categoria: 'abordaje',
      descripcion: r.observaciones,
      area: r.area_abordaje,
      reportante: r.supervisor_responsable,
      estado: r.estado || 'pendiente'
    }));

    return [...reportesIncidencia, ...reportesSupervision, ...reportesAbordajes];
  }, [reportes, supervisionCampo, abordajesCampo]);

  // Filtros aplicados
  const reportesFiltrados = useMemo(() => {
    let filtrados = todosLosReportes;

    // Filtro por fecha
    if (fechaInicio && fechaFin) {
      const fechaInicioDate = new Date(fechaInicio);
      const fechaFinDate = new Date(fechaFin);
      fechaFinDate.setHours(23, 59, 59, 999);

      filtrados = filtrados.filter(reporte => {
        const fechaReporte = new Date(reporte.created_at);
        return fechaReporte >= fechaInicioDate && fechaReporte <= fechaFinDate;
      });
    }

    // Filtro por tipo
    if (tipoReporteSeleccionado !== 'todos') {
      filtrados = filtrados.filter(r => r.categoria === tipoReporteSeleccionado);
    }

    return filtrados;
  }, [todosLosReportes, fechaInicio, fechaFin, tipoReporteSeleccionado]);

  // Análisis de datos para dashboards
  const analisisCompleto = useMemo(() => {
    const reportesValidos = Array.isArray(reportesFiltrados) ? reportesFiltrados : [];

    // Estadísticas generales
    const totalReportes = reportesValidos.length;
    const incidencias = reportesValidos.filter(r => r.categoria === 'incidencia').length;
    const supervisiones = reportesValidos.filter(r => r.categoria === 'supervision').length;
    const abordajes = reportesValidos.filter(r => r.categoria === 'abordaje').length;
    const areasUnicas = [...new Set(reportesValidos.map(r => r.area).filter(Boolean))].length;

    // Estados de reportes
    const reportesPorEstado = reportesValidos.reduce((acc, reporte) => {
      const estado = reporte.estado || 'pendiente';
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {});

    const estadoData = Object.entries(reportesPorEstado).map(([estado, cantidad]) => ({
      estado: estado.charAt(0).toUpperCase() + estado.slice(1),
      cantidad,
      color: {
        'pendiente': '#f59e0b',
        'en_proceso': '#3b82f6',
        'resuelto': '#10b981',
        'cerrado': '#6b7280'
      }[estado] || '#6b7280'
    }));

    // Reportes por categoría
    const categoriaData = [
      { categoria: 'Incidencias', cantidad: incidencias, color: '#ef4444' },
      { categoria: 'Supervisión', cantidad: supervisiones, color: '#3b82f6' },
      { categoria: 'Abordajes', cantidad: abordajes, color: '#10b981' }
    ].filter(item => item.cantidad > 0);

    // Reportes por área (top 10)
    const reportesPorArea = reportesValidos.reduce((acc, reporte) => {
      // El área ya está unificada en el campo 'area' después del mapeo
      const area = reporte.area || 'Sin área';
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {});

    console.log('DEBUG - reportesValidos count:', reportesValidos.length);
    console.log('DEBUG - Sample reporte fields:', reportesValidos[0] ? Object.keys(reportesValidos[0]) : 'No data');
    console.log('DEBUG - First 3 reportes:', reportesValidos.slice(0, 3));
    console.log('DEBUG - reportesPorArea:', reportesPorArea);

    const areaData = Object.entries(reportesPorArea)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([area, cantidad]) => ({
        area: area.length > 15 ? area.substring(0, 15) + '...' : area,
        cantidad
      }));

    console.log('DEBUG - areaData:', areaData);

    // Tendencia mensual (últimos 6 meses)
    const tendenciaMensual = [];
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      const mesYear = `${fecha.toLocaleDateString('es-ES', { month: 'short' })} ${fecha.getFullYear()}`;

      const reportesDelMes = reportesValidos.filter(r => {
        const fechaReporte = new Date(r.created_at);
        return fechaReporte.getMonth() === fecha.getMonth() &&
               fechaReporte.getFullYear() === fecha.getFullYear();
      }).length;

      tendenciaMensual.push({
        mes: mesYear,
        incidencias: reportesValidos.filter(r => {
          const fechaReporte = new Date(r.created_at);
          return fechaReporte.getMonth() === fecha.getMonth() &&
                 fechaReporte.getFullYear() === fecha.getFullYear() &&
                 r.categoria === 'incidencia';
        }).length,
        supervisiones: reportesValidos.filter(r => {
          const fechaReporte = new Date(r.created_at);
          return fechaReporte.getMonth() === fecha.getMonth() &&
                 fechaReporte.getFullYear() === fecha.getFullYear() &&
                 r.categoria === 'supervision';
        }).length,
        abordajes: reportesValidos.filter(r => {
          const fechaReporte = new Date(r.created_at);
          return fechaReporte.getMonth() === fecha.getMonth() &&
                 fechaReporte.getFullYear() === fecha.getFullYear() &&
                 r.categoria === 'abordaje';
        }).length,
        total: reportesDelMes
      });
    }

    return {
      estadisticas: {
        totalReportes,
        incidencias,
        supervisiones,
        abordajes,
        areasUnicas
      },
      estadoData,
      categoriaData,
      areaData,
      tendenciaMensual
    };
  }, [reportesFiltrados]);

  if (loading || reportesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <Icon name="Analytics" size={64} className="mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Cargando Analytics</h3>
            <p className="text-slate-500">Procesando datos de seguridad...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header Principal */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-3 shadow-lg">
                <Icon name="Analytics" size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  Centro de Inteligencia de Seguridad
                </h1>
                <p className="text-slate-600 font-medium">
                  Analytics Avanzado • KPIs en Tiempo Real • Visualizaciones Interactivas • Tendencias Predictivas
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Sistema Activo</span>
              </div>
              <div className="w-px h-6 bg-slate-300"></div>
              <span className="font-medium">
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filtros y Controles */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center space-x-3">
              <Icon name="Calendar" size={20} className="text-slate-500" />
              <label className="text-sm font-semibold text-slate-700 min-w-fit">Período:</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <span className="text-slate-400">a</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-center space-x-3">
              <Icon name="Filter" size={20} className="text-slate-500" />
              <label className="text-sm font-semibold text-slate-700">Tipo:</label>
              <select
                value={tipoReporteSeleccionado}
                onChange={(e) => setTipoReporteSeleccionado(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="todos">Todos los reportes</option>
                <option value="incidencia">Incidencias</option>
                <option value="supervision">Supervisión</option>
                <option value="abordaje">Abordajes</option>
              </select>
            </div>

            {/* Botones período rápido */}
            <div className="flex items-center space-x-2 ml-auto">
              <span className="text-sm text-slate-500">Rápido:</span>
              {[
                { label: '7d', dias: 7 },
                { label: '30d', dias: 30 },
                { label: '90d', dias: 90 }
              ].map(periodo => (
                <button
                  key={periodo.dias}
                  onClick={() => {
                    const fin = new Date();
                    const inicio = new Date();
                    inicio.setDate(fin.getDate() - periodo.dias);
                    setFechaInicio(inicio.toISOString().split('T')[0]);
                    setFechaFin(fin.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1 text-xs font-medium text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                >
                  {periodo.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Icon name="BarChart3" size={16} className="text-blue-500" />
                <span className="text-slate-600">
                  Analizando: <span className="font-medium">{new Date(fechaInicio).toLocaleDateString('es-ES')} - {new Date(fechaFin).toLocaleDateString('es-ES')}</span>
                </span>
              </div>
              <div className="text-slate-500">
                {reportesFiltrados.length} reportes encontrados
              </div>
            </div>
          </div>
        </div>

        {/* KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {[
            {
              titulo: 'Total Reportes',
              valor: analisisCompleto.estadisticas.totalReportes,
              icon: 'FileText',
              color: 'from-blue-500 to-blue-600',
              bgColor: 'bg-blue-50',
              textColor: 'text-blue-700'
            },
            {
              titulo: 'Incidencias',
              valor: analisisCompleto.estadisticas.incidencias,
              icon: 'AlertTriangle',
              color: 'from-red-500 to-red-600',
              bgColor: 'bg-red-50',
              textColor: 'text-red-700'
            },
            {
              titulo: 'Supervisiones',
              valor: analisisCompleto.estadisticas.supervisiones,
              icon: 'Eye',
              color: 'from-indigo-500 to-indigo-600',
              bgColor: 'bg-indigo-50',
              textColor: 'text-indigo-700'
            },
            {
              titulo: 'Abordajes',
              valor: analisisCompleto.estadisticas.abordajes,
              icon: 'Users',
              color: 'from-emerald-500 to-emerald-600',
              bgColor: 'bg-emerald-50',
              textColor: 'text-emerald-700'
            },
            {
              titulo: 'Áreas Activas',
              valor: analisisCompleto.estadisticas.areasUnicas,
              icon: 'Building2',
              color: 'from-amber-500 to-amber-600',
              bgColor: 'bg-amber-50',
              textColor: 'text-amber-700'
            }
          ].map(stat => (
            <div key={stat.titulo} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <Icon name={stat.icon} size={24} className={stat.textColor} />
                </div>
                <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.valor}
                </div>
              </div>
              <h3 className="text-sm font-semibold text-slate-600">
                {stat.titulo}
              </h3>
            </div>
          ))}
        </div>

        {/* Gráficos Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Estados de Reportes */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Icon name="PieChart" size={24} className="text-blue-600" />
              <h3 className="text-xl font-bold text-slate-800">Estados de Reportes</h3>
            </div>
            {analisisCompleto.estadoData && analisisCompleto.estadoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analisisCompleto.estadoData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="cantidad"
                    label={({estado, percent}) => `${estado}: ${(percent * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {analisisCompleto.estadoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Icon name="PieChart" size={48} className="mx-auto mb-3 text-slate-300" />
                  <p>No hay datos de estados disponibles</p>
                </div>
              </div>
            )}
          </div>

          {/* Reportes por Categoría */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Icon name="BarChart3" size={24} className="text-emerald-600" />
              <h3 className="text-xl font-bold text-slate-800">Reportes por Categoría</h3>
            </div>
            {analisisCompleto.categoriaData && analisisCompleto.categoriaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analisisCompleto.categoriaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="categoria"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar
                    dataKey="cantidad"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Icon name="BarChart3" size={48} className="mx-auto mb-3 text-slate-300" />
                  <p>No hay datos de categorías disponibles</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gráficos Secundarios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Tendencia Mensual */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Icon name="TrendingUp" size={24} className="text-indigo-600" />
              <h3 className="text-xl font-bold text-slate-800">Tendencia Mensual</h3>
            </div>
            {analisisCompleto.tendenciaMensual && analisisCompleto.tendenciaMensual.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={analisisCompleto.tendenciaMensual}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="incidencias" fill="#ef4444" name="Incidencias" />
                  <Bar dataKey="supervisiones" fill="#3b82f6" name="Supervisiones" />
                  <Bar dataKey="abordajes" fill="#10b981" name="Abordajes" />
                  <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} name="Total" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Icon name="TrendingUp" size={48} className="mx-auto mb-3 text-slate-300" />
                  <p>No hay datos de tendencia disponibles</p>
                </div>
              </div>
            )}
          </div>

          {/* Reportes por Área */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Icon name="Building2" size={24} className="text-amber-600" />
              <h3 className="text-xl font-bold text-slate-800">Top Áreas con Reportes</h3>
            </div>
            {analisisCompleto.areaData && analisisCompleto.areaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analisisCompleto.areaData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis
                    type="category"
                    dataKey="area"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar
                    dataKey="cantidad"
                    fill="#f59e0b"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Icon name="Building2" size={48} className="mx-auto mb-3 text-slate-300" />
                  <p>No hay datos de áreas disponibles</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mensaje cuando no hay datos */}
        {reportesFiltrados.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon name="BarChart3" size={32} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-3">
                No hay reportes en el período seleccionado
              </h3>
              <p className="text-slate-500 mb-6">
                Ajusta los filtros de fecha o tipo de reporte para ver los datos de análisis.
              </p>
              <button
                onClick={() => {
                  const fin = new Date();
                  const inicio = new Date();
                  inicio.setDate(fin.getDate() - 30);
                  setFechaInicio(inicio.toISOString().split('T')[0]);
                  setFechaFin(fin.toISOString().split('T')[0]);
                  setTipoReporteSeleccionado('todos');
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Restablecer filtros
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalisisSupervision;