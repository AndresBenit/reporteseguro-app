import React, { useState, useEffect } from 'react';
import { dbHelpers } from '../../services/supabase';
import { Icon } from '../common/Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const PerfilIndividual = () => {
  const [colaboradores, setColaboradores] = useState([]);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [abordajes, setAbordajes] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [selectedColaborador, setSelectedColaborador] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [colaboradoresFiltrados, setColaboradoresFiltrados] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar colaboradores
        const colaboradoresData = await dbHelpers.getAll('colaboradores', {
          orderBy: 'nombre',
          ascending: true
        });
        setColaboradores(colaboradoresData);

        // Cargar recomendaciones
        const recomendacionesData = await dbHelpers.getAll('recomendaciones_campo');
        setRecomendaciones(recomendacionesData);

        // Cargar abordajes
        const abordajesData = await dbHelpers.getAll('abordajes_campo');
        setAbordajes(abordajesData);

        // Cargar reportes (incluye EPP, incidencias, etc.)
        const reportesData = await dbHelpers.getAll('reportes');
        setReportes(Array.isArray(reportesData) ? reportesData : []);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscriptions
    const colaboradoresSubscription = dbHelpers.subscribe('colaboradores', () => fetchData());
    const recomendacionesSubscription = dbHelpers.subscribe('recomendaciones_campo', () => fetchData());
    const abordajesSubscription = dbHelpers.subscribe('abordajes_campo', () => fetchData());
    const reportesSubscription = dbHelpers.subscribe('reportes', () => fetchData());

    return () => {
      if (colaboradoresSubscription) colaboradoresSubscription.unsubscribe();
      if (recomendacionesSubscription) recomendacionesSubscription.unsubscribe();
      if (abordajesSubscription) abordajesSubscription.unsubscribe();
      if (reportesSubscription) reportesSubscription.unsubscribe();
    };
  }, []);

  // Filtrar colaboradores para búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setColaboradoresFiltrados([]);
      setShowSugerencias(false);
    } else {
      const filtrados = colaboradores
        .filter(col =>
          col.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          col.cedula.includes(searchTerm)
        )
        .slice(0, 10);
      setColaboradoresFiltrados(filtrados);
      setShowSugerencias(filtrados.length > 0);
    }
  }, [searchTerm, colaboradores]);

  // Manejar búsqueda
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Seleccionar colaborador
  const seleccionarColaborador = (colaborador) => {
    setSelectedColaborador(colaborador);
    setSearchTerm(colaborador.nombre);
    setShowSugerencias(false);
  };

  // Limpiar selección
  const limpiarSeleccion = () => {
    setSelectedColaborador(null);
    setSearchTerm('');
    setShowSugerencias(false);
  };

  // Cerrar sugerencias
  const handleBlur = () => {
    setTimeout(() => setShowSugerencias(false), 200);
  };

  // Obtener todas las intervenciones del colaborador seleccionado
  const getIntervencionesColaborador = () => {
    if (!selectedColaborador) return [];

    const recsColaborador = recomendaciones
      .filter(rec => rec.colaborador?.id === selectedColaborador.id)
      .map(rec => ({ ...rec, tipo: 'recomendacion' }));

    const abordajesColaborador = abordajes
      .filter(abordaje => abordaje.colaborador?.id === selectedColaborador.id)
      .map(abordaje => ({ ...abordaje, tipo: 'abordaje' }));

    // Reportes del colaborador (EPP, incidencias, etc.)
    const reportesValidos = Array.isArray(reportes) ? reportes : [];
    const reportesColaborador = reportesValidos
      .filter(reporte =>
        reporte.reportante === selectedColaborador.nombre ||
        reporte.reportante === selectedColaborador.cedula ||
        (reporte.descripcion &&
         reporte.descripcion.toLowerCase().includes(selectedColaborador.nombre.toLowerCase()))
      )
      .map(reporte => ({
        ...reporte,
        tipo: reporte.tipo || 'incidencia',
        hallazgo: reporte.descripcion || reporte.observaciones || 'Sin descripción',
        recomendacion: reporte.accionesTomadas || reporte.medidas || 'Sin acciones específicas',
        lugarLabor: reporte.ubicacion || reporte.lugar || 'No especificado'
      }));

    // Combinar y ordenar por fecha
    const todasIntervenciones = [...recsColaborador, ...abordajesColaborador, ...reportesColaborador]
      .sort((a, b) => {
        if (!a.fecha || !b.fecha) return 0;
        return new Date(b.fecha) - new Date(a.fecha);
      });

    return todasIntervenciones;
  };

  // Estadísticas del colaborador
  const getEstadisticasColaborador = () => {
    const todasIntervenciones = getIntervencionesColaborador();

    if (todasIntervenciones.length === 0) {
      return {
        totalRecomendaciones: 0,
        totalAbordajes: 0,
        totalReportes: 0,
        totalEPP: 0,
        totalIncidencias: 0,
        totalIntervenciones: 0,
        ultimaIntervencion: null,
        lugares: {},
        tendenciaMensual: [],
        tiposHallazgos: []
      };
    }

    // Contar por tipo
    const recomendacionesCount = todasIntervenciones.filter(i => i.tipo === 'recomendacion').length;
    const abordajesCount = todasIntervenciones.filter(i => i.tipo === 'abordaje').length;
    const eppCount = todasIntervenciones.filter(i => i.tipo === 'epp').length;
    const incidenciasCount = todasIntervenciones.filter(i => i.tipo === 'incidencia' || i.tipo === 'incidente').length;
    const reportesCount = eppCount + incidenciasCount;

    // Contar por lugares
    const lugares = {};
    todasIntervenciones.forEach(intervencion => {
      const lugar = intervencion.lugarLabor || 'Sin especificar';
      lugares[lugar] = (lugares[lugar] || 0) + 1;
    });

    // Tendencia mensual (últimos 6 meses)
    const meses = [];
    const ahora = new Date();

    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      meses.push({
        mes: fecha.toLocaleDateString('es-ES', { month: 'short' }),
        fecha: fecha,
        recomendaciones: 0,
        abordajes: 0,
        epp: 0,
        incidencias: 0,
        total: 0
      });
    }

    todasIntervenciones.forEach(intervencion => {
      if (intervencion.fecha) {
        const fechaInt = new Date(intervencion.fecha);
        const mesIndex = meses.findIndex(m =>
          m.fecha.getMonth() === fechaInt.getMonth() &&
          m.fecha.getFullYear() === fechaInt.getFullYear()
        );

        if (mesIndex !== -1) {
          if (intervencion.tipo === 'recomendacion') {
            meses[mesIndex].recomendaciones++;
          } else if (intervencion.tipo === 'abordaje') {
            meses[mesIndex].abordajes++;
          } else if (intervencion.tipo === 'epp') {
            meses[mesIndex].epp = (meses[mesIndex].epp || 0) + 1;
          } else {
            meses[mesIndex].incidencias = (meses[mesIndex].incidencias || 0) + 1;
          }
          meses[mesIndex].total++;
        }
      }
    });

    // Tipos de hallazgos (palabras clave)
    const tiposHallazgos = {};
    todasIntervenciones.forEach(intervencion => {
      if (intervencion.hallazgo) {
        const hallazgo = intervencion.hallazgo.toLowerCase();
        if (hallazgo.includes('epp') || hallazgo.includes('casco') || hallazgo.includes('guantes')) {
          tiposHallazgos['EPP'] = (tiposHallazgos['EPP'] || 0) + 1;
        } else if (hallazgo.includes('procedimiento') || hallazgo.includes('norma')) {
          tiposHallazgos['Procedimientos'] = (tiposHallazgos['Procedimientos'] || 0) + 1;
        } else if (hallazgo.includes('orden') || hallazgo.includes('aseo') || hallazgo.includes('limpieza')) {
          tiposHallazgos['Orden y Aseo'] = (tiposHallazgos['Orden y Aseo'] || 0) + 1;
        } else {
          tiposHallazgos['Otros'] = (tiposHallazgos['Otros'] || 0) + 1;
        }
      }
    });

    return {
      totalRecomendaciones: recomendacionesCount,
      totalAbordajes: abordajesCount,
      totalReportes: reportesCount,
      totalEPP: eppCount,
      totalIncidencias: incidenciasCount,
      totalIntervenciones: todasIntervenciones.length,
      ultimaIntervencion: todasIntervenciones[0]?.fecha,
      lugares,
      tendenciaMensual: meses,
      tiposHallazgos
    };
  };

  // Datos para gráficas
  const stats = getEstadisticasColaborador();

  // Top 3 lugares
  const topLugares = Object.entries(stats.lugares)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([lugar, cantidad]) => ({ lugar, cantidad }));

  // Tipos de hallazgos para pie chart
  const tiposHallazgosPie = Object.entries(stats.tiposHallazgos)
    .map(([tipo, cantidad]) => ({ tipo, cantidad }));

  const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'];

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center p-8">
          <Icon name="User" size={48} color="#6b7280" className="mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Cargando perfiles...</h2>
          <p className="text-gray-500">Conectando con la base de datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Icon name="User" size={28} color="white" />
              </div>
              <h1 className="text-3xl font-bold">
                Perfil Individual
              </h1>
            </div>
            <p className="text-purple-100 text-lg">
              Análisis detallado de seguridad por colaborador • {colaboradores.length} colaboradores disponibles
            </p>
          </div>

          {selectedColaborador && (
            <div className="flex items-center gap-4 bg-white bg-opacity-15 p-4 rounded-xl backdrop-blur-sm">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-white to-gray-100 flex items-center justify-center text-purple-600 font-bold text-xl shadow-md">
                {selectedColaborador.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-lg">{selectedColaborador.nombre}</div>
                <div className="text-purple-100 text-sm">
                  {selectedColaborador.area} • {stats.totalIntervenciones} intervenciones
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Search" size={20} color="#374151" />
          <h3 className="text-lg font-semibold text-gray-900">Buscar Colaborador</h3>
        </div>

        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-2xl">
            <Icon name="Search" size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Escribe el nombre o cédula del colaborador..."
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => searchTerm && setShowSugerencias(colaboradoresFiltrados.length > 0)}
              onBlur={handleBlur}
              className={`w-full pl-12 pr-4 py-4 text-base border-2 rounded-xl transition-all ${
                selectedColaborador
                  ? 'border-green-300 bg-green-50 ring-green-100'
                  : 'border-gray-300 bg-white focus:border-purple-500 focus:ring-purple-100'
              } focus:ring-4`}
            />

            {/* Indicador de selección */}
            {selectedColaborador && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500 text-xl">
                <Icon name="CheckCircle" size={20} />
              </div>
            )}

            {/* Lista de sugerencias */}
            {showSugerencias && (
              <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-b-xl shadow-lg max-h-80 overflow-y-auto">
                {colaboradoresFiltrados.map(colaborador => {
                  const recsColaborador = recomendaciones.filter(r => r.colaborador?.id === colaborador.id);
                  const abordajesColaborador = abordajes.filter(a => a.colaborador?.id === colaborador.id);
                  const reportesValidos = Array.isArray(reportes) ? reportes : [];
                  const reportesColaborador = reportesValidos.filter(reporte =>
                    reporte.reportante === colaborador.nombre ||
                    reporte.reportante === colaborador.cedula ||
                    (reporte.descripcion &&
                     reporte.descripcion.toLowerCase().includes(colaborador.nombre.toLowerCase()))
                  );
                  const totalIntervenciones = recsColaborador.length + abordajesColaborador.length + reportesColaborador.length;

                  return (
                    <div
                      key={colaborador.id}
                      onClick={() => seleccionarColaborador(colaborador)}
                      className="p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-all hover:translate-x-1 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {colaborador.nombre.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">{colaborador.nombre}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Icon name="FileText" size={12} />
                          <span>{colaborador.cedula}</span>
                          <Icon name="Building" size={12} />
                          <span>{colaborador.area}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                          totalIntervenciones > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {totalIntervenciones} intervenciones
                        </span>
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                          colaborador.area === 'Centro Industrial'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <Icon
                            name={colaborador.area === 'Centro Industrial' ? 'Building' : 'Flame'}
                            size={10}
                            className="inline mr-1"
                          />
                          {colaborador.area === 'Centro Industrial' ? 'CI' : 'HS'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botón limpiar */}
          {selectedColaborador && (
            <button
              onClick={limpiarSeleccion}
              className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:-translate-y-1 hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Icon name="Trash2" size={16} />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Dashboard del Colaborador Seleccionado */}
      {selectedColaborador ? (
        <div className="space-y-6">
          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white text-center shadow-sm">
              <div className="text-3xl font-bold mb-2">{stats.totalRecomendaciones}</div>
              <div className="text-sm font-medium opacity-90 flex items-center justify-center gap-1">
                <Icon name="Lightbulb" size={14} />
                Recomendaciones
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-5 text-white text-center shadow-sm">
              <div className="text-3xl font-bold mb-2">{stats.totalAbordajes}</div>
              <div className="text-sm font-medium opacity-90 flex items-center justify-center gap-1">
                <Icon name="RotateCcw" size={14} />
                Abordajes
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-5 text-white text-center shadow-sm">
              <div className="text-3xl font-bold mb-2">{stats.totalEPP}</div>
              <div className="text-sm font-medium opacity-90 flex items-center justify-center gap-1">
                <Icon name="Shield" size={14} />
                Control EPP
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-5 text-white text-center shadow-sm">
              <div className="text-3xl font-bold mb-2">{stats.totalIncidencias}</div>
              <div className="text-sm font-medium opacity-90 flex items-center justify-center gap-1">
                <Icon name="AlertTriangle" size={14} />
                Incidencias
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-5 text-white text-center shadow-sm">
              <div className="text-3xl font-bold mb-2">{stats.totalIntervenciones}</div>
              <div className="text-sm font-medium opacity-90 flex items-center justify-center gap-1">
                <Icon name="BarChart3" size={14} />
                Total
              </div>
            </div>

            <div className={`rounded-xl p-5 text-white text-center shadow-sm ${
              stats.ultimaIntervencion
                ? 'bg-gradient-to-r from-purple-600 to-purple-700'
                : 'bg-gradient-to-r from-gray-600 to-gray-700'
            }`}>
              <div className="text-2xl font-bold mb-2">
                {stats.ultimaIntervencion ?
                  (() => {
                    const diasDiferencia = Math.floor((new Date() - new Date(stats.ultimaIntervencion)) / (1000 * 60 * 60 * 24));
                    return diasDiferencia === 0 ? 'Hoy' : `${diasDiferencia}d`;
                  })() :
                  'N/A'
                }
              </div>
              <div className="text-sm font-medium opacity-90 flex items-center justify-center gap-1">
                <Icon name="Clock" size={14} />
                Última Actividad
              </div>
            </div>
          </div>

          {/* Info del Colaborador */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-5 mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {selectedColaborador.nombre.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedColaborador.nombre}</h2>
                <div className="text-gray-600 flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Icon name="FileText" size={16} />
                    {selectedColaborador.cedula}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="Building" size={16} />
                    {selectedColaborador.area}
                  </span>
                  {selectedColaborador.activo !== false && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm font-semibold flex items-center gap-1">
                      <Icon name="CheckCircle" size={14} />
                      Activo
                    </span>
                  )}
                </div>
              </div>

              {stats.ultimaIntervencion && (
                <div className="text-right bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Última intervención:</div>
                  <div className="font-semibold text-gray-900">
                    {new Date(stats.ultimaIntervencion).toLocaleDateString('es-ES')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {stats.totalIntervenciones > 0 ? (
            <>
              {/* Gráficas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tendencia Mensual */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Icon name="TrendingUp" size={20} />
                      Tendencia Mensual
                    </h3>
                    <span className="bg-gray-100 px-3 py-1 rounded-lg text-sm font-medium text-gray-600">
                      Últimos 6 meses
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={stats.tendenciaMensual} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <XAxis
                        dataKey="mes"
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickLine={{ stroke: '#e5e7eb' }}
                        gridLine={{ stroke: '#f3f4f6' }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="recomendaciones"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2, fill: 'white' }}
                        name="Recomendaciones"
                      />
                      <Line
                        type="monotone"
                        dataKey="abordajes"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 2, fill: 'white' }}
                        name="Abordajes"
                      />
                      <Line
                        type="monotone"
                        dataKey="epp"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2, fill: 'white' }}
                        name="Control EPP"
                      />
                      <Line
                        type="monotone"
                        dataKey="incidencias"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: 'white' }}
                        name="Incidencias"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Lugares */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Icon name="MapPin" size={20} />
                      Lugares Más Frecuentes
                    </h3>
                    <span className="bg-yellow-100 px-3 py-1 rounded-lg text-sm font-medium text-yellow-800">
                      Top {Math.min(topLugares.length, 3)}
                    </span>
                  </div>
                  {topLugares.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={topLugares} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <XAxis
                          dataKey="lugar"
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickLine={{ stroke: '#e5e7eb' }}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickLine={{ stroke: '#e5e7eb' }}
                          gridLine={{ stroke: '#f3f4f6' }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Bar
                          dataKey="cantidad"
                          fill="url(#colorGradient)"
                          radius={[6, 6, 0, 0]}
                        />
                        <defs>
                          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={1}/>
                            <stop offset="95%" stopColor="#d97706" stopOpacity={1}/>
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-gray-500 py-16">
                      <Icon name="MapPin" size={48} color="#d1d5db" className="mx-auto mb-4" />
                      <h4 className="font-medium mb-2">No hay datos de lugares</h4>
                      <p className="text-sm">Las intervenciones aparecerán aquí cuando se registren</p>
                    </div>
                  )}
                </div>

                {/* Tipos de Hallazgos */}
                {tiposHallazgosPie.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Icon name="PieChart" size={20} />
                        Tipos de Hallazgos
                      </h3>
                      <span className="bg-blue-100 px-3 py-1 rounded-lg text-sm font-medium text-blue-800">
                        Distribución
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={tiposHallazgosPie}
                          dataKey="cantidad"
                          nameKey="tipo"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          innerRadius={40}
                          label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                          labelLine={false}
                        >
                          {tiposHallazgosPie.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Historial Detallado */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Icon name="FileText" size={20} />
                      Historial Completo
                    </h3>
                    <span className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm font-medium">
                      {stats.totalIntervenciones} registros
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {getIntervencionesColaborador().slice(0, 10).map((intervencion, index) => (
                      <div
                        key={intervencion.id || index}
                        className="p-5 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all border-l-4"
                        style={{ borderLeftColor: intervencion.tipo === 'recomendacion' ? '#f59e0b' : '#10b981' }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold text-white uppercase tracking-wide ${
                              intervencion.tipo === 'recomendacion' ? 'bg-orange-500' : 'bg-green-500'
                            }`}>
                              <Icon
                                name={intervencion.tipo === 'recomendacion' ? 'Lightbulb' : 'RotateCcw'}
                                size={12}
                                className="inline mr-1"
                              />
                              {intervencion.tipo === 'recomendacion' ? 'Recomendación' : 'Abordaje'}
                            </span>
                            <div className="bg-gray-100 px-3 py-1 rounded-lg text-sm font-medium text-gray-600 flex items-center gap-1">
                              <Icon name="Calendar" size={12} />
                              {new Date(intervencion.fecha).toLocaleDateString('es-ES')}
                            </div>
                            <div className="bg-yellow-100 px-3 py-1 rounded-lg text-sm font-medium text-yellow-800 flex items-center gap-1">
                              <Icon name="MapPin" size={12} />
                              {intervencion.lugarLabor}
                            </div>
                          </div>
                          {intervencion.fotoFirmada && (
                            <button
                              onClick={() => window.open(intervencion.fotoFirmada, '_blank')}
                              className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:scale-105 transition-transform shadow-md flex items-center gap-1"
                            >
                              <Icon name="Camera" size={12} />
                              Ver Evidencia
                            </button>
                          )}
                        </div>

                        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                            <Icon name="Search" size={14} />
                            Hallazgo Identificado
                          </div>
                          <p className="text-gray-900 leading-relaxed">
                            {intervencion.hallazgo}
                          </p>
                        </div>

                        <div className={`p-4 rounded-lg border ${
                          intervencion.tipo === 'recomendacion'
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-green-50 border-green-200'
                        }`}>
                          <div className={`text-sm font-bold mb-2 flex items-center gap-1 ${
                            intervencion.tipo === 'recomendacion' ? 'text-orange-800' : 'text-green-800'
                          }`}>
                            <Icon
                              name={intervencion.tipo === 'recomendacion' ? 'Lightbulb' : 'RotateCcw'}
                              size={14}
                            />
                            {intervencion.tipo === 'recomendacion' ? 'Recomendación Aplicada' : 'Abordaje Realizado'}
                          </div>
                          <p className="text-gray-900 leading-relaxed">
                            {intervencion.tipo === 'recomendacion' ? intervencion.recomendacion : intervencion.abordaje}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {stats.totalIntervenciones > 10 && (
                    <p className="text-center mt-6 text-gray-500">
                      Mostrando 10 de {stats.totalIntervenciones} intervenciones
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <Icon name="Award" size={64} color="#d1d5db" className="mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-600 mb-2">
                Excelente Desempeño
              </h3>
              <p className="text-gray-600">
                Este colaborador no tiene recomendaciones registradas
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <Icon name="Search" size={64} color="#d1d5db" className="mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Selecciona un Colaborador
          </h3>
          <p className="text-gray-500">
            Usa el buscador para encontrar y analizar el perfil de un colaborador
          </p>
        </div>
      )}
    </div>
  );
};

export default PerfilIndividual;