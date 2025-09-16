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
    <div>
      {/* Header simple */}
      <div className="text-center mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 inline-flex items-center gap-2">
          <div className="p-2 bg-amber-600 rounded-lg">
            <Icon name="Zap" size={20} color="white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Acciones Rápidas
          </h2>
        </div>
      </div>

      {/* Grid de acciones empresarial */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 text-left flex items-center gap-4"
          >
            {/* Icono */}
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              action.color === '#dc2626' ? 'bg-red-600' :
              action.color === '#3b82f6' ? 'bg-blue-600' :
              action.color === '#059669' ? 'bg-emerald-600' :
              'bg-purple-600'
            }`}>
              <Icon name={action.icon} size={24} color="white" />
            </div>

            {/* Contenido */}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                {action.title}
              </h3>
              <p className="text-sm text-gray-600">
                {action.subtitle}
              </p>
            </div>

            {/* Flecha */}
            <div className="text-gray-400">
              <Icon name="ChevronRight" size={20} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;