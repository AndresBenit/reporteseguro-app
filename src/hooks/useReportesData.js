import { useEffect, useState } from 'react';
import { dbHelpers } from '../services/supabase';
import { getEstadisticasColaboradores } from '../utils/scripts/migrateColaboradores';

const useReportesData = (user) => {
  const [reportes, setReportes] = useState([]);
  const [colaboradoresStats, setColaboradoresStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Cargar reportes
    const fetchReportes = async () => {
      try {
        const data = await dbHelpers.getAll('reportes', {
          orderBy: 'fecha',
          ascending: false
        });
        setReportes(data);
        setError(null);
      } catch (err) {
        console.error("Error obteniendo reportes:", err);
        setError("Error conectando con la base de datos");
      }
    };

    fetchReportes();

    // Set up real-time subscription
    const subscription = dbHelpers.subscribe('reportes', (payload) => {
      console.log('Reportes updated:', payload);
      fetchReportes();
    });

    // Cargar estadísticas de colaboradores
    const loadColaboradoresStats = async () => {
      try {
        const stats = await getEstadisticasColaboradores();
        setColaboradoresStats(stats);
      } catch (error) {
        console.error('Error cargando estadísticas de colaboradores:', error);
        setColaboradoresStats({ total: 0, activos: 0, centroIndustrial: 0, hornosSolera: 0 });
      }
    };

    loadColaboradoresStats();
    setLoading(false);

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [user]);

  return {
    reportes,
    colaboradoresStats,
    loading,
    error
  };
};

export default useReportesData;