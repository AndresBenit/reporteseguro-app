import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from './Icons';

const Navigation = () => {
  const navItems = [
    {
      path: '/',
      icon: 'Home',
      label: 'Inicio',
      exact: true
    },
    {
      path: '/reportes',
      icon: 'FileText',
      label: 'Reportes'
    },
    {
      path: '/supervision',
      icon: 'Users',
      label: 'Supervisión'
    },
    {
      path: '/colaboradores',
      icon: 'UserCheck',
      label: 'Colaboradores'
    }
  ];

  return (
    <nav className="app-navigation">
      <div className="nav-container">
        <div className="nav-items">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon name={item.icon} size={18} />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <style jsx>{`
        .app-navigation {
          position: fixed;
          top: 70px;
          left: 0;
          right: 0;
          z-index: 999;
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          box-shadow: var(--shadow-sm);
        }

        .nav-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .nav-items {
          display: flex;
          gap: 4px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .nav-items::-webkit-scrollbar {
          display: none;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 8px;
          text-decoration: none;
          color: var(--color-text-secondary);
          font-weight: 500;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .nav-item:hover {
          background: var(--color-surface-hover);
          color: var(--color-text-primary);
        }

        .nav-item.active {
          background: var(--color-primary);
          color: white;
        }

        .nav-item.active:hover {
          background: var(--color-primary-light);
        }

        @media (max-width: 768px) {
          .nav-container {
            padding: 0 16px;
          }

          .nav-item {
            padding: 10px 12px;
            font-size: 0.85rem;
          }

          .nav-label {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .nav-item {
            padding: 8px 10px;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navigation;