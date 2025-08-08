import React, { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Icon } from '../Icons';

const EnhancedGraficos = ({ reportes = [] }) => {
  const [activeChart, setActiveChart] = useState('trends');

  // 🎨 COLORES GARANTIZADOS QUE FUNCIONAN
  const colores = {
    primary: '#3b82f6',
    success: '#10b981', 
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    purple: '#8b5cf6',
    indigo: '#6366f1',
    pink: '#ec4899'
  };



  // 📊 PROCESAR DATOS CON LÓGICA MEJORADA
  const chartData = useMemo(() => {
    console.log('📊 Procesando datos para gráficas:', reportes.length, 'reportes');
    console.log('📋 Datos de ejemplo:', reportes.slice(0, 2)); // DEBUG
    
    // Si no hay reportes, retornar datos vacíos
    if (!reportes.length) {
      console.log('⚠️ No hay reportes disponibles');
      return {
        monthly: [],
        severity: [],
        areas: [],
        status: []
      };
    }

    // 📈 DATOS TEMPORALES MEJORADOS - Últimos 6 meses
    const monthlyData = {};
    const ahora = new Date();
    
    // Inicializar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const monthKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      const monthName = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
      
      monthlyData[monthKey] = {
        mes: monthName,
        total: 0,
        criticos: 0,
        altos: 0,
        medios: 0,
        bajos: 0,
        pendientes: 0,
        resueltos: 0
      };
    }
    
    // Procesar reportes reales
    reportes.forEach(reporte => {
      if (!reporte.fecha) return;
      
      const date = reporte.fecha instanceof Date ? reporte.fecha : reporte.fecha.toDate();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].total++;
        
        // Categorizar por severidad
        const severidad = (reporte.severidad || '').toLowerCase();
        if (severidad === 'critica') monthlyData[monthKey].criticos++;
        else if (severidad === 'alta') monthlyData[monthKey].altos++;
        else if (severidad === 'media') monthlyData[monthKey].medios++;
        else monthlyData[monthKey].bajos++;
        
        // Categorizar por estado
        const estado = (reporte.estado || '').toLowerCase();
        if (['resuelto', 'cerrado'].includes(estado)) {
          monthlyData[monthKey].resueltos++;
        } else {
          monthlyData[monthKey].pendientes++;
        }
      }
    });

    const monthly = Object.values(monthlyData);

    // 🎯 DATOS POR SEVERIDAD
    const severityData = [
      { 
        name: 'Crítica', 
        value: reportes.filter(r => (r.severidad || '').toLowerCase() === 'critica').length, 
        color: colores.danger 
      },
      { 
        name: 'Alta', 
        value: reportes.filter(r => (r.severidad || '').toLowerCase() === 'alta').length, 
        color: colores.warning 
      },
      { 
        name: 'Media', 
        value: reportes.filter(r => (r.severidad || '').toLowerCase() === 'media').length, 
        color: colores.info 
      },
      { 
        name: 'Baja', 
        value: reportes.filter(r => (r.severidad || '').toLowerCase() === 'baja').length, 
        color: colores.success 
      }
    ].filter(item => item.value > 0);

    // 🏢 DATOS POR ÁREA - DETECCIÓN ROBUSTA
    const areasMap = {};
    reportes.forEach(reporte => {
      // Buscar área en múltiples campos posibles con logging
      const area = reporte.area || 
                   reporte.lugarLabor || 
                   reporte.lugarTrabajo ||
                   reporte.ubicacion ||
                   reporte.lugar ||
                   reporte.centro ||
                   reporte.departamento ||
                   reporte.seccion ||
                   'Sin área especificada';
      
      console.log('🏢 Área detectada:', area, 'del reporte:', reporte); // DEBUG
      
      if (!areasMap[area]) {
        areasMap[area] = { area, total: 0, criticos: 0, resueltos: 0, pendientes: 0 };
      }
      areasMap[area].total++;
      
      const severidad = (reporte.severidad || '').toLowerCase();
      console.log('🎯 Severidad detectada:', severidad); // DEBUG
      if (severidad === 'critica' || severidad === 'crítica') {
        areasMap[area].criticos++;
      }
      
      const estado = (reporte.estado || '').toLowerCase();
      console.log('📊 Estado detectado:', estado); // DEBUG
      if (['resuelto', 'cerrado'].includes(estado)) {
        areasMap[area].resueltos++;
      } else {
        areasMap[area].pendientes++;
      }
    });

    console.log('🏢 Datos de áreas detectadas:', areasMap); // DEBUG

    const areas = Object.values(areasMap)
      .map(area => ({
        ...area,
        eficiencia: area.total > 0 ? Math.round((area.resueltos / area.total) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total);

    // 📊 DATOS DE ESTADO
    const statusData = [
      { 
        name: 'Pendientes', 
        value: reportes.filter(r => (r.estado || '').toLowerCase() === 'pendiente').length, 
        color: colores.info 
      },
      { 
        name: 'En Proceso', 
        value: reportes.filter(r => ['proceso', 'en_proceso', 'asignado'].includes((r.estado || '').toLowerCase())).length, 
        color: colores.warning 
      },
      { 
        name: 'Resueltos', 
        value: reportes.filter(r => ['resuelto', 'cerrado'].includes((r.estado || '').toLowerCase())).length, 
        color: colores.success 
      }
    ].filter(item => item.value > 0);

    return { monthly, severity: severityData, areas, status: statusData };
  }, [reportes]);

  // 📊 COMPONENTE DE TOOLTIP PERSONALIZADO
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
          fontSize: '0.875rem'
        }}>
          <p style={{ color: '#1f2937', fontWeight: '600', marginBottom: '8px' }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: '4px 0' }}>
              <span style={{ fontWeight: '500' }}>{entry.name}:</span> {entry.value}
              {entry.name.includes('%') && '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const chartTabs = [
    { id: 'trends', name: 'Tendencias', icon: 'Analytics' },
    { id: 'severity', name: 'Severidad', icon: 'AlertCircle' },
    { id: 'areas', name: 'Por Áreas', icon: 'Building' },
    { id: 'performance', name: 'Rendimiento', icon: 'TrendingUp' }
  ];

  // Componente para estado sin datos
  const NoDataMessage = ({ message = "No hay datos para mostrar en este período" }) => (
    <div style={{
      textAlign: 'center',
      padding: '60px 20px',
      background: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.3 }}>📊</div>
      <h3 style={{ color: '#6b7280', marginBottom: '8px', fontSize: '1.125rem' }}>{message}</h3>
      <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
        Los gráficos aparecerán aquí cuando haya reportes registrados
      </p>
    </div>
  );

  // Si no hay reportes, mostrar mensaje
  if (!reportes.length) {
    return <NoDataMessage message="No hay reportes registrados aún" />;
  }

  return (
    <div>
      {/* Filtros de gráficos */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px', 
        flexWrap: 'wrap' 
      }}>
        {chartTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveChart(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              border: `2px solid ${activeChart === tab.id ? '#3b82f6' : '#e5e7eb'}`,
              background: activeChart === tab.id ? '#3b82f6' : '#ffffff',
              color: activeChart === tab.id ? '#ffffff' : '#1f2937',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Icon name={tab.icon} size={16} />
            {tab.name}
          </button>
        ))}
      </div>

      {/* 📈 Gráfico de tendencias temporales */}
      {activeChart === 'trends' && (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginBottom: '20px',
            color: '#1f2937',
            fontSize: '1.25rem',
            fontWeight: '600'
          }}>
            <Icon name="Analytics" size={20} />
            Evolución Temporal de Reportes
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData.monthly}>
              <defs>
                <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="criticosGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="mes" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#totalGradient)"
                name="Total Reportes"
              />
              <Area
                type="monotone"
                dataKey="criticos"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#criticosGradient)"
                name="Críticos"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 🎯 Gráfico de severidad */}
      {activeChart === 'severity' && (
        chartData.severity.length === 0 ? (
          <NoDataMessage message="No hay datos de severidad para mostrar" />
        ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: '#1f2937',
              marginBottom: '16px',
              fontSize: '1.125rem',
              fontWeight: '600'
            }}>
              <Icon name="AlertCircle" size={20} />
              Distribución por Severidad
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.severity}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.severity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: '#1f2937',
              marginBottom: '16px',
              fontSize: '1.125rem',
              fontWeight: '600'
            }}>
              <Icon name="BarChart" size={20} />
              Severidad por Mes
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="mes" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="criticos" fill="#ef4444" name="Críticos" />
                <Bar dataKey="altos" fill="#f59e0b" name="Altos" />
                <Bar dataKey="medios" fill="#06b6d4" name="Medios" />
                <Bar dataKey="bajos" fill="#10b981" name="Bajos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        )
      )}

      {/* 🏢 Gráfico por áreas */}
      {activeChart === 'areas' && (
        chartData.areas.length === 0 ? (
          <NoDataMessage message="No hay datos de áreas para mostrar" />
        ) : (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginBottom: '20px',
            color: '#1f2937',
            fontSize: '1.25rem',
            fontWeight: '600'
          }}>
            <Icon name="Building" size={20} />
            Reportes por Área de Trabajo
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={chartData.areas} 
              layout="vertical"
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                type="number" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                type="category" 
                dataKey="area" 
                stroke="#6b7280"
                fontSize={12}
                width={150}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="total" fill="#3b82f6" name="Total" />
              <Bar dataKey="criticos" fill="#ef4444" name="Críticos" />
              <Bar dataKey="resueltos" fill="#10b981" name="Resueltos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        )
      )}

      {/* 📊 Gráfico de rendimiento */}
      {activeChart === 'performance' && (
        chartData.status.length === 0 ? (
          <NoDataMessage message="No hay datos de rendimiento para mostrar" />
        ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: '#1f2937',
              marginBottom: '16px',
              fontSize: '1.125rem',
              fontWeight: '600'
            }}>
              <Icon name="TrendingUp" size={20} />
              Estado de Resolución
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.status}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: '#1f2937',
              marginBottom: '16px',
              fontSize: '1.125rem',
              fontWeight: '600'
            }}>
              <Icon name="CheckCircle" size={20} />
              Eficiencia por Área
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.areas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="area" 
                  stroke="#6b7280"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="eficiencia" 
                  fill="#10b981" 
                  name="% Eficiencia"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        )
      )}

      {/* 📋 Resumen estadístico */}
      <div style={{
        marginTop: '24px',
        padding: '20px',
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <h4 style={{ 
          marginBottom: '16px', 
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '1.125rem',
          fontWeight: '600'
        }}>
          <Icon name="Analytics" size={18} />
          Resumen Estadístico
        </h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          fontSize: '0.875rem'
        }}>
          <div>
            <strong style={{ color: '#1f2937' }}>Total de reportes:</strong> {reportes.length}
          </div>
          <div>
            <strong style={{ color: '#1f2937' }}>Tasa de resolución:</strong> {' '}
            {reportes.length > 0 ? 
              Math.round((reportes.filter(r => ['resuelto', 'cerrado'].includes((r.estado || '').toLowerCase())).length / reportes.length) * 100) 
              : 0}%
          </div>
          <div>
            <strong style={{ color: '#1f2937' }}>Área más activa:</strong> {' '}
            {chartData.areas.length > 0 ? chartData.areas[0].area : 'N/A'}
          </div>
          <div>
            <strong style={{ color: '#1f2937' }}>Reportes críticos:</strong> {' '}
            {reportes.filter(r => (r.severidad || '').toLowerCase() === 'critica').length}
          </div>
        </div>
      </div>

      {/* CSS responsivo */}
      <style jsx>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(2, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedGraficos;