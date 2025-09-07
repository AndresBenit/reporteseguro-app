import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../common/Icons';

const ReportTypeSelector = () => {
  const navigate = useNavigate();

  const handleTypeSelect = (typeId) => {
    switch (typeId) {
      case 'incidencia':
        // Usar el formulario de incidencia existente
        navigate('/reportes/incident-form');
        break;
      case 'recomendacion':
        navigate('/formularios/recomendacion');
        break;
      case 'abordaje':
        navigate('/formularios/abordaje');
        break;
      case 'epp':
        navigate('/formularios/control-epp');
        break;
      default:
        break;
    }
  };

  const reportTypes = [
    {
      id: 'incidencia',
      title: 'Reporte de Incidencia',
      description: 'Condiciones inseguras y actos riesgosos',
      icon: 'AlertTriangle',
      color: '#dc2626',
      bgColor: '#fef2f2',
      priority: 'CRÍTICO',
      examples: ['Condición insegura', 'Acto inseguro']
    },
    {
      id: 'recomendacion',
      title: 'Nueva Recomendación',
      description: 'Registro de mejora para colaborador',
      icon: 'Lightbulb',
      color: '#3b82f6',
      bgColor: '#eff6ff',
      priority: 'IMPORTANTE',
      examples: ['Recomendación de mejora', 'Capacitación']
    },
    {
      id: 'abordaje',
      title: 'Abordaje en Campo',
      description: 'Documentar conversación directa con colaborador',
      icon: 'Users',
      color: '#059669',
      bgColor: '#ecfdf5',
      priority: 'SEGUIMIENTO',
      examples: ['Conversación directa', 'Abordaje correctivo']
    },
    {
      id: 'epp',
      title: 'Control de EPP',
      description: 'Registrar entrega de Elementos de Protección Personal',
      icon: 'Shield',
      color: '#7c3aed',
      bgColor: '#f3e8ff',
      priority: 'CONTROL',
      examples: ['Entrega de casco', 'Entrega de guantes']
    }
  ];

  const renderForm = () => {
    // Esta función ya no se usa - navegamos a rutas específicas
    return null;
  };

  return (
    <div className="report-type-selector">
      <div className="selector-header">
        <h1>
          <Icon name="FileText" size={28} color="var(--color-primary)" />
          Centro de Reportes
        </h1>
        <p className="selector-subtitle">
          Selecciona el tipo de reporte que necesitas crear
        </p>
      </div>

      <div className="types-grid">
        {reportTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => handleTypeSelect(type.id)}
            className="type-card"
            style={{
              '--type-color': type.color,
              '--type-bg': type.bgColor
            }}
          >
            <div className="type-header">
              <div className="type-icon">
                <Icon name={type.icon} size={24} color={type.color} />
              </div>
              <span 
                className="type-priority"
                style={{ 
                  background: type.color,
                  color: 'white'
                }}
              >
                {type.priority}
              </span>
            </div>

            <div className="type-content">
              <h3 className="type-title">{type.title}</h3>
              <p className="type-description">{type.description}</p>
            </div>

            <div className="type-examples">
              <span className="examples-label">Ejemplos:</span>
              <div className="examples-list">
                {type.examples.slice(0, 2).map((example, index) => (
                  <span key={index} className="example-tag">
                    {example}
                  </span>
                ))}
              </div>
            </div>

            <div className="type-footer">
              <span className="action-text">Crear reporte</span>
              <Icon name="ChevronRight" size={16} color={type.color} />
            </div>
          </button>
        ))}
      </div>

      {/* Botón para ver historial */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '30px',
        paddingTop: '30px',
        borderTop: '2px solid #f3f4f6'
      }}>
        <button
          onClick={() => navigate('/reportes/historial')}
          style={{
            padding: '16px 32px',
            background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(107, 114, 128, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: '0 auto'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 20px rgba(107, 114, 128, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.25)';
          }}
        >
          📊 Ver Historial de Reportes
        </button>
        <p style={{ 
          marginTop: '12px', 
          color: '#6b7280', 
          fontSize: '0.9rem' 
        }}>
          Consulta todos los reportes registrados con filtros y búsqueda
        </p>
      </div>

      <div className="help-section">
        <div className="help-card">
          <Icon name="HelpCircle" size={20} color="#6b7280" />
          <div>
            <h4>¿No sabes qué tipo elegir?</h4>
            <p>
              Si tienes dudas, usa <strong>Reporte de Incidencia</strong> para situaciones críticas 
              o <strong>Reporte de Observación</strong> para condiciones que podrían mejorarse.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .report-type-selector {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        }

        .selector-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .selector-header h1 {
          font-size: 2.25rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .selector-subtitle {
          color: var(--color-text-secondary);
          font-size: 1.1rem;
          font-weight: 500;
        }

        .types-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 40px;
          max-width: 1200px;
          margin: 0 auto 40px auto;
        }
        
        @media (max-width: 1024px) {
          .types-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .type-card {
          background: var(--type-bg);
          border: 2px solid transparent;
          border-radius: 20px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .type-card:hover {
          border-color: var(--type-color);
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
        }

        .type-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .type-icon {
          width: 50px;
          height: 50px;
          background: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .type-priority {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
          letter-spacing: 0.5px;
        }

        .type-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0 0 8px 0;
        }

        .type-description {
          color: var(--color-text-secondary);
          font-size: 0.95rem;
          line-height: 1.5;
          margin: 0;
        }

        .type-examples {
          padding: 12px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .examples-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--color-text-secondary);
          display: block;
          margin-bottom: 8px;
        }

        .examples-list {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .example-tag {
          font-size: 0.75rem;
          padding: 4px 8px;
          background: white;
          border-radius: 6px;
          color: var(--color-text-primary);
          border: 1px solid var(--color-border-light);
        }

        .type-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.5);
        }

        .action-text {
          font-weight: 600;
          color: var(--type-color);
          font-size: 0.9rem;
        }

        .help-section {
          display: flex;
          justify-content: center;
        }

        .help-card {
          background: white;
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          max-width: 500px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .help-card h4 {
          color: var(--color-text-primary);
          font-size: 0.95rem;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .help-card p {
          color: var(--color-text-secondary);
          font-size: 0.85rem;
          line-height: 1.5;
          margin: 0;
        }

        @media (max-width: 768px) {
          .report-type-selector {
            padding: 16px;
          }

          .selector-header h1 {
            font-size: 1.75rem;
          }

          .selector-subtitle {
            font-size: 1rem;
          }

          .types-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .type-card {
            padding: 20px;
          }

          .help-card {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportTypeSelector;