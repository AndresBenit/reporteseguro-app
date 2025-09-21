import React from 'react';
import { Icon } from '../common/Icons';

const EvaluacionForm = () => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-amber-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="AlertTriangle" size={32} className="text-amber-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Evaluación de Riesgos</h3>
        <p className="text-slate-600 mb-4">
          Identificación y evaluación de peligros según metodología GTC-45
        </p>
        <div className="text-sm text-slate-500">
          Componente separado siguiendo Pattern A - Próximamente con funcionalidad completa
        </div>
      </div>
    </div>
  );
};

export default EvaluacionForm;