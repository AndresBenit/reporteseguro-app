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
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1002,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '500px',
          width: '100%'
        }}>
          <h3 style={{ marginBottom: '20px', color: '#1f2937' }}>
            Cambiar Estado del Reporte
          </h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600', 
              color: '#374151' 
            }}>
              Nuevo Estado:
            </label>
            <select
              value={nuevoEstado}
              onChange={(e) => setNuevoEstado(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            >
              <option value="pendiente">⏳ Pendiente</option>
              <option value="proceso">🔄 En Proceso</option>
              <option value="resuelto">✅ Resuelto</option>
              <option value="cerrado">🔒 Cerrado</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600', 
              color: '#374151' 
            }}>
              Comentario (opcional):
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Agregar comentario sobre el cambio de estado..."
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                minHeight: '80px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => setShowEstadoModal(false)}
              style={{
                padding: '10px 20px',
                border: '2px solid #d1d5db',
                background: 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => actualizarEstadoConHistorial(reporteAEditar.id, nuevoEstado, comentario)}
              disabled={updating === reporteAEditar.id}
              style={{
                padding: '10px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: updating === reporteAEditar.id ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                opacity: updating === reporteAEditar.id ? 0.7 : 1
              }}
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
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>📊</div>
          <p>Cargando historial...</p>
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, color: '#1f2937' }}>Detalles del Reporte</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <strong>Fecha:</strong> {formatearFecha(selectedReporte.fecha)}
              </div>
              <div>
                <strong>Tipo:</strong> {selectedReporte.tipo || selectedReporte.tipoReporte}
              </div>
              <div>
                <strong>Descripción:</strong> {selectedReporte.descripcion || selectedReporte.hallazgo || 'N/A'}
              </div>
              <div>
                <strong>Área:</strong> {selectedReporte.area || selectedReporte.lugarLabor || 'N/A'}
              </div>
              {selectedReporte.supervisorReporta && (
                <div>
                  <strong>Supervisor que Reporta:</strong> {selectedReporte.supervisorReporta}
                </div>
              )}
              {selectedReporte.colaborador && (
                <div>
                  <strong>Colaborador Involucrado:</strong> {selectedReporte.colaborador.nombre} ({selectedReporte.colaborador.area})
                </div>
              )}
              {!selectedReporte.supervisorReporta && (
                <div>
                  <strong>Reportante:</strong> {selectedReporte.reportante || selectedReporte.colaboradorNombre || 'Anónimo'}
                </div>
              )}
              {selectedReporte.severidad && (
                <div>
                  <strong>Severidad:</strong> 
                  <span style={{
                    marginLeft: '8px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'white',
                    background: getSeverityColor(selectedReporte.severidad),
                    textTransform: 'capitalize'
                  }}>
                    {selectedReporte.severidad}
                  </span>
                </div>
              )}
              <div>
                <strong>Estado:</strong> 
                <span style={{
                  marginLeft: '8px',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'white',
                  background: getStatusColor(selectedReporte.estado),
                  textTransform: 'capitalize'
                }}>
                  {selectedReporte.estado || 'Pendiente'}
                </span>
              </div>

              {/* Historial de Estados */}
              {selectedReporte.historialEstados && selectedReporte.historialEstados.length > 0 && (
                <div>
                  <strong>Historial de Estados:</strong>
                  <div style={{
                    marginTop: '8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}>
                    {selectedReporte.historialEstados.map((historia, index) => (
                      <div key={index} style={{
                        padding: '12px',
                        borderBottom: index < selectedReporte.historialEstados.length - 1 ? '1px solid #f1f5f9' : 'none'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            color: 'white',
                            background: getStatusColor(historia.estado),
                            textTransform: 'capitalize'
                          }}>
                            {historia.estado}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {formatearFecha(new Date(historia.fecha))}
                          </span>
                        </div>
                        {historia.comentario && (
                          <p style={{ 
                            fontSize: '0.8rem', 
                            color: '#374151', 
                            margin: '4px 0 0 0',
                            fontStyle: 'italic'
                          }}>
                            "{historia.comentario}"
                          </p>
                        )}
                        {historia.usuario && (
                          <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '2px' }}>
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
                  <strong>Abordaje:</strong> {selectedReporte.abordaje}
                </div>
              )}
              {selectedReporte.fotoUrl && (
                <div>
                  <strong>Evidencia:</strong>
                  <button
                    onClick={() => verImagen(selectedReporte.fotoUrl)}
                    style={{
                      marginLeft: '8px',
                      padding: '4px 8px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    📸 Ver imagen
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Imagen */}
      {showImageModal && selectedImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh'
          }}>
            <img
              src={selectedImage}
              alt="Evidencia"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                borderRadius: '8px'
              }}
            />
            <button
              onClick={() => setShowImageModal(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .tabla-seccion {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
        }

        .tabla-container {
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .reportes-tabla {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }

        .reportes-tabla th {
          background: #f8fafc;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
          font-size: 0.9rem;
          white-space: nowrap;
        }

        .reportes-tabla td {
          padding: 12px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.85rem;
          vertical-align: top;
        }

        .reportes-tabla tr:hover {
          background: #f8fafc;
        }

        @media (max-width: 768px) {
          .tabla-container {
            font-size: 0.75rem;
          }
          
          .reportes-tabla th,
          .reportes-tabla td {
            padding: 8px 4px;
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportesHistorialMejorado;