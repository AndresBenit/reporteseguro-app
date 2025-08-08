import React, { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, where, orderBy, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

/**
 * Hook para manejar notificaciones en tiempo real
 */
export const useNotificaciones = (usuario = 'admin') => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noLeidasCount, setNoLeidasCount] = useState(0);

  useEffect(() => {
    // Suscribirse a notificaciones del usuario actual
    const notificacionesRef = collection(db, 'notificaciones');
    const q = query(
      notificacionesRef,
      where('usuarios', 'array-contains', usuario),
      orderBy('fecha', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha: doc.data().fecha?.toDate()
      }));
      
      setNotificaciones(data);
      setNoLeidasCount(data.filter(n => !n.leida).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [usuario]);

  // Marcar notificación como leída
  const marcarLeida = useCallback(async (notificacionId) => {
    try {
      await updateDoc(doc(db, 'notificaciones', notificacionId), {
        leida: true,
        fechaLeida: new Date()
      });
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  }, []);

  // Marcar todas como leídas
  const marcarTodasLeidas = useCallback(async () => {
    const noLeidas = notificaciones.filter(n => !n.leida);
    const promises = noLeidas.map(notif => 
      updateDoc(doc(db, 'notificaciones', notif.id), {
        leida: true,
        fechaLeida: new Date()
      })
    );
    
    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
    }
  }, [notificaciones]);

  // Crear notificación
  const crearNotificacion = useCallback(async (datos) => {
    try {
      const {
        tipo = 'info',
        titulo = '',
        mensaje = '',
        reporteId = null,
        usuarios = ['admin'],
        prioridad = 'normal',
        accion = null
      } = datos;

      const notificacion = {
        tipo,
        titulo,
        mensaje,
        reporteId,
        usuarios,
        prioridad,
        accion,
        fecha: new Date(),
        leida: false,
        creadoPor: usuario
      };

      await addDoc(collection(db, 'notificaciones'), notificacion);
      return { success: true };
    } catch (error) {
      console.error('Error creando notificación:', error);
      return { success: false, error: error.message };
    }
  }, [usuario]);

  return {
    notificaciones,
    noLeidasCount,
    loading,
    marcarLeida,
    marcarTodasLeidas,
    crearNotificacion
  };
};

/**
 * Componente de notificaciones con dropdown
 */
