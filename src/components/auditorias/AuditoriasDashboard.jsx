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
const getTipoAuditoriaColor = (tipo) => {
  const colors = {
    'Interna': '#3B82F6',      // blue
    'Externa': '#F59E0B',      // amber
    'Gubernamental': '#EF4444', // red
    'Certificación': '#10B981', // emerald
    'Seguimiento': '#8B5CF6'   // violet
  };
  return colors[tipo] || '#6B7280'; // gray default
};

const getEstadoAuditoriaColor = (estado) => {
  const colors = {
    'planificada': '#3B82F6',    // blue
    'en_ejecucion': '#F59E0B',   // amber
    'en_revision': '#8B5CF6',    // violet
    'cerrada': '#10B981',        // emerald
    'cancelada': '#EF4444'       // red
  };
  return colors[estado] || '#6B7280'; // gray default
};

const getHallazgoColor = (tipo) => {
  const colors = {
    'No Conformidad Mayor': '#EF4444',    // red
    'No Conformidad Menor': '#F59E0B',    // amber
    'Observación': '#3B82F6',             // blue
    'Oportunidad de Mejora': '#10B981',   // emerald
    'Fortaleza': '#06B6D4'                // cyan
  };
  return colors[tipo] || '#6B7280'; // gray default
};

const getColorByIndex = (index) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
  return colors[index % colors.length];
};

