import React, { useState, useEffect } from 'react';
import { supabase, dbHelpers } from '../../services/supabase';
import { useReportes } from '../../hooks/useReportes';
import { Icon } from '../common/Icons';

const ReportesHistorialMejorado = () => {
  const {
    reportes,
    loading,
    actualizarEstado,
    eliminarReporte,
    isUpdating
  } = useReportes();

  // Debug logs
  console.log('[HISTORIAL] Estado actual:', {
    reportes: reportes,
    reportesCount: reportes?.length || 0,
    loading,
    isArray: Array.isArray(reportes)
  });

  // Cargar datos de supervision y abordajes
  useEffect(() => {
    const loadSupervisionData = async () => {
      try {
        setLoadingSupervision(true);

        // TEMPORAL: Actualizar abordajes con estado "completado" a "pendiente"
        try {
          const { data: abordajesCompletados } = await supabase
            .from('abordajes_campo')
            .select('id')
            .eq('estado', 'completado');

          if (abordajesCompletados && abordajesCompletados.length > 0) {
            console.log('[HISTORIAL] Actualizando', abordajesCompletados.length, 'abordajes de completado a pendiente...');

            await supabase
              .from('abordajes_campo')
              .update({ estado: 'pendiente' })
              .eq('estado', 'completado');

            console.log('[HISTORIAL] ✅ Abordajes actualizados a pendiente');
          }
        } catch (updateError) {
          console.error('[HISTORIAL] Error actualizando abordajes:', updateError);
        }

        // Cargar supervision_campo
        const supervisionData = await dbHelpers.getAll('supervision_campo', {
          orderBy: 'created_at',
          ascending: false
        });

        // Cargar abordajes_campo
        const abordajesData = await dbHelpers.getAll('abordajes_campo', {
          orderBy: 'created_at',
          ascending: false
        });

        console.log('[HISTORIAL] Datos de supervisión cargados:', {
          supervision: supervisionData.length,
          abordajes: abordajesData.length
        });

        setSupervisionCampo(supervisionData);
        setAbordajesCampo(abordajesData);

      } catch (error) {
        console.error('[HISTORIAL] Error cargando datos de supervisión:', error);
      } finally {
        setLoadingSupervision(false);
      }
    };

    loadSupervisionData();
  }, []);

  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState({
    desde: '',
    hasta: ''
  });
  const [paginaActual, setPaginaActual] = useState({
    incidencia: 1,
    recomendacion: 1,
    abordaje: 1
  });
  const [selectedReporte, setSelectedReporte] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [reporteAEditar, setReporteAEditar] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [comentario, setComentario] = useState('');

  // Estados para datos de múltiples tablas
  const [supervisionCampo, setSupervisionCampo] = useState([]);
  const [abordajesCampo, setAbordajesCampo] = useState([]);
  const [loadingSupervision, setLoadingSupervision] = useState(true);

  const reportesPorPagina = 10;

  // Función para manejar actualización de estado según la fuente
  const handleActualizarEstado = async () => {
    if (!reporteAEditar || !nuevoEstado) {
      console.log('[HISTORIAL] Error: faltan datos', { reporteAEditar, nuevoEstado });
      return;
    }

    console.log('[HISTORIAL] Iniciando actualización de estado:', {
      reporteId: reporteAEditar.id,
      estadoActual: reporteAEditar.estado,
      nuevoEstado: nuevoEstado,
      fuente: reporteAEditar.fuente
    });

    try {
      // Actualizar según la tabla de origen
      if (reporteAEditar.fuente === 'reportes') {
        // Usar el hook original para tabla reportes
        await actualizarEstado(reporteAEditar.id, nuevoEstado);
      } else if (reporteAEditar.fuente === 'supervision_campo') {
        // Actualizar directamente en tabla supervision_campo
        await dbHelpers.update('supervision_campo', reporteAEditar.id, { estado: nuevoEstado });
        // Actualizar estado local
        setSupervisionCampo(prev => prev.map(r =>
          r.id === reporteAEditar.id ? { ...r, estado: nuevoEstado } : r
        ));
      } else if (reporteAEditar.fuente === 'abordajes_campo') {
        // Actualizar directamente en tabla abordajes_campo
        await dbHelpers.update('abordajes_campo', reporteAEditar.id, { estado: nuevoEstado });
        // Actualizar estado local
        setAbordajesCampo(prev => prev.map(r =>
          r.id === reporteAEditar.id ? { ...r, estado: nuevoEstado } : r
        ));
      }

      console.log('[HISTORIAL] Estado actualizado exitosamente');
      setShowEstadoModal(false);
      setReporteAEditar(null);
      setNuevoEstado('');
      setComentario('');
    } catch (error) {
      console.error('[HISTORIAL] Error actualizando estado:', error);
      alert(`Error al actualizar el estado del reporte: ${error.message}`);
    }
  };

  // Filtrar reportes
  const reportesFiltrados = reportes.filter(reporte => {
    const cumpleTipo = filtroTipo === 'todos' ||
      reporte.tipo_reporte === filtroTipo ||
      reporte.tipo?.toLowerCase().includes(filtroTipo.toLowerCase());

    const cumpleEstado = filtroEstado === 'todos' ||
      reporte.estado === filtroEstado;

    let cumpleFecha = true;
    if (filtroFecha.desde && reporte.created_at) {
      const fechaReporte = new Date(reporte.created_at);
      cumpleFecha = cumpleFecha && fechaReporte >= new Date(filtroFecha.desde);
    }
    if (filtroFecha.hasta && reporte.created_at) {
      const fechaReporte = new Date(reporte.created_at);
      cumpleFecha = cumpleFecha && fechaReporte <= new Date(filtroFecha.hasta + 'T23:59:59');
    }

    return cumpleTipo && cumpleEstado && cumpleFecha;
  });

  // Combinar datos de todas las tablas en un formato unificado
  const todosLosReportes = [
    // Reportes de incidencia de tabla 'reportes'
    ...reportesFiltrados.filter(r =>
      r.tipo_reporte === 'incidencia' ||
      r.tipo === 'incidencia'
    ).map(r => ({ ...r, fuente: 'reportes', categoria: 'incidencia' })),

    // Reportes EPP de tabla 'reportes'
    ...reportesFiltrados.filter(r =>
      r.tipo_reporte === 'epp' ||
      r.tipo === 'epp'
    ).map(r => ({ ...r, fuente: 'reportes', categoria: 'epp' })),

    // Supervision de tabla 'supervision_campo' como recomendaciones
    ...supervisionCampo.map(r => ({
      id: r.id,
      created_at: r.created_at,
      descripcion: r.hallazgo,
      area: r.lugar_labor,
      reportante: r.supervisor_reporta,
      estado: r.estado,
      tipo_reporte: 'recomendacion',
      tipo: 'recomendacion',
      severidad: 'media',
      colaborador_nombre: r.colaborador_nombre,
      colaborador_area: r.colaborador_area,
      recomendacion: r.recomendacion,
      evidencia_url: r.evidencia_url,
      firma_url: r.firma_url,
      firmado_por: r.firmado_por,
      fuente: 'supervision_campo',
      categoria: 'recomendacion'
    })),

    // Abordajes de tabla 'abordajes_campo'
    ...abordajesCampo.map(r => ({
      id: r.id,
      created_at: r.created_at,
      descripcion: r.hallazgo,
      area: r.lugar_labor,
      reportante: r.supervisor_reporta,
      estado: r.estado,
      tipo_reporte: 'abordaje',
      tipo: 'abordaje',
      severidad: 'baja',
      colaborador_nombre: r.colaborador_nombre,
      colaborador_area: r.colaborador_area,
      abordaje: r.abordaje,
      firma_url: r.firma_url,
      firmado_por: r.firmado_por,
      fuente: 'abordajes_campo',
      categoria: 'abordaje'
    }))
  ];

  // Agrupar todos los reportes por tipo
  const reportesPorTipo = {
    incidencia: todosLosReportes.filter(r => r.categoria === 'incidencia'),
    recomendacion: todosLosReportes.filter(r => r.categoria === 'recomendacion'),
    abordaje: todosLosReportes.filter(r => r.categoria === 'abordaje'),
    epp: todosLosReportes.filter(r => r.categoria === 'epp')
  };

  // Debug logs de filtrado
  console.log('[HISTORIAL] Reportes combinados:', {
    totalReportes: reportesFiltrados.length,
    totalSupervision: supervisionCampo.length,
    totalAbordajes: abordajesCampo.length,
    totalCombinado: todosLosReportes.length,
    incidencia: reportesPorTipo.incidencia.length,
    recomendacion: reportesPorTipo.recomendacion.length,
    abordaje: reportesPorTipo.abordaje.length,
    epp: reportesPorTipo.epp.length
  });

  // Debug detallado de los primeros reportes combinados
  if (todosLosReportes.length > 0) {
    console.log('[HISTORIAL] Primeros 3 reportes combinados para debug:', todosLosReportes.slice(0, 3).map(r => ({
      id: r.id,
      tipo: r.tipo,
      tipo_reporte: r.tipo_reporte,
      categoria: r.categoria,
      fuente: r.fuente,
      descripcion: r.descripcion?.substring(0, 50) + '...'
    })));
  }

  // Paginación
  const getPaginatedData = (tipo) => {
    const data = reportesPorTipo[tipo] || [];
    const inicio = (paginaActual[tipo] - 1) * reportesPorPagina;
    const fin = inicio + reportesPorPagina;
    return data.slice(inicio, fin);
  };

  const getTotalPaginas = (tipo) => {
    const total = reportesPorTipo[tipo]?.length || 0;
    return Math.ceil(total / reportesPorPagina);
  };

  const cambiarPagina = (tipo, nuevaPagina) => {
    setPaginaActual(prev => ({
      ...prev,
      [tipo]: nuevaPagina
    }));
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColor = (severidad) => {
    const colors = {
      baja: '#10b981',
      media: '#f59e0b',
      alta: '#ef4444',
      critica: '#dc2626'
    };
    return colors[severidad?.toLowerCase()] || '#6b7280';
  };

  const getStatusColor = (estado) => {
    const colors = {
      pendiente: '#f59e0b',
      'en proceso': '#3b82f6',
      proceso: '#3b82f6',
      resuelto: '#10b981',
      cerrado: '#059669'
    };
    return colors[estado?.toLowerCase()] || '#6b7280';
  };

  const verDetalles = (reporte) => {
    setSelectedReporte(reporte);
    setShowModal(true);
  };

  const verImagen = (imagenUrl) => {
    setSelectedImage(imagenUrl);
    setShowImageModal(true);
  };

  const abrirModalEstado = (reporte) => {
    setReporteAEditar(reporte);
    setNuevoEstado(reporte.estado || 'pendiente');
    setComentario('');
    setShowEstadoModal(true);
  };

  const EstadosModal = () => {
    if (!showEstadoModal || !reporteAEditar) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 max-w-lg w-full">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Cambiar Estado del Reporte
          </h3>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nuevo Estado:
            </label>
            <select
              value={nuevoEstado}
              onChange={(e) => setNuevoEstado(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pendiente">Pendiente</option>
              <option value="proceso">En Proceso</option>
              <option value="resuelto">Resuelto</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Comentario (opcional):
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Agregar comentario sobre el cambio de estado..."
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-20 resize-vertical"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowEstadoModal(false)}
              className="px-6 py-2 border-2 border-gray-300 bg-white rounded-lg hover:bg-gray-50 font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleActualizarEstado}
              disabled={isUpdating(reporteAEditar?.id)}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold transition-colors ${
                isUpdating(reporteAEditar?.id)
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-blue-700'
              }`}
            >
              {isUpdating(reporteAEditar?.id) ? 'Actualizando...' : 'Actualizar Estado'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TablaReportes = ({ tipo, titulo, color }) => {
    const datos = getPaginatedData(tipo);
    const totalPaginas = getTotalPaginas(tipo);
    const paginaActualTipo = paginaActual[tipo];

    if (datos.length === 0) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-xl font-bold mb-4" style={{ color }}>
            {titulo} ({reportesPorTipo[tipo]?.length || 0})
          </h3>
          <div className="bg-gray-50 rounded-xl p-10 text-center border border-gray-100">
            <Icon name="FileX" size={48} color="#9ca3af" className="mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No hay reportes de este tipo</p>
            <p className="text-gray-400 text-sm">Los reportes aparecerán aquí cuando se registren</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold" style={{ color }}>
            {titulo} ({reportesPorTipo[tipo]?.length || 0})
          </h3>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => cambiarPagina(tipo, paginaActualTipo - 1)}
                disabled={paginaActualTipo === 1}
                className={`px-3 py-1 border border-gray-300 rounded-md text-sm ${
                  paginaActualTipo === 1
                    ? 'bg-gray-100 cursor-not-allowed'
                    : 'bg-white hover:bg-gray-50 cursor-pointer'
                }`}
              >
                ←
              </button>
              <span className="text-sm text-gray-700 font-medium px-2">
                {paginaActualTipo} de {totalPaginas}
              </span>
              <button
                onClick={() => cambiarPagina(tipo, paginaActualTipo + 1)}
                disabled={paginaActualTipo === totalPaginas}
                className={`px-3 py-1 border border-gray-300 rounded-md text-sm ${
                  paginaActualTipo === totalPaginas
                    ? 'bg-gray-100 cursor-not-allowed'
                    : 'bg-white hover:bg-gray-50 cursor-pointer'
                }`}
              >
                →
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Fecha</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Descripción</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Área</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Reportante</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Severidad</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((reporte) => (
                <tr key={reporte.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatearFecha(reporte.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs overflow-hidden text-ellipsis">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {reporte.descripcion || reporte.hallazgo || 'N/A'}
                      </div>
                      {reporte.tipo && (
                        <div className="text-xs text-gray-500 mt-1">
                          {reporte.tipo}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {reporte.area || reporte.lugarLabor || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {reporte.supervisorReporta || reporte.reportante || reporte.colaboradorNombre || 'Anónimo'}
                  </td>
                  <td className="px-6 py-4">
                    {reporte.severidad && (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold text-white capitalize"
                        style={{ backgroundColor: getSeverityColor(reporte.severidad) }}
                      >
                        {reporte.severidad}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold text-white capitalize"
                        style={{ backgroundColor: getStatusColor(reporte.estado) }}
                      >
                        {reporte.estado || 'Pendiente'}
                      </span>
                      <button
                        onClick={() => abrirModalEstado(reporte)}
                        disabled={isUpdating(reporte.id)}
                        className={`p-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors ${
                          isUpdating(reporte.id) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Cambiar estado"
                      >
                        <Icon name="Edit" size={12} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => verDetalles(reporte)}
                        className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        title="Ver detalles"
                      >
                        <Icon name="Eye" size={14} />
                      </button>
                      {(reporte.fotoUrl || reporte.evidencia_url || reporte.evidenciaUrl) && (
                        <button
                          onClick={() => verImagen(reporte.fotoUrl || reporte.evidencia_url || reporte.evidenciaUrl)}
                          className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          title="Ver imagen"
                        >
                          <Icon name="Eye" size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => eliminarReporte(reporte.id)}
                        disabled={isUpdating(reporte.id)}
                        className={`p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors ${
                          isUpdating(reporte.id) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Eliminar reporte"
                      >
                        <Icon name="Trash2" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading || loadingSupervision) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Icon name="BarChart3" size={48} color="#6b7280" className="mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-gray-600">Cargando historial de reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header mejorado */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Icon name="BarChart3" size={32} color="#1f2937" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Historial de Reportes
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Visualiza, gestiona y filtra todos los reportes del sistema con seguimiento completo de estados
              </p>
            </div>
          </div>
        </div>

        {/* Filtros mejorados */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Filter" size={20} color="#374151" />
            <h3 className="text-lg font-semibold text-gray-900">Filtros de Búsqueda</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de Reporte
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos los tipos</option>
                <option value="incidencia">Incidencias</option>
                <option value="recomendacion">Recomendaciones</option>
                <option value="abordaje">Abordajes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="proceso">En Proceso</option>
                <option value="resuelto">Resuelto</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha Desde
              </label>
              <input
                type="date"
                value={filtroFecha.desde}
                onChange={(e) => setFiltroFecha(prev => ({ ...prev, desde: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={filtroFecha.hasta}
                onChange={(e) => setFiltroFecha(prev => ({ ...prev, hasta: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Estadísticas mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Icon name="AlertTriangle" size={24} color="#dc2626" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-red-600">
                  {reportesPorTipo.incidencia?.length || 0}
                </div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
            </div>
            <div className="text-gray-700 font-semibold">Reportes de Incidencia</div>
            <div className="text-xs text-gray-500 mt-1">Condiciones y actos inseguros</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Icon name="Lightbulb" size={24} color="#3b82f6" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {reportesPorTipo.recomendacion?.length || 0}
                </div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
            </div>
            <div className="text-gray-700 font-semibold">Recomendaciones</div>
            <div className="text-xs text-gray-500 mt-1">Mejoras y capacitaciones</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Icon name="Users" size={24} color="#059669" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">
                  {reportesPorTipo.abordaje?.length || 0}
                </div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
            </div>
            <div className="text-gray-700 font-semibold">Abordajes en Campo</div>
            <div className="text-xs text-gray-500 mt-1">Conversaciones directas</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Icon name="Filter" size={24} color="#6b7280" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-600">
                  {reportesFiltrados.length}
                </div>
                <div className="text-sm text-gray-500">Mostrados</div>
              </div>
            </div>
            <div className="text-gray-700 font-semibold">Resultados Filtrados</div>
            <div className="text-xs text-gray-500 mt-1">Según criterios actuales</div>
          </div>
        </div>

        {/* Tablas por tipo */}
        <div className="space-y-8">
          <TablaReportes
            tipo="incidencia"
            titulo="Reportes de Incidencia"
            color="#dc2626"
          />
          <TablaReportes
            tipo="recomendacion"
            titulo="Recomendaciones"
            color="#3b82f6"
          />
          <TablaReportes
            tipo="abordaje"
            titulo="Abordajes en Campo"
            color="#059669"
          />
        </div>

        {/* Modal de Estados */}
        <EstadosModal />

        {/* Modal de Detalles */}
        {showModal && selectedReporte && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Detalles del Reporte</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="font-semibold text-gray-900">Fecha:</span> {formatearFecha(selectedReporte.created_at)}
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Tipo:</span> {selectedReporte.tipo || selectedReporte.tipoReporte}
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Descripción:</span> {selectedReporte.descripcion || selectedReporte.hallazgo || 'N/A'}
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Área:</span> {selectedReporte.area || selectedReporte.lugarLabor || 'N/A'}
                </div>
                {selectedReporte.supervisorReporta && (
                  <div>
                    <span className="font-semibold text-gray-900">Supervisor que Reporta:</span> {selectedReporte.supervisorReporta}
                  </div>
                )}
                {selectedReporte.colaborador && (
                  <div>
                    <span className="font-semibold text-gray-900">Colaborador Involucrado:</span> {selectedReporte.colaborador.nombre} ({selectedReporte.colaborador.area})
                  </div>
                )}
                {!selectedReporte.supervisorReporta && (
                  <div>
                    <span className="font-semibold text-gray-900">Reportante:</span> {selectedReporte.reportante || selectedReporte.colaboradorNombre || 'Anónimo'}
                  </div>
                )}
                {selectedReporte.severidad && (
                  <div>
                    <span className="font-semibold text-gray-900">Severidad:</span>
                    <span
                      className="ml-2 px-2 py-1 rounded-full text-xs font-semibold text-white capitalize"
                      style={{ backgroundColor: getSeverityColor(selectedReporte.severidad) }}
                    >
                      {selectedReporte.severidad}
                    </span>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-gray-900">Estado:</span>
                  <span
                    className="ml-2 px-2 py-1 rounded-full text-xs font-semibold text-white capitalize"
                    style={{ backgroundColor: getStatusColor(selectedReporte.estado) }}
                  >
                    {selectedReporte.estado || 'Pendiente'}
                  </span>
                </div>

                {/* Historial de Estados */}
                {selectedReporte.historialEstados && selectedReporte.historialEstados.length > 0 && (
                  <div>
                    <span className="font-semibold text-gray-900">Historial de Estados:</span>
                    <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-auto">
                      {selectedReporte.historialEstados.map((historia, index) => (
                        <div
                          key={index}
                          className={`p-3 ${index < selectedReporte.historialEstados.length - 1 ? 'border-b border-gray-100' : ''}`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span
                              className="px-2 py-1 rounded text-xs font-semibold text-white capitalize"
                              style={{ backgroundColor: getStatusColor(historia.estado) }}
                            >
                              {historia.estado}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatearFecha(new Date(historia.fecha))}
                            </span>
                          </div>
                          {historia.comentario && (
                            <p className="text-sm text-gray-700 italic mt-1">
                              "{historia.comentario}"
                            </p>
                          )}
                          {historia.usuario && (
                            <div className="text-xs text-gray-400 mt-1">
                              Por: {historia.usuario}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedReporte.abordaje && (
                  <div>
                    <span className="font-semibold text-gray-900">Abordaje:</span> {selectedReporte.abordaje}
                  </div>
                )}
                {(selectedReporte.fotoUrl || selectedReporte.evidencia_url || selectedReporte.evidenciaUrl) && (
                  <div>
                    <span className="font-semibold text-gray-900">Evidencia:</span>
                    <button
                      onClick={() => verImagen(selectedReporte.fotoUrl || selectedReporte.evidencia_url || selectedReporte.evidenciaUrl)}
                      className="ml-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition-colors"
                    >
                      <Icon name="Eye" size={16} className="inline mr-1" />
                      Ver imagen
                    </button>
                  </div>
                )}
                {(selectedReporte.firma_url || selectedReporte.firmaUrl) && (
                  <div>
                    <span className="font-semibold text-gray-900">Firma:</span>
                    <button
                      onClick={() => verImagen(selectedReporte.firma_url || selectedReporte.firmaUrl)}
                      className="ml-2 px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm transition-colors"
                    >
                      <Icon name="PenTool" size={16} className="inline mr-1" />
                      Ver firma
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Imagen */}
        {showImageModal && selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-[90vw] max-h-[90vh]">
              <img
                src={selectedImage}
                alt="Evidencia"
                className="max-w-full max-h-full rounded-lg"
              />
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-2 right-2 bg-black bg-opacity-70 text-white border-0 rounded-full w-10 h-10 cursor-pointer text-xl hover:bg-opacity-90 transition-all"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportesHistorialMejorado;