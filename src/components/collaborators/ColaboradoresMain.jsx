import React, { useState } from 'react';
import { Icon } from '../common/Icons';
import Colaboradores from './Colaboradores';
import PerfilIndividual from '../supervision/PerfilIndividual';

const ColaboradoresMain = () => {
  const [activeTab, setActiveTab] = useState('gestion');

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Navegación de Colaboradores */}
        <div className="bg-white rounded-xl border border-gray-200 p-1.5 mb-8 shadow-sm max-w-lg mx-auto">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('gestion')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'gestion'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon name="Users" size={16} />
              Gestión
            </button>

            <button
              onClick={() => setActiveTab('perfil')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'perfil'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon name="Analytics" size={16} />
              Perfil Individual
            </button>
          </div>
        </div>

        {/* Contenido */}
        {activeTab === 'gestion' && <Colaboradores />}
        {activeTab === 'perfil' && <PerfilIndividual />}
      </div>
    </div>
  );
};

export default ColaboradoresMain;