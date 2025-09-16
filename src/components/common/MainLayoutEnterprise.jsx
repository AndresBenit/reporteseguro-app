import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from './Icons';
import Logo from './Logo';

const MainLayoutEnterprise = ({ user, onLogout, children, reportes = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Detectar móvil y cerrar menú cuando sea necesario
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // NUEVA ESTRUCTURA ENTERPRISE SST
  const enterpriseModules = [
    {
      category: "OPERACIONES",
      color: "primary",
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
          id: 'colaboradores',
          label: 'Colaboradores',
          icon: 'Users',
          path: '/colaboradores',
          description: 'Gestión de personal'
        }
      ]
    },
    {
      category: "SEGURIDAD",
      color: "secondary",
      modules: [
        {
          id: 'supervision',
          label: 'Supervisión',
          icon: 'Eye',
          path: '/supervision',
          description: 'Control en campo'
        },
        {
          id: 'investigacion',
          label: 'Investigación',
          icon: 'Search',
          path: '/investigacion-accidentes',
          description: 'Investigación de accidentes'
        },
        {
          id: 'inspecciones',
          label: 'Inspecciones',
          icon: 'CheckSquare',
          path: '/inspecciones',
          description: 'Inspecciones SST'
        },
        {
          id: 'auditorias',
          label: 'Auditorías',
          icon: 'Shield',
          path: '/auditorias',
          description: 'Auditorías del sistema'
        }
      ]
    },
    {
      category: "RECURSOS",
      color: "orange",
      modules: [
        {
          id: 'inventario',
          label: 'Inventario EPP',
          icon: 'Package',
          path: '/inventario',
          description: 'Gestión de equipos'
        },
        {
          id: 'capacitaciones',
          label: 'Capacitaciones',
          icon: 'BookOpen',
          path: '/capacitaciones',
          description: 'Formación SST'
        },
        {
          id: 'examenes',
          label: 'Exámenes Médicos',
          icon: 'Heart',
          path: '/examenes-medicos',
          description: 'Control médico'
        },
        {
          id: 'planes-emergencia',
          label: 'Planes Emergencia',
          icon: 'AlertTriangle',
          path: '/planes-emergencia',
          description: 'Gestión de emergencias'
        }
      ]
    },
    {
      category: "GESTIÓN",
      color: "purple",
      modules: [
        {
          id: 'copasst',
          label: 'COPASST',
          icon: 'Users',
          path: '/copasst',
          description: 'Comité paritario'
        },
        {
          id: 'reportes-legales',
          label: 'Reportes Legales',
          icon: 'FileText',
          path: '/reportes-legales',
          description: 'Documentación legal'
        },
        {
          id: 'matriz-riesgos',
          label: 'Matriz de Riesgos',
          icon: 'AlertCircle',
          path: '/matriz-riesgos',
          description: 'Gestión de riesgos'
        }
      ]
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const isActiveRoute = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getColorClasses = (color, isActive = false) => {
    const colors = {
      primary: isActive
        ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
        : 'text-gray-600 hover:text-primary-700 hover:bg-primary-50',
      secondary: isActive
        ? 'bg-secondary-100 text-secondary-700 border-r-2 border-secondary-600'
        : 'text-gray-600 hover:text-secondary-700 hover:bg-secondary-50',
      orange: isActive
        ? 'bg-orange-100 text-orange-700 border-r-2 border-orange-600'
        : 'text-gray-600 hover:text-orange-700 hover:bg-orange-50',
      purple: isActive
        ? 'bg-purple-100 text-purple-700 border-r-2 border-purple-600'
        : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'
    };
    return colors[color] || colors.primary;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Desktop */}
      <div className={`hidden lg:flex lg:flex-col lg:w-80 bg-white border-r border-gray-200 shadow-enterprise ${
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-80'
      } transition-all duration-300`}>

        {/* Header del Sidebar */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-white">
          {!sidebarCollapsed && (
            <Logo variant="main" size="md" />
          )}
          {sidebarCollapsed && (
            <Logo variant="icon" size="sm" />
          )}
          <button
            onClick={() => {
              console.log('Toggling sidebar:', !sidebarCollapsed);
              setSidebarCollapsed(!sidebarCollapsed);
            }}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={sidebarCollapsed ? "Expandir menú" : "Contraer menú"}
          >
            <Icon name={sidebarCollapsed ? "ChevronRight" : "ChevronLeft"} size={16} />
          </button>
        </div>

        {/* Navegación */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-6">
            {enterpriseModules.map((category) => (
              <div key={category.category} className="px-4">
                {!sidebarCollapsed && (
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    {category.category}
                  </h3>
                )}
                <div className="space-y-1">
                  {category.modules.map((module) => {
                    const isActive = isActiveRoute(module.path);
                    return (
                      <button
                        key={module.id}
                        onClick={() => handleNavigation(module.path)}
                        className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                          getColorClasses(category.color, isActive)
                        }`}
                        title={sidebarCollapsed ? module.label : module.description}
                      >
                        <Icon name={module.icon} size={18} className="flex-shrink-0" />
                        {!sidebarCollapsed && (
                          <span className="ml-3 truncate">{module.label}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Usuario - Footer del Sidebar */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {!sidebarCollapsed ? (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500">Administrador SST</p>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <Icon name="LogOut" size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <Icon name="LogOut" size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 left-0 w-80 h-full bg-white shadow-enterprise-lg">
            {/* Mobile Header */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
              <Logo variant="main" size="md" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-6">
                {enterpriseModules.map((category) => (
                  <div key={category.category} className="px-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      {category.category}
                    </h3>
                    <div className="space-y-1">
                      {category.modules.map((module) => {
                        const isActive = isActiveRoute(module.path);
                        return (
                          <button
                            key={module.id}
                            onClick={() => handleNavigation(module.path)}
                            className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                              getColorClasses(category.color, isActive)
                            }`}
                          >
                            <Icon name={module.icon} size={18} />
                            <span className="ml-3">{module.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Icon name="Menu" size={20} />
            </button>

            {/* Breadcrumb/Title */}
            <div className="flex-1 lg:ml-0 ml-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {location.pathname === '/' ? 'Dashboard' :
                 location.pathname.split('/')[1]?.replace('-', ' ').toUpperCase() || 'ReporteSeguro'}
              </h2>
            </div>

            {/* Top Bar Actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg relative">
                <Icon name="Bell" size={20} />
                {reportes?.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Desktop User Menu */}
              <div className="hidden lg:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.email || 'Usuario'}</p>
                  <p className="text-xs text-gray-500">Administrador SST</p>
                </div>
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayoutEnterprise;