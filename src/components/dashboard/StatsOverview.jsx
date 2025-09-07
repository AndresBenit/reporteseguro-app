import React, { useEffect, useState } from 'react';
import { Icon } from '../common/Icons';

const StatsOverview = ({ reportes = [], colaboradoresStats = {} }) => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Actualizar timestamp cuando cambien los reportes
  useEffect(() => {
    setLastUpdate(new Date());
  }, [reportes?.length, reportes]);
  
  // Validar que reportes sea un array válido
  const reportesValidos = Array.isArray(reportes) ? reportes : [];
  
  // Debug: verificar los datos que llegan (solo cuando hay cambios)
  if (reportesValidos.length > 0) {
    console.log('📊 StatsOverview actualizado - Total reportes:', reportesValidos.length);
  }
  
  // Calcular estadísticas básicas - CORREGIDO para estados reales
  const totalReportes = reportesValidos.length;
  const reportesCriticos = reportesValidos.filter(r => r.severidad === 'critica' || r.severidad === 'crítica').length;
  const reportesResueltos = reportesValidos.filter(r => r.estado === 'resuelto' || r.estado === 'cerrado').length;
  const reportesPendientes = reportesValidos.filter(r => r.estado === 'pendiente').length;
  const reportesEnProceso = reportesValidos.filter(r => 
    r.estado === 'proceso' || 
    r.estado === 'en_proceso' || 
    r.estado === 'asignado' ||
    r.estado === 'en_revision'
  ).length;
  
  // Colaboradores - PROTECCIÓN CONTRA NULL
  const colaboradoresData = colaboradoresStats || {};
  const totalColaboradores = colaboradoresData.total || 0;
  const colaboradoresActivos = colaboradoresData.activos || 0;

  // Calcular porcentaje de crecimiento (simulado para demo)
  const crecimientoMensual = totalReportes > 0 ? '+12%' : '0%';
  const eficienciaTasa = totalReportes > 0 ? Math.round((reportesResueltos / totalReportes) * 100) : 0;

  const stats = [
    {
      id: 'total',
      title: 'Total Reportes',
      value: totalReportes,
      subtitle: 'Este mes',
      change: crecimientoMensual,
      changeType: 'positive',
      icon: 'FileText',
      color: 'blue',
      bgColor: '#eff6ff'
    },
    {
      id: 'colaboradores',
      title: 'Colaboradores',
      value: colaboradoresActivos,
      subtitle: 'En sistema',
      change: `${totalColaboradores} activos`,
      changeType: 'info',
      icon: 'Users',
      color: 'green',
      bgColor: '#f0fdf4'
    },
    {
      id: 'criticos',
      title: 'Críticos',
      value: reportesCriticos,
      subtitle: 'Requieren atención',
      change: reportesCriticos > 0 ? '100%' : '0%',
      changeType: reportesCriticos > 0 ? 'negative' : 'positive',
      icon: 'AlertCircle',
      color: 'red',
      bgColor: '#fef2f2'
    },
    {
      id: 'resueltos',
      title: 'Resueltos',
      value: reportesResueltos,
      subtitle: 'Completados',
      change: `${eficienciaTasa}%`,
      changeType: 'positive',
      icon: 'CheckCircle',
      color: 'green',
      bgColor: '#f0fdf4'
    }
  ];

  const getChangeColor = (type) => {
    switch (type) {
      case 'positive': return '#059669';
      case 'negative': return '#dc2626';
      default: return '#6b7280';
    }
  };

  return (
    <div className="stats-overview">
      <div className="stats-header">
        <h2>
          <Icon name="Analytics" size={24} color="var(--color-primary)" />
          Resumen Ejecutivo
        </h2>
        <p>Métricas clave del sistema</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.id} className="stat-card" style={{ background: stat.bgColor }}>
            <div className="stat-header">
              <div className="stat-icon" style={{ 
                background: stat.color === 'blue' ? '#3b82f6' : 
                          stat.color === 'green' ? '#059669' : 
                          stat.color === 'red' ? '#dc2626' : '#6b7280',
                color: 'white'
              }}>
                <Icon name={stat.icon} size={20} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-title">{stat.title}</div>
              </div>
            </div>
            
            <div className="stat-footer">
              <span className="stat-subtitle">{stat.subtitle}</span>
              <span 
                className="stat-change" 
                style={{ color: getChangeColor(stat.changeType) }}
              >
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Indicadores de rendimiento en tiempo real */}
      <div className="performance-indicators">
        <div className="performance-header">
          <h3>
            <Icon name="TrendingUp" size={20} />
            Indicadores de Rendimiento en Tiempo Real
            <span className="live-indicator">
              <span className="live-dot"></span>
              EN VIVO
            </span>
          </h3>
          <p>Estado actual del sistema de reportes • Última actualización: {lastUpdate.toLocaleTimeString()}</p>
        </div>

        <div className="indicators-row">
          <div className="indicator">
            <div className="indicator-icon" style={{ background: '#f59e0b', color: 'white' }}>
              <Icon name="Clock" size={16} />
            </div>
            <div className="indicator-content">
              <div className="indicator-value">
                {reportesPendientes}
                <span className="indicator-label">Pendientes</span>
              </div>
              <div className="indicator-description">Requieren atención</div>
            </div>
          </div>

          <div className="indicator">
            <div className="indicator-icon" style={{ background: '#06b6d4', color: 'white' }}>
              <Icon name="Settings" size={16} />
            </div>
            <div className="indicator-content">
              <div className="indicator-value">
                {reportesEnProceso}
                <span className="indicator-label">En Proceso</span>
              </div>
              <div className="indicator-description">En seguimiento</div>
            </div>
          </div>

          <div className="indicator">
            <div className="indicator-icon" style={{ background: '#ef4444', color: 'white' }}>
              <Icon name="AlertCircle" size={16} />
            </div>
            <div className="indicator-content">
              <div className="indicator-value">
                {reportesCriticos}
                <span className="indicator-label">Críticos</span>
              </div>
              <div className="indicator-description">
                {reportesCriticos === 0 ? 'Sin críticos' : 'Atención urgente'}
              </div>
            </div>
          </div>

          <div className="indicator">
            <div className="indicator-icon" style={{ background: '#059669', color: 'white' }}>
              <Icon name="CheckCircle" size={16} />
            </div>
            <div className="indicator-content">
              <div className="indicator-value">
                {reportesResueltos}
                <span className="indicator-label">Resueltos</span>
              </div>
              <div className="indicator-description">Completados exitosamente</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .stats-overview {
          margin-bottom: 32px;
          position: relative;
          z-index: 1;
        }

        .stats-header {
          text-align: center;
          margin-bottom: 24px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .stats-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-primary);
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .stats-header p {
          color: #6b7280;
          font-size: 1rem;
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        }

        .stat-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 800;
          color: #1f2937;
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #4b5563;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .stat-change {
          font-size: 0.875rem;
          font-weight: 600;
        }

        .performance-indicators {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .performance-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .performance-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .live-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: #ef4444;
          color: white;
          border-radius: 12px;
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        
        .live-dot {
          width: 6px;
          height: 6px;
          background: white;
          border-radius: 50%;
          animation: pulse-dot 2s infinite;
        }
        
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .performance-header p {
          color: #6b7280;
          font-size: 0.875rem;
          margin: 0;
        }

        .indicators-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .indicator {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .indicator-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .indicator-content {
          flex: 1;
        }

        .indicator-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: #1f2937;
          line-height: 1;
          margin-bottom: 4px;
        }

        .indicator-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-left: 8px;
        }

        .indicator-description {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }

          .stat-card {
            padding: 16px;
          }

          .stat-value {
            font-size: 1.75rem;
          }

          .indicators-row {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .indicator {
            padding: 12px;
            flex-direction: column;
            text-align: center;
            gap: 8px;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .indicators-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default StatsOverview;