import React from 'react';
import { Icon } from './Icons';

const Header = ({ user, onLogout }) => {
  return (
    <header className="app-header">
      <div className="header-container">
        {/* Logo y título */}
        <div className="header-brand">
          <Icon name="Shield" size={32} color="var(--color-primary)" />
          <div className="brand-text">
            <h1>ReporteSeguro</h1>
            <span>Sistema de Gestión de Seguridad</span>
          </div>
        </div>

        {/* Info del usuario */}
        <div className="header-user">
          <div className="user-info">
            <span className="user-name">
              {user.displayName || user.email.split('@')[0]}
            </span>
            <span className="user-role">Administrador</span>
          </div>
          
          <button 
            onClick={onLogout}
            className="logout-button"
            title="Cerrar sesión"
          >
            <Icon name="LogOut" size={18} />
            <span>Salir</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .app-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          box-shadow: var(--shadow-sm);
        }

        .header-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-text h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-primary);
          margin: 0;
          line-height: 1;
        }

        .brand-text span {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          font-weight: 500;
        }

        .header-user {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .user-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .user-role {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
        }

        .logout-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: var(--color-danger);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .logout-button:hover {
          background: var(--color-danger-light);
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .header-container {
            padding: 0 16px;
          }

          .brand-text h1 {
            font-size: 1.25rem;
          }

          .brand-text span {
            display: none;
          }

          .user-info {
            display: none;
          }

          .logout-button span {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;