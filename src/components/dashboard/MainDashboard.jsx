import React, { useState } from 'react';
import { Icon } from '../common/Icons';
import StatsOverview from './StatsOverview';
import QuickActions from './QuickActions';
import ActividadReciente from './RecentActivity';

const MainDashboard = ({ user, reportes, colaboradoresStats }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 relative">
      {/* Patrón de fondo moderno */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

      {/* Gradiente sutil de overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-50/20 to-transparent pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Empresarial Mejorado */}
        <div className="text-center mb-12">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 relative overflow-hidden">
            {/* Decoración de fondo */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full blur-3xl opacity-60"></div>

            <div className="relative">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                  <Icon name="Shield" size={32} color="white" />
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                  Bienvenido, {user.displayName || user.email.split('@')[0]}
                </h1>
              </div>
              <p className="text-slate-600 text-lg font-medium tracking-wide">
                PANEL DE CONTROL EJECUTIVO • SISTEMA DE GESTIÓN DE SEGURIDAD INDUSTRIAL
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-500 font-medium">Sistema Activo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="mb-10">
          <QuickActions />
        </div>

        {/* Resumen ejecutivo */}
        <div className="mb-10">
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

      <style jsx>{`
        .bg-grid-pattern {
          background-image:
            linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px),
            linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
};

export default MainDashboard;