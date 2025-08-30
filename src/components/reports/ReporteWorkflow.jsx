import React, { useState, useEffect } from 'react';
import { dbHelpers } from '../../services/supabase';

/**
 * Hook para manejar el workflow de estados de reportes
 * Incluye validaciones, historial y notificaciones
 */
export const useReporteWorkflow = () => {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Definir los estados posibles y sus transiciones permitidas
  const ESTADOS = {
    pendiente: {
      label: 'Pendiente',
      color: '#f59e0b',
      icon: '⏳',
      siguientes: ['asignado', 'en_proceso', 'descartado']
    },
    asignado: {
      label: 'Asignado',
      color: '#8b5cf6',
      icon: '👤',
      siguientes: ['en_proceso', 'pendiente']
    },
    en_proceso: {
      label: 'En Proceso',
      color: '#3b82f6',
      icon: '🔄',
      siguientes: ['en_revision', 'pendiente', 'pausado']
    },
    pausado: {
      label: 'Pausado',
      color: '#ef4444',
      icon: '⏸️',
      siguientes: ['en_proceso', 'pendiente']
    },
    en_revision: {
      label: 'En Revisión',
      color: '#06b6d4',
      icon: '🔍',
      siguientes: ['resuelto', 'en_proceso', 'requiere_informacion']
    },
    requiere_informacion: {
      label: 'Requiere Información',
      color: '#f97316',
      icon: '❓',
      siguientes: ['en_proceso', 'en_revision']
    },
    resuelto: {
      label: 'Resuelto',
      color: '#10b981',
      icon: '✅',
      siguientes: ['cerrado', 'en_revision']
    },
    cerrado: {
      label: 'Cerrado',
      color: '#059669',
      icon: '🔒',
      siguientes: [] // Estado final
    },
    descartado: {
      label: 'Descartado',
      color: '#6b7280',
      icon: '🗑️',
      siguientes: ['pendiente'] // Solo se puede reabrir
    }
  };

  // Validar si una transición de estado es permitida
  const esTransicionValida = (estadoActual, nuevoEstado) => {
    if (!estadoActual || !ESTADOS[estadoActual]) return true; // Primer estado
    return ESTADOS[estadoActual].siguientes.includes(nuevoEstado);
  };

  // Obtener estados siguientes permitidos
  const getEstadosSiguientes = (estadoActual) => {
    if (!estadoActual || !ESTADOS[estadoActual]) {
      return Object.keys(ESTADOS).filter(estado => estado === 'pendiente');
    }
    return ESTADOS[estadoActual].siguientes;
  };

  // Cambiar estado con validaciones y historial
  const cambiarEstado = async (reporteId, nuevoEstado, datos = {}) => {
    setLoading(true);
    try {
      const {
        comentario = '',
        usuario = 'Sistema',
        asignadoA = '',
        prioridad = '',
        fechaEstimada = null,
        notificarA = [],
        adjuntos = []
      } = datos;

      const ahora = new Date();
      
      // Crear entrada de historial
      const entradaHistorial = {
        estado: nuevoEstado,
        fecha: ahora,
        comentario,
        usuario,
        asignadoA,
        prioridad,
        fechaEstimada,
        adjuntos
      };

      // Obtener reporte actual para el historial
      // En una implementación real, necesitarías obtener el reporte actual
      const updateData = {
        estado: nuevoEstado,
        fechaUltimaActualizacion: ahora,
        asignadoA: asignadoA || null,
        prioridad: prioridad || null,
        fechaEstimada: fechaEstimada || null
      };

      // Actualizar reporte con historial
      // En Supabase, necesitamos obtener el registro actual, modificar el historial y actualizar
      const reporteActual = await dbHelpers.getById('reportes', reporteId);
      const historialExistente = reporteActual.historialEstados || {};
      
      await dbHelpers.update('reportes', reporteId, {
        ...updateData,
        historialEstados: {
          ...historialExistente,
          [Date.now().toString()]: entradaHistorial
        }
      });

      // Crear notificación si se especifica
      if (notificarA.length > 0) {
        await crearNotificacion(reporteId, nuevoEstado, notificarA, comentario);
      }

      // Agregar notificación local
      agregarNotificacion({
        tipo: 'success',
        mensaje: `Estado cambiado a "${ESTADOS[nuevoEstado].label}" exitosamente`,
        reporteId
      });

      return { success: true };

    } catch (error) {
      console.error('Error cambiando estado:', error);
      agregarNotificacion({
        tipo: 'error',
        mensaje: 'Error al cambiar el estado del reporte',
        reporteId
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Crear notificación en la base de datos
  const crearNotificacion = async (reporteId, estado, usuarios, mensaje) => {
    try {
      const notificacion = {
        reporteId,
        estado,
        mensaje,
        usuarios,
        fecha: new Date(),
        leida: false,
        tipo: 'cambio_estado'
      };

      await dbHelpers.create('notificaciones', notificacion);
    } catch (error) {
      console.error('Error creando notificación:', error);
    }
  };

  // Agregar notificación local
  const agregarNotificacion = (notif) => {
    const id = Date.now();
    const nuevaNotif = { ...notif, id };
    setNotifications(prev => [nuevaNotif, ...prev]);
    
    // Auto-remove después de 5 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Remover notificación
  const removerNotificacion = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return {
    ESTADOS,
    loading,
    notifications,
    esTransicionValida,
    getEstadosSiguientes,
    cambiarEstado,
    removerNotificacion
  };
};

/**
 * Componente Modal avanzado para cambio de estados
 */
export const ModalCambioEstadoAvanzado = ({ 
  reporte, 
  isOpen, 
  onClose, 
  onEstadoChanged 
}) => {
  const {
    ESTADOS,
    loading,
    getEstadosSiguientes,
    cambiarEstado,
    esTransicionValida
  } = useReporteWorkflow();

  const [formData, setFormData] = useState({
    nuevoEstado: '',
    comentario: '',
    asignadoA: '',
    prioridad: '',
    fechaEstimada: '',
    notificarA: [],
    requiereAprobacion: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (reporte && isOpen) {
      setFormData({
        nuevoEstado: reporte.estado || 'pendiente',
        comentario: '',
        asignadoA: reporte.asignadoA || '',
        prioridad: reporte.prioridad || '',
        fechaEstimada: reporte.fechaEstimada || '',
        notificarA: [],
        requiereAprobacion: false
      });
      setErrors({});
    }
  }, [reporte, isOpen]);

  const estadosDisponibles = reporte ? getEstadosSiguientes(reporte.estado) : [];

  const validarFormulario = () => {
    const newErrors = {};

    if (!formData.nuevoEstado) {
      newErrors.nuevoEstado = 'Selecciona un estado';
    }

    if (formData.nuevoEstado === 'asignado' && !formData.asignadoA) {
      newErrors.asignadoA = 'Debe especificar a quién se asigna';
    }

    if (formData.nuevoEstado === 'en_proceso' && !formData.prioridad) {
      newErrors.prioridad = 'Debe especificar la prioridad';
    }

    if (['en_proceso', 'en_revision'].includes(formData.nuevoEstado) && !formData.fechaEstimada) {
      newErrors.fechaEstimada = 'Debe especificar fecha estimada';
    }

    if (!formData.comentario.trim()) {
      newErrors.comentario = 'El comentario es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validarFormulario()) return;

    const resultado = await cambiarEstado(reporte.id, formData.nuevoEstado, {
      comentario: formData.comentario,
      usuario: 'Usuario Actual', // Aquí usar el usuario real
      asignadoA: formData.asignadoA,
      prioridad: formData.prioridad,
      fechaEstimada: formData.fechaEstimada ? new Date(formData.fechaEstimada) : null,
      notificarA: formData.notificarA
    });

    if (resultado.success) {
      onEstadoChanged?.(reporte.id, formData.nuevoEstado);
      onClose();
    }
  };

  if (!isOpen || !reporte) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1003,
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
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h3 style={{ margin: 0, color: '#1f2937' }}>
            Cambiar Estado del Reporte
          </h3>
          <button
            onClick={onClose}
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

        {/* Estado actual */}
        <div style={{
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <strong>Estado actual:</strong>
          <div style={{
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              padding: '6px 12px',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: 'white',
              background: ESTADOS[reporte.estado || 'pendiente']?.color || '#6b7280'
            }}>
              {ESTADOS[reporte.estado || 'pendiente']?.icon} {ESTADOS[reporte.estado || 'pendiente']?.label}
            </span>
          </div>
        </div>

        {/* Nuevo estado */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#374151'
          }}>
            Nuevo Estado: *
          </label>
          <select
            value={formData.nuevoEstado}
            onChange={(e) => setFormData(prev => ({ ...prev, nuevoEstado: e.target.value }))}
            style={{
              width: '100%',
              padding: '12px',
              border: errors.nuevoEstado ? '2px solid #ef4444' : '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          >
            <option value="">Seleccionar estado...</option>
            {estadosDisponibles.map(estado => (
              <option key={estado} value={estado}>
                {ESTADOS[estado]?.icon} {ESTADOS[estado]?.label}
              </option>
            ))}
          </select>
          {errors.nuevoEstado && (
            <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>
              {errors.nuevoEstado}
            </span>
          )}
        </div>

        {/* Campos condicionales */}
        {formData.nuevoEstado === 'asignado' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151'
            }}>
              Asignar a: *
            </label>
            <input
              type="text"
              value={formData.asignadoA}
              onChange={(e) => setFormData(prev => ({ ...prev, asignadoA: e.target.value }))}
              placeholder="Nombre del responsable"
              style={{
                width: '100%',
                padding: '12px',
                border: errors.asignadoA ? '2px solid #ef4444' : '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
            {errors.asignadoA && (
              <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>
                {errors.asignadoA}
              </span>
            )}
          </div>
        )}

        {formData.nuevoEstado === 'en_proceso' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151'
            }}>
              Prioridad: *
            </label>
            <select
              value={formData.prioridad}
              onChange={(e) => setFormData(prev => ({ ...prev, prioridad: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px',
                border: errors.prioridad ? '2px solid #ef4444' : '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            >
              <option value="">Seleccionar prioridad...</option>
              <option value="baja">🟢 Baja</option>
              <option value="media">🟡 Media</option>
              <option value="alta">🟠 Alta</option>
              <option value="critica">🔴 Crítica</option>
            </select>
            {errors.prioridad && (
              <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>
                {errors.prioridad}
              </span>
            )}
          </div>
        )}

        {['en_proceso', 'en_revision'].includes(formData.nuevoEstado) && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151'
            }}>
              Fecha estimada de resolución: *
            </label>
            <input
              type="date"
              value={formData.fechaEstimada}
              onChange={(e) => setFormData(prev => ({ ...prev, fechaEstimada: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '12px',
                border: errors.fechaEstimada ? '2px solid #ef4444' : '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
            {errors.fechaEstimada && (
              <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>
                {errors.fechaEstimada}
              </span>
            )}
          </div>
        )}

        {/* Comentario obligatorio */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#374151'
          }}>
            Comentario: *
          </label>
          <textarea
            value={formData.comentario}
            onChange={(e) => setFormData(prev => ({ ...prev, comentario: e.target.value }))}
            placeholder="Describe el motivo del cambio de estado, acciones tomadas o información relevante..."
            style={{
              width: '100%',
              padding: '12px',
              border: errors.comentario ? '2px solid #ef4444' : '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '1rem',
              minHeight: '100px',
              resize: 'vertical'
            }}
          />
          {errors.comentario && (
            <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>
              {errors.comentario}
            </span>
          )}
        </div>

        {/* Botones */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '12px 24px',
              border: '2px solid #d1d5db',
              background: 'white',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              opacity: loading ? 0.7 : 1
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.nuevoEstado}
            style={{
              padding: '12px 24px',
              background: loading || !formData.nuevoEstado ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading || !formData.nuevoEstado ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {loading ? 'Actualizando...' : 'Cambiar Estado'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente de notificaciones
 */
export const NotificationContainer = ({ notifications, onRemove }) => {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {notifications.map(notification => (
        <div
          key={notification.id}
          style={{
            background: notification.tipo === 'error' ? '#fef2f2' : '#f0f9ff',
            border: `1px solid ${notification.tipo === 'error' ? '#fecaca' : '#bae6fd'}`,
            borderRadius: '8px',
            padding: '16px',
            maxWidth: '350px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <span style={{ fontSize: '1.2rem' }}>
              {notification.tipo === 'error' ? '❌' : '✅'}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{
                margin: 0,
                color: notification.tipo === 'error' ? '#991b1b' : '#0369a1',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                {notification.mensaje}
              </p>
            </div>
            <button
              onClick={() => onRemove(notification.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280',
                fontSize: '1.2rem',
                padding: '0',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};