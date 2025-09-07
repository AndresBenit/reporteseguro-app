import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../common/Icons';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'new-incident',
      title: 'Reportar Incidencia',
      subtitle: 'Condición o acto inseguro',
      icon: 'AlertTriangle',
      color: '#dc2626',
      bgColor: '#fef2f2',
      action: () => navigate('/reportes/incident-form')
    },
    {
      id: 'new-recommendation',
      title: 'Nueva Recomendación',
      subtitle: 'Registro de mejora para colaborador',
      icon: 'Lightbulb',
      color: '#3b82f6',
      bgColor: '#eff6ff',
      action: () => navigate('/formularios/recomendacion')
    },
    {
      id: 'new-approach',
      title: 'Abordaje en Campo',
      subtitle: 'Documentar conversación directa',
      icon: 'Users',
      color: '#059669',
      bgColor: '#ecfdf5',
      action: () => navigate('/formularios/abordaje')
    },
    {
      id: 'control-epp',
      title: 'Control de EPP',
      subtitle: 'Registrar entrega de elementos',
      icon: 'Shield',
      color: '#7c3aed',
      bgColor: '#f3e8ff',
      action: () => navigate('/formularios/control-epp')
    }
  ];

  return (
    <div className="quick-actions-container">
      <h2 className="section-title">
        <Icon name="Zap" size={20} />
        Acciones Rápidas
      </h2>
      
      <div className="actions-grid">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className="action-card"
            style={{
              '--action-color': action.color,
              '--action-bg': action.bgColor
            }}
          >
            <div className="action-icon">
              <Icon name={action.icon} size={24} color={action.color} />
            </div>
            <div className="action-content">
              <h3>{action.title}</h3>
              <p>{action.subtitle}</p>
            </div>
            <div className="action-arrow">
              <Icon name="ChevronRight" size={20} color={action.color} />
            </div>
          </button>
        ))}
      </div>

      <style jsx>{`
        .quick-actions-container {
          margin-bottom: 40px;
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          text-align: center;
          justify-content: center;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .action-card {
          background: var(--action-bg);
          border: 2px solid transparent;
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .action-card:hover {
          border-color: var(--action-color);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .action-icon {
          width: 50px;
          height: 50px;
          background: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .action-content {
          flex: 1;
        }

        .action-content h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 4px;
        }

        .action-content p {
          font-size: 0.9rem;
          color: var(--color-text-secondary);
          margin: 0;
        }

        .action-arrow {
          opacity: 0.5;
          transition: opacity 0.3s ease;
        }

        .action-card:hover .action-arrow {
          opacity: 1;
        }

        @media (max-width: 768px) {
          .actions-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .action-card {
            padding: 20px;
          }
          
          .action-icon {
            width: 45px;
            height: 45px;
          }
          
          .action-content h3 {
            font-size: 1rem;
          }
          
          .action-content p {
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};

export default QuickActions;