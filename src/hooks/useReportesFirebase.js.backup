import { useEffect, useState } from "react";
import { db } from "../services/firebase";
import {
  collection,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { migrarReportesANuevoFormato } from '../utils/migracionReportes';

export const useReportes = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(new Set());

  useEffect(() => {
    const ref = collection(db, "reportes");
    // QUITAR EL FILTRO DE FECHA - TRAER TODOS LOS REPORTES
    // const q = query(ref, orderBy("fecha", "desc"));
    
    const unsub = onSnapshot(
      ref, // SIN QUERY - TRAER TODO
      (snap) => {
        try {
          console.log('🔄 Firebase snapshot - Total docs:', snap.docs.length);
          
          const data = snap.docs.map((d) => {
            console.log('Doc ID:', d.id, 'Data:', d.data());
            return { 
              id: d.id, 
              ...d.data(),
              fecha: d.data().fecha?.toDate ? d.data().fecha.toDate() : d.data().fecha || new Date()
            };
          });
          
          // ORDENAR EN JAVASCRIPT EN LUGAR DE FIREBASE
          data.sort((a, b) => {
            const fechaA = a.fecha instanceof Date ? a.fecha : new Date(a.fecha);
            const fechaB = b.fecha instanceof Date ? b.fecha : new Date(b.fecha);
            return fechaB - fechaA;
          });
          
          console.log('✅ Reportes cargados:', data.length);
          setReportes(data);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error("Error procesando datos:", err);
          setError("Error al procesar los datos");
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error obteniendo reportes:", err);
        setError("Error conectando con la base de datos");
        setLoading(false);
      }
    );
    
    return () => unsub();
  }, []);

  // Migración automática - se ejecuta una vez al cargar
  useEffect(() => {
    const ejecutarMigracionAutomatica = async () => {
      // Solo ejecutar si hay reportes y alguno no tiene historial
      if (reportes.length > 0) {
        const reportesSinHistorial = reportes.filter(r => !r.historialEstados);
        
        if (reportesSinHistorial.length > 0) {
          console.log(`🔄 Ejecutando migración automática para ${reportesSinHistorial.length} reportes...`);
          try {
            const resultado = await migrarReportesANuevoFormato();
            console.log('✅ Migración automática completada:', resultado);
          } catch (error) {
            console.warn('⚠️ Error en migración automática:', error);
          }
        }
      }
    };
    
    // Solo ejecutar la migración si no estamos cargando
    if (!loading && reportes.length > 0) {
      ejecutarMigracionAutomatica();
    }
  }, [reportes, loading]);

  const eliminarReporte = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este reporte? Esta acción no se puede deshacer.")) {
      try {
        console.log(`🗑️ Eliminando reporte ${id} de Firebase...`);
        setUpdating(prev => new Set([...prev, id]));
        
        // Eliminar de Firebase
        await deleteDoc(doc(db, "reportes", id));
        
        console.log(`✅ Reporte ${id} eliminado exitosamente`);
        
        // Opcional: Mostrar confirmación
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
      console.log(`🔄 Actualizando reporte ${id} al estado: ${estado}`);
      setUpdating(prev => new Set([...prev, id]));
      
      const updateData = { 
        estado,
        fechaUltimaActualizacion: serverTimestamp()
      };
      
      console.log('Update data:', updateData);
      
      await updateDoc(doc(db, "reportes", id), updateData);
      
      console.log(`✅ Estado actualizado exitosamente`);
      
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

      const ahora = new Date();
      
      // Obtener el reporte actual para mantener el historial existente
      const reporteActual = reportes.find(r => r.id === id);
      const historialExistente = reporteActual?.historialEstados || {};
      
      // Crear nueva entrada de historial
      const nuevaEntrada = {
        estado: nuevoEstado,
        fecha: ahora,
        comentario,
        usuario,
        asignadoA,
        prioridad,
        fechaEstimada
      };
      
      const nuevoHistorial = {
        ...historialExistente,
        [Date.now().toString()]: nuevaEntrada
      };

      const updateData = {
        estado: nuevoEstado,
        historialEstados: nuevoHistorial,
        fechaUltimaActualizacion: ahora
      };

      // Agregar campos opcionales solo si se proporcionan
      if (asignadoA !== null) updateData.asignadoA = asignadoA;
      if (prioridad !== null) updateData.prioridad = prioridad;
      if (fechaEstimada !== null) updateData.fechaEstimada = fechaEstimada;

      await updateDoc(doc(db, "reportes", id), updateData);
      
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
      const historialExistente = reporteActual?.historialEstados || {};
      
      const nuevaEntrada = {
        estado: reporteActual?.estado || 'pendiente',
        fecha: new Date(),
        comentario: comentario || `Prioridad cambiada a ${prioridad}`,
        usuario: 'Sistema',
        prioridad,
        cambioPrioridad: true
      };
      
      const nuevoHistorial = {
        ...historialExistente,
        [Date.now().toString()]: nuevaEntrada
      };

      await updateDoc(doc(db, "reportes", id), {
        prioridad,
        historialEstados: nuevoHistorial,
        fechaUltimaActualizacion: new Date()
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
      const historialExistente = reporteActual?.historialEstados || {};
      
      const nuevaEntrada = {
        estado: reporteActual?.estado || 'pendiente',
        fecha: new Date(),
        comentario,
        usuario,
        soloComentario: true
      };
      
      const nuevoHistorial = {
        ...historialExistente,
        [Date.now().toString()]: nuevaEntrada
      };

      await updateDoc(doc(db, "reportes", id), {
        historialEstados: nuevoHistorial,
        fechaUltimaActualizacion: new Date()
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

  // Nueva función: Obtener estadísticas de reportes
  const getEstadisticas = () => {
    const stats = {
      total: reportes.length,
      pendientes: reportes.filter(r => r.estado === 'pendiente').length,
      enProceso: reportes.filter(r => ['asignado', 'en_proceso'].includes(r.estado)).length,
      resueltos: reportes.filter(r => ['resuelto', 'cerrado'].includes(r.estado)).length,
      vencidos: 0,
      sinAsignar: reportes.filter(r => !r.asignadoA).length,
      porSeveridad: {
        baja: reportes.filter(r => r.severidad === 'baja').length,
        media: reportes.filter(r => r.severidad === 'media').length,
        alta: reportes.filter(r => r.severidad === 'alta').length,
        critica: reportes.filter(r => r.severidad === 'critica').length
      }
    };

    // Calcular vencidos
    const ahora = new Date();
    stats.vencidos = reportes.filter(r => {
      if (!r.fechaEstimada || ['resuelto', 'cerrado'].includes(r.estado)) return false;
      const fechaEstimada = r.fechaEstimada.toDate ? r.fechaEstimada.toDate() : new Date(r.fechaEstimada);
      return fechaEstimada < ahora;
    }).length;

    return stats;
  };

  // Nueva función: Obtener reportes por estado
  const getReportesPorEstado = (estado) => {
    return reportes.filter(r => r.estado === estado);
  };

  // Nueva función: Obtener reportes asignados a usuario
  const getReportesAsignados = (usuario) => {
    return reportes.filter(r => r.asignadoA === usuario);
  };

  // Nueva función: Obtener reportes vencidos
  const getReportesVencidos = () => {
    const ahora = new Date();
    return reportes.filter(r => {
      if (!r.fechaEstimada || ['resuelto', 'cerrado'].includes(r.estado)) return false;
      const fechaEstimada = r.fechaEstimada.toDate ? r.fechaEstimada.toDate() : new Date(r.fechaEstimada);
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
    isUpdating: (id) => updating.has(id)
  };
};