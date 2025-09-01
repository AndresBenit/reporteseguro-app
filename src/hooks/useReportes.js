import { useEffect, useState } from "react";
import { supabase, dbHelpers } from "../services/supabase";
import { reporteUtils, REPORTE_ESTADOS } from "../constants/reporteStates";

export const useReportes = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(new Set());

  useEffect(() => {
    loadReportes();
    
    // Suscripción en tiempo real
    const subscription = dbHelpers.subscribe('reportes', (payload) => {
      console.log('🔄 Real-time update:', payload);
      
      switch (payload.eventType) {
        case 'INSERT':
          setReportes(prev => [payload.new, ...prev]);
          break;
        case 'UPDATE':
          setReportes(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
          break;
        case 'DELETE':
          setReportes(prev => prev.filter(r => r.id !== payload.old.id));
          break;
        default:
          break;
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const loadReportes = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando reportes desde Supabase...');
      
      const data = await dbHelpers.getAll('reportes', {
        orderBy: 'created_at',
        ascending: false
      });
      
      console.log('✅ Reportes cargados:', data.length);
      setReportes(data);
      setError(null);
    } catch (err) {
      console.error("❌ Error cargando reportes:", err);
      setError("Error conectando con la base de datos");
    } finally {
      setLoading(false);
    }
  };

  const eliminarReporte = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este reporte? Esta acción no se puede deshacer.")) {
      try {
        console.log(`🗑️ Eliminando reporte ${id} de Supabase...`);
        setUpdating(prev => new Set([...prev, id]));
        
        await dbHelpers.delete('reportes', id);
        
        console.log(`✅ Reporte ${id} eliminado exitosamente`);
        alert("Reporte eliminado exitosamente");
        
      } catch (err) {
        console.error("❌ Error eliminando reporte:", err);
        alert("Error al eliminar el reporte: " + err.message);
      } finally {
        setUpdating(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    }
  };

  const actualizarEstado = async (id, estado) => {
    try {
      // Normalizar el estado antes de enviarlo
      const estadoNormalizado = reporteUtils.normalizeEstado(estado);
      console.log(`🔄 Actualizando reporte ${id} al estado: ${estado} (normalizado: ${estadoNormalizado})`);
      
      setUpdating(prev => new Set([...prev, id]));
      
      const updateData = { 
        estado: estadoNormalizado,
        fecha_ultima_actualizacion: new Date().toISOString()
      };
      
      await dbHelpers.update('reportes', id, updateData);
      
      console.log(`✅ Estado actualizado exitosamente a ${estadoNormalizado}`);
      
    } catch (err) {
      console.error("❌ Error actualizando estado:", err);
      alert("Error al actualizar el estado: " + err.message);
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // Nueva función: Actualizar estado con historial completo
  const actualizarEstadoConHistorial = async (id, nuevoEstado, datos = {}) => {
    try {
      setUpdating(prev => new Set([...prev, id]));
      
      const {
        comentario = '',
        usuario = 'Sistema',
        asignadoA = null,
        prioridad = null,
        fechaEstimada = null
      } = datos;

      const ahora = new Date().toISOString();
      
      // Obtener el reporte actual para mantener el historial existente
      const reporteActual = reportes.find(r => r.id === id);
      const historialExistente = reporteActual?.historial_estados || {};
      
      // Crear nueva entrada de historial
      const nuevaEntrada = {
        estado: nuevoEstado,
        fecha: ahora,
        comentario,
        usuario,
        asignado_a: asignadoA,
        prioridad,
        fecha_estimada: fechaEstimada
      };
      
      const nuevoHistorial = {
        ...historialExistente,
        [Date.now().toString()]: nuevaEntrada
      };

      const updateData = {
        estado: nuevoEstado,
        historial_estados: nuevoHistorial,
        fecha_ultima_actualizacion: ahora
      };

      // Agregar campos opcionales solo si se proporcionan
      if (asignadoA !== null) updateData.asignado_a = asignadoA;
      if (prioridad !== null) updateData.prioridad = prioridad;
      if (fechaEstimada !== null) updateData.fecha_estimada = fechaEstimada;

      await dbHelpers.update('reportes', id, updateData);
      
      return { success: true };
      
    } catch (err) {
      console.error("Error actualizando estado con historial:", err);
      throw new Error("Error al actualizar el estado del reporte");
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // Nueva función: Asignar reporte a usuario
  const asignarReporte = async (id, asignadoA, comentario = '') => {
    return await actualizarEstadoConHistorial(id, 'asignado', {
      comentario: comentario || `Reporte asignado a ${asignadoA}`,
      usuario: 'Sistema',
      asignadoA
    });
  };

  // Nueva función: Cambiar prioridad
  const cambiarPrioridad = async (id, prioridad, comentario = '') => {
    try {
      setUpdating(prev => new Set([...prev, id]));
      
      const reporteActual = reportes.find(r => r.id === id);
      const historialExistente = reporteActual?.historial_estados || {};
      
      const nuevaEntrada = {
        estado: reporteActual?.estado || 'pendiente',
        fecha: new Date().toISOString(),
        comentario: comentario || `Prioridad cambiada a ${prioridad}`,
        usuario: 'Sistema',
        prioridad,
        cambio_prioridad: true
      };
      
      const nuevoHistorial = {
        ...historialExistente,
        [Date.now().toString()]: nuevaEntrada
      };

      await dbHelpers.update('reportes', id, {
        prioridad,
        historial_estados: nuevoHistorial,
        fecha_ultima_actualizacion: new Date().toISOString()
      });
      
      return { success: true };
      
    } catch (err) {
      console.error("Error cambiando prioridad:", err);
      throw new Error("Error al cambiar la prioridad del reporte");
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // Nueva función: Agregar comentario sin cambiar estado
  const agregarComentario = async (id, comentario, usuario = 'Sistema') => {
    try {
      setUpdating(prev => new Set([...prev, id]));
      
      const reporteActual = reportes.find(r => r.id === id);
      const historialExistente = reporteActual?.historial_estados || {};
      
      const nuevaEntrada = {
        estado: reporteActual?.estado || 'pendiente',
        fecha: new Date().toISOString(),
        comentario,
        usuario,
        solo_comentario: true
      };
      
      const nuevoHistorial = {
        ...historialExistente,
        [Date.now().toString()]: nuevaEntrada
      };

      await dbHelpers.update('reportes', id, {
        historial_estados: nuevoHistorial,
        fecha_ultima_actualizacion: new Date().toISOString()
      });
      
      return { success: true };
      
    } catch (err) {
      console.error("Error agregando comentario:", err);
      throw new Error("Error al agregar comentario al reporte");
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // Nueva función: Crear reporte
  const crearReporte = async (datosReporte) => {
    try {
      const ahora = new Date().toISOString();
      
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      const nuevoReporte = {
        ...datosReporte,
        created_at: ahora,
        fecha_ultima_actualizacion: ahora,
        creado_por: user?.id || 'anonimo',
        estado: datosReporte.estado || 'pendiente',
        tipo_reporte: datosReporte.tipo_reporte || datosReporte.tipo || 'Condición Insegura',
        historial_estados: {
          [Date.now().toString()]: {
            estado: datosReporte.estado || 'pendiente',
            fecha: ahora,
            comentario: 'Reporte creado',
            usuario: user?.email || 'Sistema'
          }
        }
      };

      const result = await dbHelpers.create('reportes', nuevoReporte);
      return result;
      
    } catch (err) {
      console.error("Error creando reporte:", err);
      throw new Error("Error al crear el reporte");
    }
  };

  // Nueva función: Obtener estadísticas de reportes
  const getEstadisticas = () => {
    // ✅ VALIDACIÓN: Asegurar que reportes es un array válido
    const reportesValidos = Array.isArray(reportes) ? reportes : [];
    
    const stats = {
      total: reportesValidos.length,
      pendientes: reportesValidos.filter(r => r && reporteUtils.normalizeEstado(r.estado) === REPORTE_ESTADOS.PENDIENTE).length,
      enProceso: reportesValidos.filter(r => r && [REPORTE_ESTADOS.ASIGNADO, REPORTE_ESTADOS.EN_PROCESO, REPORTE_ESTADOS.PROCESO].includes(reporteUtils.normalizeEstado(r.estado))).length,
      resueltos: reportesValidos.filter(r => r && [REPORTE_ESTADOS.RESUELTO, REPORTE_ESTADOS.CERRADO].includes(reporteUtils.normalizeEstado(r.estado))).length,
      vencidos: 0,
      sinAsignar: reportesValidos.filter(r => r && !r.asignado_a).length,
      porSeveridad: {
        baja: reportesValidos.filter(r => r && r.severidad === 'baja').length,
        media: reportesValidos.filter(r => r && r.severidad === 'media').length,
        alta: reportesValidos.filter(r => r && r.severidad === 'alta').length,
        critica: reportesValidos.filter(r => r && r.severidad === 'critica').length
      }
    };

    // Calcular vencidos - con validación adicional
    const ahora = new Date();
    stats.vencidos = reportesValidos.filter(r => {
      if (!r || !r.fecha_estimada || ['resuelto', 'cerrado'].includes(r.estado)) return false;
      const fechaEstimada = new Date(r.fecha_estimada);
      return fechaEstimada < ahora;
    }).length;

    return stats;
  };

  // Nueva función: Obtener reportes por estado
  const getReportesPorEstado = (estado) => {
    const reportesValidos = Array.isArray(reportes) ? reportes : [];
    return reportesValidos.filter(r => r && r.estado === estado);
  };

  // Nueva función: Obtener reportes asignados a usuario
  const getReportesAsignados = (usuario) => {
    const reportesValidos = Array.isArray(reportes) ? reportes : [];
    return reportesValidos.filter(r => r && r.asignado_a === usuario);
  };

  // Nueva función: Obtener reportes vencidos
  const getReportesVencidos = () => {
    const reportesValidos = Array.isArray(reportes) ? reportes : [];
    const ahora = new Date();
    return reportesValidos.filter(r => {
      if (!r || !r.fecha_estimada || ['resuelto', 'cerrado'].includes(r.estado)) return false;
      const fechaEstimada = new Date(r.fecha_estimada);
      return fechaEstimada < ahora;
    });
  };

  return {
    reportes,
    loading,
    error,
    updating,
    
    // Funciones básicas (compatibilidad)
    eliminarReporte,
    actualizarEstado,
    
    // Funciones avanzadas
    crearReporte,
    actualizarEstadoConHistorial,
    asignarReporte,
    cambiarPrioridad,
    agregarComentario,
    
    // Funciones de consulta
    getEstadisticas,
    getReportesPorEstado,
    getReportesAsignados,
    getReportesVencidos,
    
    // Utilidades
    isUpdating: (id) => updating.has(id),
    refetch: loadReportes
  };
};