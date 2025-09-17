import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { dbHelpers } from '../../services/supabase';
import { Icon } from '../common/Icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const InvestigacionDashboard = () => {
  const [investigaciones, setInvestigaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroTiempo, setFiltroTiempo] = useState('todo');
  const [filtroGravedad, setFiltroGravedad] = useState('todos');

  // Cargar datos de investigaciones
  useEffect(() => {
    cargarInvestigaciones();
  }, []);

  const cargarInvestigaciones = async () => {
    try {
      setLoading(true);
      const data = await dbHelpers.getAll('investigaciones_accidentes', {
        orderBy: 'created_at',
        ascending: false
      });

      // Validación defensiva
      const investigacionesValidas = Array.isArray(data) ? data : [];
      setInvestigaciones(investigacionesValidas);
      setError("");
    } catch (err) {
      console.error('Error cargando investigaciones:', err);
      setError("Error al cargar las investigaciones");
      setInvestigaciones([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtros aplicados con validación defensiva
  const investigacionesFiltradas = useMemo(() => {
    let filtradas = Array.isArray(investigaciones) ? investigaciones : [];

    // Filtro por tiempo
    if (filtroTiempo !== 'todo') {
      const ahora = new Date();
      let fechaLimite;

      switch (filtroTiempo) {
        case 'mes':
          fechaLimite = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
          break;
        case 'trimestre':
          fechaLimite = new Date(ahora.getFullYear(), ahora.getMonth() - 3, 1);
          break;
        case 'ano':
          fechaLimite = new Date(ahora.getFullYear(), 0, 1);
          break;
        default:
          fechaLimite = null;
      }

      if (fechaLimite) {
        filtradas = filtradas.filter(inv => {
          const fechaAccidente = inv.fecha_accidente ? new Date(inv.fecha_accidente) : null;
          return fechaAccidente && fechaAccidente >= fechaLimite;
        });
      }
    }

    // Filtro por gravedad
    if (filtroGravedad !== 'todos') {
      filtradas = filtradas.filter(inv =>
        inv.gravedad && inv.gravedad.toLowerCase() === filtroGravedad.toLowerCase()
      );
    }

    return filtradas;
  }, [investigaciones, filtroTiempo, filtroGravedad]);

  // Análisis estadístico con validación defensiva
  const analisisEstadistico = useMemo(() => {
    const investigacionesValidas = Array.isArray(investigacionesFiltradas) ? investigacionesFiltradas : [];

    // Estadísticas generales
    const total = investigacionesValidas.length;
    const enProceso = investigacionesValidas.filter(inv =>
      inv.estado_investigacion &&
      ['iniciada', 'en_proceso'].includes(inv.estado_investigacion)
    ).length;
    const completadas = investigacionesValidas.filter(inv =>
      inv.estado_investigacion &&
      ['completada', 'cerrada'].includes(inv.estado_investigacion)
    ).length;
    const graves = investigacionesValidas.filter(inv =>
      inv.gravedad &&
      ['Grave', 'Muy grave', 'Mortal'].includes(inv.gravedad)
    ).length;

    // Distribución por gravedad
    const distribicionGravedad = investigacionesValidas.reduce((acc, inv) => {
      const gravedad = inv.gravedad || 'Sin clasificar';
      acc[gravedad] = (acc[gravedad] || 0) + 1;
      return acc;
    }, {});

    const gravedadData = Object.entries(distribicionGravedad).map(([gravedad, cantidad]) => ({
      gravedad,
      cantidad,
      color: getColorGravedad(gravedad)
    }));

    // Distribución por área
    const distribicionArea = investigacionesValidas.reduce((acc, inv) => {
      const area = inv.area_accidente || 'Sin área';
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {});

    const areaData = Object.entries(distribicionArea)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([area, cantidad]) => ({
        area: area.length > 20 ? area.substring(0, 20) + '...' : area,
        cantidad
      }));

    // Distribución por tipo de accidente
    const distribicionTipo = investigacionesValidas.reduce((acc, inv) => {
      const tipo = inv.tipo_accidente || 'Sin tipo';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    const tipoData = Object.entries(distribicionTipo)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([tipo, cantidad]) => ({
        tipo: tipo.length > 25 ? tipo.substring(0, 25) + '...' : tipo,
        cantidad
      }));

    // Tendencia mensual (últimos 6 meses)
    const tendenciaMensual = [];
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      const mesYear = `${fecha.toLocaleDateString('es-ES', { month: 'short' })} ${fecha.getFullYear()}`;

      const accidentesDelMes = investigacionesValidas.filter(inv => {
        const fechaAccidente = inv.fecha_accidente ? new Date(inv.fecha_accidente) : null;
        return fechaAccidente &&
               fechaAccidente.getMonth() === fecha.getMonth() &&
               fechaAccidente.getFullYear() === fecha.getFullYear();
      }).length;

      tendenciaMensual.push({
        mes: mesYear,
        accidentes: accidentesDelMes
      });
    }

    return {
      estadisticas: { total, enProceso, completadas, graves },
      gravedadData,
      areaData,
      tipoData,
      tendenciaMensual
    };
  }, [investigacionesFiltradas]);

  // Función para obtener color por gravedad
  const getColorGravedad = (gravedad) => {
    const colores = {
      'Leve': '#10b981',
      'Grave': '#f59e0b',
      'Muy grave': '#ef4444',
      'Mortal': '#7c2d12',
      'Sin clasificar': '#6b7280'
    };
    return colores[gravedad] || '#6b7280';
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'iniciada': '#f59e0b',
      'en_proceso': '#3b82f6',
      'completada': '#10b981',
      'cerrada': '#6b7280',
      'reabierta': '#ef4444'
    };
    return colores[estado] || '#6b7280';
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    try {
      return new Date(fecha).toLocaleDateString('es-ES');
    } catch {
      return 'Fecha inválida';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Cargando investigaciones...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <Icon name="AlertTriangle" size={48} className="mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error al cargar datos</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={cargarInvestigaciones}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-3 shadow-lg">
                <Icon name="AlertTriangle" size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-700 to-orange-600 bg-clip-text text-transparent">
                  Investigación de Accidentes SST
                </h1>
                <p className="text-slate-600 font-medium">
                  Dashboard Analítico • Gestión de Investigaciones • Control de Seguridad
                </p>
              </div>
            </div>

            <Link
              to="/investigacion/nuevo"
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg flex items-center space-x-2"
            >
              <Icon name="Plus" size={20} />
              <span>Nueva Investigación</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Icon name="Filter" size={16} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Filtros:</span>
            </div>

            <select
              value={filtroTiempo}
              onChange={(e) => setFiltroTiempo(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="todo">Todo el tiempo</option>
              <option value="mes">Este mes</option>
              <option value="trimestre">Último trimestre</option>
              <option value="ano">Este año</option>
            </select>

            <select
              value={filtroGravedad}
              onChange={(e) => setFiltroGravedad(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="todos">Todas las gravedades</option>
              <option value="leve">Leve</option>
              <option value="grave">Grave</option>
              <option value="muy grave">Muy grave</option>
              <option value="mortal">Mortal</option>
            </select>

            <div className="text-sm text-slate-600">
              Mostrando {investigacionesFiltradas.length} de {investigaciones.length} investigaciones
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Investigaciones</p>
                <p className="text-3xl font-bold text-slate-900">{analisisEstadistico.estadisticas.total}</p>
              </div>
              <div className="bg-blue-100 rounded-xl p-3">
                <Icon name="FileText" size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">En Proceso</p>
                <p className="text-3xl font-bold text-orange-600">{analisisEstadistico.estadisticas.enProceso}</p>
              </div>
              <div className="bg-orange-100 rounded-xl p-3">
                <Icon name="Clock" size={24} className="text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Completadas</p>
                <p className="text-3xl font-bold text-green-600">{analisisEstadistico.estadisticas.completadas}</p>
              </div>
              <div className="bg-green-100 rounded-xl p-3">
                <Icon name="CheckCircle" size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Accidentes Graves</p>
                <p className="text-3xl font-bold text-red-600">{analisisEstadistico.estadisticas.graves}</p>
              </div>
              <div className="bg-red-100 rounded-xl p-3">
                <Icon name="AlertTriangle" size={24} className="text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Distribución por gravedad */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Icon name="PieChart" size={24} className="text-orange-600" />
              <h3 className="text-xl font-bold text-slate-800">Distribución por Gravedad</h3>
            </div>
            {analisisEstadistico.gravedadData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analisisEstadistico.gravedadData}
                    dataKey="cantidad"
                    nameKey="gravedad"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ gravedad, cantidad }) => `${gravedad}: ${cantidad}`}
                  >
                    {analisisEstadistico.gravedadData.map((entry, index) => (
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
                  <p>No hay datos de gravedad disponibles</p>
                </div>
              </div>
            )}
          </div>

          {/* Tendencia mensual */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Icon name="TrendingUp" size={24} className="text-blue-600" />
              <h3 className="text-xl font-bold text-slate-800">Tendencia Mensual</h3>
            </div>
            {analisisEstadistico.tendenciaMensual.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analisisEstadistico.tendenciaMensual}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="accidentes"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
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
        </div>

        {/* Gráficos de áreas y tipos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top áreas con accidentes */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Icon name="Building2" size={24} className="text-purple-600" />
              <h3 className="text-xl font-bold text-slate-800">Top Áreas con Accidentes</h3>
            </div>
            {analisisEstadistico.areaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analisisEstadistico.areaData} layout="horizontal">
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
                  <Bar dataKey="cantidad" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
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

          {/* Tipos de accidentes */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Icon name="AlertCircle" size={24} className="text-red-600" />
              <h3 className="text-xl font-bold text-slate-800">Tipos de Accidentes</h3>
            </div>
            {analisisEstadistico.tipoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analisisEstadistico.tipoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="tipo" tick={{ fontSize: 10, fill: '#64748b' }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="cantidad" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Icon name="AlertCircle" size={48} className="mx-auto mb-3 text-slate-300" />
                  <p>No hay datos de tipos disponibles</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lista de investigaciones recientes */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Icon name="List" size={24} className="text-slate-600" />
                <h3 className="text-xl font-bold text-slate-800">Investigaciones Recientes</h3>
              </div>
              <span className="text-sm text-slate-600">
                {investigacionesFiltradas.length} investigaciones
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {investigacionesFiltradas.length === 0 ? (
              <div className="p-12 text-center">
                <Icon name="FileText" size={48} className="mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No hay investigaciones</h3>
                <p className="text-slate-500 mb-6">No se encontraron investigaciones con los filtros aplicados</p>
                <Link
                  to="/investigacion/nuevo"
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 inline-flex items-center space-x-2"
                >
                  <Icon name="Plus" size={20} />
                  <span>Nueva Investigación</span>
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Caso
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Gravedad
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Área
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Persona Afectada
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Investigador
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {investigacionesFiltradas.slice(0, 20).map((investigacion, index) => (
                    <tr key={investigacion.id || index} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {investigacion.numero_caso || 'Sin número'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {investigacion.lugar_accidente || 'Lugar no especificado'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {formatearFecha(investigacion.fecha_accidente)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${getColorGravedad(investigacion.gravedad)}20`,
                            color: getColorGravedad(investigacion.gravedad)
                          }}
                        >
                          {investigacion.gravedad || 'Sin clasificar'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="max-w-32 truncate">
                          {investigacion.area_accidente || 'Sin área'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="max-w-32 truncate">
                          {investigacion.persona_afectada || 'No especificada'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${getEstadoColor(investigacion.estado_investigacion)}20`,
                            color: getEstadoColor(investigacion.estado_investigacion)
                          }}
                        >
                          {investigacion.estado_investigacion || 'Sin estado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="max-w-32 truncate">
                          {investigacion.investigador_principal || 'No asignado'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestigacionDashboard;