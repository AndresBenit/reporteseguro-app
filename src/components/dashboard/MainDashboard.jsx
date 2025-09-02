import React, { useState } from 'react';
import { Icon } from '../common/Icons';
import StatsOverview from './StatsOverview';
import QuickActions from './QuickActions';
import ActividadReciente from './RecentActivity';

const MainDashboard = ({ user, reportes, colaboradoresStats }) => {
  return (
    <div className="dashboard-container">
      {/* Header profesional */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>
            <Icon name="Shield" size={28} color="#1e293b" />
            Bienvenido, {user.displayName || user.email.split('@')[0]}
          </h1>
          <p className="dashboard-subtitle">
            Panel de control ejecutivo • Sistema de gestión de seguridad industrial
          </p>
        </div>
      </div>

      {/* Acciones rápidas */}
      <QuickActions />

      {/* Resumen ejecutivo */}
      <StatsOverview 
        reportes={reportes} 
        colaboradoresStats={colaboradoresStats} 
      />

      {/* Actividad reciente */}
      <ActividadReciente reportes={reportes} />


      <style jsx>{`
        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
          position: relative;
        }
        
        .dashboard-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(90deg, rgba(226, 232, 240, 0.3) 1px, transparent 1px),
            linear-gradient(rgba(226, 232, 240, 0.3) 1px, transparent 1px);
          background-size: 20px 20px;
          pointer-events: none;
          opacity: 0.5;
        }
        
        .dashboard-header {
          text-align: center;
          margin-bottom: 40px;
          position: relative;
          z-index: 1;
        }
        
        .welcome-section {
          background: white;
          border-radius: 12px;
          padding: 40px 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }
        
        .welcome-section h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }
        
        .dashboard-subtitle {
          color: #64748b;
          font-size: 1rem;
          font-weight: 500;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 0.875rem;
        }
        
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 16px;
          }
          
          .welcome-section {
            padding: 30px 16px;
          }
          
          .welcome-section h1 {
            font-size: 2rem;
            flex-direction: column;
            gap: 8px;
          }
          
          .dashboard-subtitle {
            font-size: 0.8rem;
          }
        }
        
        @media (max-width: 480px) {
          .welcome-section h1 {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MainDashboard;