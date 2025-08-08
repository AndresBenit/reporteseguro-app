import React, { useState } from 'react';
import { migrarReportesANuevoFormato, limpiarHistorialReportes, verificarIntegridadDatos } from '../../utils/migracionReportes';

/**
 * Componente para ejecutar la migración desde la UI
 */
const ComponenteMigracion = () => {
  const [estado, setEstado] = useState('idle'); // idle, migrando, completado, error
  const [resultado, setResultado] = useState(null);
  const [logs, setLogs] = useState([]);

  const agregarLog = (mensaje) => {
    setLogs(prev => [...prev, { timestamp: new Date(), mensaje }]);
  };

  const ejecutarMigracion = async () => {
    setEstado('migrando');
    setLogs([]);
    agregarLog('Iniciando migración...');
    
    try {
      const resultado = await migrarReportesANuevoFormato();
      setResultado(resultado);
      setEstado('completado');
      agregarLog(`Migración completada: ${resultado.migrados} reportes actualizados`);
      
      // Verificar integridad después de la migración
      agregarLog('🔍 Verificando integridad...');
      const integridad = await verificarIntegridadDatos();
      agregarLog(`Verificación completada: ${integridad.conHistorial}/${integridad.total} reportes con historial`);
      
    } catch (error) {
      setEstado('error');
      agregarLog(`❌ Error en migración: ${error.message}`);
    }
  };

  const ejecutarLimpieza = async () => {
    if (!window.confirm('⚠️ ¿Estás seguro? Esto eliminará todo el historial de estados.')) {
      return;
    }
    
    setEstado('migrando');
    agregarLog('🧹 Iniciando limpieza...');
    
    try {
      const limpiados = await limpiarHistorialReportes();
      agregarLog(`✅ Limpieza completada: ${limpiados} reportes limpiados`);
      setEstado('completado');
    } catch (error) {
      setEstado('error');
      agregarLog(`❌ Error en limpieza: ${error.message}`);
    }
  };

  return (
    <div style={{
      padding: '24px',
      maxWidth: '800px',
      margin: '0 auto',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{ marginBottom: '20px', color: '#1f2937' }}>
        🔄 Migración de Sistema de Estados
      </h2>
      
      <div style={{
        background: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <p style={{ margin: 0, color: '#92400e' }}>
          ⚠️ <strong>Importante:</strong> Esta migración actualizará todos los reportes existentes 
          para incluir el nuevo sistema de historial de estados. Haz un respaldo antes de continuar.
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <button
          onClick={ejecutarMigracion}
          disabled={estado === 'migrando'}
          style={{
            padding: '12px 24px',
            background: estado === 'migrando' ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: estado === 'migrando' ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}
        >
          {estado === 'migrando' ? '🔄 Migrando...' : '🚀 Ejecutar Migración'}
        </button>

        <button
          onClick={() => verificarIntegridadDatos().then(r => agregarLog(`📊 Verificación: ${JSON.stringify(r)}`))}
          disabled={estado === 'migrando'}
          style={{
            padding: '12px 24px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: estado === 'migrando' ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}
        >
          🔍 Verificar Integridad
        </button>

        <button
          onClick={ejecutarLimpieza}
          disabled={estado === 'migrando'}
          style={{
            padding: '12px 24px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: estado === 'migrando' ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}
        >
          🧹 Limpiar Historial
        </button>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px',
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          <h4 style={{ marginTop: 0, color: '#374151' }}>📋 Logs de Migración:</h4>
          {logs.map((log, index) => (
            <div key={index} style={{
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              color: '#374151',
              marginBottom: '4px'
            }}>
              <span style={{ color: '#6b7280' }}>
                {log.timestamp.toLocaleTimeString()}
              </span>
              {' - '}
              {log.mensaje}
            </div>
          ))}
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div style={{
          marginTop: '20px',
          background: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h4 style={{ marginTop: 0, color: '#0c4a6e' }}>📊 Resultado de la Migración:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0c4a6e' }}>
                {resultado.total}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#0369a1' }}>Total</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                {resultado.migrados}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#047857' }}>Migrados</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>
                {resultado.errores}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#991b1b' }}>Errores</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6b7280' }}>
                {resultado.saltados}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>Saltados</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponenteMigracion;