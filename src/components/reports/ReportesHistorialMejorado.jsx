import React, { useState, useEffect } from 'react';
import { dbHelpers, supabase } from '../../services/supabase';
import { Icon } from '../common/Icons';

const ReportesHistorialMejorado = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [updating, setUpdating] = useState(null);

  const reportesPorPagina = 10;

  useEffect(() => {
    const fetchReportes = async () => {
      try {
        const data = await dbHelpers.getAll('reportes', {
          orderBy: 'fecha',
          ascending: false
        });
        const processedData = data.map(item => ({
          ...item,
          fecha: item.fecha ? new Date(item.fecha) : null
        }));
        setReportes(processedData);
      } catch (error) {
        console.error('Error fetching reportes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportes();

    // Set up real-time subscription
    const subscription = dbHelpers.subscribe('reportes', (payload) => {
      console.log('Reportes updated:', payload);
      // Refresh data when changes occur
      fetchReportes();
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Función para actualizar estado con historial
  const actualizarEstadoConHistorial = async (reporteId, estado, comentario = '') => {
    setUpdating(reporteId);
    try {
      const ahora = new Date().toISOString();
      
      // Buscar el reporte actual para mantener el historial
      const reporteActual = reportes.find(r => r.id === reporteId);
      const historialExistente = reporteActual?.historialEstados || [];
      
      const nuevoHistorial = [
        ...historialExistente,
        {
          estado: estado,
          fecha: ahora,
          comentario: comentario,
          usuario: 'Admin' // Aquí puedes usar el usuario actual
        }
      ];

      await dbHelpers.update(reporteId, {
        estado: estado,
        historialEstados: nuevoHistorial,
        fechaUltimaActualizacion: ahora
      });

      setShowEstadoModal(false);
      setReporteAEditar(null);
      setNuevoEstado('');
      setComentario('');
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Error al actualizar el estado del reporte');
    }
    setUpdating(null);
  };

  // Filtrar reportes
  const reportesFiltrados = reportes.filter(reporte => {
    const cumpleTipo = filtroTipo === 'todos' || 
      reporte.tipoReporte === filtroTipo || 
      reporte.tipo?.toLowerCase().includes(filtroTipo.toLowerCase());
    
    const cumpleEstado = filtroEstado === 'todos' || 
      reporte.estado === filtroEstado;
    
    let cumpleFecha = true;
    if (filtroFecha.desde && reporte.fecha) {
      cumpleFecha = cumpleFecha && reporte.fecha >= new Date(filtroFecha.desde);
    }
    if (filtroFecha.hasta && reporte.fecha) {
      cumpleFecha = cumpleFecha && reporte.fecha <= new Date(filtroFecha.hasta + 'T23:59:59');
    }
    
    return cumpleTipo && cumpleEstado && cumpleFecha;
  });

  // Agrupar reportes por tipo
  const reportesPorTipo = {
    incidencia: reportesFiltrados.filter(r => 
      r.tipoReporte === 'incidencia' || 
      r.tipo === 'Incidencia' || 
      r.tipo === 'Acto Inseguro' || 
      r.tipo === 'Condición Insegura'
    ),
    recomendacion: reportesFiltrados.filter(r => 
      r.tipoReporte === 'recomendacion' || 
      r.tipo === 'Recomendación'
    ),
    abordaje: reportesFiltrados.filter(r => 
      r.tipoReporte === 'abordaje' || 
      r.tipo === 'Abordaje'
    )
  };

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
    return fecha.toLocaleDateString('es-ES', {
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
              <option value="pendiente">⏳ Pendiente</option>
              <option value="proceso">🔄 En Proceso</option>
              <option value="resuelto">✅ Resuelto</option>
              <option value="cerrado">🔒 Cerrado</option>
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
              onClick={() => actualizarEstadoConHistorial(reporteAEditar.id, nuevoEstado, comentario)}
              disabled={updating === reporteAEditar.id}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold transition-colors ${
                updating === reporteAEditar.id
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-blue-700'
              }`}
            >
              {updating === reporteAEditar.id ? 'Actualizando...' : 'Actualizar Estado'}
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
        <div className="tabla-seccion">
          <h3 style={{ color, marginBottom: '16px' }}>
            {titulo} ({reportesPorTipo[tipo]?.length || 0})
          </h3>
          <div style={{
            padding: '40px',
            textAlign: 'center',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <p style={{ color: '#6b7280' }}>No hay reportes de este tipo</p>
          </div>
        </div>
      );
    }

    return (
      <div className="tabla-seccion">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{ color, margin: 0 }}>
            {titulo} ({reportesPorTipo[tipo]?.length || 0})
          </h3>
          
          {/* Paginación */}
          {totalPaginas > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <button
                onClick={() => cambiarPagina(tipo, paginaActualTipo - 1)}
                disabled={paginaActualTipo === 1}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #d1d5db',
                  background: paginaActualTipo === 1 ? '#f3f4f6' : 'white',
                  borderRadius: '6px',
                  cursor: paginaActualTipo === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ←
              </button>
              <span style={{
                fontSize: '0.9rem',
                color: '#374151',
                fontWeight: '500'
              }}>
                {paginaActualTipo} de {totalPaginas}
              </span>
              <button
                onClick={() => cambiarPagina(tipo, paginaActualTipo + 1)}
                disabled={paginaActualTipo === totalPaginas}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #d1d5db',
                  background: paginaActualTipo === totalPaginas ? '#f3f4f6' : 'white',
                  borderRadius: '6px',
                  cursor: paginaActualTipo === totalPaginas ? 'not-allowed' : 'pointer'
                }}
              >
                →
              </button>
            </div>
          )}
        </div>

        <div className="tabla-container">
          <table className="reportes-tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Área</th>
                <th>Supervisor</th>
                <th>Severidad</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((reporte) => (
                <tr key={reporte.id}>
                  <td style={{ fontSize: '0.8rem' }}>
                    {formatearFecha(reporte.fecha)}
                  </td>
                  <td>
                    <div style={{
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {reporte.descripcion || reporte.hallazgo || 'N/A'}
                    </div>
                  </td>
                  <td>{reporte.area || reporte.lugarLabor || 'N/A'}</td>
                  <td>{reporte.supervisorReporta || reporte.reportante || reporte.colaboradorNombre || 'Anónimo'}</td>
                  <td>
                    {reporte.severidad && (
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: 'white',
                        background: getSeverityColor(reporte.severidad),
                        textTransform: 'capitalize'
                      }}>
                        {reporte.severidad}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: 'white',
                        background: getStatusColor(reporte.estado),
                        textTransform: 'capitalize'
                      }}>
                        {reporte.estado || 'Pendiente'}
                      </span>
                      <button
                        onClick={() => abrirModalEstado(reporte)}
                        disabled={updating === reporte.id}
                        style={{
                          padding: '4px 6px',
                          background: '#6366f1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: updating === reporte.id ? 'not-allowed' : 'pointer',
                          fontSize: '0.7rem',
                          opacity: updating === reporte.id ? 0.7 : 1
                        }}
                        title="Cambiar estado"
                      >
                        {updating === reporte.id ? '⏳' : '✏️'}
                      </button>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => verDetalles(reporte)}
                        style={{
                          padding: '4px 8px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}
                        title="Ver detalles"
                      >
                        👁️
                      </button>
                      {reporte.fotoUrl && (
                        <button
                          onClick={() => verImagen(reporte.fotoUrl)}
                          style={{
                            padding: '4px 8px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}
                          title="Ver imagen"
                        >
                          📸
                        </button>
                      )}
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Icon name="BarChart3" size={48} color="#6b7280" className="mx-auto mb-4" />
          <p className="text-lg text-gray-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          📊 Historial de Reportes Mejorado
        </h1>
        <p style={{ color: '#6b7280' }}>
          Visualiza y gestiona todos los reportes con funcionalidad completa de cambio de estados
        </p>
      </div>

      {/* Filtros */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        border: '1px solid #e5e7eb',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}>
            Tipo de Reporte
          </label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '2px solid #e5e7eb',
              borderRadius: '6px'
            }}
          >
            <option value="todos">Todos los tipos</option>
            <option value="incidencia">Incidencias</option>
            <option value="recomendacion">Recomendaciones</option>
            <option value="abordaje">Abordajes</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}>
            Estado
          </label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '2px solid #e5e7eb',
              borderRadius: '6px'
            }}
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="proceso">En Proceso</option>
            <option value="resuelto">Resuelto</option>
            <option value="cerrado">Cerrado</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}>
            Desde
          </label>
          <input
            type="date"
            value={filtroFecha.desde}
            onChange={(e) => setFiltroFecha(prev => ({ ...prev, desde: e.target.value }))}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '2px solid #e5e7eb',
              borderRadius: '6px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}>
            Hasta
          </label>
          <input
            type="date"
            value={filtroFecha.hasta}
            onChange={(e) => setFiltroFecha(prev => ({ ...prev, hasta: e.target.value }))}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '2px solid #e5e7eb',
              borderRadius: '6px'
            }}
          />
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#dc2626' }}>
            {reportesPorTipo.incidencia?.length || 0}
          </div>
          <div style={{ color: '#374151', fontWeight: '600' }}>Incidencias</div>
        </div>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>
            {reportesPorTipo.recomendacion?.length || 0}
          </div>
          <div style={{ color: '#374151', fontWeight: '600' }}>Recomendaciones</div>
        </div>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#059669' }}>
            {reportesPorTipo.abordaje?.length || 0}
          </div>
          <div style={{ color: '#374151', fontWeight: '600' }}>Abordajes</div>
        </div>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#6b7280' }}>
            {reportesFiltrados.length}
          </div>
          <div style={{ color: '#374151', fontWeight: '600' }}>Filtrados</div>
        </div>
      </div>

      {/* Tablas por tipo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <TablaReportes 
          tipo="incidencia" 
          titulo="Reportes de Incidencia" 
          color="#dc2626" 
        />
        <TablaReportes 
          tipo="recomendacion" 
          titulo="💡 Recomendaciones" 
          color="#3b82f6" 
        />
        <TablaReportes 
          tipo="abordaje" 
          titulo="👥 Abordajes en Campo" 
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
                  <span className="font-semibold text-gray-900">Fecha:</span> {formatearFecha(selectedReporte.fecha)}
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
                {selectedReporte.fotoUrl && (
                  <div>
                    <span className="font-semibold text-gray-900">Evidencia:</span>
                    <button
                      onClick={() => verImagen(selectedReporte.fotoUrl)}
                      className="ml-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition-colors"
                    >
                      <Icon name="Camera" size={16} className="inline mr-1" />
                      Ver imagen
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
  );
};

export default ReportesHistorialMejorado;