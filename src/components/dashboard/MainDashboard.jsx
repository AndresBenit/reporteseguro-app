import React from 'react';
import { Icon } from '../common/Icons';
import StatsOverview from './StatsOverview';
import QuickActions from './QuickActions';
import ActividadReciente from './RecentActivity';

const MainDashboard = ({ user, reportes, colaboradoresStats }) => {

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Empresarial Simple */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Icon name="Shield" size={24} color="white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Bienvenido, {user.displayName || user.email.split('@')[0]}
              </h1>
            </div>
            <p className="text-gray-600 font-medium">
              Panel de Control Ejecutivo • Sistema Integral de Gestión SST
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-semibold">TODOS LOS SISTEMAS OPERATIVOS</span>
            </div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="mb-8">
          <QuickActions />
        </div>

        {/* Resumen ejecutivo */}
        <div className="mb-8">
          <StatsOverview
            reportes={reportes}
            colaboradoresStats={colaboradoresStats}
          />
        </div>

        {/* Actividad reciente */}
        <div className="mb-8">
          <ActividadReciente reportes={reportes} />
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;