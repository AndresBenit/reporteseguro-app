import { useEffect, useState } from "react";
import { getEstadisticasColaboradores } from "../utils/scripts/migrateColaboradores";

export const useColaboradores = () => {
  const [colaboradoresStats, setColaboradoresStats] = useState({ total: 0, activos: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadColaboradoresStats();
  }, []);

  const loadColaboradoresStats = async () => {
    try {
      setLoading(true);
      const stats = await getEstadisticasColaboradores();
      setColaboradoresStats(stats);
      setError(null);
    } catch (err) {
      console.error('Error cargando estadísticas de colaboradores:', err);
      setError(err.message);
      // Si falla, usar stats por defecto
      setColaboradoresStats({ total: 0, activos: 0, centroIndustrial: 0, hornosSolera: 0 });
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = () => {
    loadColaboradoresStats();
  };

  return {
    colaboradoresStats,
    loading,
    error,
    refreshStats
  };
};