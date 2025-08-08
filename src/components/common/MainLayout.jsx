import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from './Icons';

const MainLayout = ({ user, onLogout, children, reportes = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Inicio',
      icon: 'Home',
      path: '/',
      description: 'Panel principal'
    },
    {
      id: 'reportes',
      label: 'Reportes',
      icon: 'FileText',
      path: '/reportes',
      description: 'Crear y gestionar reportes'
    },
    {
      id: 'supervision',
      label: 'Análisis',
      icon: 'Eye',
      path: '/supervision',
      description: 'Herramientas de análisis'
    },
    {
      id: 'colaboradores',
      label: 'Colaboradores',
      icon: 'Users',
      path: '/colaboradores',
      description: 'Gestión de personal'
    }
  ];

  const isActiveRoute = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="main-layout">
      {/* Header Principal */}
      <header className="main-header">
        <div className="header-container">
          {/* Logo y título */}
          <div className="header-brand">
            <Icon name="Shield" size={32} color="#1e40af" />
            <div className="brand-text">
              <h1>ReporteSeguro</h1>
              <span>Sistema de Gestión de Seguridad</span>
            </div>
          </div>

          {/* Navegación Desktop */}
          <nav className="desktop-nav">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`nav-item ${isActiveRoute(item.path) ? 'active' : ''}`}
                title={item.description}
              >
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User menu */}
          <div className="header-actions">
            <div className="header-user">
              <div className="user-info">
                <span className="user-name">
                  {user.displayName || user.email.split('@')[0]}
                </span>
                <span className="user-role">Administrador</span>
              </div>
              <button className="logout-button" onClick={onLogout}>
                <Icon name="LogOut" size={18} />
                <span className="logout-text">Salir</span>
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <button 
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Icon name={mobileMenuOpen ? "X" : "Menu"} size={24} />
          </button>
        </div>
      </header>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
          <nav className="mobile-nav" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <h3>Navegación</h3>
              <button onClick={() => setMobileMenuOpen(false)}>
                <Icon name="X" size={20} />
              </button>
            </div>
            
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`mobile-nav-item ${isActiveRoute(item.path) ? 'active' : ''}`}
              >
                <Icon name={item.icon} size={20} />
                <div>
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-description">{item.description}</span>
                </div>
              </button>
            ))}
            
            <div className="mobile-nav-footer">
              <button className="mobile-logout" onClick={onLogout}>
                <Icon name="LogOut" size={18} />
                Cerrar Sesión
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>

      <style jsx>{`
        .main-layout {
          min-height: 100vh;
          background: #f8fafc;
        }

        .main-header {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .header-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .header-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .brand-text h1 {
          color: #1e40af;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          line-height: 1;
        }

        .brand-text span {
          color: #64748b;
          font-size: 0.75rem;
          font-weight: 500;
          display: block;
          line-height: 1;
        }

        .desktop-nav {
          display: flex;
          gap: 4px;
          flex: 1;
          justify-content: center;
          max-width: 600px;
          position: relative;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: #64748b;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .nav-item:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .nav-item.active {
          background: #1e40af;
          color: white;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-user {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-info {
          text-align: right;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .user-name {
          font-weight: 600;
          font-size: 0.9rem;
          color: #1e293b;
        }

        .user-role {
          font-size: 0.75rem;
          color: #64748b;
        }

        .logout-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .logout-button:hover {
          background: #b91c1c;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        .mobile-menu-button {
          display: none;
          background: none;
          border: none;
          color: #1e293b;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .mobile-menu-button:hover {
          background: #f1f5f9;
        }

        .mobile-nav-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 2000;
        }

        .mobile-nav {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          width: 280px;
          background: white;
          box-shadow: -4px 0 15px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          animation: slideInRight 0.3s ease;
        }

        .mobile-nav-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        .mobile-nav-header h3 {
          margin: 0;
          color: #1e293b;
          font-weight: 600;
        }

        .mobile-nav-header button {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }

        .mobile-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border: none;
          background: none;
          color: #1e293b;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          border-bottom: 1px solid #f1f5f9;
        }

        .mobile-nav-item:hover {
          background: #f8fafc;
        }

        .mobile-nav-item.active {
          background: #1e40af;
          color: white;
        }

        .nav-label {
          font-weight: 600;
          font-size: 0.95rem;
          display: block;
        }

        .nav-description {
          font-size: 0.8rem;
          opacity: 0.8;
          display: block;
        }

        .mobile-nav-footer {
          margin-top: auto;
          padding: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .mobile-logout {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 12px 16px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mobile-logout:hover {
          background: #b91c1c;
        }

        .main-content {
          min-height: calc(100vh - 70px);
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .header-container {
            padding: 0 16px;
          }

          .desktop-nav {
            max-width: 500px;
          }

          .nav-item {
            padding: 8px 12px;
            font-size: 0.85rem;
          }

          .brand-text h1 {
            font-size: 1.3rem;
          }

          .brand-text span {
            font-size: 0.7rem;
          }
        }

        @media (max-width: 768px) {
          .header-container {
            padding: 0 12px;
          }

          .desktop-nav {
            display: none;
          }

          .user-info {
            display: none;
          }

          .logout-text {
            display: none;
          }

          .mobile-menu-button {
            display: block;
          }

          .mobile-nav-overlay {
            display: block;
          }

          .brand-text span {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .header-container {
            height: 60px;
            padding: 0 8px;
          }

          .brand-text h1 {
            font-size: 1.2rem;
          }

          .mobile-nav {
            width: 100vw;
          }
        }
      `}</style>
    </div>
  );
};

export default MainLayout;