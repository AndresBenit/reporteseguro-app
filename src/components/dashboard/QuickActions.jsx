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
    <div className="mb-10">
      {/* Header modernizado */}
      <div className="text-center mb-8">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 inline-flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
            <Icon name="Zap" size={20} color="white" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-amber-700 bg-clip-text text-transparent">
            Acciones Rápidas
          </h2>
        </div>
      </div>

      {/* Grid de acciones modernizado */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className={`group bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-lg border-2 border-transparent hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left flex items-center gap-4 ${
              action.color === '#dc2626' ? 'hover:border-red-300 hover:bg-red-50/80' :
              action.color === '#3b82f6' ? 'hover:border-blue-300 hover:bg-blue-50/80' :
              action.color === '#059669' ? 'hover:border-emerald-300 hover:bg-emerald-50/80' :
              'hover:border-purple-300 hover:bg-purple-50/80'
            }`}
          >
            {/* Icono con gradiente */}
            <div className={`w-12 h-12 rounded-xl shadow-lg flex items-center justify-center ${
              action.color === '#dc2626' ? 'bg-gradient-to-br from-red-500 to-red-600' :
              action.color === '#3b82f6' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
              action.color === '#059669' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
              'bg-gradient-to-br from-purple-500 to-purple-600'
            }`}>
              <Icon name={action.icon} size={24} color="white" />
            </div>

            {/* Contenido */}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-gray-800">
                {action.title}
              </h3>
              <p className="text-sm text-gray-600 group-hover:text-gray-700">
                {action.subtitle}
              </p>
            </div>

            {/* Flecha */}
            <div className={`opacity-40 group-hover:opacity-100 transition-opacity duration-300 ${
              action.color === '#dc2626' ? 'text-red-600' :
              action.color === '#3b82f6' ? 'text-blue-600' :
              action.color === '#059669' ? 'text-emerald-600' :
              'text-purple-600'
            }`}>
              <Icon name="ChevronRight" size={20} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;