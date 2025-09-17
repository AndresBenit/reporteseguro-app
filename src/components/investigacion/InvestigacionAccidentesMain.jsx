import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../common/Icons';
import InvestigacionDashboard from './InvestigacionDashboard';
import InvestigacionForm from './InvestigacionForm';

const InvestigacionAccidentesMain = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [vistaActiva, setVistaActiva] = useState('dashboard');

  // Detectar la ruta actual y cambiar la vista automáticamente
  useEffect(() => {
    if (location.pathname === '/investigacion/nuevo') {
      setVistaActiva('nuevo');
    } else {
      setVistaActiva('dashboard');
    }
  }, [location.pathname]);

  const vistas = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'BarChart3',
      color: 'from-red-600 to-red-700',
      description: 'Vista analítica de investigaciones de accidentes y estadísticas'
    },
    {
      id: 'nuevo',
      label: 'Nueva Investigación',
      icon: 'Plus',
      color: 'from-orange-600 to-orange-700',
      description: 'Registrar nueva investigación de accidente laboral'
    }
  ];

  const vistaActual = vistas.find(v => v.id === vistaActiva);

  const handleVistaChange = (nuevaVista) => {
    setVistaActiva(nuevaVista);
    // Navegar a la ruta correspondiente
    if (nuevaVista === 'nuevo') {
      navigate('/investigacion/nuevo');
    } else {
      navigate('/investigacion');
    }
  };

  const renderContent = () => {
    switch (vistaActiva) {
      case 'dashboard':
        return <InvestigacionDashboard />;
      case 'nuevo':
        return <InvestigacionForm />;
      default:
        return <InvestigacionDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50">
      {/* Header Principal */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-red-700 to-orange-700 rounded-2xl p-3 shadow-lg">
                <Icon name="AlertTriangle" size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-700 to-orange-700 bg-clip-text text-transparent">
                  Investigación de Accidentes
                </h1>
                <p className="text-slate-600 font-medium">
                  Sistema de Seguridad y Salud en el Trabajo • Metodología Científica • Control Preventivo
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Sistema SST Activo</span>
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
                onClick={() => handleVistaChange(vista.id)}
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

export default InvestigacionAccidentesMain;