import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from './Icons';

const MainLayoutEnterprise = ({ user, onLogout, children, reportes = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeCategory, setActiveCategory] = useState('OPERACIONES');

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

  // NUEVA ESTRUCTURA ENTERPRISE SST - SIDEBAR MODULAR
  const enterpriseModules = [
    {
      category: "OPERACIONES",
      color: "#3b82f6",
      modules: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: 'Home',
          path: '/',
          description: 'Panel principal y KPIs'
        },
        {
          id: 'reportes',
          label: 'Reportes',
          icon: 'FileText', 
          path: '/reportes',
          description: 'Crear y gestionar reportes'
        },
        {
          id: 'investigaciones',
          label: 'Investigaciones',
          icon: 'Activity',
          path: '/investigaciones',
          description: 'Investigación de accidentes',
          isNew: true
        }
      ]
    },
    {
      category: "GESTIÓN DE RIESGOS",
      color: "#dc2626",
      modules: [
        {
          id: 'riesgos',
          label: 'Matriz de Riesgos',
          icon: 'AlertTriangle',
          path: '/riesgos',
          description: 'Identificación y evaluación',
          isNew: true
        },
        {
          id: 'auditorias',
          label: 'Auditorías',
          icon: 'Settings',
          path: '/auditorias',
          description: 'Auditorías internas SST',
          isNew: true
        }
      ]
    },
    {
      category: "RECURSOS HUMANOS",
      color: "#059669", 
      modules: [
        {
          id: 'colaboradores',
          label: 'Personal',
          icon: 'Users',
          path: '/colaboradores',
          description: 'Gestión de colaboradores'
        },
        {
          id: 'capacitaciones',
          label: 'Capacitaciones',
          icon: 'BookOpen',
          path: '/capacitaciones',
          description: 'Programa de entrenamiento',
          isNew: true
        },
        {
          id: 'examenes',
          label: 'Exámenes Médicos',
          icon: 'Heart',
          path: '/examenes-medicos',
          description: 'Vigilancia epidemiológica',
          isNew: true
        }
      ]
    },
    {
      category: "CUMPLIMIENTO LEGAL",
      color: "#7c3aed",
      modules: [
        {
          id: 'copasst',
          label: 'COPASST',
          icon: 'Users',
          path: '/copasst',
          description: 'Comité Paritario SST',
          isNew: true
        },
        {
          id: 'reportes-legales',
          label: 'Reportes Legales',
          icon: 'FileText',
          path: '/reportes-legales', 
          description: 'Reportes obligatorios',
          isNew: true
        },
        {
          id: 'planes-emergencia',
          label: 'Planes de Emergencia',
          icon: 'Shield',
          path: '/planes-emergencia',
          description: 'Gestión de emergencias',
          isNew: true
        },
        {
          id: 'inspecciones',
          label: 'Inspecciones SST',
          icon: 'CheckSquare',
          path: '/inspecciones',
          description: 'Sistema de inspecciones',
          isNew: true
        },
        {
          id: 'investigacion-accidentes',
          label: 'Investigación Accidentes',
          icon: 'Search',
          path: '/investigacion-accidentes',
          description: 'Análisis de incidentes',
          isNew: true
        }
      ]
    },
    {
      category: "RECURSOS",
      color: "#f97316",
      modules: [
        {
          id: 'inventario',
          label: 'Inventario EPP',
          icon: 'Package',
          path: '/inventario',
          description: 'Gestión de inventario EPP'
        },
        {
          id: 'supervision',
          label: 'Análisis',
          icon: 'BarChart3',
          path: '/supervision',
          description: 'Herramientas de análisis'
        }
      ]
    }
  ];

  const isActiveRoute = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const isActiveModule = (module) => {
    return isActiveRoute(module.path);
  };

  const isActiveCategory = (category) => {
    return category.modules.some(module => isActiveModule(module));
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleCategory = (categoryName) => {
    if (activeCategory === categoryName) {
      setActiveCategory(null);
    } else {
      setActiveCategory(categoryName);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="enterprise-layout">
      {/* HEADER SUPERIOR FIJO */}
      <header className="enterprise-header">
        <div className="header-content">
          {/* Toggle sidebar + Logo */}
          <div className="header-left">
            {!isMobile && (
              <button 
                className="sidebar-toggle"
                onClick={toggleSidebar}
                title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
              >
                <Icon name="ChevronRight" size={20} style={{
                  transform: sidebarCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                  transition: 'transform 0.3s ease'
                }} />
              </button>
            )}
            
            <div className="header-brand" onClick={() => handleNavigation('/')}>
              <Icon name="Shield" size={28} color="#1e40af" />
              <div className="brand-text">
                <h1>ReporteSeguro</h1>
                <span>Sistema SST Minería</span>
              </div>
            </div>
          </div>

          {/* User info + Actions */}
          <div className="header-right">
            {!isMobile && (
              <div className="user-info">
                <div className="user-avatar">
                  <Icon name="User" size={20} color="#1e40af" />
                </div>
                <div className="user-details">
                  <span className="user-name">
                    {user.displayName || user.email.split('@')[0]}
                  </span>
                  <span className="user-role">Administrador SST</span>
                </div>
              </div>
            )}

            <button className="logout-btn" onClick={onLogout} title="Cerrar Sesión">
              <Icon name="LogOut" size={18} />
              {!isMobile && <span>Salir</span>}
            </button>

            {/* Mobile menu button */}
            {isMobile && (
              <button 
                className={`mobile-menu-btn ${mobileMenuOpen ? 'active' : ''}`}
                onClick={toggleMobileMenu}
              >
                <div className="hamburger">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* SIDEBAR ENTERPRISE */}
      {!isMobile && (
        <aside className={`enterprise-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-content">
            {enterpriseModules.map((category) => (
              <div key={category.category} className="sidebar-category">
                <button 
                  className={`category-header ${isActiveCategory(category) ? 'active' : ''}`}
                  onClick={() => toggleCategory(category.category)}
                  style={sidebarCollapsed ? { justifyContent: 'center' } : {}}
                >
                  <div className="category-indicator" style={{ backgroundColor: category.color }}>
                    <Icon name={category.modules[0].icon} size={16} color="white" />
                  </div>
                  {!sidebarCollapsed && (
                    <>
                      <span className="category-title">{category.category}</span>
                      <Icon name="ChevronRight" size={16} style={{
                        transform: activeCategory === category.category ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }} />
                    </>
                  )}
                </button>
                
                {!sidebarCollapsed && (activeCategory === category.category || isActiveCategory(category)) && (
                  <div className="category-modules">
                    {category.modules.map((module) => (
                      <button
                        key={module.id}
                        onClick={() => handleNavigation(module.path)}
                        className={`sidebar-module ${isActiveModule(module) ? 'active' : ''}`}
                        title={module.description}
                      >
                        <Icon name={module.icon} size={18} />
                        <span className="module-label">{module.label}</span>
                        {module.isNew && <span className="new-badge">NUEVO</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* MOBILE NAVIGATION */}
      {isMobile && (
        <>
          <div 
            className={`mobile-overlay ${mobileMenuOpen ? 'visible' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          />
          
          <nav className={`mobile-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
            <div className="mobile-nav-header">
              <div className="mobile-user-info">
                <Icon name="User" size={24} color="#1e40af" />
                <div>
                  <div className="mobile-user-name">
                    {user.displayName || user.email.split('@')[0]}
                  </div>
                  <div className="mobile-user-role">Administrador SST</div>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)}>
                <Icon name="ArrowLeft" size={20} />
              </button>
            </div>
            
            <div className="mobile-nav-content">
              {enterpriseModules.map((category) => (
                <div key={category.category} className="mobile-category">
                  <div className="mobile-category-header" style={{ color: category.color }}>
                    <Icon name={category.modules[0].icon} size={16} />
                    {category.category}
                  </div>
                  <div className="mobile-modules">
                    {category.modules.map((module) => (
                      <button
                        key={module.id}
                        onClick={() => handleNavigation(module.path)}
                        className={`mobile-module ${isActiveModule(module) ? 'active' : ''}`}
                      >
                        <Icon name={module.icon} size={18} />
                        <span>{module.label}</span>
                        {module.isNew && <span className="new-badge">NUEVO</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>
        </>
      )}

      {/* MAIN CONTENT */}
      <main className={`enterprise-main ${sidebarCollapsed && !isMobile ? 'sidebar-collapsed' : ''}`}>
        <div className="main-content">
          {children}
        </div>
      </main>

      <style jsx>{`
        /* ========== LAYOUT PRINCIPAL ENTERPRISE ========== */
        .enterprise-layout {
          min-height: 100vh;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
        }

        /* ========== HEADER ========== */
        .enterprise-header {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          height: 64px;
        }

        .header-content {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          max-width: 100%;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .sidebar-toggle {
          background: #f1f5f9;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sidebar-toggle:hover {
          background: #e2e8f0;
        }

        .header-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .header-brand:hover {
          transform: scale(1.02);
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

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          border-radius: 8px;
          background: #f8fafc;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-details {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-weight: 600;
          font-size: 0.9rem;
          color: #1e293b;
          line-height: 1;
        }

        .user-role {
          font-size: 0.75rem;
          color: #64748b;
          line-height: 1;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .logout-btn:hover {
          background: #b91c1c;
          transform: translateY(-1px);
        }

        .mobile-menu-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
        }

        .hamburger {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .hamburger span {
          width: 24px;
          height: 2px;
          background: #374151;
          transition: all 0.3s ease;
        }

        .mobile-menu-btn.active .hamburger span:nth-child(1) {
          transform: rotate(45deg) translate(6px, 6px);
        }

        .mobile-menu-btn.active .hamburger span:nth-child(2) {
          opacity: 0;
        }

        .mobile-menu-btn.active .hamburger span:nth-child(3) {
          transform: rotate(-45deg) translate(6px, -6px);
        }

        /* ========== SIDEBAR DESKTOP ========== */
        .enterprise-sidebar {
          position: fixed;
          left: 0;
          top: 64px;
          width: 280px;
          height: calc(100vh - 64px);
          background: white;
          border-right: 1px solid #e2e8f0;
          z-index: 900;
          transition: width 0.3s ease;
          overflow-y: auto;
        }

        .enterprise-sidebar.collapsed {
          width: 72px;
        }

        .sidebar-content {
          padding: 16px;
        }

        .sidebar-category {
          margin-bottom: 8px;
        }

        .category-header {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: none;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 600;
          font-size: 0.85rem;
          color: #374151;
        }

        .category-header:hover {
          background: #f1f5f9;
        }

        .category-header.active {
          background: #f1f5f9;
          color: #1e40af;
        }

        .category-indicator {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .category-title {
          flex: 1;
          text-align: left;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .category-modules {
          margin-left: 36px;
          margin-top: 8px;
          border-left: 1px solid #e2e8f0;
          padding-left: 12px;
        }

        .sidebar-module {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
          color: #64748b;
          margin-bottom: 2px;
          position: relative;
        }

        .sidebar-module:hover {
          background: #f8fafc;
          color: #374151;
          transform: translateX(4px);
        }

        .sidebar-module.active {
          background: #1e40af;
          color: white;
        }

        .module-label {
          flex: 1;
          text-align: left;
          font-weight: 500;
        }

        .new-badge {
          background: #10b981;
          color: white;
          font-size: 0.6rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* ========== MOBILE NAVIGATION ========== */
        .mobile-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 998;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }

        .mobile-overlay.visible {
          opacity: 1;
          visibility: visible;
        }

        .mobile-sidebar {
          position: fixed;
          top: 0;
          left: -100%;
          width: 320px;
          height: 100vh;
          background: white;
          z-index: 999;
          transition: left 0.3s ease;
          overflow-y: auto;
        }

        .mobile-sidebar.open {
          left: 0;
        }

        .mobile-nav-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        .mobile-user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mobile-user-name {
          font-weight: 600;
          color: #1e293b;
        }

        .mobile-user-role {
          font-size: 0.85rem;
          color: #64748b;
        }

        .mobile-nav-content {
          padding: 20px;
        }

        .mobile-category {
          margin-bottom: 24px;
        }

        .mobile-category-header {
          font-weight: 700;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mobile-modules {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .mobile-module {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: none;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
          color: #374151;
          position: relative;
        }

        .mobile-module:hover {
          background: #f8fafc;
        }

        .mobile-module.active {
          background: #1e40af;
          color: white;
        }

        /* ========== MAIN CONTENT ========== */
        .enterprise-main {
          margin-left: ${isMobile ? '0' : '280px'};
          margin-top: 64px;
          min-height: calc(100vh - 64px);
          transition: margin-left 0.3s ease;
        }

        .enterprise-main.sidebar-collapsed {
          margin-left: 72px;
        }

        .main-content {
          padding: 0;
        }

        /* ========== RESPONSIVE ========== */
        @media (max-width: 768px) {
          .enterprise-main {
            margin-left: 0;
          }
          
          .brand-text span {
            display: none;
          }
          
          .brand-text h1 {
            font-size: 1.25rem;
          }

          .header-content {
            padding: 0 16px;
          }

          .user-info {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default MainLayoutEnterprise;