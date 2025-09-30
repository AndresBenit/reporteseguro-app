import { useEffect, useState } from "react";
import { dbHelpers } from "../services/supabase";

export const useColaboradores = () => {
  const [colaboradores, setColaboradores] = useState([]);
  const [colaboradoresStats, setColaboradoresStats] = useState({ 
    total: 0, 
    activos: 0,
    centroIndustrial: 0,
    hornosSolera: 0 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(new Set());

  useEffect(() => {
    loadColaboradores();
    loadColaboradoresStats();
    
    // Suscripción en tiempo real
    const subscription = dbHelpers.subscribe('colaboradores', (payload) => {
      switch (payload.eventType) {
        case 'INSERT':
          setColaboradores(prev => [payload.new, ...prev]);
          loadColaboradoresStats();
          break;
        case 'UPDATE':
          setColaboradores(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
          loadColaboradoresStats();
          break;
        case 'DELETE':
          setColaboradores(prev => prev.filter(c => c.id !== payload.old.id));
          loadColaboradoresStats();
          break;
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const loadColaboradores = async () => {
    try {
      setLoading(true);
      const data = await dbHelpers.getAll('colaboradores', {
        orderBy: 'nombre',
        ascending: true
      });
      setColaboradores(data);
      setError(null);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error cargando colaboradores:", err);
      }
      setError("Error conectando con la base de datos");
    } finally {
      setLoading(false);
    }
  };

  const loadColaboradoresStats = async () => {
    try {
      const colaboradoresActivos = await dbHelpers.getAll('colaboradores', {
        filters: { activo: true }
      });

      const total = await dbHelpers.count('colaboradores');
      const activos = colaboradoresActivos.length;

      const centroIndustrial = colaboradoresActivos.filter(c =>
        c.area?.toLowerCase().includes('centro') ||
        c.area?.toLowerCase().includes('industrial')
      ).length;

      const hornosSolera = colaboradoresActivos.filter(c =>
        c.area?.toLowerCase().includes('horno') ||
        c.area?.toLowerCase().includes('solera')
      ).length;

      setColaboradoresStats({ total, activos, centroIndustrial, hornosSolera });
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error calculando estadísticas:', err);
      }
    }
  };

  const crearColaborador = async (datosColaborador) => {
    try {
      setUpdating(prev => new Set([...prev, 'creating']));
      
      const ahora = new Date().toISOString();
      const nuevoColaborador = {
        ...datosColaborador,
        fecha_registro: ahora,
        fecha_actualizacion: ahora,
        activo: datosColaborador.activo ?? true
      };

      const result = await dbHelpers.create('colaboradores', nuevoColaborador);
      return result;
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error creando colaborador:", err);
      }
      throw new Error("Error al crear el colaborador: " + err.message);
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete('creating');
        return newSet;
      });
    }
  };

  const actualizarColaborador = async (id, datos) => {
    try {
      setUpdating(prev => new Set([...prev, id]));
      
      const datosActualizacion = {
        ...datos,
        fecha_actualizacion: new Date().toISOString()
      };

      const result = await dbHelpers.update('colaboradores', id, datosActualizacion);
      return result;
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error actualizando colaborador:", err);
      }
      throw new Error("Error al actualizar el colaborador: " + err.message);
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const eliminarColaborador = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este colaborador? Esta acción no se puede deshacer.")) {
      try {
        setUpdating(prev => new Set([...prev, id]));
        
        await dbHelpers.delete('colaboradores', id);
        alert("Colaborador eliminado exitosamente");
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error eliminando colaborador:", err);
        }
        alert("Error al eliminar el colaborador: " + err.message);
      } finally {
        setUpdating(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    }
  };

  const toggleActivo = async (id) => {
    try {
      const colaborador = colaboradores.find(c => c.id === id);
      if (!colaborador) throw new Error("Colaborador no encontrado");
      
      await actualizarColaborador(id, { 
        activo: !colaborador.activo 
      });
      
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error cambiando estado activo:", err);
      }
      throw new Error("Error al cambiar estado del colaborador");
    }
  };

  const buscarColaboradores = (termino) => {
    const colaboradoresValidos = Array.isArray(colaboradores) ? colaboradores : [];
    if (!termino) return colaboradoresValidos;
    
    const terminoLower = termino.toLowerCase();
    return colaboradoresValidos.filter(colaborador =>
      colaborador?.nombre?.toLowerCase().includes(terminoLower) ||
      colaborador?.email?.toLowerCase().includes(terminoLower) ||
      colaborador?.area?.toLowerCase().includes(terminoLower) ||
      colaborador?.cargo?.toLowerCase().includes(terminoLower) ||
      colaborador?.cedula?.toString().includes(termino)
    );
  };

  const getColaboradoresPorArea = (area) => {
    const colaboradoresValidos = Array.isArray(colaboradores) ? colaboradores : [];
    return colaboradoresValidos.filter(c => 
      c && c.area?.toLowerCase().includes(area.toLowerCase())
    );
  };

  const getColaboradoresActivos = () => {
    const colaboradoresValidos = Array.isArray(colaboradores) ? colaboradores : [];
    return colaboradoresValidos.filter(c => c && c.activo !== false);
  };

  const getColaboradoresPorCargo = (cargo) => {
    const colaboradoresValidos = Array.isArray(colaboradores) ? colaboradores : [];
    return colaboradoresValidos.filter(c => 
      c && c.cargo?.toLowerCase().includes(cargo.toLowerCase())
    );
  };

  // Función para importar colaboradores desde Excel/CSV
  const importarColaboradores = async (listaColaboradores) => {
    try {
      setUpdating(prev => new Set([...prev, 'importing']));
      
      const resultados = {
        exitosos: 0,
        fallidos: 0,
        errores: []
      };

      for (const colaboradorData of listaColaboradores) {
        try {
          await crearColaborador(colaboradorData);
          resultados.exitosos++;
        } catch (error) {
          resultados.fallidos++;
          resultados.errores.push({
            colaborador: colaboradorData.nombre || colaboradorData.email,
            error: error.message
          });
        }
      }
      return resultados;
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error en importación masiva:", err);
      }
      throw new Error("Error en la importación masiva");
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete('importing');
        return newSet;
      });
    }
  };

  // Función para exportar colaboradores
  const exportarColaboradores = () => {
    try {
      const colaboradoresValidos = Array.isArray(colaboradores) ? colaboradores : [];
      const datosExportar = colaboradoresValidos.map(colaborador => ({
        Nombre: colaborador?.nombre || '',
        Email: colaborador?.email || '',
        Cedula: colaborador?.cedula || '',
        Area: colaborador?.area || '',
        Cargo: colaborador?.cargo || '',
        Telefono: colaborador?.telefono || '',
        Estado: colaborador?.activo ? 'Activo' : 'Inactivo',
        'Fecha Registro': colaborador?.fecha_registro ? new Date(colaborador.fecha_registro).toLocaleDateString() : '',
        'Última Actualización': colaborador?.fecha_actualizacion ? new Date(colaborador.fecha_actualizacion).toLocaleDateString() : ''
      }));

      return datosExportar;
    } catch (err) {
      console.error("❌ Error preparando exportación:", err);
      throw new Error("Error al preparar los datos para exportación");
    }
  };

  const refreshStats = () => {
    loadColaboradoresStats();
  };

  return {
    colaboradores,
    colaboradoresStats,
    loading,
    error,
    updating,
    
    // Funciones CRUD
    crearColaborador,
    actualizarColaborador,
    eliminarColaborador,
    toggleActivo,
    
    // Funciones de búsqueda y filtrado
    buscarColaboradores,
    getColaboradoresPorArea,
    getColaboradoresActivos,
    getColaboradoresPorCargo,
    
    // Funciones de importación/exportación
    importarColaboradores,
    exportarColaboradores,
    
    // Utilidades
    refreshStats,
    isUpdating: (id) => updating.has(id),
    refetch: loadColaboradores
  };
};