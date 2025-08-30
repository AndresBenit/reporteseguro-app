import { useState, useEffect } from 'react';
import { dbHelpers } from '../services/supabase';

export const useReports = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

  return { reportes, loading, error };
};