const AuditoriasDashboard = () => {
  const navigate = useNavigate();

  // DEFENSIVE: Initialize all states with safe defaults
  const [auditorias, setAuditorias] = useState([]);
  const [hallazgos, setHallazgos] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    estado: 'todos',
    año: new Date().getFullYear().toString(),
    fechaInicio: '',
    fechaFin: ''
  });

  // DEFENSIVE: Safe data processing with multiple fallbacks
  const auditoriasSeguras = useMemo(() => {
    if (!Array.isArray(auditorias)) return [];
    return auditorias.filter(aud => aud && typeof aud === 'object');
  }, [auditorias]);

  const hallazgosSeguras = useMemo(() => {
    if (!Array.isArray(hallazgos)) return [];
    return hallazgos.filter(hall => hall && typeof hall === 'object');
  }, [hallazgos]);

  // DEFENSIVE: Statistics with safe calculations
  const estadisticas = useMemo(() => {
    const total = auditoriasSeguras.length;
    const añoActual = new Date().getFullYear();

    if (total === 0) {
      return {
        total: 0,
        auditoriasAño: 0,
        enEjecucion: 0,
        completadas: 0,
        hallazgosAbiertos: 0,
        noConformidadesMayores: 0,
        porcentajeCompletadas: 0,
        promedioHallazgosPorAuditoria: 0
      };
    }

    // Auditorías del año actual
    const auditoriasAño = auditoriasSeguras.filter(a => {
      if (!a.fecha_programada) return false;
      const fechaAud = new Date(a.fecha_programada);
      return fechaAud.getFullYear() === añoActual;
    }).length;

    const enEjecucion = auditoriasSeguras.filter(a => a.estado_auditoria === 'en_ejecucion').length;
    const completadas = auditoriasSeguras.filter(a => a.estado_auditoria === 'cerrada').length;

    // DEFENSIVE: Safe percentage calculation
    const porcentajeCompletadas = total > 0 ? Math.round((completadas / total) * 100) : 0;

    // Hallazgos statistics
    const hallazgosAbiertos = hallazgosSeguras.filter(h =>
      h.estado_hallazgo === 'abierto' || h.estado_hallazgo === 'en_proceso'
    ).length;

    const noConformidadesMayores = hallazgosSeguras.filter(h =>
      h.tipo_hallazgo === 'No Conformidad Mayor'
    ).length;

    // DEFENSIVE: Safe average calculation
    const promedioHallazgosPorAuditoria = total > 0
      ? Math.round((hallazgosSeguras.length / total) * 10) / 10
      : 0;

    return {
      total,
      auditoriasAño,
      enEjecucion,
      completadas,
      hallazgosAbiertos,
      noConformidadesMayores,
      porcentajeCompletadas,
      promedioHallazgosPorAuditoria
    };
  }, [auditoriasSeguras, hallazgosSeguras]);

  // DEFENSIVE: Safe chart data with fallbacks
  const datosGraficos = useMemo(() => {
    // Estados para pie chart
    const estadosData = [
      { name: 'Planificadas', value: auditoriasSeguras.filter(a => a.estado_auditoria === 'planificada').length, color: getEstadoAuditoriaColor('planificada') },
      { name: 'En Ejecución', value: auditoriasSeguras.filter(a => a.estado_auditoria === 'en_ejecucion').length, color: getEstadoAuditoriaColor('en_ejecucion') },
      { name: 'En Revisión', value: auditoriasSeguras.filter(a => a.estado_auditoria === 'en_revision').length, color: getEstadoAuditoriaColor('en_revision') },
      { name: 'Cerradas', value: auditoriasSeguras.filter(a => a.estado_auditoria === 'cerrada').length, color: getEstadoAuditoriaColor('cerrada') },
      { name: 'Canceladas', value: auditoriasSeguras.filter(a => a.estado_auditoria === 'cancelada').length, color: getEstadoAuditoriaColor('cancelada') }
    ].filter(item => item.value > 0);

    // Tipos de auditoría para bar chart
    const tiposCount = {};
    auditoriasSeguras.forEach(aud => {
      const tipo = aud.tipo_auditoria || 'Sin especificar';
      tiposCount[tipo] = (tiposCount[tipo] || 0) + 1;
    });

    const tiposData = Object.entries(tiposCount).map(([tipo, count]) => ({
      tipo,
      cantidad: count,
      color: getTipoAuditoriaColor(tipo)
    }));

    // Hallazgos por tipo
    const hallazgosCount = {};
    hallazgosSeguras.forEach(hall => {
      const tipo = hall.tipo_hallazgo || 'Sin especificar';
      hallazgosCount[tipo] = (hallazgosCount[tipo] || 0) + 1;
    });

    const hallazgosData = Object.entries(hallazgosCount).map(([tipo, count]) => ({
      tipo: tipo.length > 20 ? tipo.substring(0, 20) + '...' : tipo,
      cantidad: count,
      color: getHallazgoColor(tipo)
    }));

    // Tendencia mensual de auditorías
    const tendenciaData = [];
    const fechaActual = new Date();

    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
      const siguienteMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i + 1, 1);

      const auditoriasDelMes = auditoriasSeguras.filter(aud => {
        if (!aud.fecha_programada) return false;
        const fechaAud = new Date(aud.fecha_programada);
        return fechaAud >= fecha && fechaAud < siguienteMes;
      }).length;

      const hallazgosDelMes = hallazgosSeguras.filter(hall => {
        if (!hall.created_at) return false;
        const fechaHall = new Date(hall.created_at);
        return fechaHall >= fecha && fechaHall < siguienteMes;
      }).length;

      tendenciaData.push({
        mes: fecha.toLocaleDateString('es-ES', { month: 'short' }),
        auditorias: auditoriasDelMes,
        hallazgos: hallazgosDelMes
      });
    }

    return {
      estados: estadosData,
      tipos: tiposData,
      hallazgos: hallazgosData,
      tendencia: tendenciaData
    };
  }, [auditoriasSeguras, hallazgosSeguras]);

  // DEFENSIVE: Safe data loading with error handling
  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      const [auditoriasRes, hallazgosRes, programasRes] = await Promise.all([
        dbHelpers.getAll('auditorias_sst', {
          orderBy: 'fecha_programada',
          ascending: false
        }),
        dbHelpers.getAll('hallazgos_auditoria', {
          orderBy: 'created_at',
          ascending: false
        }),
        dbHelpers.getAll('programas_auditoria', {
          orderBy: 'año',
          ascending: false
        })
      ]);

      // DEFENSIVE: Validate responses
      setAuditorias(Array.isArray(auditoriasRes) ? auditoriasRes : []);
      setHallazgos(Array.isArray(hallazgosRes) ? hallazgosRes : []);
      setProgramas(Array.isArray(programasRes) ? programasRes : []);

    } catch (error) {
      console.error('Error cargando datos de auditorías:', error);
      setError('Error al cargar los datos de auditorías');
      setAuditorias([]);
      setHallazgos([]);
      setProgramas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // DEFENSIVE: Safe filtering with validation
  const auditoriasFiltradas = useMemo(() => {
    return auditoriasSeguras.filter(aud => {
      if (filtros.tipo !== 'todos' && aud.tipo_auditoria !== filtros.tipo) return false;
      if (filtros.estado !== 'todos' && aud.estado_auditoria !== filtros.estado) return false;

      if (filtros.año !== 'todos' && aud.fecha_programada) {
        const fechaAud = new Date(aud.fecha_programada);
        if (fechaAud.getFullYear().toString() !== filtros.año) return false;
      }

      if (filtros.fechaInicio && aud.fecha_programada) {
        if (new Date(aud.fecha_programada) < new Date(filtros.fechaInicio)) return false;
      }

      if (filtros.fechaFin && aud.fecha_programada) {
        if (new Date(aud.fecha_programada) > new Date(filtros.fechaFin)) return false;
      }

      return true;
    });
  }, [auditoriasSeguras, filtros]);

  // DEFENSIVE: Get unique values safely
  const tiposUnicos = useMemo(() => {
    const tipos = new Set();
    auditoriasSeguras.forEach(aud => {
      if (aud.tipo_auditoria) tipos.add(aud.tipo_auditoria);
    });
    return Array.from(tipos).sort();
  }, [auditoriasSeguras]);

  const añosUnicos = useMemo(() => {
    const años = new Set();
    auditoriasSeguras.forEach(aud => {
      if (aud.fecha_programada) {
        const año = new Date(aud.fecha_programada).getFullYear();
        años.add(año.toString());
      }
    });
    return Array.from(años).sort().reverse();
  }, [auditoriasSeguras]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando auditorías...</p>
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
              <p className="text-sm font-medium text-slate-600">Total Auditorías</p>
              <p className="text-3xl font-bold text-slate-900">{estadisticas.total}</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <Icon name="Settings" size={24} className="text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-purple-600 font-medium">{estadisticas.auditoriasAño}</span>
            <span className="text-slate-600 ml-1">este año</span>
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
              <p className="text-sm font-medium text-slate-600">En Ejecución</p>
              <p className="text-3xl font-bold text-amber-600">{estadisticas.enEjecucion}</p>
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
              <p className="text-sm font-medium text-slate-600">Hallazgos Abiertos</p>
              <p className="text-3xl font-bold text-orange-600">{estadisticas.hallazgosAbiertos}</p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <Icon name="AlertTriangle" size={24} className="text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-red-600 font-medium">{estadisticas.noConformidadesMayores}</span>
            <span className="text-slate-600 ml-1">NC Mayores</span>
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Auditoría</label>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="todos">Todos</option>
              {tiposUnicos.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="todos">Todos</option>
              <option value="planificada">Planificadas</option>
              <option value="en_ejecucion">En Ejecución</option>
              <option value="en_revision">En Revisión</option>
              <option value="cerrada">Cerradas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Año</label>
            <select
              value={filtros.año}
              onChange={(e) => setFiltros(prev => ({ ...prev, año: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="todos">Todos</option>
              {añosUnicos.map(año => (
                <option key={año} value={año}>{año}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Inicio</label>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Fecha Fin</label>
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estados de Auditorías */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Icon name="PieChart" size={20} className="mr-2 text-purple-600" />
            Estados de Auditorías
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

        {/* Tipos de Auditoría */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Icon name="BarChart3" size={20} className="mr-2 text-blue-600" />
            Tipos de Auditoría
          </h3>
          {datosGraficos.tipos.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosGraficos.tipos} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tipo" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad">
                  {datosGraficos.tipos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
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

        {/* Hallazgos por Tipo */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Icon name="AlertTriangle" size={20} className="mr-2 text-orange-600" />
            Hallazgos por Tipo
          </h3>
          {datosGraficos.hallazgos.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosGraficos.hallazgos} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                <Bar dataKey="cantidad">
                  {datosGraficos.hallazgos.map((entry, index) => (
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
                  dataKey="auditorias"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  name="Auditorías"
                />
                <Line
                  type="monotone"
                  dataKey="hallazgos"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                  name="Hallazgos"
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

      {/* Tabla de Auditorías */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center">
            <Icon name="Settings" size={20} className="mr-2 text-slate-600" />
            Auditorías Recientes ({auditoriasFiltradas.length})
          </h3>
          <button
            onClick={() => navigate('/auditorias')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Icon name="Plus" size={16} />
            <span>Nueva Auditoría</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Alcance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Auditor Líder
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Hallazgos
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {auditoriasFiltradas.slice(0, 10).map((auditoria) => (
                <tr key={auditoria.id} className="hover:bg-slate-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">
                      {auditoria.codigo_auditoria || 'Sin código'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}
                      style={{
                        backgroundColor: `${getTipoAuditoriaColor(auditoria.tipo_auditoria)}15`,
                        color: getTipoAuditoriaColor(auditoria.tipo_auditoria)
                      }}
                    >
                      {auditoria.tipo_auditoria || 'Sin tipo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    <div className="max-w-xs truncate">
                      {auditoria.alcance_auditoria || 'Sin alcance definido'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {auditoria.auditor_lider || 'No asignado'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {auditoria.fecha_programada
                      ? new Date(auditoria.fecha_programada).toLocaleDateString('es-ES')
                      : 'Sin fecha'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize`}
                      style={{
                        backgroundColor: `${getEstadoAuditoriaColor(auditoria.estado_auditoria)}15`,
                        color: getEstadoAuditoriaColor(auditoria.estado_auditoria)
                      }}
                    >
                      {auditoria.estado_auditoria?.replace('_', ' ') || 'Sin estado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {/* Placeholder para contar hallazgos relacionados */}
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                      {hallazgosSeguras.filter(h => h.auditoria_id === auditoria.id).length}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {auditoriasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <Icon name="Search" size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No se encontraron auditorías</h3>
            <p className="text-slate-500 mb-4">No hay auditorías que coincidan con los filtros seleccionados.</p>
            <button
              onClick={() => navigate('/auditorias')}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Planificar Primera Auditoría
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditoriasDashboard;