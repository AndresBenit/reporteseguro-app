import React, { useState } from 'react';
import { Icon } from '../common/Icons';
import RiesgosDashboard from './RiesgosDashboard';
import EvaluacionForm from './EvaluacionForm';
import ControlesForm from './ControlesForm';

const MatrizRiesgosMain = () => {
  const [vistaActiva, setVistaActiva] = useState('dashboard');


  const vistas = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'BarChart3',
      color: 'from-red-600 to-red-700',
      description: 'Vista analítica de matriz de riesgos, evaluaciones GTC-45 y controles implementados'
    },
    {
      id: 'evaluacion',
      label: 'Evaluación de Riesgos',
      icon: 'AlertTriangle',
      color: 'from-amber-600 to-amber-700',
      description: 'Identificación y evaluación de peligros según metodología GTC-45'
    },
    {
      id: 'controles',
      label: 'Controles de Riesgos',
      icon: 'Shield',
      color: 'from-emerald-600 to-emerald-700',
      description: 'Gestión de medidas de control según jerarquía de controles SST'
    }
  ];

  const vistaActual = vistas.find(v => v.id === vistaActiva);

  const renderContent = () => {
    switch (vistaActiva) {
      case 'dashboard':
        return <RiesgosDashboard />;
      case 'evaluacion':
        return <EvaluacionForm />;
      case 'controles':
        return <ControlesForm />;
      default:
        return <RiesgosDashboard />;
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50">
      {/* Header Principal */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-red-700 to-amber-700 rounded-2xl p-3 shadow-lg">
                <Icon name="AlertTriangle" size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-700 to-amber-700 bg-clip-text text-transparent">
                  Matriz de Riesgos GTC-45
                </h1>
                <p className="text-slate-600 font-medium">
                  Identificación • Evaluación • Control • Seguimiento • Metodología GTC-45
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Sistema Riesgos Activo</span>
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
      <div className="bg-gradient-to-r from-slate-50 to-red-50 border-b border-slate-200">
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

export default MatrizRiesgosMain;