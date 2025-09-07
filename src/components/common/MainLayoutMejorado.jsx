import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from './Icons';

const MainLayoutMejorado = ({ user, onLogout, children, reportes = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Cerrar menú móvil cuando se redimensiona a desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false);
    }
  }, [isMobile]);

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Inicio',
      icon: 'Home',
      path: '/',
      description: 'Panel principal',
      color: '#3b82f6'
    },
    {
      id: 'reportes',
      label: 'Reportes',
      icon: 'FileText',
      path: '/reportes',
      description: 'Crear y gestionar reportes',
      color: '#059669'
    },
    {
      id: 'supervision',
      label: 'Análisis',
      icon: 'Eye',
      path: '/supervision',
      description: 'Herramientas de análisis',
      color: '#7c3aed'
    },
    {
      id: 'colaboradores',
      label: 'Personal',
      icon: 'Users',
      path: '/colaboradores',
      description: 'Gestión de colaboradores',
      color: '#dc2626'
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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="main-layout-mejorado">
      {/* Header Principal */}
      <header className="header-principal">
        <div className="header-contenido">
          {/* Logo y título */}
          <div className="header-marca" onClick={() => handleNavigation('/')}>
            <div className="logo-container">
              <Icon name="Shield" size={isMobile ? 28 : 32} color="#1e40af" />
            </div>
            <div className="marca-texto">
              <h1>ReporteSeguro</h1>
              {!isMobile && <span>Sistema de Gestión de Seguridad</span>}
            </div>
          </div>

          {/* Navegación Desktop */}
          {!isMobile && (
            <nav className="navegacion-desktop">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`nav-item-desktop ${isActiveRoute(item.path) ? 'activo' : ''}`}
                  title={item.description}
                >
                  <Icon name={item.icon} size={20} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          )}

          {/* Acciones del header */}
          <div className="header-acciones">
            {/* Info del usuario (solo desktop) */}
            {!isMobile && (
              <div className="info-usuario">
                <div className="avatar-usuario">
                  <Icon name="User" size={20} color="#1e40af" />
                </div>
                <div className="detalles-usuario">
                  <span className="nombre-usuario">
                    {user.displayName || user.email.split('@')[0]}
                  </span>
                  <span className="rol-usuario">Administrador</span>
                </div>
              </div>
            )}

            {/* Botón de logout */}
            <button className="boton-logout" onClick={onLogout} title="Cerrar Sesión">
              <Icon name="LogOut" size={18} />
              {!isMobile && <span>Salir</span>}
            </button>

            {/* Botón menú móvil */}
            {isMobile && (
              <button 
                className={`menu-movil-boton ${mobileMenuOpen ? 'activo' : ''}`}
                onClick={toggleMobileMenu}
                aria-label="Menú de navegación"
              >
                <div className="hamburguesa">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Navegación Móvil */}
      {isMobile && (
        <>
          {/* Overlay */}
          <div 
            className={`menu-movil-overlay ${mobileMenuOpen ? 'visible' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Panel de navegación móvil */}
          <nav className={`navegacion-movil ${mobileMenuOpen ? 'abierto' : ''}`}>
            <div className="menu-movil-header">
              <div className="info-usuario-movil">
                <div className="avatar-usuario-movil">
                  <Icon name="User" size={24} color="#1e40af" />
                </div>
                <div>
                  <div className="nombre-usuario-movil">
                    {user.displayName || user.email.split('@')[0]}
                  </div>
                  <div className="rol-usuario-movil">Administrador</div>
                </div>
              </div>
              <button 
                className="cerrar-menu"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Cerrar menú"
              >
                <Icon name="ArrowLeft" size={20} />
              </button>
            </div>
            
            <div className="navegacion-items">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`nav-item-movil ${isActiveRoute(item.path) ? 'activo' : ''}`}
                >
                  <div className="item-icono" style={{ backgroundColor: item.color }}>
                    <Icon name={item.icon} size={20} color="white" />
                  </div>
                  <div className="item-contenido">
                    <span className="item-titulo">{item.label}</span>
                    <span className="item-descripcion">{item.description}</span>
                  </div>
                  <Icon name="ChevronRight" size={16} color="#64748b" />
                </button>
              ))}
            </div>
            
            <div className="menu-movil-footer">
              <button className="logout-movil" onClick={onLogout}>
                <Icon name="LogOut" size={18} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </nav>
        </>
      )}

      {/* Contenido Principal */}
      <main className="contenido-principal">
        {children}
      </main>

      <style jsx>{`
        .main-layout-mejorado {
          min-height: 100vh;
          background: #f8fafc;
          position: relative;
        }

        /* ========== HEADER ========== */
        .header-principal {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
          height: ${isMobile ? '60px' : '70px'};
        }

        .header-contenido {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 ${isMobile ? '12px' : '20px'};
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: ${isMobile ? '12px' : '20px'};
        }

        .header-marca {
          display: flex;
          align-items: center;
          gap: ${isMobile ? '8px' : '12px'};
          cursor: pointer;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .header-marca:hover {
          transform: ${isMobile ? 'none' : 'scale(1.02)'};
        }

        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${isMobile ? '36px' : '44px'};
          height: ${isMobile ? '36px' : '44px'};
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(30, 64, 175, 0.2);
        }

        .marca-texto h1 {
          color: #1e40af;
          font-size: ${isMobile ? '1.2rem' : '1.5rem'};
          font-weight: 700;
          margin: 0;
          line-height: 1;
        }

        .marca-texto span {
          color: #64748b;
          font-size: 0.75rem;
          font-weight: 500;
          display: block;
          line-height: 1;
        }

        /* ========== NAVEGACIÓN DESKTOP ========== */
        .navegacion-desktop {
          display: flex;
          gap: 4px;
          flex: 1;
          justify-content: center;
          max-width: 600px;
        }

        .nav-item-desktop {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: #64748b;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          position: relative;
          overflow: hidden;
        }

        .nav-item-desktop::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          transition: left 0.5s ease;
        }

        .nav-item-desktop:hover::before {
          left: 100%;
        }

        .nav-item-desktop:hover {
          background: #f1f5f9;
          color: #1e293b;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .nav-item-desktop.activo {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
        }

        /* ========== ACCIONES DEL HEADER ========== */
        .header-acciones {
          display: flex;
          align-items: center;
          gap: ${isMobile ? '8px' : '16px'};
          flex-shrink: 0;
        }

        .info-usuario {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .avatar-usuario {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(30, 64, 175, 0.2);
        }

        .detalles-usuario {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .nombre-usuario {
          font-weight: 600;
          font-size: 0.9rem;
          color: #1e293b;
        }

        .rol-usuario {
          font-size: 0.75rem;
          color: #64748b;
        }

        .boton-logout {
          display: flex;
          align-items: center;
          gap: ${isMobile ? '0' : '6px'};
          padding: ${isMobile ? '8px' : '8px 12px'};
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2);
        }

        .boton-logout:hover {
          background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        /* ========== MENÚ MÓVIL ========== */
        .menu-movil-boton {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: transparent;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .menu-movil-boton:hover {
          border-color: #1e40af;
          background: #f8fafc;
        }

        .menu-movil-boton.activo {
          border-color: #1e40af;
          background: #1e40af;
        }

        .hamburguesa {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .hamburguesa span {
          width: 20px;
          height: 2px;
          background: #1e293b;
          border-radius: 1px;
          transition: all 0.3s ease;
        }

        .menu-movil-boton.activo .hamburguesa span {
          background: white;
        }

        .menu-movil-boton.activo .hamburguesa span:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .menu-movil-boton.activo .hamburguesa span:nth-child(2) {
          opacity: 0;
        }

        .menu-movil-boton.activo .hamburguesa span:nth-child(3) {
          transform: rotate(-45deg) translate(7px, -6px);
        }

        .menu-movil-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1999;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }

        .menu-movil-overlay.visible {
          opacity: 1;
          visibility: visible;
        }

        .navegacion-movil {
          position: fixed;
          top: 0;
          right: 0;
          width: 100vw;
          max-width: 320px;
          height: 100vh;
          background: white;
          z-index: 2000;
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.3s ease;
          box-shadow: -8px 0 24px rgba(0, 0, 0, 0.15);
        }

        .navegacion-movil.abierto {
          transform: translateX(0);
        }

        .menu-movil-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          border-bottom: 1px solid #e2e8f0;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .info-usuario-movil {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar-usuario-movil {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(30, 64, 175, 0.2);
        }

        .nombre-usuario-movil {
          font-weight: 600;
          font-size: 1rem;
          color: #1e293b;
        }

        .rol-usuario-movil {
          font-size: 0.8rem;
          color: #64748b;
        }

        .cerrar-menu {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s ease;
        }

        .cerrar-menu:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        .navegacion-items {
          flex: 1;
          padding: 12px;
          overflow-y: auto;
        }

        .nav-item-movil {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 16px;
          margin-bottom: 8px;
          background: transparent;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          position: relative;
          overflow: hidden;
        }

        .nav-item-movil::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
          transition: left 0.5s ease;
        }

        .nav-item-movil:hover::before {
          left: 100%;
        }

        .nav-item-movil:hover {
          background: #f8fafc;
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .nav-item-movil.activo {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(30, 64, 175, 0.3);
        }

        .nav-item-movil.activo .item-descripcion {
          color: rgba(255, 255, 255, 0.8);
        }

        .item-icono {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .item-contenido {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .item-titulo {
          font-weight: 600;
          font-size: 1rem;
          color: inherit;
        }

        .item-descripcion {
          font-size: 0.8rem;
          color: #64748b;
        }

        .menu-movil-footer {
          padding: 20px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .logout-movil {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px 20px;
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
        }

        .logout-movil:hover {
          background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(220, 38, 38, 0.3);
        }

        /* ========== CONTENIDO PRINCIPAL ========== */
        .contenido-principal {
          min-height: calc(100vh - ${isMobile ? '60px' : '70px'});
          padding: ${isMobile ? '8px' : '0'};
        }

        /* ========== RESPONSIVE ADICIONAL ========== */
        @media (max-width: 480px) {
          .navegacion-movil {
            width: 100vw;
            max-width: none;
          }
        }

        @media (max-width: 360px) {
          .header-contenido {
            padding: 0 8px;
          }
          
          .marca-texto h1 {
            font-size: 1.1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MainLayoutMejorado;
