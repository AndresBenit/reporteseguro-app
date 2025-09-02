import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { reporteUtils } from "../constants/reporteStates";

// ✅ Hook simplificado con actualización inmediata garantizada
export const useReportesSimple = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(new Set());

  // Cargar reportes
  const loadReportes = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando reportes...');
      
      const { data, error } = await supabase
        .from('reportes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log('✅ Reportes cargados:', data?.length || 0);
      setReportes(data || []);
      setError(null);
    } catch (err) {
      console.error("❌ Error cargando reportes:", err);
      setError("Error conectando con la base de datos");
    } finally {
      setLoading(false);
    }
  };

  // Actualizar estado con actualización inmediata garantizada
  const actualizarEstado = async (id, estado) => {
    try {
      const estadoNormalizado = reporteUtils.normalizeEstado(estado);
      console.log(`🔄 Actualizando reporte ${id} al estado: ${estadoNormalizado}`);
      
      setUpdating(prev => new Set([...prev, id]));
      
      // ✅ 1. Actualizar inmediatamente en la UI (optimistic update)
      setReportes(prev => prev.map(r => 
        r.id === id ? { ...r, estado: estadoNormalizado } : r
      ));
      
      // ✅ 2. Enviar a Supabase
      const { data, error } = await supabase
        .from('reportes')
        .update({ estado: estadoNormalizado })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        // Revertir cambio optimistic si hay error
        setReportes(prev => prev.map(r => 
          r.id === id ? { ...r, estado: prev.find(p => p.id === id)?.estado || 'pendiente' } : r
        ));
        throw error;
      }
      
      // ✅ 3. Confirmar con datos de servidor
      setReportes(prev => prev.map(r => 
        r.id === id ? { ...r, ...data } : r
      ));
      
      console.log(`✅ Estado actualizado exitosamente a ${estadoNormalizado}`);
      
    } catch (err) {
      console.error("❌ Error actualizando estado:", err);
      alert("Error al actualizar el estado: " + err.message);
      // Recargar datos como fallback
      loadReportes();
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // Eliminar reporte con confirmación
  const eliminarReporte = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este reporte?")) return;
    
    try {
      setUpdating(prev => new Set([...prev, id]));
      
      // ✅ 1. Remover inmediatamente de UI
      const reporteEliminado = reportes.find(r => r.id === id);
      setReportes(prev => prev.filter(r => r.id !== id));
      
      // ✅ 2. Eliminar de Supabase
      const { error } = await supabase
        .from('reportes')
        .delete()
        .eq('id', id);
      
      if (error) {
        // Restaurar si hay error
        setReportes(prev => [...prev, reporteEliminado].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        ));
        throw error;
      }
      
      console.log(`✅ Reporte ${id} eliminado exitosamente`);
      alert("Reporte eliminado exitosamente");
      
    } catch (err) {
      console.error("❌ Error eliminando reporte:", err);
      alert("Error al eliminar el reporte: " + err.message);
      loadReportes(); // Recargar como fallback
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // Cargar al montar
  useEffect(() => {
    loadReportes();
  }, []);

  // ✅ Opcional: Auto-refrescar cada 30 segundos como backup
  useEffect(() => {
    const interval = setInterval(() => {
      if (!updating.size) { // Solo refrescar si no hay operaciones en curso
        loadReportes();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [updating]);

  return {
    reportes,
    loading,
    error,
    updating,
    actualizarEstado,
    eliminarReporte,
    refetch: loadReportes,
    isUpdating: (id) => updating.has(id)
  };
};