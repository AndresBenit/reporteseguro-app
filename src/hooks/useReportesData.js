import { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
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
    const reportesRef = collection(db, "reportes");
    const reportesQuery = query(reportesRef, orderBy('fecha', 'desc'));
    
    const unsubReportes = onSnapshot(
      reportesQuery, 
      (snapshot) => {
        try {
          const data = snapshot.docs.map((doc) => ({ 
            id: doc.id, 
            ...doc.data() 
          }));
          setReportes(data);
          setError(null);
        } catch (err) {
          console.error("Error procesando reportes:", err);
          setError("Error al procesar los datos de reportes");
        }
      },
      (err) => {
        console.error("Error obteniendo reportes:", err);
        setError("Error conectando con la base de datos");
      }
    );

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
      unsubReportes();
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