import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from './Icons';

const MainNavigation = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  const getActiveSection = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path.startsWith('/reportes')) return 'reportes';
    if (path.startsWith('/supervision')) return 'supervision';
    if (path.startsWith('/colaboradores')) return 'colaboradores';
    return 'dashboard';
  };

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Inicio',
      icon: 'Home',
      path: '/',
      color: '#3b82f6'
    },
    {
      id: 'reportes',
      label: 'Reportes',
      icon: 'FileText',
      path: '/reportes',
      color: '#f59e0b',
      submenu: [
        {
          id: 'nuevo-reporte',
          label: 'Nuevo Reporte',
          icon: 'Plus',
          path: '/reportes/nuevo'
        },
        {
          id: 'lista-reportes',
          label: 'Lista de Reportes',
          icon: 'List',
          path: '/reportes/lista'
        },
        {
          id: 'historial-basico',
          label: 'Historial Básico',
          icon: 'Clock',
          path: '/reportes/historial'
        },
        {
          id: 'historial-avanzado',
          label: 'Historial Avanzado',
          icon: 'Activity',
          path: '/reportes/historial-mejorado',
          badge: 'NUEVO'
        },
        {
          id: 'migracion',
          label: 'Migración de Datos',
          icon: 'Database',
          path: '/reportes/migracion',
          badge: 'ADMIN'
        }
      ]
    },
    {
      id: 'supervision',
      label: 'Supervisión',
      icon: 'Shield',
      path: '/supervision',
      color: '#8b5cf6'
    },
    {
      id: 'colaboradores',
      label: 'Colaboradores',
      icon: 'Users',
      path: '/colaboradores',
      color: '#10b981'
    }
  ];

  const activeSection = getActiveSection();

  const handleItemClick = (item) => {
    if (item.submenu) {
      setActiveSubmenu(activeSubmenu === item.id ? null : item.id);
    } else {
      navigate(item.path);
      setActiveSubmenu(null);
    }
  };

  const handleSubmenuClick = (path) => {
    navigate(path);
    setActiveSubmenu(null);
  };

  return (
    <nav className="main-navigation">
      {/* Header */}
      <div className="nav-header">
        <div className="nav-brand">
          <Icon name="Shield" size={24} color="#1e3a8a" />
          <h1>ReporteSeguro</h1>
        </div>
        
        <div className="nav-user">
          <div className="user-info">
            <span className="user-name">
              {user.displayName || user.email.split('@')[0]}
            </span>
            <span className="user-role">Administrador</span>
          </div>
          <button onClick={onLogout} className="logout-button">
            <Icon name="LogOut" size={16} />
            <span className="logout-text">Salir</span>
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="nav-items">
        {navigationItems.map((item) => (
          <div key={item.id} className="nav-item-container">
            <button
              onClick={() => handleItemClick(item)}
              className={`nav-item ${
                activeSection === item.id ? 'active' : ''
              } ${
                item.submenu ? 'has-submenu' : ''
              }`}
              style={{
                '--item-color': item.color
              }}
            >
              <div className="nav-item-icon">
                <Icon 
                  name={item.icon} 
                  size={20} 
                  color={activeSection === item.id ? 'white' : item.color} 
                />
              </div>
              <span className="nav-item-label">{item.label}</span>
              {item.submenu && (
                <Icon 
                  name={activeSubmenu === item.id ? 'ChevronUp' : 'ChevronDown'} 
                  size={16} 
                  color={activeSection === item.id ? 'white' : '#6b7280'} 
                  className="submenu-arrow"
                />
              )}
            </button>

            {/* Submenu */}
            {item.submenu && activeSubmenu === item.id && (
              <div className="submenu">
                {item.submenu.map((subitem) => (
                  <button
                    key={subitem.id}
                    onClick={() => handleSubmenuClick(subitem.path)}
                    className={`submenu-item ${
                      location.pathname === subitem.path ? 'active' : ''
                    }`}
                  >
                    <Icon name={subitem.icon} size={16} />
                    <span>{subitem.label}</span>
                    {subitem.badge && (
                      <span className={`badge badge-${subitem.badge.toLowerCase()}`}>
                        {subitem.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .main-navigation {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .nav-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid #f3f4f6;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-brand h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e3a8a;
          margin: 0;
        }

        .nav-user {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .user-name {
          font-weight: 600;
          color: #374151;
          font-size: 0.9rem;
        }

        .user-role {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .logout-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.85rem;
          transition: all 0.2s ease;
        }

        .logout-button:hover {
          background: #dc2626;
        }

        .nav-items {
          display: flex;
          padding: 0 24px;
          gap: 4px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          position: relative;
        }

        .nav-items::-webkit-scrollbar {
          height: 3px;
        }

        .nav-items::-webkit-scrollbar-track {
          background: transparent;
        }

        .nav-items::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }

        .nav-item-container {
          position: relative;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 8px 8px 0 0;
          transition: all 0.2s ease;
          font-weight: 600;
          font-size: 0.9rem;
          color: #6b7280;
          white-space: nowrap;
          position: relative;
          min-width: max-content;
        }

        .nav-item:hover {
          background: rgba(59, 130, 246, 0.05);
          color: var(--item-color);
        }

        .nav-item.active {
          background: var(--item-color);
          color: white;
        }

        .nav-item.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--item-color);
        }

        .nav-item.has-submenu {
          padding-right: 32px;
        }

        .nav-item-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-item-label {
          font-weight: inherit;
        }

        .submenu-arrow {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
        }

        .submenu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-top: none;
          border-radius: 0 0 12px 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          z-index: 100;
          min-width: 250px;
        }

        .submenu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.85rem;
          color: #374151;
          text-align: left;
          border-bottom: 1px solid #f1f5f9;
        }

        .submenu-item:last-child {
          border-bottom: none;
        }

        .submenu-item:hover {
          background: #f8fafc;
          color: #1f2937;
        }

        .submenu-item.active {
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 600;
        }

        .badge {
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-left: auto;
        }

        .badge-nuevo {
          background: #10b981;
          color: white;
        }

        .badge-admin {
          background: #ef4444;
          color: white;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .nav-header {
            padding: 12px 16px;
          }

          .nav-brand h1 {
            font-size: 1.25rem;
          }

          .user-info {
            display: none;
          }

          .logout-button {
            padding: 6px 12px;
            font-size: 0.8rem;
          }

          .logout-text {
            display: none;
          }

          .nav-items {
            padding: 0 16px;
            flex-wrap: wrap;
            max-height: none;
          }

          .nav-item {
            padding: 10px 16px;
            font-size: 0.85rem;
          }

          .nav-item-label {
            display: none;
          }

          .nav-item {
            min-width: 48px;
            justify-content: center;
          }

          .submenu {
            position: fixed;
            top: auto;
            left: 16px;
            right: 16px;
            bottom: 80px;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            max-height: 300px;
            overflow-y: auto;
          }
        }

        @media (max-width: 480px) {
          .nav-header {
            padding: 10px 12px;
          }

          .nav-brand h1 {
            font-size: 1.1rem;
          }

          .nav-items {
            padding: 0 12px;
          }

          .nav-item {
            padding: 8px 12px;
            min-width: 44px;
          }
        }
      `}</style>
    </nav>
  );
};

export default MainNavigation;