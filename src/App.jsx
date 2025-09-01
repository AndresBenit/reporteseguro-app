import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { supabase, authHelpers } from "./services/supabase";

// Componentes principales
import LoginMejorado from "./components/auth/LoginMejorado";
import MainLayoutMejorado from "./components/common/MainLayoutMejorado";
import MainDashboard from "./components/dashboard/MainDashboard";
import ReportTypeSelector from "./components/reports/ReportTypeSelector";
import ReporteList from "./components/reports/ReporteList";
import ColaboradoresMain from "./components/collaborators/ColaboradoresMain";
import SupervisionMain from "./components/supervision/SupervisionMain";
import SupervisionCampo from "./components/supervision/SupervisionCampo";
import AbordajeCampo from "./components/supervision/AbordajeCampo";
import IncidentReportForm from "./components/reports/forms/IncidentReportForm";
import ReportesHistorial from "./components/reports/ReportesHistorial";
import ReportesHistorialMejorado from "./components/reports/ReportesHistorialMejorado";
import ComponenteMigracion from "./components/admin/ComponenteMigracion";
import TestForm from "./components/debug/TestForm";
import ErrorBoundary from "./components/debug/ErrorBoundary";

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
            fontSize: '3rem',
            marginBottom: '20px',
            color: '#1e40af'
          }}>
            🛡️
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

  return (
    <div className="app fade-in">
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
              <MainLayoutMejorado user={user} onLogout={handleLogout} reportes={reportes}>
                <Routes>
                  {/* Dashboard principal */}
                  <Route
                    path="/"
                    element={
                      <MainDashboard 
                        user={user} 
                        reportes={reportes}
                        colaboradoresStats={colaboradoresStats}
                        estadisticasReportes={getEstadisticas()}
                      />
                    }
                  />
                  
                  {/* Módulo de Reportes */}
                  <Route path="/reportes">
                    <Route index element={<Navigate to="/reportes/nuevo" replace />} />
                    <Route path="nuevo" element={<ReportTypeSelector />} />
                    <Route path="historial" element={<ReportesHistorial />} />
                    <Route path="historial-mejorado" element={<ReportesHistorialMejorado />} />
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
                  <Route path="/supervision" element={<SupervisionMain />} />
                  
                  {/* Módulo de Colaboradores */}
                  <Route path="/colaboradores" element={<ColaboradoresMain />} />
                  
                  {/* Redirección por defecto */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </MainLayoutMejorado>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </div>
  );
}

export default App;