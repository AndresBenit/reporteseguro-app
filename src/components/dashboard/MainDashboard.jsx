import React, { useState } from 'react';
import { Icon } from '../common/Icons';
import { useNotifications } from '../common/NotificationSystem';
import StatsOverview from './StatsOverview';
import QuickActions from './QuickActions';
import ActividadReciente from './RecentActivity';

const MainDashboard = ({ user, reportes, colaboradoresStats }) => {
  const { success, error, warning, info } = useNotifications();

  const testNotifications = () => {
    success('Reporte creado exitosamente', {
      title: 'Operación completada',
      details: 'El reporte se ha guardado correctamente en la base de datos.'
    });

    setTimeout(() => {
      warning('Revisar configuración de buckets', {
        title: 'Advertencia de configuración',
        details: 'Algunos buckets de almacenamiento requieren atención.'
      });
    }, 1000);

    setTimeout(() => {
      info('Sistema funcionando correctamente', {
        title: 'Estado del sistema',
        details: 'Todas las funcionalidades están operativas.'
      });
    }, 2000);
  };

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
              Panel de Control Ejecutivo • Sistema de Gestión de Seguridad Industrial
            </p>

            {/* Botón temporal de prueba de notificaciones */}
            <button
              onClick={testNotifications}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Probar Sistema de Notificaciones
            </button>
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