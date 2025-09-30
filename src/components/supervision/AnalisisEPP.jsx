import React, { useState, useMemo } from 'react';
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
import { useColaboradores } from '../../hooks/useColaboradores';
import { Icon } from '../common/Icons';

const AnalisisEPP = ({ reportes: reportesProp }) => {
  // Usar reportes desde props (viene de App.jsx con realtime activo)
  const reportes = reportesProp || [];
  const loading = false; // Ya no necesitamos loading porque los reportes vienen cargados
  const { colaboradores, loading: loadingColaboradores } = useColaboradores();
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 30);
    return fecha.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Filtrar solo reportes EPP
  const reportesEPP = useMemo(() => {
    return reportes.filter(r => r.tipo === 'epp' || r.tipo_reporte === 'epp');
  }, [reportes]);

  // Mapa de colaboradores para lookup rápido
  const colaboradoresMap = useMemo(() => {
    const map = {};
    if (Array.isArray(colaboradores)) {
      colaboradores.forEach(c => {
        if (c?.nombre) {
          map[c.nombre.toUpperCase().trim()] = c;
        }
      });
    }
    return map;
  }, [colaboradores]);

  // Filtros de fecha por rango
  const reportesFiltrados = useMemo(() => {
    if (!fechaInicio || !fechaFin) return reportesEPP;

    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);
    fechaFinDate.setHours(23, 59, 59, 999); // Incluir todo el día final

    return reportesEPP.filter(reporte => {
      const fechaReporte = new Date(reporte.created_at);
      return fechaReporte >= fechaInicioDate && fechaReporte <= fechaFinDate;
    });
  }, [reportesEPP, fechaInicio, fechaFin]);

  // Funciones auxiliares de colores (Memorizadas para evitar re-renders)
  const getColorByElement = React.useCallback((elemento) => {
    const colors = {
      'Casco': '#ef4444',
      'Guantes': '#3b82f6',
      'Botas': '#8b5cf6',
      'Chaleco': '#f59e0b',
      'Gafas': '#10b981',
      'Tapabocas': '#ec4899',
      'Auriculares': '#6366f1'
    };
    return colors[elemento] || '#6b7280';
  }, []);

  const getColorByArea = React.useCallback((area) => {
    const hash = area.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    return colors[Math.abs(hash) % colors.length];
  }, []);

  // 📊 ANÁLISIS DE DATOS EPP
  const analisisEPP = useMemo(() => {
    // Validar que reportesFiltrados sea un array
    const reportesValidos = Array.isArray(reportesFiltrados) ? reportesFiltrados : [];

    // Extraer todos los elementos EPP normalizando formato antiguo y nuevo
    const todosLosElementos = [];
    const todosLosNombresElementos = new Set();

    reportesValidos.forEach(reporte => {
      const persona = reporte?.colaboradorinvolucrado || 'Anónimo';

      // Buscar área del colaborador (SOLO usar área del colaborador, no del reporte)
      const personaKey = persona.toUpperCase().trim();
      const colaborador = colaboradoresMap[personaKey];
      const area = colaborador?.area || 'Sin área'; // Solo área del colaborador

      const fecha = reporte?.created_at;

      // FORMATO NUEVO: elementos_epp es un array
      if (Array.isArray(reporte?.elementos_epp) && reporte.elementos_epp.length > 0) {
        reporte.elementos_epp.forEach(elem => {
          const nombreElem = elem?.nombre || 'Sin especificar';
          const cantidadElem = Number(elem?.cantidad) || 1;

          todosLosElementos.push({
            nombre: nombreElem,
            cantidad: cantidadElem > 0 ? cantidadElem : 1,
            persona,
            area,
            fecha
          });
          todosLosNombresElementos.add(nombreElem);
        });
      }
      // FORMATO ANTIGUO: elemento_epp es string y cantidad es campo directo
      else if (reporte?.elemento_epp) {
        const nombreElem = reporte.elemento_epp;
        const cantidadElem = Number(reporte?.cantidad) || 1;

        todosLosElementos.push({
          nombre: nombreElem,
          cantidad: cantidadElem > 0 ? cantidadElem : 1,
          persona,
          area,
          fecha
        });
        todosLosNombresElementos.add(nombreElem);
      }
    });

    // 1. Estadísticas generales
    const totalElementosEntregados = todosLosElementos.reduce((sum, elem) => sum + elem.cantidad, 0);
    const elementosUnicos = Array.from(todosLosNombresElementos);
    const personasAtendidas = [...new Set(reportesValidos.map(r => r?.colaboradorinvolucrado).filter(Boolean))];
    // Áreas únicas de colaboradores (extraídas de todosLosElementos que ya tiene área del colaborador)
    const areasAtendidas = [...new Set(todosLosElementos.map(e => e.area).filter(Boolean))];

    // 2. EPP más pedidos (Top 5) - usando cantidades reales
    const elementosMasPedidos = todosLosElementos.reduce((acc, elem) => {
      acc[elem.nombre] = (acc[elem.nombre] || 0) + elem.cantidad;
      return acc;
    }, {});

    const top5Elementos = Object.entries(elementosMasPedidos)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([elemento, cantidad]) => ({
        elemento: elemento || 'Sin especificar',
        cantidad: isNaN(cantidad) ? 0 : cantidad,
        color: getColorByElement(elemento)
      }))
      .filter(item => item.cantidad > 0);

    // 3. Entregas por área - usando cantidades reales
    const entregasPorArea = todosLosElementos.reduce((acc, elem) => {
      acc[elem.area] = (acc[elem.area] || 0) + elem.cantidad;
      return acc;
    }, {});

    const areasMasActivas = Object.entries(entregasPorArea)
      .sort(([,a], [,b]) => b - a)
      .map(([area, cantidad]) => ({
        area: area && area.length > 15 ? area.substring(0, 15) + '...' : (area || 'Sin área'),
        cantidad: isNaN(cantidad) ? 0 : cantidad,
        color: getColorByArea(area || 'Sin área')
      }))
      .filter(item => item.cantidad > 0);

    // 4. Personas que han pedido EPP - usando cantidades reales
    const personasConEPP = todosLosElementos.reduce((acc, elem) => {
      acc[elem.persona] = (acc[elem.persona] || 0) + elem.cantidad;
      return acc;
    }, {});

    const topPersonas = Object.entries(personasConEPP)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([persona, cantidad]) => ({
        persona: persona && persona.length > 20 ? persona.substring(0, 20) + '...' : (persona || 'Anónimo'),
        cantidad: isNaN(cantidad) ? 0 : cantidad
      }))
      .filter(item => item.cantidad > 0);

    // 5. Entregas por mes (últimos 6 meses) - usando cantidades reales
    const entregasPorMes = [];
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      const mesYear = `${fecha.toLocaleDateString('es-ES', { month: 'short' })} ${fecha.getFullYear()}`;

      const entregasDelMes = todosLosElementos
        .filter(elem => {
          if (!elem.fecha) return false;
          const fechaElem = new Date(elem.fecha);
          return fechaElem.getMonth() === fecha.getMonth() &&
                 fechaElem.getFullYear() === fecha.getFullYear();
        })
        .reduce((sum, elem) => sum + elem.cantidad, 0);

      entregasPorMes.push({
        mes: mesYear,
        entregas: entregasDelMes
      });
    }

    return {
      estadisticas: {
        totalElementosEntregados: isNaN(totalElementosEntregados) ? 0 : totalElementosEntregados,
        elementosUnicos: isNaN(elementosUnicos.length) ? 0 : elementosUnicos.length,
        personasAtendidas: isNaN(personasAtendidas.length) ? 0 : personasAtendidas.length,
        areasAtendidas: isNaN(areasAtendidas.length) ? 0 : areasAtendidas.length
      },
      top5Elementos: top5Elementos || [],
      areasMasActivas: areasMasActivas || [],
      topPersonas: topPersonas || [],
      entregasPorMes: entregasPorMes || []
    };
  }, [reportesFiltrados, getColorByElement, getColorByArea, colaboradoresMap]);


  if (loading || loadingColaboradores) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <Icon name="Shield" size={64} className="mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Cargando Análisis EPP</h3>
            <p className="text-slate-500">
              {loading && loadingColaboradores ? 'Cargando datos...' :
               loading ? 'Cargando reportes...' : 'Cargando colaboradores...'}
            </p>
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
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-3 shadow-lg">
                <Icon name="Shield" size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                  Análisis Control EPP
                </h1>
                <p className="text-slate-600 font-medium">
                  Dashboard Completo • Gestión EPP • Distribución • Análisis de Tendencias
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
              <label className="text-sm font-semibold text-slate-700 min-w-fit">Fecha Inicio:</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-center space-x-3">
              <Icon name="Calendar" size={20} className="text-slate-500" />
              <label className="text-sm font-semibold text-slate-700 min-w-fit">Fecha Fin:</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Botones período rápido */}
            <div className="flex items-center space-x-2 ml-auto">
              <span className="text-sm text-slate-500">Rápido:</span>
              {[
                { label: '7d', dias: 7 },
                { label: '30d', dias: 30 },
                { label: '90d', dias: 90 },
                { label: '1a', dias: 365 }
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
                <Icon name="BarChart3" size={16} className="text-emerald-500" />
                <span className="text-slate-600">
                  Analizando: <span className="font-medium">{new Date(fechaInicio).toLocaleDateString('es-ES')} - {new Date(fechaFin).toLocaleDateString('es-ES')}</span>
                </span>
              </div>
              <div className="text-slate-500">
                {reportesFiltrados.length} entregas EPP encontradas
              </div>
            </div>
          </div>
        </div>

        {/* KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              titulo: 'Elementos Entregados',
              valor: analisisEPP.estadisticas.totalElementosEntregados,
              icon: 'Package',
              color: 'from-blue-500 to-blue-600',
              bgColor: 'bg-blue-50',
              textColor: 'text-blue-700'
            },
            {
              titulo: 'Elementos Diferentes',
              valor: analisisEPP.estadisticas.elementosUnicos,
              icon: 'Shield',
              color: 'from-emerald-500 to-emerald-600',
              bgColor: 'bg-emerald-50',
              textColor: 'text-emerald-700'
            },
            {
              titulo: 'Personas Atendidas',
              valor: analisisEPP.estadisticas.personasAtendidas,
              icon: 'Users',
              color: 'from-amber-500 to-amber-600',
              bgColor: 'bg-amber-50',
              textColor: 'text-amber-700'
            },
            {
              titulo: 'Áreas Cubiertas',
              valor: analisisEPP.estadisticas.areasAtendidas,
              icon: 'Building2',
              color: 'from-red-500 to-red-600',
              bgColor: 'bg-red-50',
              textColor: 'text-red-700'
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

        {/* Gráficos principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top 5 EPP más pedidos */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Icon name="Trophy" size={24} className="text-amber-600" />
              <h3 className="text-xl font-bold text-slate-800">Top 5 EPP Más Pedidos</h3>
            </div>
            {analisisEPP.top5Elementos && analisisEPP.top5Elementos.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analisisEPP.top5Elementos}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="elemento"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
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
                  <Icon name="Package" size={48} className="mx-auto mb-3 text-slate-300" />
                  <p>No hay datos de EPP para mostrar</p>
                </div>
              </div>
            )}
        </div>

          {/* Entregas por área */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Icon name="Building2" size={24} className="text-blue-600" />
              <h3 className="text-xl font-bold text-slate-800">Entregas por Área</h3>
            </div>
            {analisisEPP.areasMasActivas && analisisEPP.areasMasActivas.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analisisEPP.areasMasActivas}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="cantidad"
                    label={({area, percent}) => `${area}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {analisisEPP.areasMasActivas.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Icon name="Building2" size={48} className="mx-auto mb-3 text-slate-300" />
                  <p>No hay datos de áreas para mostrar</p>
                </div>
              </div>
            )}
        </div>
      </div>

        {/* Gráficos secundarios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Entregas por mes */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Icon name="TrendingUp" size={24} className="text-emerald-600" />
              <h3 className="text-xl font-bold text-slate-800">Entregas Mensuales</h3>
            </div>
            {analisisEPP.entregasPorMes && analisisEPP.entregasPorMes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analisisEPP.entregasPorMes}>
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
                  <Area
                    type="monotone"
                    dataKey="entregas"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Icon name="TrendingUp" size={48} className="mx-auto mb-3 text-slate-300" />
                  <p>No hay datos mensuales para mostrar</p>
                </div>
              </div>
            )}
        </div>

          {/* Top personas */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Icon name="Users" size={24} className="text-indigo-600" />
              <h3 className="text-xl font-bold text-slate-800">Personas que más EPP han recibido</h3>
            </div>
            {analisisEPP.topPersonas && analisisEPP.topPersonas.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto">
                {analisisEPP.topPersonas.map((persona, index) => (
                  <div key={index} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-b-0">
                    <span className="text-sm text-slate-700 font-medium">
                      {persona.persona}
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      {persona.cantidad}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Icon name="Users" size={48} className="mx-auto mb-3 text-slate-300" />
                  <p>No hay datos de personas para mostrar</p>
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
                <Icon name="Package" size={32} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-3">
                No hay registros de EPP en el período seleccionado
              </h3>
              <p className="text-slate-500 mb-6">
                Ajusta el filtro de fecha o registra algunas entregas de EPP
              </p>
              <button
                onClick={() => {
                  const fin = new Date();
                  const inicio = new Date();
                  inicio.setDate(fin.getDate() - 30);
                  setFechaInicio(inicio.toISOString().split('T')[0]);
                  setFechaFin(fin.toISOString().split('T')[0]);
                }}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
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

export default AnalisisEPP;