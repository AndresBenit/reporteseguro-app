import React, { useEffect, useState, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { supabase, authHelpers } from "./services/supabase";
import { NotificationProvider } from "./components/common/NotificationSystem";

// Componentes críticos (carga inmediata)
import LoginMejorado from "./components/auth/LoginMejorado";
import MainLayoutEnterprise from "./components/common/MainLayoutEnterprise";
import MainDashboard from "./components/dashboard/MainDashboard";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Componentes lazy-loaded (carga bajo demanda)
const ReportTypeSelector = lazy(() => import("./components/reports/ReportTypeSelector"));
const ReporteList = lazy(() => import("./components/reports/ReporteList"));
const ColaboradoresMain = lazy(() => import("./components/collaborators/ColaboradoresMain"));
const SupervisionMain = lazy(() => import("./components/supervision/SupervisionMain"));
const SupervisionCampo = lazy(() => import("./components/supervision/SupervisionCampo"));
const AbordajeCampo = lazy(() => import("./components/supervision/AbordajeCampo"));
const ControlEPP = lazy(() => import("./components/supervision/ControlEPP"));
const InventarioMain = lazy(() => import("./components/inventory/InventarioMain"));
const CapacitacionesMain = lazy(() => import("./components/capacitaciones/CapacitacionesMain"));
const ExamenesMedicosMain = lazy(() => import("./components/examenes/ExamenesMedicosMain"));
const COPASSTMain = lazy(() => import("./components/copasst/COPASSTMain"));
const ReportesLegalesMain = lazy(() => import("./components/reportes-legales/ReportesLegalesMain"));
const PlanesEmergenciaMain = lazy(() => import("./components/emergencias/PlanesEmergenciaMain"));
const InspeccionesMain = lazy(() => import("./components/inspecciones/InspeccionesMain"));
const InvestigacionAccidentesMain = lazy(() => import("./components/investigacion/InvestigacionAccidentesMain"));
const AuditoriasMain = lazy(() => import("./components/auditorias/AuditoriasMain"));
const MatrizRiesgosMain = lazy(() => import("./components/riesgos/MatrizRiesgosMain"));
const IncidentReportForm = lazy(() => import("./components/reports/forms/IncidentReportForm"));
const ReportesHistorialMejorado = lazy(() => import("./components/reports/ReportesHistorialMejorado"));
const ReportesHistorial = lazy(() => import("./components/reports/ReportesHistorial"));
const ComponenteMigracion = lazy(() => import("./components/reports/ComponenteMigracion"));

// Hooks y servicios
import { useReportes } from "./hooks/useReportes";
import { useColaboradores } from "./hooks/useColaboradores";
import { Icon } from "./components/common/Icons";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Custom hooks para datos
  const { 
    reportes, 
    loading: reportesLoading, 
    error: reportesError,
    eliminarReporte,
    actualizarEstado,
    actualizarEstadoConHistorial,
    asignarReporte,
    cambiarPrioridad,
    agregarComentario,
    getEstadisticas,
    isUpdating
  } = useReportes();
  const { colaboradoresStats } = useColaboradores();

  // Monitoring: Solo en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && reportesError) {
      console.error('Error cargando reportes:', reportesError);
    }
  }, [reportesError]);

  useEffect(() => {
    const getInitialUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    
    getInitialUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    
    return () => subscription?.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await authHelpers.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          maxWidth: '360px'
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(30, 64, 175, 0.25)",
            margin: "0 auto 20px"
          }}>
            <Icon name="Shield" size={32} color="white" />
          </div>
          <h2 style={{
            color: '#1e293b',
            marginBottom: '12px',
            fontSize: '1.25rem',
            fontWeight: 600
          }}>Iniciando ReporteSeguro</h2>
          <p style={{
            color: '#64748b',
            fontSize: '0.875rem',
            margin: 0
          }}>Sistema de Gestión de Seguridad Industrial</p>
        </div>
      </div>
    );
  }

  // Componente de Loading para Suspense
  const LoadingFallback = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      color: '#64748b'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px'
        }}></div>
        <p>Cargando módulo...</p>
      </div>
    </div>
  );

  return (
    <NotificationProvider>
      <div className="app fade-in">
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <Routes>
        {/* Ruta de login */}
        <Route
          path="/login"
          element={!user ? <LoginMejorado /> : <Navigate to="/" replace />}
        />

        {/* Rutas protegidas */}
        <Route
          path="/*"
          element={
            user ? (
              <MainLayoutEnterprise user={user} onLogout={handleLogout} reportes={reportes}>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                  {/* Dashboard principal */}
                  <Route
                    path="/"
                    element={
                      <MainDashboard 
                        user={user} 
                        reportes={reportes}
                        colaboradoresStats={colaboradoresStats}
                        estadisticasReportes={getEstadisticas}
                      />
                    }
                  />
                  
                  {/* Módulo de Reportes */}
                  <Route path="/reportes">
                    <Route index element={<Navigate to="/reportes/nuevo" replace />} />
                    <Route path="nuevo" element={<ReportTypeSelector />} />
                    <Route path="historial" element={<ReportesHistorial />} />
                    <Route path="historial-mejorado" element={
                      <ReportesHistorialMejorado
                        reportes={reportes}
                        actualizarEstado={actualizarEstado}
                        eliminarReporte={eliminarReporte}
                        isUpdating={isUpdating}
                      />
                    } />
                    <Route path="migracion" element={<ComponenteMigracion />} />
                    <Route 
                      path="lista" 
                      element={
                        <ReporteList
                          reportes={reportes}
                          loading={reportesLoading}
                          error={reportesError}
                          actualizarEstado={actualizarEstado}
                          actualizarEstadoConHistorial={actualizarEstadoConHistorial}
                          eliminarReporte={eliminarReporte}
                          asignarReporte={asignarReporte}
                          cambiarPrioridad={cambiarPrioridad}
                          agregarComentario={agregarComentario}
                          isUpdating={isUpdating}
                        />
                      } 
                    />
                  </Route>
                  
                  {/* Formularios Específicos */}
                  <Route path="/reportes/incident-form" element={
                    <ErrorBoundary>
                      <IncidentReportForm />
                    </ErrorBoundary>
                  } />
                  <Route path="/formularios/recomendacion" element={
                    <ErrorBoundary>
                      <SupervisionCampo />
                    </ErrorBoundary>
                  } />
                  <Route path="/formularios/abordaje" element={
                    <ErrorBoundary>
                      <AbordajeCampo />
                    </ErrorBoundary>
                  } />
                  <Route path="/formularios/control-epp" element={
                    <ErrorBoundary>
                      <ControlEPP />
                    </ErrorBoundary>
                  } />
                  
                  {/* Formularios originales para depuración */}
                  <Route path="/reportes/incident-form-original" element={
                    <ErrorBoundary>
                      <IncidentReportForm />
                    </ErrorBoundary>
                  } />
                  <Route path="/formularios/recomendacion-original" element={
                    <ErrorBoundary>
                      <SupervisionCampo />
                    </ErrorBoundary>
                  } />
                  <Route path="/formularios/abordaje-original" element={
                    <ErrorBoundary>
                      <AbordajeCampo />
                    </ErrorBoundary>
                  } />
                  
                  {/* Módulo de Supervisión */}
                  <Route path="/supervision" element={<SupervisionMain reportes={reportes} />} />
                  
                  {/* Módulo de Colaboradores */}
                  <Route path="/colaboradores" element={<ColaboradoresMain />} />
                  
                  {/* Módulo de Inventario */}
                  <Route path="/inventario" element={<InventarioMain />} />
                  
                  {/* Módulo de Capacitaciones SST */}
                  <Route path="/capacitaciones" element={<CapacitacionesMain />} />
                  
                  {/* Módulo de Exámenes Médicos SST */}
                  <Route path="/examenes-medicos" element={<ExamenesMedicosMain />} />
                  
                  {/* Módulo de COPASST SST */}
                  <Route path="/copasst" element={<COPASSTMain />} />
                  
                  {/* Módulo de Reportes Legales SST */}
                  <Route path="/reportes-legales" element={<ReportesLegalesMain />} />
                  
                  {/* Módulo de Planes de Emergencia SST */}
                  <Route path="/planes-emergencia" element={<PlanesEmergenciaMain />} />
                  
                  {/* Módulo de Inspecciones SST */}
                  <Route path="/inspecciones" element={<InspeccionesMain />} />
                  
                  {/* Módulo de Investigación de Accidentes */}
                  <Route path="/investigacion-accidentes" element={<InvestigacionAccidentesMain />} />
                  <Route path="/investigacion" element={<InvestigacionAccidentesMain />} />
                  <Route path="/investigacion/nuevo" element={<InvestigacionAccidentesMain />} />
                  
                  {/* Módulo de Auditorías SST */}
                  <Route path="/auditorias" element={<AuditoriasMain />} />
                  
                  {/* Módulo de Matriz de Riesgos */}
                  <Route path="/matriz-riesgos" element={<MatrizRiesgosMain />} />
                  
                  {/* Redirección por defecto */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                </Suspense>
              </MainLayoutEnterprise>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        </Routes>
      </div>
    </NotificationProvider>
  );
}

export default App;