export const NotificacionesDropdown = ({ usuario }) => {
  const { 
    notificaciones, 
    noLeidasCount, 
    loading, 
    marcarLeida, 
    marcarTodasLeidas 
  } = useNotificaciones(usuario);
  
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificacionClick = (notificacion) => {
    if (!notificacion.leida) {
      marcarLeida(notificacion.id);
    }
    
    // Si tiene acción, ejecutarla
    if (notificacion.accion) {
      if (notificacion.accion.tipo === 'navigateToReporte' && notificacion.reporteId) {
        window.location.href = `/reportes/historial-mejorado?reporte=${notificacion.reporteId}`;
      }
    }
    
    setIsOpen(false);
  };

  const getTipoIcon = (tipo) => {
    const icons = {
      info: '💡',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      cambio_estado: '🔄',
      asignacion: '👤',
      vencimiento: '⏰'
    };
    return icons[tipo] || '📢';
  };

  const getPrioridadColor = (prioridad) => {
    const colors = {
      baja: '#10b981',
      normal: '#3b82f6',
      alta: '#f59e0b',
      urgente: '#ef4444'
    };
    return colors[prioridad] || '#6b7280';
  };

  const formatearTiempoRelativo = (fecha) => {
    if (!fecha) return '';
    
    const ahora = new Date();
    const diferencia = ahora - fecha;
    const segundos = Math.floor(diferencia / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (dias > 0) return `hace ${dias} día${dias > 1 ? 's' : ''}`;
    if (horas > 0) return `hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (minutos > 0) return `hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    return 'hace un momento';
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Botón de notificaciones */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          padding: '8px',
          background: 'transparent',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={e => e.target.style.background = '#f3f4f6'}
        onMouseLeave={e => e.target.style.background = 'transparent'}
      >
        <span style={{ fontSize: '1.25rem' }}>🔔</span>
        {noLeidasCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
            fontWeight: '600'
          }}>
            {noLeidasCount > 9 ? '9+' : noLeidasCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          width: '400px',
          maxWidth: '90vw',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          maxHeight: '500px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              Notificaciones {noLeidasCount > 0 && `(${noLeidasCount})`}
            </h3>
            {noLeidasCount > 0 && (
              <button
                onClick={marcarTodasLeidas}
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  color: '#3b82f6',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Lista de notificaciones */}
          <div style={{
            flex: 1,
            overflow: 'auto'
          }}>
            {loading ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                Cargando notificaciones...
              </div>
            ) : notificaciones.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔔</div>
                No tienes notificaciones
              </div>
            ) : (
              notificaciones.slice(0, 10).map((notificacion) => (
                <div
                  key={notificacion.id}
                  onClick={() => handleNotificacionClick(notificacion)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f8fafc',
                    cursor: notificacion.accion ? 'pointer' : 'default',
                    background: notificacion.leida ? 'transparent' : '#eff6ff',
                    transition: 'background 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={e => {
                    if (notificacion.accion) {
                      e.target.style.background = notificacion.leida ? '#f8fafc' : '#dbeafe';
                    }
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = notificacion.leida ? 'transparent' : '#eff6ff';
                  }}
                >
                  {/* Indicador de no leída */}
                  {!notificacion.leida && (
                    <div style={{
                      position: 'absolute',
                      left: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '6px',
                      height: '6px',
                      background: '#3b82f6',
                      borderRadius: '50%'
                    }} />
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    paddingLeft: notificacion.leida ? '0' : '16px'
                  }}>
                    {/* Icono del tipo */}
                    <div style={{
                      fontSize: '1.2rem',
                      flexShrink: 0
                    }}>
                      {getTipoIcon(notificacion.tipo)}
                    </div>

                    {/* Contenido */}
                    <div style={{
                      flex: 1,
                      minWidth: 0
                    }}>
                      {notificacion.titulo && (
                        <div style={{
                          fontWeight: '600',
                          color: '#1f2937',
                          fontSize: '0.9rem',
                          marginBottom: '4px'
                        }}>
                          {notificacion.titulo}
                        </div>
                      )}
                      
                      <div style={{
                        color: '#4b5563',
                        fontSize: '0.85rem',
                        lineHeight: '1.4',
                        marginBottom: '6px'
                      }}>
                        {notificacion.mensaje}
                      </div>

                      {/* Footer con tiempo y prioridad */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#9ca3af'
                        }}>
                          {formatearTiempoRelativo(notificacion.fecha)}
                        </span>
                        
                        {notificacion.prioridad && notificacion.prioridad !== 'normal' && (
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            color: 'white',
                            background: getPrioridadColor(notificacion.prioridad),
                            textTransform: 'uppercase'
                          }}>
                            {notificacion.prioridad}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notificaciones.length > 10 && (
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #f1f5f9',
              textAlign: 'center'
            }}>
              <button
                onClick={() => {
                  window.location.href = '/notificaciones';
                  setIsOpen(false);
                }}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  color: '#3b82f6',
                  border: '1px solid #3b82f6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay para cerrar */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

/**
 * Hook para generar notificaciones automáticas basadas en eventos
 */
export const useNotificacionesAutomaticas = (reportes = []) => {
  const { crearNotificacion } = useNotificaciones();

  useEffect(() => {
    // Verificar reportes vencidos cada hora
    const verificarVencimientos = () => {
      const ahora = new Date();
      const reportesVencidos = reportes.filter(reporte => {
        if (!reporte.fechaEstimada || ['resuelto', 'cerrado'].includes(reporte.estado)) {
          return false;
        }
        const fechaEstimada = reporte.fechaEstimada.toDate ? 
          reporte.fechaEstimada.toDate() : 
          new Date(reporte.fechaEstimada);
        return fechaEstimada < ahora;
      });

      reportesVencidos.forEach(reporte => {
        crearNotificacion({
          tipo: 'vencimiento',
          titulo: 'Reporte Vencido',
          mensaje: `El reporte "${reporte.descripcion?.substring(0, 50)}..." ha superado su fecha estimada de resolución.`,
          reporteId: reporte.id,
          usuarios: [reporte.asignadoA, 'admin'].filter(Boolean),
          prioridad: 'alta',
          accion: {
            tipo: 'navigateToReporte',
            url: `/reportes/historial-mejorado?reporte=${reporte.id}`
          }
        });
      });
    };

    // Verificar inmediatamente y luego cada hora
    verificarVencimientos();
    const interval = setInterval(verificarVencimientos, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [reportes, crearNotificacion]);

  return { crearNotificacion };
};

export default NotificacionesDropdown;