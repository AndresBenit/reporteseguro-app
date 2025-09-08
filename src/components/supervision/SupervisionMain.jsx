import React, { useState } from 'react';
import AnalisisSupervision from './AnalisisSupervision';
import AnalisisEPP from './AnalisisEPP';

const SupervisionMain = () => {
  const [vistaActiva, setVistaActiva] = useState('general');

  const vistas = [
    { 
      id: 'general', 
      label: 'Análisis General', 
      icon: '📊',
      descripcion: 'Reportes de seguridad, incidencias y recomendaciones'
    },
    { 
      id: 'epp', 
      label: 'Análisis EPP', 
      icon: '🦺',
      descripcion: 'Control y gestión de Elementos de Protección Personal'
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Tabs de navegación */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '30px',
        borderBottom: '2px solid #f3f4f6'
      }}>
        {vistas.map(vista => (
          <button
            key={vista.id}
            onClick={() => setVistaActiva(vista.id)}
            style={{
              padding: '15px 25px',
              background: vistaActiva === vista.id ? '#3b82f6' : 'transparent',
              color: vistaActiva === vista.id ? 'white' : '#374151',
              border: 'none',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              borderBottom: vistaActiva === vista.id ? '2px solid #3b82f6' : '2px solid transparent'
            }}
            onMouseEnter={(e) => {
              if (vistaActiva !== vista.id) {
                e.target.style.background = '#f8fafc';
              }
            }}
            onMouseLeave={(e) => {
              if (vistaActiva !== vista.id) {
                e.target.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{vista.icon}</span>
            {vista.label}
          </button>
        ))}
      </div>

      {/* Descripción de la vista activa */}
      <div style={{
        background: '#f8fafc',
        padding: '15px 20px',
        borderRadius: '8px',
        marginBottom: '30px',
        border: '1px solid #e5e7eb'
      }}>
        <p style={{
          margin: 0,
          color: '#6b7280',
          fontSize: '0.95rem'
        }}>
          {vistas.find(v => v.id === vistaActiva)?.descripcion}
        </p>
      </div>

      {/* Contenido según la vista activa */}
      {vistaActiva === 'general' && <AnalisisSupervision />}
      {vistaActiva === 'epp' && <AnalisisEPP />}
    </div>
  );
};

export default SupervisionMain;