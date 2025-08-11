import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Icon } from '../common/Icons';
import BannerMejoras from '../common/BannerMejoras';
import { useReportes } from '../../hooks/useReportes';

const ReportesHistorial = () => {
  const { reportes, loading, actualizarEstado, eliminarReporte, isUpdating } = useReportes();
  const [filtroTipo, setFiltroTipo] = useState('todos');
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

  const reportesPorPagina = 10;

  // DEBUG: Ver qué tipos tenemos cuando cambien los reportes
  useEffect(() => {
    if (reportes.length > 0) {
      console.log('=== TIPOS DE REPORTES ENCONTRADOS ===');
      const tiposUnicos = [...new Set(reportes.map(r => r.tipo))];
      const tiposReporteUnicos = [...new Set(reportes.map(r => r.tipoReporte))];
      console.log('Tipos (campo "tipo"):', tiposUnicos);
      console.log('Tipos (campo "tipoReporte"):', tiposReporteUnicos);
      console.log('Total reportes:', reportes.length);
      
      console.log('=== DETALLES DE CADA REPORTE ===');
      reportes.forEach(r => {
        console.log(`ID: ${r.id}`);
        console.log(`  - Tipo: "${r.tipo}"`);
        console.log(`  - TipoReporte: "${r.tipoReporte}"`);
        console.log(`  - Fecha: ${r.fecha}`);
        console.log(`  - Descripción: "${r.descripcion || r.hallazgo || 'N/A'}"`);
        console.log('---');
      });
      console.log('====================================');
    }
  }, [reportes]);

  // Agrupar reportes por tipo - ARREGLADO PARA NUEVOS TIPOS
  const reportesPorTipo = {
    incidencia: reportes.filter(r => {
      const tipo = String(r.tipo || '').toLowerCase();
      const tipoReporte = String(r.tipoReporte || '').toLowerCase();
      
      return (
        r.tipo === 'Acto Inseguro' ||
        r.tipo === 'Condición Insegura' ||
        r.tipo === 'Reporte de Incidencia' ||
        r.tipoReporte === 'incidencia' ||
        tipo.includes('acto') ||
        tipo.includes('condici') ||
        tipo.includes('insegur')
      );
    }),
    
    recomendacion: reportes.filter(r => {
      const tipo = String(r.tipo || '').toLowerCase();
      const tipoReporte = String(r.tipoReporte || '').toLowerCase();
      
      return (
        r.tipo === 'Nueva Recomendación' ||
        r.tipoReporte === 'recomendacion' ||
        tipo.includes('recomenda') ||
        tipo.includes('nueva') ||
        tipoReporte.includes('recomenda')
      );
    }),
    
    abordaje: reportes.filter(r => {
      const tipo = String(r.tipo || '').toLowerCase();
      const tipoReporte = String(r.tipoReporte || '').toLowerCase();
      
      return (
        r.tipo === 'Nuevo Abordaje en Campo' ||
        r.tipoReporte === 'abordaje' ||
        tipo.includes('abordaj') ||
        tipo.includes('campo') ||
        tipoReporte.includes('abordaj')
      );
    })
  };
  
  // Reportes que no encajan en ninguna categoría
  const reportesSinCategoria = reportes.filter(r => {
    return !reportesPorTipo.incidencia.includes(r) && 
           !reportesPorTipo.recomendacion.includes(r) && 
           !reportesPorTipo.abordaje.includes(r);
  });
  
  // DEBUG: Mostrar cuántos reportes van a cada categoría
  console.log('📊 DISTRIBUCIÓN POR TIPO:');
  console.log(`Incidencias: ${reportesPorTipo.incidencia.length}`);
  console.log(`Recomendaciones: ${reportesPorTipo.recomendacion.length}`);
  console.log(`Abordajes: ${reportesPorTipo.abordaje.length}`);
  console.log(`Sin categoría: ${reportesSinCategoria.length}`);
  console.log('✅ PROBLEMA SOLUCIONADO - Formularios ahora guardan en "reportes"');
  
  if (reportesSinCategoria.length > 0) {
    console.log('⚠️ REPORTES SIN CATEGORÍA:', reportesSinCategoria.length);
    reportesSinCategoria.forEach(r => {
      console.log(`- ID: ${r.id}, Tipo: "${r.tipo}", TipoReporte: "${r.tipoReporte}"`);
    });
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
      asignado: '#3b82f6',
      en_proceso: '#3b82f6',
      'en proceso': '#3b82f6',
      pausado: '#8b5cf6',
      en_revision: '#f59e0b',
      'requiere informacion': '#ef4444',
      resuelto: '#10b981',
      cerrado: '#6b7280',
      descartado: '#9ca3af'
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
                      <select
                        value={reporte.estado || 'pendiente'}
                        onChange={(e) => {
                          console.log(`Cambiando estado de ${reporte.id} a ${e.target.value}`);
                          actualizarEstado(reporte.id, e.target.value);
                        }}
                        disabled={isUpdating(reporte.id)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          border: 'none',
                          color: 'white',
                          background: getStatusColor(reporte.estado),
                          cursor: 'pointer',
                          minWidth: '100px'
                        }}
                      >
                        <option value="pendiente" style={{ color: 'black' }}>⏳ Pendiente</option>
                        <option value="en_proceso" style={{ color: 'black' }}>🔄 En Proceso</option>
                        <option value="resuelto" style={{ color: 'black' }}>✅ Resuelto</option>
                        <option value="cerrado" style={{ color: 'black' }}>📝 Cerrado</option>
                      </select>
                      {isUpdating(reporte.id) && <span style={{ fontSize: '0.8rem' }}>⏳</span>}
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
                      
                      {/* Botón para ver foto de recomendación */}
                      {(reporte.fotoUrl || reporte.fotoFirmada) && (
                        <button
                          onClick={() => verImagen(reporte.fotoUrl || reporte.fotoFirmada)}
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
                          title="Ver evidencia"
                        >
                          📸
                        </button>
                      )}
                      
                      {/* Botón para eliminar */}
                      <button
                        onClick={() => {
                          if (window.confirm('¿Estás seguro de eliminar este reporte?')) {
                            eliminarReporte(reporte.id);
                          }
                        }}
                        style={{
                          padding: '4px 8px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}
                        title="Eliminar reporte"
                      >
                        🗑️
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
          📊 Historial de Reportes
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          Visualiza y gestiona todos los reportes registrados en el sistema. ¡Ahora puedes cambiar estados directamente!
        </p>
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
            {reportes.length}
          </div>
          <div style={{ color: '#374151', fontWeight: '600' }}>Total</div>
        </div>
      </div>

      {/* Tablas por tipo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <TablaReportes 
          tipo="incidencia" 
          titulo="🚨 Reportes de Incidencia" 
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
        
        {/* Sección para reportes sin categoría si los hay */}
        {reportesSinCategoria.length > 0 && (
          <div style={{
            background: '#fef3c7',
            border: '2px solid #f59e0b',
            borderRadius: '16px',
            padding: '24px',
            marginTop: '20px'
          }}>
            <h3 style={{ color: '#92400e', marginBottom: '16px' }}>
              ⚠️ Reportes Sin Categoría Detectada ({reportesSinCategoria.length})
            </h3>
            <p style={{ color: '#92400e', marginBottom: '16px', fontSize: '0.9rem' }}>
              Estos reportes no se clasificaron automáticamente. Revisa los tipos en la consola del navegador.
            </p>
            
            <div style={{ 
              background: 'white', 
              borderRadius: '8px', 
              overflow: 'hidden',
              border: '1px solid #f59e0b'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fbbf24' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#92400e' }}>Fecha</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#92400e' }}>Tipo Original</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#92400e' }}>Descripción</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#92400e' }}>Supervisor</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#92400e' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reportesSinCategoria.map((reporte) => (
                    <tr key={reporte.id} style={{ borderBottom: '1px solid #fed7aa' }}>
                      <td style={{ padding: '12px', fontSize: '0.8rem' }}>
                        {formatearFecha(reporte.fecha)}
                      </td>
                      <td style={{ padding: '12px', fontWeight: '600' }}>
                        "{reporte.tipo || reporte.tipoReporte || 'Sin tipo'}"
                      </td>
                      <td style={{ padding: '12px' }}>
                        {reporte.descripcion || reporte.hallazgo || 'N/A'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {reporte.supervisorReporta || reporte.reportante || reporte.colaboradorNombre || 'Anónimo'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <select
                          value={reporte.estado || 'pendiente'}
                          onChange={(e) => {
                            console.log(`Cambiando estado de ${reporte.id} a ${e.target.value}`);
                            actualizarEstado(reporte.id, e.target.value);
                          }}
                          disabled={isUpdating(reporte.id)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            border: 'none',
                            color: 'white',
                            background: getStatusColor(reporte.estado),
                            cursor: 'pointer'
                          }}
                        >
                          <option value="pendiente" style={{ color: 'black' }}>⏳ Pendiente</option>
                          <option value="en_proceso" style={{ color: 'black' }}>🔄 En Proceso</option>
                          <option value="resuelto" style={{ color: 'black' }}>✅ Resuelto</option>
                          <option value="cerrado" style={{ color: 'black' }}>📝 Cerrado</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

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
              {selectedReporte.hallazgo && selectedReporte.descripcion && selectedReporte.hallazgo !== selectedReporte.descripcion && (
                <div>
                  <strong>Hallazgo:</strong> {selectedReporte.hallazgo}
                </div>
              )}
              {selectedReporte.recomendacion && (
                <div>
                  <strong>Recomendación:</strong> {selectedReporte.recomendacion}
                </div>
              )}
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
              {selectedReporte.abordaje && (
                <div>
                  <strong>Abordaje:</strong> {selectedReporte.abordaje}
                </div>
              )}
              {(selectedReporte.fotoUrl || selectedReporte.fotoFirmada) && (
                <div>
                  <strong>Evidencia:</strong>
                  <button
                    onClick={() => verImagen(selectedReporte.fotoUrl || selectedReporte.fotoFirmada)}
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
                    📸 Ver {selectedReporte.fotoFirmada ? 'documento firmado' : 'imagen'}
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

      {/* Banner de mejoras */}
      {/* <BannerMejoras /> */}

      <style>{`
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

export default ReportesHistorial;