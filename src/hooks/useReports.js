import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';

export const useReports = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const reportesRef = collection(db, "reportes");
    const q = query(reportesRef, orderBy("fecha", "desc"));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
          setReportes(data);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error("Error procesando reportes:", err);
          setError("Error al procesar los datos de reportes");
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error obteniendo reportes:", err);
        setError("Error conectando con la base de datos");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { reportes, loading, error };
};