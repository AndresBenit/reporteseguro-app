import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../common/Icons';

const ReportTypeSelector = () => {
  const navigate = useNavigate();

  const handleTypeSelect = (typeId) => {
    switch (typeId) {
      case 'incidencia':
        // Usar el formulario de incidencia existente
        navigate('/reportes/incident-form');
        break;
      case 'recomendacion':
        navigate('/formularios/recomendacion');
        break;
      case 'abordaje':
        navigate('/formularios/abordaje');
        break;
      case 'epp':
        navigate('/formularios/control-epp');
        break;
      default:
        break;
    }
  };

  const reportTypes = [
    {
      id: 'incidencia',
      title: 'Reporte de Incidencia',
      description: 'Condiciones inseguras y actos riesgosos',
      icon: 'AlertTriangle',
      color: '#dc2626',
      bgColor: '#fef2f2',
      priority: 'CRÍTICO',
      examples: ['Condición insegura', 'Acto inseguro']
    },
    {
      id: 'recomendacion',
      title: 'Nueva Recomendación',
      description: 'Registro de mejora para colaborador',
      icon: 'Lightbulb',
      color: '#3b82f6',
      bgColor: '#eff6ff',
      priority: 'IMPORTANTE',
      examples: ['Recomendación de mejora', 'Capacitación']
    },
    {
      id: 'abordaje',
      title: 'Abordaje en Campo',
      description: 'Documentar conversación directa con colaborador',
      icon: 'Users',
      color: '#059669',
      bgColor: '#ecfdf5',
      priority: 'SEGUIMIENTO',
      examples: ['Conversación directa', 'Abordaje correctivo']
    },
    {
      id: 'epp',
      title: 'Control de EPP',
      description: 'Registrar entrega de Elementos de Protección Personal',
      icon: 'Shield',
      color: '#7c3aed',
      bgColor: '#f3e8ff',
      priority: 'CONTROL',
      examples: ['Entrega de casco', 'Entrega de guantes']
    }
  ];

  const renderForm = () => {
    // Esta función ya no se usa - navegamos a rutas específicas
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Icon name="FileText" size={32} color="#1f2937" />
            <h1 className="text-4xl font-bold text-gray-900">
              Centro de Reportes
            </h1>
          </div>
          <p className="text-lg text-gray-600 font-medium">
            Selecciona el tipo de reporte que necesitas crear
          </p>
        </div>

        {/* Report Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
          {reportTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleTypeSelect(type.id)}
              className="group relative bg-white rounded-2xl p-6 border-2 border-transparent hover:border-current transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl shadow-lg"
              style={{ color: type.color }}
            >
              {/* Card Background */}
              <div
                className="absolute inset-0 rounded-2xl opacity-5"
                style={{ backgroundColor: type.color }}
              />

              {/* Header */}
              <div className="relative flex justify-between items-start mb-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md bg-white"
                  style={{ borderColor: type.color }}
                >
                  <Icon name={type.icon} size={28} color={type.color} />
                </div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold text-white tracking-wider"
                  style={{ backgroundColor: type.color }}
                >
                  {type.priority}
                </span>
              </div>

              {/* Content */}
              <div className="relative mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {type.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {type.description}
                </p>
              </div>

              {/* Examples */}
              <div className="relative bg-gray-50 rounded-xl p-4 mb-4 border">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                  Ejemplos:
                </span>
                <div className="flex flex-wrap gap-2">
                  {type.examples.slice(0, 2).map((example, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 bg-white rounded-md text-xs font-medium text-gray-700 border"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="relative flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-sm font-semibold" style={{ color: type.color }}>
                  Crear reporte
                </span>
                <Icon name="ChevronRight" size={18} color={type.color} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>

        {/* History Section */}
        <div className="text-center py-12 border-t-2 border-gray-200">
          <button
            onClick={() => navigate('/reportes/historial')}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 mx-auto"
          >
            <Icon name="BarChart3" size={24} color="white" />
            Ver Historial de Reportes
          </button>
          <p className="mt-4 text-gray-600">
            Consulta todos los reportes registrados con filtros y búsqueda
          </p>
        </div>

        {/* Help Section */}
        <div className="flex justify-center mt-12">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm max-w-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <Icon name="HelpCircle" size={24} color="#6b7280" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿No sabes qué tipo elegir?
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  Si tienes dudas, usa <strong className="text-gray-900">Reporte de Incidencia</strong> para situaciones críticas
                  o <strong className="text-gray-900">Nueva Recomendación</strong> para condiciones que podrían mejorarse.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ReportTypeSelector;