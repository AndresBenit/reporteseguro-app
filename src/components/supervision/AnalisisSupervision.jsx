import React from 'react';
import { useReportes } from '../../hooks/useReportes';
import { Icon } from '../common/Icons';

const AnalisisSupervision = () => {
  // Hook para reportes de seguridad
  const { reportes, loading: reportesLoading } = useReportes();


  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700', 
          color: '#1f2937',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <Icon name="Analytics" size={40} />
          Análisis Avanzado
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          Dashboard analítico completo de seguridad industrial • Todos los tipos de reportes unificados
        </p>
      </div>

      {/* Header del Dashboard */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '30px',
        color: 'white'
      }}>
        <h2 style={{
          fontSize: '1.8rem',
          fontWeight: '700',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Icon name="TrendingUp" size={32} color="white" />
          Centro de Inteligencia de Seguridad
        </h2>
        <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
          Análisis avanzado • Filtros inteligentes • Visualizaciones interactivas • KPIs en tiempo real
        </p>
      </div>
      
      {/* Dashboard Principal */}
      {reportesLoading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <Icon name="Analytics" size={64} color="#6b7280" />
          <h3 style={{ marginTop: '20px' }}>Cargando datos de reportes...</h3>
        </div>
      ) : (
        <EnterpriseGraficos reportes={Array.isArray(reportes) ? reportes : []} />
      )}

    </div>
  );
};

export default AnalisisSupervision;