import React, { useState, useEffect } from 'react';
import { Icon } from '../common/Icons';

const DataDebugger = ({ reportes = [], colaboradoresStats = {}, user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugData, setDebugData] = useState({});
  
  useEffect(() => {
    // Calcular estadísticas detalladas para debugging
    const reportesValidos = Array.isArray(reportes) ? reportes : [];
    
    const estadisticas = {
      reportes: {
        total: reportesValidos.length,
        array_type: Array.isArray(reportes) ? 'Array' : typeof reportes,
        pendientes: reportesValidos.filter(r => r && r.estado === 'pendiente').length,
        enProceso: reportesValidos.filter(r => r && ['proceso', 'en_proceso', 'asignado'].includes(r.estado)).length,
        resueltos: reportesValidos.filter(r => r && ['resuelto', 'cerrado'].includes(r.estado)).length,
        criticos: reportesValidos.filter(r => r && r.severidad === 'critica').length,
        porSeveridad: {
          baja: reportesValidos.filter(r => r && r.severidad === 'baja').length,
          media: reportesValidos.filter(r => r && r.severidad === 'media').length,
          alta: reportesValidos.filter(r => r && r.severidad === 'alta').length,
          critica: reportesValidos.filter(r => r && r.severidad === 'critica').length,
        },
        areasUnicas: new Set(reportesValidos.map(r => r && r.area).filter(Boolean)).size,
        ultimoReporte: reportesValidos.length > 0 ? reportesValidos[0]?.created_at : 'N/A'
      },
      colaboradores: {
        stats_type: typeof colaboradoresStats,
        total: colaboradoresStats?.total || 0,
        activos: colaboradoresStats?.activos || 0,
        centroIndustrial: colaboradoresStats?.centroIndustrial || 0,
        hornosSolera: colaboradoresStats?.hornosSolera || 0,
        statsKeys: Object.keys(colaboradoresStats || {})
      },
      usuario: {
        id: user?.id || 'N/A',
        email: user?.email || 'N/A',
        displayName: user?.displayName || 'N/A',
        authenticated: !!user
      },
      timestamp: new Date().toLocaleTimeString(),
      errors: []
    };
    
    // Detectar posibles problemas
    if (!Array.isArray(reportes)) {
      estadisticas.errors.push(`Reportes no es array: ${typeof reportes}`);
    }
    
    if (!colaboradoresStats || typeof colaboradoresStats !== 'object') {
      estadisticas.errors.push(`ColaboradoresStats inválido: ${typeof colaboradoresStats}`);
    }
    
    if (reportesValidos.length === 0 && Array.isArray(reportes)) {
      estadisticas.errors.push('Array de reportes está vacío');
    }
    
    // Verificar estructura de reportes
    if (reportesValidos.length > 0) {
      const primerReporte = reportesValidos[0];
      if (!primerReporte.estado) {
        estadisticas.errors.push('Reportes sin campo "estado"');
      }
      if (!primerReporte.severidad) {
        estadisticas.errors.push('Reportes sin campo "severidad"');
      }
      if (!primerReporte.area) {
        estadisticas.errors.push('Reportes sin campo "area"');
      }
    }
    
    setDebugData(estadisticas);
  }, [reportes, colaboradoresStats, user]);
  
  if (!isOpen) {
    return (
      <div style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 9999
      }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: '#1e40af',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          🔍 DEBUG
        </button>
      </div>
    );
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '20px',
      width: '400px',
      maxHeight: '70vh',
      background: 'white',
      border: '2px solid #1e40af',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      zIndex: 9999,
      fontFamily: 'monospace',
      fontSize: '12px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: '#1e40af',
        color: 'white',
        padding: '10px 15px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <strong>🔍 DATA DEBUGGER</strong>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ✕
        </button>
      </div>
      
      {/* Content */}
      <div style={{
        padding: '15px',
        maxHeight: 'calc(70vh - 50px)',
        overflowY: 'auto'
      }}>
        {/* Errores */}
        {debugData.errors && debugData.errors.length > 0 && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #f87171',
            borderRadius: '6px',
            padding: '10px',
            marginBottom: '15px'
          }}>
            <div style={{ color: '#dc2626', fontWeight: 'bold', marginBottom: '5px' }}>
              ⚠️ ERRORES DETECTADOS:
            </div>
            {debugData.errors.map((error, index) => (
              <div key={index} style={{ color: '#7f1d1d', marginBottom: '3px' }}>
                • {error}
              </div>
            ))}
          </div>
        )}
        
        {/* Reportes */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '10px',
          marginBottom: '10px'
        }}>
          <div style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: '8px' }}>
            📊 REPORTES
          </div>
          <div>Total: <strong>{debugData.reportes?.total}</strong></div>
          <div>Tipo: <strong>{debugData.reportes?.array_type}</strong></div>
          <div>Pendientes: <strong>{debugData.reportes?.pendientes}</strong></div>
          <div>En Proceso: <strong>{debugData.reportes?.enProceso}</strong></div>
          <div>Resueltos: <strong>{debugData.reportes?.resueltos}</strong></div>
          <div>Críticos: <strong>{debugData.reportes?.criticos}</strong></div>
          <div>Áreas únicas: <strong>{debugData.reportes?.areasUnicas}</strong></div>
          
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280' }}>
            Por severidad:
            <div style={{ marginLeft: '10px' }}>
              Baja: {debugData.reportes?.porSeveridad?.baja} | 
              Media: {debugData.reportes?.porSeveridad?.media} | 
              Alta: {debugData.reportes?.porSeveridad?.alta} | 
              Crítica: {debugData.reportes?.porSeveridad?.critica}
            </div>
          </div>
        </div>
        
        {/* Colaboradores */}
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '6px',
          padding: '10px',
          marginBottom: '10px'
        }}>
          <div style={{ fontWeight: 'bold', color: '#059669', marginBottom: '8px' }}>
            👥 COLABORADORES
          </div>
          <div>Tipo: <strong>{debugData.colaboradores?.stats_type}</strong></div>
          <div>Total: <strong>{debugData.colaboradores?.total}</strong></div>
          <div>Activos: <strong>{debugData.colaboradores?.activos}</strong></div>
          <div>Centro Industrial: <strong>{debugData.colaboradores?.centroIndustrial}</strong></div>
          <div>Hornos Solera: <strong>{debugData.colaboradores?.hornosSolera}</strong></div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '5px' }}>
            Props: [{debugData.colaboradores?.statsKeys?.join(', ')}]
          </div>
        </div>
        
        {/* Usuario */}
        <div style={{
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '6px',
          padding: '10px',
          marginBottom: '10px'
        }}>
          <div style={{ fontWeight: 'bold', color: '#d97706', marginBottom: '8px' }}>
            👤 USUARIO
          </div>
          <div>Email: <strong>{debugData.usuario?.email}</strong></div>
          <div>Nombre: <strong>{debugData.usuario?.displayName}</strong></div>
          <div>Autenticado: <strong>{debugData.usuario?.authenticated ? 'Sí' : 'No'}</strong></div>
        </div>
        
        {/* Timestamp */}
        <div style={{
          textAlign: 'center',
          fontSize: '11px',
          color: '#6b7280',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '8px'
        }}>
          Última actualización: {debugData.timestamp}
        </div>
        
        {/* Botón de refresh */}
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            🔄 Recargar Página
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataDebugger;