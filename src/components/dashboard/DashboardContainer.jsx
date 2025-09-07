import React, { useEffect, useState } from "react";
import { supabase, dbHelpers } from "../../services/supabase";
import { Icon } from "../common/Icons";
import ReporteForm from "../reports/ReporteForm";
import GraficosEspañol from "../common/ui/GraficosEspañol";
import ReporteList from "../reports/ReporteList";
import Colaboradores from "../collaborators/Colaboradores";
import ExcelUploader from "../collaborators/ExcelUploader";
import SupervisionMain from "../supervision/SupervisionMain";
import ActividadReciente from "./RecentActivity";
import { migrateColaboradores, getEstadisticasColaboradores } from '../../utils/scripts/migrateColaboradores';
import { useReportes } from "../../hooks/useReportes";

const Dashboard = ({ user, onLogout }) => {
  // ✅ Usar hook actualizado para gestión automática de reportes  
  const { 
    reportes, 
    loading, 
    error, 
    actualizarEstado, 
    eliminarReporte,
    refresh
  } = useReportes();
  
  const [activeSection, setActiveSection] = useState('dashboard');
  const [colaboradoresStats, setColaboradoresStats] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [showExcelUploader, setShowExcelUploader] = useState(false);

  useEffect(() => {
    // Cargar estadísticas de colaboradores
    loadColaboradoresStats();
  }, []);

  // CARGA SIMPLE Y DIRECTA DESDE FIREBASE
  const loadColaboradoresStats = async () => {
    try {
      const stats = await getEstadisticasColaboradores();
      setColaboradoresStats(stats);
    } catch (error) {
      console.error('Error cargando estadísticas de colaboradores:', error);
      // Si falla, usar stats por defecto
      setColaboradoresStats({ total: 0, activos: 0, centroIndustrial: 0, hornosSolera: 0 });
    }
  };

  const handleMigrationComplete = async (resultado) => {
    // Recargar estadísticas después de la migración
    await loadColaboradoresStats();
    alert(`✅ Migración completada:\n• ${resultado.migrados} nuevos colaboradores\n• ${resultado.yaExisten} ya existían\n• Total: ${resultado.total}`);
  };

  // ✅ Las funciones eliminarReporte y actualizarEstado ahora vienen del hook useReportes

  const getStatsCards = () => {
    // Validar que reportes sea un array válido
    const reportesValidos = Array.isArray(reportes) ? reportes : [];
    const total = reportesValidos.length;
    const pendientes = reportesValidos.filter(r => r && r.estado === "pendiente").length;
    const criticos = reportesValidos.filter(r => r && r.severidad === "critica").length;
    const resueltos = reportesValidos.filter(r => r && r.estado === "resuelto").length;
    
    // Calcular porcentajes
    const porcentajePendientes = total > 0 ? Math.round((pendientes / total) * 100) : 0;
    const porcentajeCriticos = total > 0 ? Math.round((criticos / total) * 100) : 0;
    const porcentajeResueltos = total > 0 ? Math.round((resueltos / total) * 100) : 0;

    return [
      { 
        title: "Total Reportes", 
        value: total, 
        icon: "Reports", 
        color: "var(--color-primary)",
        trend: "+12%",
        subtitle: "Este mes"
      },
      { 
        title: "Colaboradores", 
        value: colaboradoresStats?.total || 0, 
        icon: "Users", 
        color: "var(--color-success)",
        trend: `${colaboradoresStats?.activos || 0} activos`,
        subtitle: "En sistema"
      },
      { 
        title: "Críticos", 
        value: criticos, 
        icon: "AlertCircle", 
        color: "var(--color-danger)",
        trend: `${porcentajeCriticos}%`,
        subtitle: "Requieren atención"
      },
      { 
        title: "Resueltos", 
        value: resueltos, 
        icon: "CheckCircle", 
        color: "var(--color-success)",
        trend: `${porcentajeResueltos}%`,
        subtitle: "Completados"
      }
    ];
  };

  // Estado de carga mejorado
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc"
      }}>
        <div style={{
          background: "white",
          borderRadius: "20px",
          padding: "40px 30px",
          textAlign: "center",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
          maxWidth: "350px"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "15px" }} className="pulse">📊</div>
          <h2 style={{
            color: "#374151",
            marginBottom: "10px",
            fontSize: "1.2rem",
            fontWeight: "600"
          }}>
            Cargando Dashboard
          </h2>
          <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
            Conectando con Supabase...
          </p>
          
          {/* Barra de progreso rápida */}
          <div style={{
            width: "100%",
            height: "3px",
            background: "#e5e7eb",
            borderRadius: "2px",
            margin: "20px 0 10px 0",
            overflow: "hidden"
          }}>
            <div style={{
              width: "70%",
              height: "100%",
              background: "linear-gradient(90deg, #3b82f6, #1e40af)",
              borderRadius: "2px",
              animation: "quickLoad 1s ease-in-out infinite alternate"
            }} />
          </div>
          
          <style>
            {`
              @keyframes quickLoad {
                0% { width: 30%; }
                100% { width: 90%; }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc"
      }}>
        <div style={{
          background: "white",
          borderRadius: "20px",
          padding: "50px 35px",
          textAlign: "center",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb",
          maxWidth: "450px"
        }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "20px" }}>⚠️</div>
          <h2 style={{
            color: "#dc2626",
            marginBottom: "15px",
            fontSize: "1.4rem",
            fontWeight: "600"
          }}>
            Error de Conexión
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "20px" }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Dashboard principal - Validar arrays
  const reportesValidos = Array.isArray(reportes) ? reportes : [];
  const pendientes = reportesValidos.filter(r => r && r.estado === "pendiente").length;
  const criticos = reportesValidos.filter(r => r && r.severidad === "critica").length;

  return (
    <div className="container fade-in">
      {/* Header Mejorado - RESPONSIVE */}
      <div className="header">
        <div className="header-main">
          <div className="header-title">
            <h1>
              <Icon name="Shield" size={32} color="var(--color-primary)" />
              ReporteSeguro
            </h1>
            <p className="header-subtitle">
              Sistema Profesional de Gestión de Incidencias de Seguridad
            </p>
          </div>
          
          <div className="header-actions">
            {/* Botones de Colaboradores */}
            <div className="header-buttons">
              {/* Botón de refresh manual */}
              <button
                onClick={() => refresh()}
                className="btn"
                style={{
                  padding: "10px 16px",
                  background: "var(--color-primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  fontWeight: "600",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "var(--transition-base)",
                  whiteSpace: "nowrap",
                  marginRight: "12px"
                }}
                disabled={loading}
                title="Actualizar datos manualmente"
              >
                <Icon name="RefreshCw" size={16} />
                {loading ? 'Actualizando...' : 'Actualizar'}
              </button>
              <button
                onClick={() => setShowExcelUploader(true)}
                className="btn"
                style={{
                  padding: "10px 16px",
                  background: "var(--color-success)",
                  color: "var(--color-text-inverse)",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  fontWeight: "600",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "var(--transition-base)",
                  whiteSpace: "nowrap",
                  boxShadow: "var(--shadow-sm)"
                }}
              >
                <Icon name="Upload" size={16} />
                <span className="btn-text">Subir Excel</span>
              </button>
              
              <button
                onClick={async () => {
                  setMigrating(true);
                  try {
                    const resultado = await migrateColaboradores();
                    await handleMigrationComplete(resultado);
                  } catch (error) {
                    alert(`Error: ${error.message}`);
                  } finally {
                    setMigrating(false);
                  }
                }}
                disabled={migrating}
                className="btn"
                style={{
                  padding: "10px 16px",
                  background: migrating ? "var(--color-text-tertiary)" : "var(--color-primary)",
                  color: "var(--color-text-inverse)",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  fontWeight: "600",
                  fontSize: "0.875rem",
                  cursor: migrating ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "var(--transition-base)",
                  opacity: migrating ? 0.7 : 1,
                  whiteSpace: "nowrap",
                  boxShadow: "var(--shadow-sm)"
                }}
              >
                {migrating ? (
                  <>
                    <Icon name="Processing" size={16} className="animate-spin" />
                    <span className="btn-text">Migrando...</span>
                  </>
                ) : (
                  <>
                    <Icon name="Refresh" size={16} />
                    <span className="btn-text">Migrar Colaboradores</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* User Info */}
        <div className="header-user-info">
          <div className="user-info">
            <div>
              <div className="user-email">
                <Icon name="Users" size={16} />
                {user.email}
              </div>
              <div className="user-role">
                Administrador del Sistema
              </div>
            </div>
            <button className="logout-btn" onClick={onLogout}>
              <Icon name="LogOut" size={16} />
              <span className="btn-text">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - RESPONSIVE */}
      <div className="nav-tabs">
        <div className="nav-tabs-flex" style={{ display: "flex", gap: "4px" }}>
          {[
            { id: 'dashboard', label: 'Tablero', icon: 'Dashboard' },
            { id: 'colaboradores', label: 'Colaboradores', icon: 'Users' },
            { id: 'reportes', label: 'Reportes', icon: 'Reports' },
            { id: 'supervision', label: 'Supervisión', icon: 'Supervisor' },
            { id: 'analytics', label: 'Análisis', icon: 'Analytics' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className="nav-tab-button"
              style={{
                flex: 1,
                padding: "12px 16px",
                border: "none",
                borderRadius: "var(--radius-md)",
                background: activeSection === tab.id ? "var(--color-primary)" : "transparent",
                color: activeSection === tab.id ? "var(--color-text-inverse)" : "var(--color-text-secondary)",
                fontWeight: "600",
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "var(--transition-base)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                whiteSpace: "nowrap"
              }}
            >
              <Icon name={tab.icon} size={18} />
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards Mejoradas */}
      <div className="grid-4" style={{ marginBottom: "24px" }}>
        {getStatsCards().map((stat, index) => (
          <div key={index} className="stats-card">
            {/* Accent bar */}
            <div className="stats-card-accent" style={{ background: stat.color }} />
            
            <div className="stats-card-icon" style={{ background: stat.color }}>
              <Icon name={stat.icon} size={24} color="white" />
            </div>
            
            <div className="stats-card-value" style={{ color: stat.color }}>
              {stat.value}
            </div>
            
            <div className="stats-card-label">
              {stat.title}
            </div>
            
            <div className="stats-card-footer">
              <span className="stats-card-subtitle">{stat.subtitle}</span>
              <span className="stats-card-trend" style={{ 
                background: `${stat.color}15`,
                color: stat.color
              }}>
                {stat.trend.startsWith('+') && <Icon name="TrendingUp" size={12} />}
                {stat.trend.startsWith('-') && <Icon name="TrendingDown" size={12} />}
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content - Conditional based on active section */}
      {activeSection === 'dashboard' && (
        <>
          {/* Main Content Grid */}
          <div className="grid-2">
            {/* Formulario de Reporte */}
            <div className="card">
              <h2>
                <Icon name="Reports" size={20} />
                Nuevo Reporte de Incidencia
              </h2>
              <ReporteForm />
            </div>

            {/* Resumen Ejecutivo Mejorado */}
            <div className="card">
              <h2>
                <Icon name="Analytics" size={20} />
                Resumen Ejecutivo
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                
                {/* Estado Operacional */}
                <div style={{ 
                  padding: "18px", 
                  background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                  borderRadius: "12px",
                  border: "1px solid #93c5fd"
                }}>
                  <h3 style={{ 
                    color: "#1e40af", 
                    marginBottom: "8px",
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <Icon name="Dashboard" size={16} />
                    Estado Operacional
                  </h3>
                  <p style={{ color: "#1e3a8a", fontSize: "0.9rem", lineHeight: "1.4" }}>
                    <strong>{pendientes}</strong> reportes pendientes de <strong>{reportesValidos.length}</strong> totales
                  </p>
                  <div style={{ 
                    marginTop: "8px", 
                    fontSize: "0.8rem", 
                    color: "#1e40af",
                    display: "flex",
                    justifyContent: "space-between"
                  }}>
                    <span>📊 Eficiencia operativa</span>
                    <span style={{ fontWeight: "600" }}>
                      {reportesValidos.length > 0 ? Math.round(((reportesValidos.length - pendientes) / reportesValidos.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
                
                {/* Alertas Críticas */}
                <div style={{ 
                  padding: "18px", 
                  background: criticos > 0 
                    ? "linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)"
                    : "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                  borderRadius: "12px",
                  border: criticos > 0 
                    ? "1px solid #f87171" 
                    : "1px solid #6ee7b7"
                }}>
                  <h3 style={{ 
                    color: criticos > 0 ? "#dc2626" : "#059669",
                    marginBottom: "8px",
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    {criticos > 0 ? (
                      <>
                        <Icon name="AlertCircle" size={16} />
                        Atención Crítica
                      </>
                    ) : (
                      <>
                        <Icon name="CheckCircle" size={16} />
                        Sistema Seguro
                      </>
                    )}
                  </h3>
                  <p style={{ 
                    color: criticos > 0 ? "#991b1b" : "#047857",
                    fontSize: "0.9rem",
                    lineHeight: "1.4"
                  }}>
                    {criticos > 0 
                      ? `${criticos} incidencia${criticos > 1 ? 's' : ''} crítica${criticos > 1 ? 's' : ''} requiere${criticos === 1 ? '' : 'n'} atención inmediata`
                      : "No hay incidencias críticas pendientes"
                    }
                  </p>
                  <div style={{ 
                    marginTop: "8px", 
                    fontSize: "0.8rem", 
                    color: criticos > 0 ? "#dc2626" : "#059669",
                    display: "flex",
                    justifyContent: "space-between"
                  }}>
                    <span>🚨 Nivel de riesgo</span>
                    <span style={{ fontWeight: "600" }}>
                      {criticos === 0 ? "BAJO" : criticos <= 2 ? "MEDIO" : "ALTO"}
                    </span>
                  </div>
                </div>

                {/* Estadísticas de Colaboradores */}
                {colaboradoresStats && (
                  <div style={{ 
                    padding: "18px", 
                    background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                    borderRadius: "12px",
                    border: "1px solid #10b981"
                  }}>
                    <h3 style={{ 
                      color: "#065f46", 
                      marginBottom: "8px",
                      fontSize: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <Icon name="Users" size={16} />
                      Base de Colaboradores
                    </h3>
                    <p style={{ color: "#047857", fontSize: "0.9rem", lineHeight: "1.4" }}>
                      <strong>{colaboradoresStats.total}</strong> colaboradores registrados
                      {colaboradoresStats.total > 0 && ` (${colaboradoresStats.activos} activos)`}
                    </p>
                    <div style={{ 
                      marginTop: "8px", 
                      fontSize: "0.8rem", 
                      color: "#065f46",
                      display: "flex",
                      justifyContent: "space-between"
                    }}>
                      <span>📍 CI: {colaboradoresStats.centroIndustrial}</span>
                      <span>🔥 HS: {colaboradoresStats.hornosSolera}</span>
                    </div>
                  </div>
                )}

                {/* Métricas Adicionales */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  fontSize: "0.85rem"
                }}>
                  <div style={{
                    padding: "12px",
                    background: "#f1f5f9",
                    borderRadius: "8px",
                    textAlign: "center",
                    border: "1px solid #e2e8f0"
                  }}>
                    <div style={{ fontWeight: "600", color: "#374151" }}>
                      {reportesValidos.filter(r => r && r.estado === "proceso").length}
                    </div>
                    <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>En Proceso</div>
                  </div>
                  <div style={{
                    padding: "12px",
                    background: "#f1f5f9",
                    borderRadius: "8px",
                    textAlign: "center",
                    border: "1px solid #e2e8f0"
                  }}>
                    <div style={{ fontWeight: "600", color: "#374151" }}>
                      {new Set(reportesValidos.map(r => r && r.area).filter(Boolean)).size}
                    </div>
                    <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>Áreas Activas</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actividad Reciente */}
          <ActividadReciente reportes={reportes} />
        </>
      )}

      {activeSection === 'colaboradores' && (
        <Colaboradores />
      )}

      {activeSection === 'supervision' && (
        <SupervisionMain />
      )}

      {activeSection === 'reportes' && (
        <div className="card">
          <h2>
            <Icon name="Reports" size={20} />
            Gestión de Reportes
          </h2>
          <ReporteList
            reportes={reportes}
            actualizarEstado={actualizarEstado}
            eliminarReporte={eliminarReporte}
          />
        </div>
      )}

      {activeSection === 'analytics' && (
        <div className="card">
          <h2>
            <Icon name="Analytics" size={20} />
            Análisis y Tendencias
          </h2>
          <GraficosEspañol reportes={reportes} />
        </div>
      )}

      {/* Excel Uploader Modal */}
      {showExcelUploader && (
        <ExcelUploader
          onUploadComplete={handleMigrationComplete}
          onClose={() => setShowExcelUploader(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
