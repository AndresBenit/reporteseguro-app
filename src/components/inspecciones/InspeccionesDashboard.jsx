import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbHelpers } from '../../services/supabase';
import { Icon } from '../common/Icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';

// DEFENSIVE: Define color functions BEFORE any useMemo hooks
const getEstadoColor = (estado) => {
  const colors = {
    programada: '#3B82F6',    // blue
    en_proceso: '#F59E0B',    // amber
    completada: '#10B981',    // emerald
    cancelada: '#EF4444'      // red
  };
  return colors[estado] || '#6B7280'; // gray default
};

const getPrioridadColor = (prioridad) => {
  const colors = {
    baja: '#10B981',      // emerald
    media: '#F59E0B',     // amber
    alta: '#EF4444',      // red
    critica: '#991B1B'    // dark red
  };
  return colors[prioridad] || '#6B7280'; // gray default
};

const getColorByIndex = (index) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
  return colors[index % colors.length];
};

const InspeccionesDashboard = () => {
  const navigate = useNavigate();

  // DEFENSIVE: Initialize all states with safe defaults
  const [inspecciones, setInspecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    prioridad: 'todos',
    tipo: 'todos',
    fechaInicio: '',
    fechaFin: ''
  });

  // DEFENSIVE: Safe data processing with multiple fallbacks
  const inspeccionesSeguras = useMemo(() => {
    if (!Array.isArray(inspecciones)) return [];
    return inspecciones.filter(insp => insp && typeof insp === 'object');
  }, [inspecciones]);

  // DEFENSIVE: Statistics with safe calculations
  const estadisticas = useMemo(() => {
    const total = inspeccionesSeguras.length;

    if (total === 0) {
      return {
        total: 0,
        programadas: 0,
        completadas: 0,
        enProceso: 0,
        canceladas: 0,
        porcentajeCompletadas: 0,
        promedioCalificacion: 0,
        inspeccionesMes: 0
      };
    }

    const programadas = inspeccionesSeguras.filter(i => i.estado === 'programada').length;
    const completadas = inspeccionesSeguras.filter(i => i.estado === 'completada').length;
    const enProceso = inspeccionesSeguras.filter(i => i.estado === 'en_proceso').length;
    const canceladas = inspeccionesSeguras.filter(i => i.estado === 'cancelada').length;

    // DEFENSIVE: Safe percentage calculation
    const porcentajeCompletadas = total > 0 ? Math.round((completadas / total) * 100) : 0;

    // DEFENSIVE: Safe average calculation
    const inspeccionesConCalificacion = inspeccionesSeguras.filter(i =>
      i.porcentaje_cumplimiento != null &&
      typeof i.porcentaje_cumplimiento === 'number'
    );
    const promedioCalificacion = inspeccionesConCalificacion.length > 0
      ? Math.round(inspeccionesConCalificacion.reduce((sum, i) => sum + i.porcentaje_cumplimiento, 0) / inspeccionesConCalificacion.length)
      : 0;

    // DEFENSIVE: Safe month calculation
    const fechaActual = new Date();
    const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
    const inspeccionesMes = inspeccionesSeguras.filter(i => {
      if (!i.fecha_programada) return false;
      const fechaInspeccion = new Date(i.fecha_programada);
      return fechaInspeccion >= inicioMes;
    }).length;

    return {
      total,
      programadas,
      completadas,
      enProceso,
      canceladas,
      porcentajeCompletadas,
      promedioCalificacion,
      inspeccionesMes
    };
  }, [inspeccionesSeguras]);

  // DEFENSIVE: Safe chart data with fallbacks
  const datosGraficos = useMemo(() => {
    // Estados para pie chart
    const estadosData = [
      { name: 'Programadas', value: estadisticas.programadas, color: getEstadoColor('programada') },
      { name: 'En Proceso', value: estadisticas.enProceso, color: getEstadoColor('en_proceso') },
      { name: 'Completadas', value: estadisticas.completadas, color: getEstadoColor('completada') },
      { name: 'Canceladas', value: estadisticas.canceladas, color: getEstadoColor('cancelada') }
    ].filter(item => item.value > 0);

    // Tipos de inspección para bar chart
    const tiposCount = {};
    inspeccionesSeguras.forEach(insp => {
      const tipo = insp.tipo_inspeccion || 'Sin especificar';
      tiposCount[tipo] = (tiposCount[tipo] || 0) + 1;
    });

    const tiposData = Object.entries(tiposCount).map(([tipo, count]) => ({
      tipo: tipo.length > 15 ? tipo.substring(0, 15) + '...' : tipo,
      cantidad: count
    }));

    // Prioridades para bar chart
    const prioridadesCount = {};
    inspeccionesSeguras.forEach(insp => {
      const prioridad = insp.prioridad || 'Sin especificar';
      prioridadesCount[prioridad] = (prioridadesCount[prioridad] || 0) + 1;
    });

    const prioridadesData = Object.entries(prioridadesCount).map(([prioridad, count]) => ({
      prioridad: prioridad.charAt(0).toUpperCase() + prioridad.slice(1),
      cantidad: count,
      color: getPrioridadColor(prioridad)
    }));

    // Tendencia mensual para line chart
    const tendenciaData = [];
    const fechaActual = new Date();

    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
      const siguienteMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i + 1, 1);

      const inspeccionesMes = inspeccionesSeguras.filter(insp => {
        if (!insp.fecha_programada) return false;
        const fechaInsp = new Date(insp.fecha_programada);
        return fechaInsp >= fecha && fechaInsp < siguienteMes;
      }).length;

      tendenciaData.push({
        mes: fecha.toLocaleDateString('es-ES', { month: 'short' }),
        inspecciones: inspeccionesMes
      });
    }

    return {
      estados: estadosData,
      tipos: tiposData,
      prioridades: prioridadesData,
      tendencia: tendenciaData
    };
  }, [inspeccionesSeguras, estadisticas]);

  // DEFENSIVE: Safe data loading with error handling
  const cargarInspecciones = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await dbHelpers.getAll('inspecciones_sst', {
        orderBy: 'fecha_programada',
        ascending: false
      });

      // DEFENSIVE: Validate response
      if (Array.isArray(data)) {
        setInspecciones(data);
      } else {
        console.warn('Respuesta inesperada del servidor:', data);
        setInspecciones([]);
        setError('Formato de datos inesperado');
      }

    } catch (error) {
      console.error('Error cargando inspecciones:', error);
      setError('Error al cargar las inspecciones');
      setInspecciones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarInspecciones();
  }, []);

  // DEFENSIVE: Safe filtering with validation
  const inspeccionesFiltradas = useMemo(() => {
    return inspeccionesSeguras.filter(insp => {
      if (filtros.estado !== 'todos' && insp.estado !== filtros.estado) return false;
      if (filtros.prioridad !== 'todos' && insp.prioridad !== filtros.prioridad) return false;
      if (filtros.tipo !== 'todos' && insp.tipo_inspeccion !== filtros.tipo) return false;

      if (filtros.fechaInicio && insp.fecha_programada) {
        if (new Date(insp.fecha_programada) < new Date(filtros.fechaInicio)) return false;
      }

      if (filtros.fechaFin && insp.fecha_programada) {
        if (new Date(insp.fecha_programada) > new Date(filtros.fechaFin)) return false;
      }

      return true;
    });
  }, [inspeccionesSeguras, filtros]);

  // DEFENSIVE: Get unique values safely
  const tiposUnicos = useMemo(() => {
    const tipos = new Set();
    inspeccionesSeguras.forEach(insp => {
      if (insp.tipo_inspeccion) tipos.add(insp.tipo_inspeccion);
    });
    return Array.from(tipos).sort();
  }, [inspeccionesSeguras]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando inspecciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <Icon name="AlertCircle" size={20} className="text-red-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Cards de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Inspecciones</p>
              <p className="text-3xl font-bold text-slate-900">{estadisticas.total}</p>
            </div>
            <div className="bg-teal-100 rounded-full p-3">
              <Icon name="CheckSquare" size={24} className="text-teal-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-teal-600 font-medium">{estadisticas.inspeccionesMes}</span>
            <span className="text-slate-600 ml-1">este mes</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Completadas</p>
              <p className="text-3xl font-bold text-emerald-600">{estadisticas.completadas}</p>
            </div>
            <div className="bg-emerald-100 rounded-full p-3">
              <Icon name="CheckCircle" size={24} className="text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-emerald-600 font-medium">{estadisticas.porcentajeCompletadas}%</span>
            <span className="text-slate-600 ml-1">del total</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">En Proceso</p>
              <p className="text-3xl font-bold text-amber-600">{estadisticas.enProceso}</p>
            </div>
            <div className="bg-amber-100 rounded-full p-3">
              <Icon name="Clock" size={24} className="text-amber-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-amber-600 font-medium">Activas</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Promedio Cumplimiento</p>
              <p className="text-3xl font-bold text-blue-600">{estadisticas.promedioCalificacion}%</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Icon name="TrendingUp" size={24} className="text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-blue-600 font-medium">Calidad</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Icon name="Filter" size={20} className="text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800">Filtros</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="todos">Todos</option>
              <option value="programada">Programadas</option>
              <option value="en_proceso">En Proceso</option>
              <option value="completada">Completadas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Prioridad</label>
            <select
              value={filtros.prioridad}
              onChange={(e) => setFiltros(prev => ({ ...prev, prioridad: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="todos">Todas</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="todos">Todos</option>
              {tiposUnicos.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Inicio</label>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Fin</label>
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estados de Inspecciones */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Icon name="PieChart" size={20} className="mr-2 text-teal-600" />
            Estados de Inspecciones
          </h3>
          {datosGraficos.estados.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={datosGraficos.estados}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {datosGraficos.estados.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500">
              <div className="text-center">
                <Icon name="PieChart" size={48} className="mx-auto text-slate-300 mb-3" />
                <p>No hay datos disponibles</p>
              </div>
            </div>
          )}
        </div>

        {/* Tipos de Inspección */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Icon name="BarChart3" size={20} className="mr-2 text-blue-600" />
            Tipos de Inspección
          </h3>
          {datosGraficos.tipos.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosGraficos.tipos} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="tipo"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500">
              <div className="text-center">
                <Icon name="BarChart3" size={48} className="mx-auto text-slate-300 mb-3" />
                <p>No hay datos disponibles</p>
              </div>
            </div>
          )}
        </div>

        {/* Prioridades */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Icon name="AlertTriangle" size={20} className="mr-2 text-amber-600" />
            Distribución por Prioridad
          </h3>
          {datosGraficos.prioridades.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosGraficos.prioridades} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="prioridad" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad">
                  {datosGraficos.prioridades.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500">
              <div className="text-center">
                <Icon name="AlertTriangle" size={48} className="mx-auto text-slate-300 mb-3" />
                <p>No hay datos disponibles</p>
              </div>
            </div>
          )}
        </div>

        {/* Tendencia Mensual */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Icon name="TrendingUp" size={20} className="mr-2 text-green-600" />
            Tendencia Mensual
          </h3>
          {datosGraficos.tendencia.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={datosGraficos.tendencia} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="inspecciones"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500">
              <div className="text-center">
                <Icon name="TrendingUp" size={48} className="mx-auto text-slate-300 mb-3" />
                <p>No hay datos disponibles</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de Inspecciones */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center">
            <Icon name="FileText" size={20} className="mr-2 text-slate-600" />
            Inspecciones Recientes ({inspeccionesFiltradas.length})
          </h3>
          <button
            onClick={() => navigate('/inspecciones')}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center space-x-2"
          >
            <Icon name="Plus" size={16} />
            <span>Nueva Inspección</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Área
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Inspector
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Cumplimiento
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {inspeccionesFiltradas.slice(0, 10).map((inspeccion) => (
                <tr key={inspeccion.id} className="hover:bg-slate-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">
                      {inspeccion.titulo || 'Sin título'}
                    </div>
                    {inspeccion.ubicacion_especifica && (
                      <div className="text-sm text-slate-500">
                        {inspeccion.ubicacion_especifica}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {inspeccion.tipo_inspeccion || 'No especificado'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {inspeccion.area_inspeccion || 'No especificada'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {inspeccion.inspector_responsable || 'No asignado'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {inspeccion.fecha_programada
                      ? new Date(inspeccion.fecha_programada).toLocaleDateString('es-ES')
                      : 'Sin fecha'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize`}
                      style={{
                        backgroundColor: `${getEstadoColor(inspeccion.estado)}15`,
                        color: getEstadoColor(inspeccion.estado)
                      }}
                    >
                      {inspeccion.estado?.replace('_', ' ') || 'Sin estado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize`}
                      style={{
                        backgroundColor: `${getPrioridadColor(inspeccion.prioridad)}15`,
                        color: getPrioridadColor(inspeccion.prioridad)
                      }}
                    >
                      {inspeccion.prioridad || 'Sin prioridad'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {inspeccion.porcentaje_cumplimiento != null
                      ? `${inspeccion.porcentaje_cumplimiento}%`
                      : 'Pendiente'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {inspeccionesFiltradas.length === 0 && (
          <div className="text-center py-12">
            <Icon name="Search" size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No se encontraron inspecciones</h3>
            <p className="text-slate-500 mb-4">No hay inspecciones que coincidan con los filtros seleccionados.</p>
            <button
              onClick={() => navigate('/inspecciones')}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Crear Primera Inspección
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspeccionesDashboard;