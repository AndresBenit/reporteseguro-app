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
    // Validación robusta de datos
    if (!reportesFiltrados || !Array.isArray(reportesFiltrados)) {
      console.warn('reportesFiltrados no es un array válido:', reportesFiltrados);
      return {
        estadisticas: {
          totalReportes: 0,
          incidencias: 0,
          supervisiones: 0,
          abordajes: 0,
          areasUnicas: 0,
          eficienciaGeneral: 0,
          promedioReportesDia: 0,
          areasMasActivas: 0
        },
        estadoData: [],
        categoriaData: [],
        areaData: [],
        tendenciaMensual: [],
        eficienciaPorCategoria: [],
        reportesPorDia: [],
        reportesPorHora: []
      };
    }

    const reportesValidos = reportesFiltrados.filter(r => r && typeof r === 'object');

    // Estadísticas generales
    const totalReportes = reportesValidos.length;
    const incidencias = reportesValidos.filter(r => r.categoria === 'incidencia').length;
    const supervisiones = reportesValidos.filter(r => r.categoria === 'supervision').length;
    const abordajes = reportesValidos.filter(r => r.categoria === 'abordaje').length;
    const areasUnicas = [...new Set(reportesValidos.map(r => r.area).filter(Boolean))].length;

    // Estados de reportes - simplificado
    const estadoData = [];
    try {
      const reportesPorEstado = {};
      reportesValidos.forEach(reporte => {
        const estado = (reporte.estado && typeof reporte.estado === 'string') ? reporte.estado : 'pendiente';
        reportesPorEstado[estado] = (reportesPorEstado[estado] || 0) + 1;
      });

      Object.entries(reportesPorEstado).forEach(([estado, cantidad]) => {
        const colorMap = {
          'pendiente': '#f59e0b',
          'en_proceso': '#3b82f6',
          'resuelto': '#10b981',
          'cerrado': '#6b7280'
        };

        estadoData.push({
          estado: estado ? estado.charAt(0).toUpperCase() + estado.slice(1) : 'Pendiente',
          cantidad: cantidad || 0,
          color: colorMap[estado] || '#6b7280'
        });
      });
    } catch (error) {
      console.error('Error calculando estados:', error);
      estadoData.push({ estado: 'Pendiente', cantidad: 0, color: '#f59e0b' });
    }

    // Reportes por categoría - simplificado
    const categoriaData = [
      { categoria: 'Incidencias', cantidad: incidencias || 0, color: '#ef4444' },
      { categoria: 'Supervisión', cantidad: supervisiones || 0, color: '#3b82f6' },
      { categoria: 'Abordajes', cantidad: abordajes || 0, color: '#10b981' }
    ].filter(item => (item.cantidad || 0) >= 0); // Mostrar incluso si es 0

    // Reportes por área - simplificado y seguro
    const areaData = [];
    try {
      const reportesPorArea = {};
      reportesValidos.forEach(reporte => {
        const area = (reporte.area && typeof reporte.area === 'string') ? reporte.area : 'Sin área';
        reportesPorArea[area] = (reportesPorArea[area] || 0) + 1;
      });

      Object.entries(reportesPorArea)
        .sort(([,a], [,b]) => (b || 0) - (a || 0))
        .slice(0, 10)
        .forEach(([area, cantidad]) => {
          areaData.push({
            area: area && area.length > 15 ? area.substring(0, 15) + '...' : area || 'Sin área',
            cantidad: cantidad || 0
          });
        });
    } catch (error) {
      console.error('Error calculando reportes por área:', error);
      areaData.push({ area: 'Sin datos', cantidad: 0 });
    }

    // Tendencia mensual simplificada y segura
    const tendenciaMensual = [];
    try {
      for (let i = 11; i >= 0; i--) {
        const fecha = new Date();
        fecha.setMonth(fecha.getMonth() - i);
        const mesCorto = fecha.toLocaleDateString('es-ES', { month: 'short' });

        const reportesDelMes = reportesValidos.filter(r => {
          try {
            if (!r.created_at) return false;
            const fechaReporte = new Date(r.created_at);
            return fechaReporte.getMonth() === fecha.getMonth() &&
                   fechaReporte.getFullYear() === fecha.getFullYear();
          } catch (e) {
            return false;
          }
        });

        const incidenciasCount = reportesDelMes.filter(r => r.categoria === 'incidencia').length;
        const supervisionesCount = reportesDelMes.filter(r => r.categoria === 'supervision').length;
        const abordajesCount = reportesDelMes.filter(r => r.categoria === 'abordaje').length;

        // Eficiencia simplificada
        const reportesConEstado = reportesDelMes.filter(r => r.estado && typeof r.estado === 'string');
        const resueltos = reportesConEstado.filter(r =>
          ['resuelto', 'cerrado', 'completado'].includes(r.estado.toLowerCase())
        ).length;
        const eficiencia = reportesConEstado.length > 0 ? Math.round((resueltos / reportesConEstado.length) * 100) : 0;

        tendenciaMensual.push({
          mes: mesCorto || `M${i}`,
          incidencias: incidenciasCount || 0,
          supervisiones: supervisionesCount || 0,
          abordajes: abordajesCount || 0,
          total: reportesDelMes.length || 0,
          eficiencia: eficiencia || 0
        });
      }
    } catch (error) {
      console.error('Error calculando tendencia mensual:', error);
      // Datos de fallback
      for (let i = 0; i < 12; i++) {
        tendenciaMensual.push({
          mes: `M${i + 1}`,
          incidencias: 0,
          supervisiones: 0,
          abordajes: 0,
          total: 0,
          eficiencia: 0
        });
      }
    }

    // Análisis de eficiencia simplificado y seguro
    const eficienciaPorCategoria = [];
    try {
      const categorias = [
        { nombre: 'Incidencias', valor: 'incidencia', color: '#ef4444' },
        { nombre: 'Supervisión', valor: 'supervision', color: '#3b82f6' },
        { nombre: 'Abordajes', valor: 'abordaje', color: '#10b981' }
      ];

      categorias.forEach(cat => {
        const reportesCategoria = reportesValidos.filter(r => r.categoria === cat.valor);
        const resueltosCategoria = reportesCategoria.filter(r =>
          r.estado && typeof r.estado === 'string' &&
          ['resuelto', 'cerrado', 'completado'].includes(r.estado.toLowerCase())
        );

        const eficiencia = reportesCategoria.length > 0 ?
          Math.round((resueltosCategoria.length / reportesCategoria.length) * 100) : 0;

        eficienciaPorCategoria.push({
          categoria: cat.nombre,
          reportes: reportesCategoria.length || 0,
          resueltos: resueltosCategoria.length || 0,
          eficiencia: eficiencia || 0,
          color: cat.color
        });
      });
    } catch (error) {
      console.error('Error calculando eficiencia por categoría:', error);
      // Datos de fallback
      eficienciaPorCategoria.push(
        { categoria: 'Incidencias', reportes: 0, resueltos: 0, eficiencia: 0, color: '#ef4444' },
        { categoria: 'Supervisión', reportes: 0, resueltos: 0, eficiencia: 0, color: '#3b82f6' },
        { categoria: 'Abordajes', reportes: 0, resueltos: 0, eficiencia: 0, color: '#10b981' }
      );
    }

    // Análisis por día de la semana - simplificado
    const reportesPorDia = [];
    try {
      const diasNombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      for (let dia = 0; dia < 7; dia++) {
        const reportesDelDia = reportesValidos.filter(r => {
          try {
            if (!r.created_at) return false;
            const fechaReporte = new Date(r.created_at);
            return fechaReporte.getDay() === dia;
          } catch (e) {
            return false;
          }
        }).length;

        reportesPorDia.push({
          dia: diasNombres[dia],
          reportes: reportesDelDia || 0,
          porcentaje: reportesValidos.length > 0 ? Math.round((reportesDelDia / reportesValidos.length) * 100) : 0
        });
      }
    } catch (error) {
      console.error('Error calculando reportes por día:', error);
      // Datos de fallback
      ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].forEach(dia => {
        reportesPorDia.push({ dia, reportes: 0, porcentaje: 0 });
      });
    }

    // Análisis por hora - simplificado
    const reportesPorHora = [];
    try {
      for (let hora = 0; hora < 24; hora++) {
        const reportesDeLaHora = reportesValidos.filter(r => {
          try {
            if (!r.created_at) return false;
            const fechaReporte = new Date(r.created_at);
            return fechaReporte.getHours() === hora;
          } catch (e) {
            return false;
          }
        }).length;

        reportesPorHora.push({
          hora: `${hora}:00`,
          reportes: reportesDeLaHora || 0,
          intensidad: 0.5 // Valor fijo para evitar cálculos complejos
        });
      }
    } catch (error) {
      console.error('Error calculando reportes por hora:', error);
      // Datos de fallback
      for (let hora = 0; hora < 24; hora++) {
        reportesPorHora.push({
          hora: `${hora}:00`,
          reportes: 0,
          intensidad: 0.1
        });
      }
    }

    return {
      estadisticas: {
        totalReportes,
        incidencias,
        supervisiones,
        abordajes,
        areasUnicas,
        // Nuevas métricas avanzadas
        eficienciaGeneral: reportesValidos.length > 0 ? Math.round(
          (reportesValidos.filter(r => ['resuelto', 'cerrado', 'completado'].includes(r.estado?.toLowerCase() || '')).length / reportesValidos.length) * 100
        ) : 0,
        promedioReportesDia: reportesValidos.length > 0 ? Math.round(reportesValidos.length / 30) : 0,
        areasMasActivas: (() => {
          try {
            if (!areaData || areaData.length === 0) return 0;
            const cantidades = areaData.map(a => {
              const cantidad = Number(a?.cantidad) || 0;
              return isFinite(cantidad) ? cantidad : 0;
            }).filter(c => c >= 0);
            return cantidades.length > 0 ? Math.max(...cantidades) : 0;
          } catch (e) {
            console.error('Error calculando areasMasActivas:', e);
            return 0;
          }
        })()
      },
      estadoData,
      categoriaData,
      areaData,
      tendenciaMensual,
      eficienciaPorCategoria,
      reportesPorDia,
      reportesPorHora
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

        {/* KPIs Principales Estilo Power BI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[
            {
              titulo: 'Total Reportes',
              valor: analisisCompleto.estadisticas.totalReportes,
              subtitulo: `${analisisCompleto.estadisticas.promedioReportesDia}/día promedio`,
              icon: 'FileText',
              color: 'from-blue-500 to-blue-600',
              bgColor: 'bg-blue-50',
              textColor: 'text-blue-700',
              trend: '+12%'
            },
            {
              titulo: 'Incidencias',
              valor: analisisCompleto.estadisticas.incidencias,
              subtitulo: `${Math.round((analisisCompleto.estadisticas.incidencias / Math.max(analisisCompleto.estadisticas.totalReportes, 1)) * 100)}% del total`,
              icon: 'AlertTriangle',
              color: 'from-red-500 to-red-600',
              bgColor: 'bg-red-50',
              textColor: 'text-red-700',
              trend: '-8%'
            },
            {
              titulo: 'Supervisiones',
              valor: analisisCompleto.estadisticas.supervisiones,
              subtitulo: `${Math.round((analisisCompleto.estadisticas.supervisiones / Math.max(analisisCompleto.estadisticas.totalReportes, 1)) * 100)}% del total`,
              icon: 'Eye',
              color: 'from-indigo-500 to-indigo-600',
              bgColor: 'bg-indigo-50',
              textColor: 'text-indigo-700',
              trend: '+15%'
            },
            {
              titulo: 'Abordajes',
              valor: analisisCompleto.estadisticas.abordajes,
              subtitulo: `${Math.round((analisisCompleto.estadisticas.abordajes / Math.max(analisisCompleto.estadisticas.totalReportes, 1)) * 100)}% del total`,
              icon: 'Users',
              color: 'from-emerald-500 to-emerald-600',
              bgColor: 'bg-emerald-50',
              textColor: 'text-emerald-700',
              trend: '+22%'
            },
            {
              titulo: 'Eficiencia',
              valor: `${analisisCompleto.estadisticas.eficienciaGeneral}%`,
              subtitulo: 'Tasa de resolución',
              icon: 'TrendingUp',
              color: 'from-green-500 to-green-600',
              bgColor: 'bg-green-50',
              textColor: 'text-green-700',
              trend: '+5%'
            },
            {
              titulo: 'Áreas Activas',
              valor: analisisCompleto.estadisticas.areasUnicas,
              subtitulo: `Max: ${analisisCompleto.estadisticas.areasMasActivas} reportes`,
              icon: 'Building2',
              color: 'from-purple-500 to-purple-600',
              bgColor: 'bg-purple-50',
              textColor: 'text-purple-700',
              trend: '+3%'
            }
          ].map(stat => (
            <div key={stat.titulo} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 hover:shadow-lg transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon name={stat.icon} size={20} className={stat.textColor} />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  stat.trend?.startsWith('+')
                    ? 'bg-green-100 text-green-700'
                    : stat.trend?.startsWith('-')
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {stat.trend}
                </span>
              </div>
              <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                {stat.valor}
              </div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">
                {stat.titulo}
              </h3>
              <p className="text-xs text-slate-500 leading-tight">
                {stat.subtitulo}
              </p>
            </div>
          ))}
        </div>

        {/* Dashboard Principal Estilo Power BI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Estados de Reportes - Donut Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Icon name="PieChart" size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-slate-800">Estados de Reportes</h3>
              </div>
              <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                Distribución actual
              </div>
            </div>
            {analisisCompleto.estadoData && analisisCompleto.estadoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={analisisCompleto.estadoData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="cantidad"
                    label={({estado, percent}) => `${(percent * 100).toFixed(1)}%`}
                    labelLine={false}
                    fontSize={12}
                  >
                    {analisisCompleto.estadoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '12px'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Icon name="PieChart" size={48} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">No hay datos de estados</p>
                </div>
              </div>
            )}
          </div>

          {/* Eficiencia por Categoría */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Icon name="TrendingUp" size={20} className="text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-800">Eficiencia por Categoría</h3>
              </div>
              <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                % Resolución
              </div>
            </div>
            {analisisCompleto.eficienciaPorCategoria && analisisCompleto.eficienciaPorCategoria.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analisisCompleto.eficienciaPorCategoria} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="categoria"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value, name) => [`${value}%`, 'Eficiencia']}
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '12px'
                    }}
                  />
                  <Bar
                    dataKey="eficiencia"
                    radius={[0, 4, 4, 0]}
                    stroke="white"
                    strokeWidth={1}
                  >
                    {analisisCompleto.eficienciaPorCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Icon name="TrendingUp" size={48} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">No hay datos de eficiencia</p>
                </div>
              </div>
            )}
          </div>

          {/* Reportes por Día de la Semana */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Icon name="Calendar" size={20} className="text-purple-600" />
                <h3 className="text-lg font-bold text-slate-800">Patrón Semanal</h3>
              </div>
              <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                Distribución semanal
              </div>
            </div>
            {analisisCompleto.reportesPorDia && analisisCompleto.reportesPorDia.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analisisCompleto.reportesPorDia}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="dia"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip
                    formatter={(value, name) => [value, 'Reportes']}
                    labelFormatter={(label) => `${label}`}
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '12px'
                    }}
                  />
                  <Bar
                    dataKey="reportes"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    stroke="white"
                    strokeWidth={1}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Icon name="Calendar" size={48} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">No hay datos semanales</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gráficos de Tendencias Avanzados */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Tendencia Mensual - Línea de tiempo completa */}
          <div className="xl:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Icon name="TrendingUp" size={20} className="text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-800">Tendencia Histórica (12 meses)</h3>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-slate-600">Incidencias</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-600">Supervisiones</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-slate-600">Abordajes</span>
                </div>
              </div>
            </div>
            {analisisCompleto.tendenciaMensual && analisisCompleto.tendenciaMensual.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={analisisCompleto.tendenciaMensual} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <defs>
                    <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '12px'
                    }}
                    labelFormatter={(label) => `Mes: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#totalGradient)"
                    name="Total"
                  />
                  <Bar dataKey="incidencias" fill="#ef4444" name="Incidencias" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="supervisiones" fill="#3b82f6" name="Supervisiones" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="abordajes" fill="#10b981" name="Abordajes" radius={[2, 2, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="eficiencia"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    name="Eficiencia %"
                    yAxisId="right"
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Icon name="TrendingUp" size={48} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">No hay datos de tendencia</p>
                </div>
              </div>
            )}
          </div>

          {/* Top Áreas - Mejorado */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Icon name="Building2" size={20} className="text-amber-600" />
                <h3 className="text-lg font-bold text-slate-800">Top 10 Áreas</h3>
              </div>
              <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                Más reportes
              </div>
            </div>
            {analisisCompleto.areaData && analisisCompleto.areaData.length > 0 ? (
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {analisisCompleto.areaData.slice(0, 10).map((area, index) => {
                  const maxCantidad = Math.max(...analisisCompleto.areaData.map(a => a.cantidad));
                  const porcentaje = (area.cantidad / maxCantidad) * 100;
                  return (
                    <div key={index} className="flex items-center space-x-3 py-2">
                      <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded text-white text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-slate-700 truncate" title={area.area}>
                            {area.area}
                          </p>
                          <span className="text-sm font-bold text-amber-600">
                            {area.cantidad}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${porcentaje}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Icon name="Building2" size={48} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">No hay datos de áreas</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Heatmap de Actividad por Hora */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Icon name="Clock" size={20} className="text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-800">Patrón de Actividad por Hora</h3>
            </div>
            <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
              Intensidad de reportes
            </div>
          </div>
          {analisisCompleto.reportesPorHora && analisisCompleto.reportesPorHora.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={analisisCompleto.reportesPorHora} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <XAxis
                  dataKey="hora"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval={1}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(value, name) => [value, 'Reportes']}
                  labelFormatter={(label) => `Hora: ${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '12px'
                  }}
                />
                <Bar
                  dataKey="reportes"
                  radius={[2, 2, 0, 0]}
                >
                  {analisisCompleto.reportesPorHora.map((entry, index) => {
                    const intensity = entry.intensidad || 0;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={`rgba(99, 102, 241, ${Math.max(0.1, intensity)})`}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[120px] flex items-center justify-center text-slate-500">
              <p className="text-sm">No hay suficientes datos para mostrar el patrón horario</p>
            </div>
          )}
        </div>

        {/* Mensaje cuando no hay datos */}
        {reportesFiltrados.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon name="BarChart3" size={32} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-3">
                No hay reportes en el período seleccionado
              </h3>
              <p className="text-slate-500 mb-6">
                Ajusta los filtros de fecha o tipo de reporte para ver los análisis avanzados.
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