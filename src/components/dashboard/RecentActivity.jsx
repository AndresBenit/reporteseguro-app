import React from 'react';
import { Icon } from '../common/Icons';

const ActividadReciente = ({ reportes = [] }) => {
  // ✅ VALIDACIÓN: Asegurar que reportes es un array válido
  const reportesValidos = Array.isArray(reportes) ? reportes : [];
  
  
  // Ordenar por fecha más reciente y tomar los primeros 5
  const recentReports = reportesValidos
    .filter(r => r && (r.fecha || r.created_at)) // ✅ Filtrar reportes válidos con fecha o created_at
    .sort((a, b) => {
      // Intentar múltiples campos de fecha
      const getFecha = (reporte) => {
        const fecha = reporte.fecha || reporte.created_at;
        return fecha?.toDate ? fecha.toDate() : new Date(fecha);
      };
      
      const dateA = getFecha(a);
      const dateB = getFecha(b);
      return dateB - dateA;
    })
    .slice(0, 5);

  const getSeverityColor = (severity) => {
    const colors = {
      baja: "#059669",
      media: "#f59e0b",
      alta: "#ef4444",
      critica: "#dc2626"
    };
    return colors[severity] || "#6b7280";
  };

  const getStatusColor = (status) => {
    const colors = {
      pendiente: "#3b82f6",
      proceso: "#8b5cf6",
      resuelto: "#10b981"
    };
    return colors[status] || "#6b7280";
  };

  const formatTimeAgo = (reporte) => {
    const fecha = reporte.fecha || reporte.created_at;
    if (!fecha) return 'Fecha no disponible';
    
    const now = new Date();
    const reportDate = fecha?.toDate ? fecha.toDate() : new Date(fecha);
    const diffInMs = now - reportDate;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} h`;
    } else {
      return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    }
  };

  if (recentReports.length === 0) {
    return (
      <div className="recent-activity">
        <h2 className="section-title">
          <Icon name="Clock" size={20} />
          Actividad Reciente
        </h2>
        
        <div className="empty-state">
          <Icon name="Calendar" size={48} color="#9ca3af" />
          <p>No hay actividad reciente</p>
        </div>

        <style jsx>{`
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
          
          .empty-state {
            text-align: center;
            padding: 40px;
            color: var(--color-text-secondary);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="recent-activity">
      <h2 className="section-title">
        <Icon name="Clock" size={20} />
        Actividad Reciente
      </h2>
      
      <div className="activity-list">
        {recentReports.map((reporte, index) => (
          <div key={reporte.id || index} className="activity-item">
            <div className="activity-icon">
              <Icon 
                name={reporte.severidad === 'critica' ? 'AlertCircle' : 'Reports'} 
                size={16} 
                color={getSeverityColor(reporte.severidad)} 
              />
            </div>
            
            <div className="activity-content">
              <div className="activity-header">
                <span className="activity-type">{reporte.tipo}</span>
                <span className="activity-time">
                  {formatTimeAgo(reporte)}
                </span>
              </div>
              
              <div className="activity-description">
                {reporte.descripcion?.length > 80 
                  ? `${reporte.descripcion.substring(0, 80)}...` 
                  : reporte.descripcion || 'Sin descripción'}
              </div>
              
              <div className="activity-footer">
                <span className="activity-area">
                  <Icon name="MapPin" size={12} />
                  {reporte.area}
                </span>
                
                <div className="activity-badges">
                  <span 
                    className="severity-badge"
                    style={{ 
                      background: `${getSeverityColor(reporte.severidad)}20`,
                      color: getSeverityColor(reporte.severidad)
                    }}
                  >
                    {reporte.severidad}
                  </span>
                  
                  <span 
                    className="status-badge"
                    style={{ 
                      background: `${getStatusColor(reporte.estado)}20`,
                      color: getStatusColor(reporte.estado)
                    }}
                  >
                    {reporte.estado}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .recent-activity {
          max-width: 800px;
          margin: 0 auto;
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

        .activity-list {
          background: var(--color-surface);
          border-radius: 16px;
          border: 1px solid var(--color-border);
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .activity-item {
          display: flex;
          gap: 16px;
          padding: 20px;
          border-bottom: 1px solid var(--color-border-light);
          transition: background-color 0.2s ease;
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-item:hover {
          background: var(--color-surface-hover);
        }

        .activity-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--color-background);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid var(--color-border);
        }

        .activity-content {
          flex: 1;
          min-width: 0;
        }

        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .activity-type {
          font-weight: 600;
          color: var(--color-text-primary);
          font-size: 0.9rem;
        }

        .activity-time {
          font-size: 0.8rem;
          color: var(--color-text-secondary);
          flex-shrink: 0;
        }

        .activity-description {
          color: var(--color-text-secondary);
          font-size: 0.9rem;
          line-height: 1.4;
          margin-bottom: 12px;
        }

        .activity-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .activity-area {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.8rem;
          color: var(--color-text-secondary);
          flex-shrink: 0;
        }

        .activity-badges {
          display: flex;
          gap: 8px;
        }

        .severity-badge,
        .status-badge {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        @media (max-width: 768px) {
          .activity-item {
            padding: 16px;
            gap: 12px;
          }
          
          .activity-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
          
          .activity-footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          
          .activity-badges {
            align-self: stretch;
          }
          
          .severity-badge,
          .status-badge {
            flex: 1;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ActividadReciente;