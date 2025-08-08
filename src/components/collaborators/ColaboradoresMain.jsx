import React, { useState } from 'react';
import { Icon } from '../common/Icons';
import Colaboradores from './Colaboradores';
import PerfilIndividual from '../supervision/PerfilIndividual';

const ColaboradoresMain = () => {
  const [activeTab, setActiveTab] = useState('gestion');

  return (
    <div>
      {/* Navegación de Colaboradores */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '6px',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--color-border)',
        maxWidth: '500px',
        margin: '0 auto 24px auto'
      }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setActiveTab('gestion')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: activeTab === 'gestion' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'gestion' ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'var(--transition-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Icon name="Users" size={16} />
            Gestión
          </button>
          
          <button
            onClick={() => setActiveTab('perfil')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: activeTab === 'perfil' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'perfil' ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'var(--transition-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
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
  );
};

export default ColaboradoresMain;