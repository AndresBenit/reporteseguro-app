import React, { useState } from 'react';
import { Icon } from '../common/Icons';
import ExamenesDashboard from './ExamenesDashboard';
import ExamenForm from './ExamenForm';
import SeguimientoForm from './SeguimientoForm';

const ExamenesMedicosMain = () => {
  const [vistaActiva, setVistaActiva] = useState('dashboard');

  const vistas = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'BarChart3',
      color: 'from-rose-600 to-rose-700',
      description: 'Vista analítica de exámenes médicos, vencimientos y cumplimiento normativo'
    },
    {
      id: 'registro',
      label: 'Registrar Examen',
      icon: 'FileText',
      color: 'from-teal-600 to-teal-700',
      description: 'Registrar nuevos exámenes médicos ocupacionales y de seguimiento'
    },
    {
      id: 'seguimiento',
      label: 'Seguimiento y Control',
      icon: 'Calendar',
      color: 'from-indigo-600 to-indigo-700',
      description: 'Control de vencimientos, alertas médicas y programación de exámenes'
    }
  ];

  const vistaActual = vistas.find(v => v.id === vistaActiva);

  const renderContent = () => {
    switch (vistaActiva) {
      case 'dashboard':
        return <ExamenesDashboard />;
      case 'registro':
        return <ExamenForm />;
      case 'seguimiento':
        return <SeguimientoForm />;
      default:
        return <ExamenesDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50">
      {/* Header Principal */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-rose-700 to-teal-700 rounded-2xl p-3 shadow-lg">
                <Icon name="Heart" size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-700 to-teal-700 bg-clip-text text-transparent">
                  Sistema de Exámenes Médicos SST
                </h1>
                <p className="text-slate-600 font-medium">
                  Medicina Ocupacional • Vigilancia Epidemiológica • Control de Vencimientos • Cumplimiento Normativo
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Sistema Médico Activo</span>
              </div>
              <div className="w-px h-6 bg-slate-300"></div>
              <span className="font-medium">
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {vistas.map(vista => (
              <button
                key={vista.id}
                onClick={() => setVistaActiva(vista.id)}
                className={`
                  flex items-center space-x-3 px-6 py-4 rounded-t-xl font-semibold transition-all duration-300
                  ${vistaActiva === vista.id
                    ? `bg-gradient-to-r ${vista.color} text-white shadow-lg transform scale-105`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                <Icon
                  name={vista.icon}
                  size={20}
                  className={vistaActiva === vista.id ? 'text-white' : 'text-slate-500'}
                />
                <span>{vista.label}</span>
                {vistaActiva === vista.id && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vista Activa Info */}
      <div className="bg-gradient-to-r from-slate-50 to-rose-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <Icon name="Info" size={16} className="text-slate-500" />
            <p className="text-slate-700 font-medium">
              {vistaActual?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div>
        {renderContent()}
      </div>
    </div>
  );
};

export default ExamenesMedicosMain;