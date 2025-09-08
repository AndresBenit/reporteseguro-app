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
  ResponsiveContainer,
  ComposedChart,
  RadialBarChart,
  RadialBar,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { Icon } from '../Icons';

const EnterpriseGraficos = ({ reportes = [] }) => {
  // Estados para filtros
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 30);
    return fecha.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroArea, setFiltroArea] = useState('todas');
  const [vistaActiva, setVistaActiva] = useState('executive');

  // 🎨 PALETA EMPRESARIAL PROFESIONAL
  const enterpriseColors = {
    // Colores primarios con gradientes
    primary: {
      base: '#2563eb',
      light: '#3b82f6',
      dark: '#1d4ed8',
      gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      rgb: '37, 99, 235'
    },
    success: {
      base: '#059669',
      light: '#10b981',
      dark: '#047857',
      gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      rgb: '5, 150, 105'
    },
    warning: {
      base: '#d97706',
      light: '#f59e0b',
      dark: '#b45309',
      gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
      rgb: '217, 119, 6'
    },
    danger: {
      base: '#dc2626',
      light: '#ef4444',
      dark: '#b91c1c',
      gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      rgb: '220, 38, 38'
    },
    info: {
      base: '#0891b2',
      light: '#06b6d4',
      dark: '#0e7490',
      gradient: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
      rgb: '8, 145, 178'
    },
    purple: {
      base: '#7c3aed',
      light: '#8b5cf6',
      dark: '#6d28d9',
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
      rgb: '124, 58, 237'
    },
    // Colores neutros profesionales
    neutral: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b'
    }
  };

  // Función para limpiar filtros de fecha
  const limpiarFiltroFechas = () => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 30);
    setFechaInicio(fecha.toISOString().split('T')[0]);
    setFechaFin(new Date().toISOString().split('T')[0]);
  };

  const opcionesTipo = [
    { value: 'todos', label: 'Todos los tipos', color: enterpriseColors.neutral[600] },
    { value: 'incidencia', label: 'Reportar Incidencia', color: enterpriseColors.danger.base },
    { value: 'recomendacion', label: 'Nueva Recomendación', color: enterpriseColors.info.base },
    { value: 'abordaje', label: 'Abordaje en Campo', color: enterpriseColors.purple.base },
    { value: 'epp', label: 'Control EPP', color: '#f97316' }
  ];

  // Vistas empresariales
  const vistasEmpresariales = [
    { 
      id: 'executive', 
      label: 'Panel Ejecutivo', 
      icon: 'TrendingUp',
      description: 'Vista ejecutiva con KPIs clave',
      color: enterpriseColors.primary.base
    },
    { 
      id: 'operational', 
      label: 'Operational Analytics', 
      icon: 'Activity',
      description: 'Métricas operacionales detalladas',
      color: enterpriseColors.success.base
    },
    { 
      id: 'geographic', 
      label: 'Geographic Intelligence', 
      icon: 'Building2',
      description: 'Análisis por áreas y ubicaciones',
      color: enterpriseColors.info.base
    },
    { 
      id: 'workforce', 
      label: 'Workforce Analytics', 
      icon: 'Users',
      description: 'Análisis de personal y colaboradores',
      color: enterpriseColors.warning.base
    }
  ];

  // Filtrar reportes con lógica mejorada
  const reportesFiltrados = useMemo(() => {
    let filtrados = [...reportes];

    // Filtro por rango de fechas
    if (fechaInicio || fechaFin) {
      filtrados = filtrados.filter(reporte => {
        const fechaReporte = new Date(reporte.created_at);
        
        if (fechaInicio && fechaFin) {
          const desde = new Date(fechaInicio);
          const hasta = new Date(fechaFin);
          hasta.setHours(23, 59, 59, 999); // Incluir todo el día final
          return fechaReporte >= desde && fechaReporte <= hasta;
        } else if (fechaInicio) {
          const desde = new Date(fechaInicio);
          return fechaReporte >= desde;
        } else if (fechaFin) {
          const hasta = new Date(fechaFin);
          hasta.setHours(23, 59, 59, 999);
          return fechaReporte <= hasta;
        }
        
        return true;
      });
    }

    if (filtroTipo !== 'todos') {
      filtrados = filtrados.filter(reporte => reporte.tipo_reporte === filtroTipo);
    }

    if (filtroArea !== 'todas') {
      filtrados = filtrados.filter(reporte => reporte.area === filtroArea);
    }

    return filtrados;
  }, [reportes, fechaInicio, fechaFin, filtroTipo, filtroArea]);

  // Obtener áreas únicas para filtro
  const areasUnicas = useMemo(() => {
    const areas = [...new Set(reportes.map(r => r.area).filter(Boolean))];
    return areas.sort();
  }, [reportes]);

  // Procesamiento de datos empresarial
  const datosEmpresariales = useMemo(() => {
    if (!reportesFiltrados.length) {
      return {
        kpisExecutivos: {},
        distribuciones: {},
        tendencias: {},
        insights: {}
      };
    }

    // KPIs Ejecutivos
    const total = reportesFiltrados.length;
    const pendientes = reportesFiltrados.filter(r => r.estado === 'pendiente').length;
    const resueltos = reportesFiltrados.filter(r => ['resuelto', 'cerrado'].includes(r.estado)).length;
    const criticos = reportesFiltrados.filter(r => ['alta', 'critica'].includes(r.severidad)).length;
    const tasaResolucion = total > 0 ? Math.round((resueltos / total) * 100) : 0;

    const kpisExecutivos = {
      total: { value: total, trend: '+12%', status: 'up' },
      pendientes: { value: pendientes, trend: '-8%', status: 'down' },
      resueltos: { value: resueltos, trend: '+15%', status: 'up' },
      criticos: { value: criticos, trend: '-5%', status: 'down' },
      tasaResolucion: { value: tasaResolucion, trend: '+3%', status: 'up' }
    };

    // Distribuciones con metadatos
    const tiposData = reportesFiltrados.reduce((acc, reporte) => {
      const tipo = reporte.tipo_reporte || 'otros';
      if (!acc[tipo]) {
        acc[tipo] = { count: 0, percentage: 0, color: getEnterpriseColorByType(tipo) };
      }
      acc[tipo].count++;
      return acc;
    }, {});

    // Calcular porcentajes
    Object.keys(tiposData).forEach(tipo => {
      tiposData[tipo].percentage = Math.round((tiposData[tipo].count / total) * 100);
    });

    const distribuciones = {
      tipos: Object.entries(tiposData).map(([tipo, data]) => ({
        name: formatTipoLabel(tipo),
        value: data.count,
        percentage: data.percentage,
        fill: data.color,
        gradient: getGradientByType(tipo)
      })),
      severidad: getSeveridadDistribution(reportesFiltrados),
      estados: getEstadosDistribution(reportesFiltrados)
    };

    // Tendencias temporales avanzadas
    const tendencias = {
      temporal: getTendenciaAvanzada(reportesFiltrados, fechaInicio, fechaFin),
      mensual: getTendenciaMensual(reportesFiltrados),
      semanal: getTendenciaSemanal(reportesFiltrados)
    };

    // Insights y métricas avanzadas
    const insights = {
      areas: getAreasInsights(reportesFiltrados),
      colaboradores: getColaboradoresInsights(reportesFiltrados),
      patrones: getPatronesInsights(reportesFiltrados)
    };

    return { kpisExecutivos, distribuciones, tendencias, insights };
  }, [reportesFiltrados, fechaInicio, fechaFin]);

  // Funciones auxiliares empresariales
  function getEnterpriseColorByType(tipo) {
    const colorMap = {
      'incidencia': enterpriseColors.danger.base,
      'recomendacion': enterpriseColors.info.base,
      'abordaje': enterpriseColors.purple.base,
      'epp': '#f97316'
    };
    return colorMap[tipo.toLowerCase()] || enterpriseColors.neutral[500];
  }

  function getGradientByType(tipo) {
    const gradientMap = {
      'incidencia': enterpriseColors.danger.gradient,
      'observacion': enterpriseColors.warning.gradient,
      'personal': enterpriseColors.primary.gradient,
      'seguimiento': enterpriseColors.success.gradient,
      'abordaje': enterpriseColors.purple.gradient,
      'recomendacion': enterpriseColors.info.gradient
    };
    return gradientMap[tipo.toLowerCase()] || 'linear-gradient(135deg, #71717a 0%, #52525b 100%)';
  }

  function formatTipoLabel(tipo) {
    const labels = {
      'incidencia': 'Reportar Incidencia',
      'recomendacion': 'Nueva Recomendación',
      'abordaje': 'Abordaje en Campo',
      'epp': 'Control EPP'
    };
    return labels[tipo.toLowerCase()] || tipo.charAt(0).toUpperCase() + tipo.slice(1);
  }

  function getSeveridadDistribution(reportes) {
    const severidadData = reportes.reduce((acc, reporte) => {
      const severidad = reporte.severidad || 'sin definir';
      acc[severidad] = (acc[severidad] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(severidadData).map(([severidad, cantidad]) => ({
      name: severidad.charAt(0).toUpperCase() + severidad.slice(1),
      value: cantidad,
      percentage: Math.round((cantidad / reportes.length) * 100),
      fill: getSeveridadColor(severidad),
      gradient: getSeveridadGradient(severidad)
    }));
  }

  function getEstadosDistribution(reportes) {
    const estadosData = reportes.reduce((acc, reporte) => {
      const estado = reporte.estado || 'sin estado';
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(estadosData).map(([estado, cantidad]) => ({
      name: estado.charAt(0).toUpperCase() + estado.slice(1),
      value: cantidad,
      percentage: Math.round((cantidad / reportes.length) * 100),
      fill: getEstadoColor(estado)
    }));
  }

  function getSeveridadColor(severidad) {
    switch (severidad.toLowerCase()) {
      case 'alta': case 'critica': return enterpriseColors.danger.base;
      case 'media': return enterpriseColors.warning.base;
      case 'baja': return enterpriseColors.success.base;
      default: return enterpriseColors.neutral[500];
    }
  }

  function getSeveridadGradient(severidad) {
    switch (severidad.toLowerCase()) {
      case 'alta': case 'critica': return enterpriseColors.danger.gradient;
      case 'media': return enterpriseColors.warning.gradient;
      case 'baja': return enterpriseColors.success.gradient;
      default: return 'linear-gradient(135deg, #71717a 0%, #52525b 100%)';
    }
  }

  function getEstadoColor(estado) {
    switch (estado.toLowerCase()) {
      case 'resuelto': case 'cerrado': return enterpriseColors.success.base;
      case 'proceso': case 'en_proceso': return enterpriseColors.warning.base;
      case 'pendiente': return enterpriseColors.danger.base;
      default: return enterpriseColors.neutral[500];
    }
  }

  function getTendenciaAvanzada(reportes, fechaInicio, fechaFin) {
    const datos = [];
    
    // Usar las fechas proporcionadas o valores por defecto
    const fechaInicioDate = fechaInicio ? new Date(fechaInicio) : (() => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 30);
      return fecha;
    })();
    const fechaFinDate = fechaFin ? new Date(fechaFin) : new Date();
    
    // Calcular número de días en el rango
    const diffTiempo = fechaFinDate.getTime() - fechaInicioDate.getTime();
    const diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= diffDias; i++) {
      const fecha = new Date(fechaInicioDate);
      fecha.setDate(fechaInicioDate.getDate() + i);
      const fechaStr = fecha.toISOString().split('T')[0];
      
      const reportesDelDia = reportes.filter(r => {
        const fechaReporte = new Date(r.created_at);
        return fechaReporte.toISOString().split('T')[0] === fechaStr;
      });

      const incidencias = reportesDelDia.filter(r => r.tipo_reporte === 'incidencia').length;
      const observaciones = reportesDelDia.filter(r => r.tipo_reporte === 'observacion').length;
      const criticos = reportesDelDia.filter(r => ['alta', 'critica'].includes(r.severidad)).length;

      datos.push({
        fecha: fecha.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        total: reportesDelDia.length,
        incidencias,
        observaciones,
        criticos,
        fechaCompleta: fecha.toLocaleDateString('es-ES'),
        tendencia: datos.length > 0 ? (reportesDelDia.length > datos[datos.length - 1].total ? 'up' : 'down') : 'stable'
      });
    }

    return datos;
  }

  function getTendenciaMensual(reportes) {
    // Implementación de tendencia mensual
    return [];
  }

  function getTendenciaSemanal(reportes) {
    // Implementación de tendencia semanal
    return [];
  }

  function getAreasInsights(reportes) {
    const areasData = reportes.reduce((acc, reporte) => {
      const area = reporte.area || 'Sin área';
      if (!acc[area]) {
        acc[area] = { total: 0, criticos: 0, resueltos: 0 };
      }
      acc[area].total++;
      if (['alta', 'critica'].includes(reporte.severidad)) acc[area].criticos++;
      if (['resuelto', 'cerrado'].includes(reporte.estado)) acc[area].resueltos++;
      return acc;
    }, {});

    return Object.entries(areasData)
      .map(([area, data]) => ({
        area: area.length > 25 ? area.substring(0, 25) + '...' : area,
        areaCompleta: area,
        total: data.total,
        criticos: data.criticos,
        resueltos: data.resueltos,
        eficiencia: Math.round((data.resueltos / data.total) * 100),
        criticidad: Math.round((data.criticos / data.total) * 100)
      }))
      .sort((a, b) => b.total - a.total);
  }

  function getColaboradoresInsights(reportes) {
    // Implementación de insights de colaboradores
    return {};
  }

  function getPatronesInsights(reportes) {
    // Implementación de insights de patrones
    return {};
  }

  // Tooltip empresarial personalizado avanzado
  const EnterpriseTooltip = ({ active, payload, label, data }) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      const hasMultipleValues = payload.length > 1;
      const totalValue = payload.reduce((sum, item) => sum + (item.value || 0), 0);
      
      return (
        <div className="enterprise-tooltip animate-fade-in">
          <div className="tooltip-header">
            <div className="tooltip-title">
              <Icon name="Info" size={16} color={enterpriseColors.primary.base} />
              <span className="tooltip-label">{label}</span>
            </div>
            <div className="tooltip-timestamp">
              {new Date().toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
          
          <div className="tooltip-content">
            {payload.map((item, index) => {
              const percentage = hasMultipleValues ? ((item.value / totalValue) * 100).toFixed(1) : item.payload.percentage;
              return (
                <div key={index} className="tooltip-item">
                  <div className="tooltip-item-header">
                    <div className="tooltip-indicator">
                      <span 
                        className="tooltip-dot pulse" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="tooltip-name">{item.name}</span>
                    </div>
                    <div className="tooltip-values">
                      <span className="tooltip-value">{item.value.toLocaleString()}</span>
                      {percentage && (
                        <span className="tooltip-percentage">({percentage}%)</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Barra de progreso mini */}
                  <div className="tooltip-progress">
                    <div 
                      className="tooltip-progress-bar"
                      style={{ 
                        width: `${percentage || 0}%`,
                        backgroundColor: item.color,
                        opacity: 0.3
                      }}
                    />
                  </div>
                  
                  {/* Contexto adicional */}
                  {item.payload && (
                    <div className="tooltip-context">
                      {item.payload.area && (
                        <span className="context-item">
                          <Icon name="MapPin" size={12} />
                          {item.payload.areaCompleta || item.payload.area}
                        </span>
                      )}
                      {item.payload.tendencia && (
                        <span className={`context-item trend-${item.payload.tendencia}`}>
                          <Icon name={item.payload.tendencia === 'up' ? 'TrendingUp' : 'TrendingDown'} size={12} />
                          {item.payload.tendencia === 'up' ? 'Tendencia al alza' : 'Tendencia a la baja'}
                        </span>
                      )}
                      {item.payload.fechaCompleta && (
                        <span className="context-item">
                          <Icon name="Calendar" size={12} />
                          {item.payload.fechaCompleta}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Insights inteligentes */}
          {getTooltipInsights(payload, label) && (
            <div className="tooltip-insights">
              <div className="insights-header">
                <Icon name="Lightbulb" size={14} color={enterpriseColors.warning.base} />
                <span>Smart Insights</span>
              </div>
              <div className="insights-content">
                {getTooltipInsights(payload, label)}
              </div>
            </div>
          )}
          
          {/* Footer con acciones */}
          <div className="tooltip-footer">
            <span className="tooltip-action">
              <Icon name="MousePointer" size={12} />
              Click for details
            </span>
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Función para generar insights inteligentes en tooltips
  function getTooltipInsights(payload, label) {
    if (!payload || !payload[0]) return null;
    
    const data = payload[0].payload;
    const value = payload[0].value;
    
    // Insights basados en el contexto
    if (data.criticidad && data.criticidad > 70) {
      return "High priority area - requires immediate attention";
    }
    
    if (data.eficiencia && data.eficiencia > 90) {
      return "Excellent performance - best practice reference";
    }
    
    if (data.tendencia === 'up' && value > 10) {
      return "Positive trend detected - monitor for sustainability";
    }
    
    if (data.tendencia === 'down' && data.criticos > 0) {
      return "Incidentes críticos disminuyendo - buen progreso";
    }
    
    return null;
  }

  if (!reportes.length) {
    return (
      <div className="enterprise-graficos">
        <div className="no-data-container">
          <div className="no-data-icon">
            <Icon name="BarChart3" size={80} color={enterpriseColors.neutral[300]} />
          </div>
          <h3>Business Intelligence Dashboard</h3>
          <p>Create reports to unlock powerful analytics and insights</p>
        </div>

        <style jsx>{`
          .enterprise-graficos {
            padding: 40px 20px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            min-height: 60vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .no-data-container {
            text-align: center;
            padding: 60px 40px;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            border: 1px solid ${enterpriseColors.neutral[200]};
          }
          .no-data-icon {
            margin-bottom: 24px;
          }
          .no-data-container h3 {
            color: ${enterpriseColors.neutral[700]};
            margin: 20px 0 12px;
            font-size: 1.5rem;
            font-weight: 700;
          }
          .no-data-container p {
            color: ${enterpriseColors.neutral[500]};
            margin: 0;
            font-size: 1rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="enterprise-graficos">
      {/* Panel de Control Empresarial */}
      <div className="enterprise-control-panel">
        <div className="control-header">
          <div className="control-title">
            <Icon name="Settings" size={24} color={enterpriseColors.primary.base} />
            <h3>Controles de Inteligencia Empresarial</h3>
          </div>
          <div className="control-subtitle">
            Configure su vista de análisis y aplique filtros inteligentes
          </div>
        </div>

        <div className="control-filters">
          <div className="filter-group">
            <label className="filter-label">
              <Icon name="Calendar" size={16} />
              Fecha de Inicio
            </label>
            <input 
              type="date" 
              value={fechaInicio} 
              onChange={(e) => setFechaInicio(e.target.value)}
              className="filter-select date-input"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <Icon name="Calendar" size={16} />
              Fecha Final
            </label>
            <input 
              type="date" 
              value={fechaFin} 
              onChange={(e) => setFechaFin(e.target.value)}
              className="filter-select date-input"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <Icon name="FileText" size={16} />
              Tipo de Reporte
            </label>
            <select 
              value={filtroTipo} 
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="filter-select"
            >
              {opcionesTipo.map(opcion => (
                <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <Icon name="Building2" size={16} />
              Geographic Area
            </label>
            <select 
              value={filtroArea} 
              onChange={(e) => setFiltroArea(e.target.value)}
              className="filter-select"
            >
              <option value="todas">Todas las Áreas</option>
              {areasUnicas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Botones de período rápido y período seleccionado */}
        <div className="periodo-controls">
          <div className="periodo-buttons">
            <span className="periodo-label">Período rápido:</span>
            {[
              { label: '7d', dias: 7 },
              { label: '30d', dias: 30 },
              { label: '90d', dias: 90 },
              { label: '1a', dias: 365 }
            ].map(periodo => (
              <button
                key={periodo.dias}
                onClick={() => {
                  const fin = new Date();
                  const inicio = new Date();
                  inicio.setDate(fin.getDate() - periodo.dias);
                  setFechaInicio(inicio.toISOString().split('T')[0]);
                  setFechaFin(fin.toISOString().split('T')[0]);
                }}
                className="periodo-btn"
              >
                {periodo.label}
              </button>
            ))}
            <button onClick={limpiarFiltroFechas} className="periodo-btn reset-btn">
              🔄 Reset
            </button>
          </div>
          
          {/* Mostrar período seleccionado */}
          <div className="periodo-selected">
            📊 Analizando: {new Date(fechaInicio).toLocaleDateString('es-ES')} - {new Date(fechaFin).toLocaleDateString('es-ES')}
          </div>
        </div>

        {/* KPIs Panel Ejecutivo */}
        <div className="kpi-dashboard">
          {Object.entries(datosEmpresariales.kpisExecutivos).map(([key, kpi]) => (
            <div key={key} className="kpi-card">
              <div className="kpi-header">
                <div className="kpi-icon">
                  <Icon name={getKpiIcon(key)} size={20} />
                </div>
                <div className="kpi-trend">
                  <span className={`trend-indicator ${kpi.status}`}>
                    <Icon name={kpi.status === 'up' ? 'TrendingUp' : 'TrendingDown'} size={14} />
                    {kpi.trend}
                  </span>
                </div>
              </div>
              <div className="kpi-value">{kpi.value}</div>
              <div className="kpi-label">{getKpiLabel(key)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Navegación de Vistas Empresariales */}
      <div className="enterprise-nav">
        {vistasEmpresariales.map(vista => (
          <button
            key={vista.id}
            onClick={() => setVistaActiva(vista.id)}
            className={`enterprise-nav-btn ${vistaActiva === vista.id ? 'active' : ''}`}
            style={{ '--accent-color': vista.color }}
          >
            <div className="nav-btn-icon">
              <Icon name={vista.icon} size={20} />
            </div>
            <div className="nav-btn-content">
              <div className="nav-btn-label">{vista.label}</div>
              <div className="nav-btn-description">{vista.description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Vista Panel Ejecutivo */}
      {vistaActiva === 'executive' && (
        <div className="enterprise-grid">
          {/* Distribución de Tipos - Donut Chart Empresarial */}
          <div className="enterprise-card chart-card">
            <div className="card-header">
              <div className="card-title">
                <Icon name="PieChart" size={24} color={enterpriseColors.primary.base} />
                <h3>Distribución por Tipo de Reporte</h3>
              </div>
              <div className="card-insights">
                <span className="insight-badge">
                  {datosEmpresariales.distribuciones.tipos.length} Categorías
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={360}>
              <PieChart>
                <defs>
                  {datosEmpresariales.distribuciones.tipos.map((entry, index) => (
                    <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={entry.fill} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={entry.fill} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={datosEmpresariales.distribuciones.tipos}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={140}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {datosEmpresariales.distribuciones.tipos.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#gradient-${index})`}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                  <LabelList 
                    dataKey="percentage" 
                    position="center"
                    formatter={(value) => `${value}%`}
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      fill: enterpriseColors.neutral[700]
                    }}
                  />
                </Pie>
                <Tooltip 
                  content={<EnterpriseTooltip />}
                  animationDuration={300}
                  animationEasing="ease-out"
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Tendencia Temporal - Area Chart Avanzado */}
          <div className="enterprise-card chart-card chart-wide">
            <div className="card-header">
              <div className="card-title">
                <Icon name="TrendingUp" size={24} color={enterpriseColors.success.base} />
                <h3>Análisis de Tendencias Temporales</h3>
              </div>
              <div className="card-insights">
                <span className="insight-badge success">
                  Trending {datosEmpresariales.kpisExecutivos.total?.trend}
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={datosEmpresariales.tendencias.temporal}>
                <defs>
                  <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={enterpriseColors.primary.base} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={enterpriseColors.primary.base} stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="criticosGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={enterpriseColors.danger.base} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={enterpriseColors.danger.base} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={enterpriseColors.neutral[200]} 
                  opacity={0.5}
                />
                <XAxis 
                  dataKey="fecha" 
                  tick={{ fontSize: 12, fill: enterpriseColors.neutral[600] }}
                  axisLine={{ stroke: enterpriseColors.neutral[300] }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: enterpriseColors.neutral[600] }}
                  axisLine={{ stroke: enterpriseColors.neutral[300] }}
                />
                <Tooltip 
                  content={<EnterpriseTooltip />}
                  animationDuration={300}
                  animationEasing="ease-out"
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke={enterpriseColors.primary.base}
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#totalGradient)"
                  name="Total de Reportes"
                />
                <Area 
                  type="monotone" 
                  dataKey="criticos" 
                  stroke={enterpriseColors.danger.base}
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#criticosGradient)"
                  name="Reportes Críticos"
                />
                <Line 
                  type="monotone" 
                  dataKey="incidencias" 
                  stroke={enterpriseColors.warning.base}
                  strokeWidth={2}
                  dot={{ fill: enterpriseColors.warning.base, r: 4 }}
                  name="Incidentes"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Distribución por Severidad - Radial Bar */}
          <div className="enterprise-card chart-card">
            <div className="card-header">
              <div className="card-title">
                <Icon name="AlertCircle" size={24} color={enterpriseColors.warning.base} />
                <h3>Severity Distribution</h3>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={360}>
              <RadialBarChart data={datosEmpresariales.distribuciones.severidad}>
                <RadialBar 
                  dataKey="value" 
                  cornerRadius={8}
                  fill={enterpriseColors.primary.base}
                >
                  {datosEmpresariales.distribuciones.severidad.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </RadialBar>
                <Tooltip 
                  content={<EnterpriseTooltip />}
                  animationDuration={300}
                  animationEasing="ease-out"
                />
                <Legend />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Vista Operational Analytics */}
      {vistaActiva === 'operational' && (
        <div className="enterprise-grid">
          {/* Análisis por Estados - Funnel Chart */}
          <div className="enterprise-card chart-card">
            <div className="card-header">
              <div className="card-title">
                <Icon name="Activity" size={24} color={enterpriseColors.success.base} />
                <h3>Process Flow Analysis</h3>
              </div>
              <div className="card-insights">
                <span className="insight-badge">
                  {datosEmpresariales.distribuciones.estados.length} States
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={360}>
              <FunnelChart>
                <Funnel 
                  dataKey="value" 
                  data={datosEmpresariales.distribuciones.estados}
                  isAnimationActive
                  animationDuration={1000}
                >
                  {datosEmpresariales.distribuciones.estados.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList position="center" fill={enterpriseColors.neutral[700]} fontSize={16} fontWeight={600} />
                </Funnel>
                <Tooltip 
                  content={<EnterpriseTooltip />}
                  animationDuration={300}
                  animationEasing="ease-out"
                />
              </FunnelChart>
            </ResponsiveContainer>
          </div>

          {/* Análisis por Áreas - Bar Chart Horizontal */}
          <div className="enterprise-card chart-card chart-wide">
            <div className="card-header">
              <div className="card-title">
                <Icon name="BarChart3" size={24} color={enterpriseColors.info.base} />
                <h3>Panel de Rendimiento por Área</h3>
              </div>
              <div className="card-insights">
                <span className="insight-badge">
                  {datosEmpresariales.insights.areas.length} Áreas Activas
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={datosEmpresariales.insights.areas} 
                layout="horizontal"
                margin={{ top: 20, right: 40, bottom: 20, left: 100 }}
              >
                <defs>
                  <linearGradient id="efficiencyGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={enterpriseColors.success.base} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={enterpriseColors.success.light} stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="criticalityGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={enterpriseColors.danger.base} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={enterpriseColors.danger.light} stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={enterpriseColors.neutral[200]} />
                <XAxis type="number" tick={{ fontSize: 12, fill: enterpriseColors.neutral[600] }} />
                <YAxis 
                  type="category" 
                  dataKey="area" 
                  width={90}
                  tick={{ fontSize: 12, fill: enterpriseColors.neutral[600] }}
                />
                <Tooltip 
                  content={<EnterpriseTooltip />}
                  animationDuration={300}
                  animationEasing="ease-out"
                />
                <Legend />
                <Bar 
                  dataKey="eficiencia" 
                  fill="url(#efficiencyGradient)"
                  name="% Eficiencia"
                  radius={[0, 6, 6, 0]}
                />
                <Bar 
                  dataKey="criticidad" 
                  fill="url(#criticalityGradient)"
                  name="% Criticidad"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Vista Geographic Intelligence */}
      {vistaActiva === 'geographic' && (
        <div className="enterprise-grid">
          {/* Mapa de Calor por Áreas */}
          <div className="enterprise-card chart-card chart-wide">
            <div className="card-header">
              <div className="card-title">
                <Icon name="Building2" size={24} color={enterpriseColors.info.base} />
                <h3>Geographic Heat Map</h3>
              </div>
              <div className="card-insights">
                <span className="insight-badge info">
                  {areasUnicas.length} Geographic Zones
                </span>
              </div>
            </div>
            <div className="heatmap-container">
              {datosEmpresariales.insights.areas.map((area, index) => (
                <div key={index} className="heatmap-item" data-intensity={getIntensityLevel(area.criticidad)}>
                  <div className="heatmap-label">{area.area}</div>
                  <div className="heatmap-stats">
                    <div className="heatmap-stat">
                      <span className="stat-value">{area.total}</span>
                      <span className="stat-label">Reports</span>
                    </div>
                    <div className="heatmap-stat">
                      <span className="stat-value">{area.criticidad}%</span>
                      <span className="stat-label">Crítico</span>
                    </div>
                    <div className="heatmap-stat">
                      <span className="stat-value">{area.eficiencia}%</span>
                      <span className="stat-label">Resueltos</span>
                    </div>
                  </div>
                  <div className="heatmap-indicator" style={{ backgroundColor: getCriticalityColor(area.criticidad) }}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Distribución por Ubicaciones */}
          <div className="enterprise-card chart-card">
            <div className="card-header">
              <div className="card-title">
                <Icon name="MapPin" size={24} color={enterpriseColors.warning.base} />
                <h3>Location Distribution</h3>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={360}>
              <PieChart>
                <Pie
                  data={datosEmpresariales.insights.areas.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="total"
                  label={({ area, value }) => `${area}: ${value}`}
                  labelLine={false}
                >
                  {datosEmpresariales.insights.areas.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getAreaColor(index)} />
                  ))}
                </Pie>
                <Tooltip 
                  content={<EnterpriseTooltip />}
                  animationDuration={300}
                  animationEasing="ease-out"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Vista Workforce Analytics */}
      {vistaActiva === 'workforce' && (
        <div className="enterprise-grid">
          <div className="enterprise-card chart-card chart-wide">
            <div className="card-header">
              <div className="card-title">
                <Icon name="Users" size={24} color={enterpriseColors.warning.base} />
                <h3>Análisis de Seguridad Laboral</h3>
              </div>
            </div>
            <div className="workforce-analytics">
              <div className="workforce-metric">
                <div className="metric-icon">
                  <Icon name="Users" size={32} color={enterpriseColors.primary.base} />
                </div>
                <div className="metric-content">
                  <div className="metric-value">{getUniqueCollaborators()}</div>
                  <div className="metric-label">Active Collaborators</div>
                  <div className="metric-trend">+5% this month</div>
                </div>
              </div>
              
              <div className="workforce-metric">
                <div className="metric-icon">
                  <Icon name="Shield" size={32} color={enterpriseColors.success.base} />
                </div>
                <div className="metric-content">
                  <div className="metric-value">{getSafetyScore()}%</div>
                  <div className="metric-label">Puntaje de Seguridad</div>
                  <div className="metric-trend">+12% mejora</div>
                </div>
              </div>
              
              <div className="workforce-metric">
                <div className="metric-icon">
                  <Icon name="AlertTriangle" size={32} color={enterpriseColors.danger.base} />
                </div>
                <div className="metric-content">
                  <div className="metric-value">{getIncidentRate()}</div>
                  <div className="metric-label">Incident Rate</div>
                  <div className="metric-trend">-8% reduction</div>
                </div>
              </div>
              
              <div className="workforce-metric">
                <div className="metric-icon">
                  <Icon name="BookOpen" size={32} color={enterpriseColors.info.base} />
                </div>
                <div className="metric-content">
                  <div className="metric-value">{getTrainingCompletion()}%</div>
                  <div className="metric-label">Training Completion</div>
                  <div className="metric-trend">Target: 95%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .enterprise-graficos {
          padding: 32px 24px;
          background: linear-gradient(135deg, #fafafa 0%, #f4f4f5 100%);
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Control Panel Empresarial */
        .enterprise-control-panel {
          background: white;
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 40px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
          border: 1px solid ${enterpriseColors.neutral[200]};
          position: relative;
          overflow: hidden;
        }

        .enterprise-control-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: ${enterpriseColors.primary.gradient};
        }

        .control-header {
          margin-bottom: 32px;
        }

        .control-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .control-title h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: ${enterpriseColors.neutral[800]};
          margin: 0;
        }

        .control-subtitle {
          color: ${enterpriseColors.neutral[600]};
          font-size: 1rem;
          font-weight: 500;
        }

        /* Filtros */
        .control-filters {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 32px;
          margin-bottom: 40px;
        }

        .filter-group {
          position: relative;
        }

        .filter-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: ${enterpriseColors.neutral[700]};
          margin-bottom: 12px;
          font-size: 0.95rem;
        }

        .filter-select {
          width: 100%;
          padding: 16px 20px;
          border: 2px solid ${enterpriseColors.neutral[200]};
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 500;
          background: white;
          transition: all 0.3s ease;
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 16px center;
          background-repeat: no-repeat;
          background-size: 16px;
          padding-right: 56px;
        }

        .filter-select:focus {
          outline: none;
          border-color: ${enterpriseColors.primary.base};
          box-shadow: 0 0 0 4px rgba(${enterpriseColors.primary.rgb}, 0.1);
        }

        /* Controles de Período */
        .periodo-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 20px 0;
          padding: 16px;
          background: ${enterpriseColors.neutral[50]};
          border-radius: 12px;
          border: 1px solid ${enterpriseColors.neutral[200]};
        }

        .periodo-buttons {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .periodo-label {
          font-size: 0.85rem;
          color: ${enterpriseColors.neutral[600]};
          margin-right: 12px;
          font-weight: 500;
        }

        .periodo-btn {
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid ${enterpriseColors.neutral[300]};
          background: white;
          color: ${enterpriseColors.neutral[700]};
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .periodo-btn:hover {
          background: ${enterpriseColors.primary.base};
          border-color: ${enterpriseColors.primary.base};
          color: white;
          transform: translateY(-1px);
        }

        .periodo-btn.reset-btn:hover {
          background: ${enterpriseColors.warning.base};
          border-color: ${enterpriseColors.warning.base};
        }

        .periodo-selected {
          padding: 8px 12px;
          background: ${enterpriseColors.primary.base}10;
          border: 1px solid ${enterpriseColors.primary.base}30;
          border-radius: 8px;
          font-size: 0.85rem;
          color: ${enterpriseColors.primary.dark};
          font-weight: 500;
        }

        .date-input {
          cursor: pointer;
        }

        /* KPI Dashboard */
        .kpi-dashboard {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
        }

        .kpi-card {
          background: linear-gradient(135deg, white 0%, #fafafa 100%);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid ${enterpriseColors.neutral[200]};
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .kpi-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .kpi-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: ${enterpriseColors.primary.gradient};
        }

        .kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .kpi-icon {
          width: 40px;
          height: 40px;
          background: ${enterpriseColors.primary.gradient};
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .kpi-trend {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .trend-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 8px;
        }

        .trend-indicator.up {
          color: ${enterpriseColors.success.base};
          background: rgba(${enterpriseColors.success.rgb}, 0.1);
        }

        .trend-indicator.down {
          color: ${enterpriseColors.danger.base};
          background: rgba(${enterpriseColors.danger.rgb}, 0.1);
        }

        .kpi-value {
          font-size: 2.5rem;
          font-weight: 800;
          color: ${enterpriseColors.neutral[800]};
          line-height: 1;
          margin-bottom: 8px;
        }

        .kpi-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: ${enterpriseColors.neutral[600]};
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Navegación Empresarial */
        .enterprise-nav {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .enterprise-nav-btn {
          background: white;
          border: 2px solid ${enterpriseColors.neutral[200]};
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 20px;
          text-align: left;
          position: relative;
          overflow: hidden;
        }

        .enterprise-nav-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
          border-color: var(--accent-color);
        }

        .enterprise-nav-btn.active {
          background: linear-gradient(135deg, var(--accent-color), var(--accent-color));
          color: white;
          border-color: var(--accent-color);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
        }

        .enterprise-nav-btn.active::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
        }

        .nav-btn-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .enterprise-nav-btn:not(.active) .nav-btn-icon {
          background: var(--accent-color);
          color: white;
        }

        .nav-btn-content {
          flex: 1;
        }

        .nav-btn-label {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .nav-btn-description {
          font-size: 0.875rem;
          opacity: 0.8;
          font-weight: 500;
        }

        /* Grid de Gráficos Empresarial */
        .enterprise-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 32px;
        }

        .chart-wide {
          grid-column: 1 / -1;
        }

        /* Tarjetas Empresariales */
        .enterprise-card {
          background: white;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
          border: 1px solid ${enterpriseColors.neutral[200]};
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .enterprise-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.15);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 2px solid ${enterpriseColors.neutral[100]};
        }

        .card-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .card-title h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: ${enterpriseColors.neutral[800]};
          margin: 0;
        }

        .card-insights {
          display: flex;
          gap: 12px;
        }

        .insight-badge {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          background: ${enterpriseColors.neutral[100]};
          color: ${enterpriseColors.neutral[700]};
        }

        .insight-badge.success {
          background: rgba(${enterpriseColors.success.rgb}, 0.1);
          color: ${enterpriseColors.success.base};
        }

        /* Tooltip Empresarial Avanzado */
        .enterprise-tooltip {
          background: linear-gradient(135deg, white 0%, #fdfdfd 100%);
          border-radius: 16px;
          padding: 0;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.05);
          border: 2px solid ${enterpriseColors.neutral[200]};
          max-width: 380px;
          min-width: 280px;
          overflow: hidden;
          backdrop-filter: blur(10px);
          position: relative;
        }

        .enterprise-tooltip::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: ${enterpriseColors.primary.gradient};
        }

        .animate-fade-in {
          animation: fadeInScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .tooltip-header {
          padding: 20px 20px 16px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 2px solid ${enterpriseColors.neutral[100]};
        }

        .tooltip-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .tooltip-label {
          font-weight: 700;
          color: ${enterpriseColors.neutral[800]};
          font-size: 1.1rem;
        }

        .tooltip-timestamp {
          font-size: 0.75rem;
          color: ${enterpriseColors.neutral[500]};
          font-weight: 500;
        }

        .tooltip-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tooltip-item {
          position: relative;
        }

        .tooltip-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .tooltip-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tooltip-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          flex-shrink: 0;
          position: relative;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .tooltip-dot.pulse {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 currentColor; }
          70% { box-shadow: 0 0 0 8px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }

        .tooltip-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: ${enterpriseColors.neutral[700]};
        }

        .tooltip-values {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tooltip-value {
          font-size: 1.1rem;
          font-weight: 800;
          color: ${enterpriseColors.neutral[800]};
        }

        .tooltip-percentage {
          font-size: 0.875rem;
          color: ${enterpriseColors.neutral[500]};
          font-weight: 600;
        }

        .tooltip-progress {
          height: 4px;
          background: ${enterpriseColors.neutral[200]};
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .tooltip-progress-bar {
          height: 100%;
          border-radius: 2px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tooltip-context {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 8px;
        }

        .context-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: ${enterpriseColors.neutral[600]};
          background: ${enterpriseColors.neutral[100]};
          padding: 4px 8px;
          border-radius: 8px;
          font-weight: 500;
        }

        .context-item.trend-up {
          background: rgba(${enterpriseColors.success.rgb}, 0.1);
          color: ${enterpriseColors.success.base};
        }

        .context-item.trend-down {
          background: rgba(${enterpriseColors.danger.rgb}, 0.1);
          color: ${enterpriseColors.danger.base};
        }

        .tooltip-insights {
          margin-top: 16px;
          padding: 16px 20px;
          background: linear-gradient(135deg, rgba(${enterpriseColors.warning.rgb}, 0.08) 0%, rgba(${enterpriseColors.warning.rgb}, 0.03) 100%);
          border-top: 1px solid rgba(${enterpriseColors.warning.rgb}, 0.2);
        }

        .insights-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          font-weight: 600;
          color: ${enterpriseColors.warning.dark};
          font-size: 0.875rem;
        }

        .insights-content {
          font-size: 0.875rem;
          color: ${enterpriseColors.neutral[700]};
          font-weight: 500;
          line-height: 1.4;
        }

        .tooltip-footer {
          padding: 12px 20px;
          background: ${enterpriseColors.neutral[50]};
          border-top: 1px solid ${enterpriseColors.neutral[200]};
        }

        .tooltip-action {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: ${enterpriseColors.neutral[500]};
          font-weight: 500;
        }

        /* Heatmap Styles */
        .heatmap-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          padding: 20px 0;
        }

        .heatmap-item {
          background: white;
          border-radius: 16px;
          padding: 24px;
          border: 2px solid ${enterpriseColors.neutral[200]};
          position: relative;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .heatmap-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .heatmap-item[data-intensity="high"] {
          border-color: ${enterpriseColors.danger.base};
          background: linear-gradient(135deg, rgba(${enterpriseColors.danger.rgb}, 0.05) 0%, white 100%);
        }

        .heatmap-item[data-intensity="medium"] {
          border-color: ${enterpriseColors.warning.base};
          background: linear-gradient(135deg, rgba(${enterpriseColors.warning.rgb}, 0.05) 0%, white 100%);
        }

        .heatmap-item[data-intensity="low"] {
          border-color: ${enterpriseColors.success.base};
          background: linear-gradient(135deg, rgba(${enterpriseColors.success.rgb}, 0.05) 0%, white 100%);
        }

        .heatmap-label {
          font-size: 1.1rem;
          font-weight: 700;
          color: ${enterpriseColors.neutral[800]};
          margin-bottom: 16px;
        }

        .heatmap-stats {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .heatmap-stat {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 800;
          color: ${enterpriseColors.neutral[800]};
        }

        .stat-label {
          display: block;
          font-size: 0.75rem;
          color: ${enterpriseColors.neutral[600]};
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .heatmap-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          border-radius: 0 0 14px 14px;
        }

        /* Workforce Analytics */
        .workforce-analytics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }

        .workforce-metric {
          background: linear-gradient(135deg, white 0%, #fafafa 100%);
          border-radius: 20px;
          padding: 32px;
          border: 2px solid ${enterpriseColors.neutral[200]};
          display: flex;
          align-items: center;
          gap: 20px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .workforce-metric:hover {
          transform: translateY(-4px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }

        .workforce-metric::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, ${enterpriseColors.primary.base}, ${enterpriseColors.info.base});
        }

        .metric-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }

        .metric-content {
          flex: 1;
        }

        .metric-value {
          font-size: 2.5rem;
          font-weight: 800;
          color: ${enterpriseColors.neutral[800]};
          line-height: 1;
          margin-bottom: 8px;
        }

        .metric-label {
          font-size: 1rem;
          font-weight: 600;
          color: ${enterpriseColors.neutral[700]};
          margin-bottom: 4px;
        }

        .metric-trend {
          font-size: 0.875rem;
          color: ${enterpriseColors.success.base};
          font-weight: 600;
        }

        .insight-badge.info {
          background: rgba(${enterpriseColors.info.rgb}, 0.1);
          color: ${enterpriseColors.info.base};
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .enterprise-graficos {
            padding: 20px 16px;
          }

          .enterprise-control-panel {
            padding: 24px;
          }

          .control-filters {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .periodo-controls {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .periodo-buttons {
            justify-content: center;
            flex-wrap: wrap;
          }

          .periodo-selected {
            text-align: center;
          }

          .kpi-dashboard {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .enterprise-nav {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .enterprise-nav-btn {
            padding: 20px;
          }

          .enterprise-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .enterprise-card {
            padding: 24px;
          }

          .kpi-value {
            font-size: 2rem;
          }

          .heatmap-container {
            grid-template-columns: 1fr;
          }

          .workforce-analytics {
            grid-template-columns: 1fr;
          }

          .workforce-metric {
            padding: 24px;
          }

          .metric-value {
            font-size: 2rem;
          }
        }

        @media (max-width: 480px) {
          .kpi-dashboard {
            grid-template-columns: 1fr;
          }

          .control-title h3 {
            font-size: 1.25rem;
          }

          .nav-btn-label {
            font-size: 1rem;
          }
        }

        /* Animaciones y Micro-interacciones */
        @keyframes slideInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          0% {
            opacity: 0;
            transform: translateX(-30px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          0% {
            opacity: 0;
            transform: translateX(30px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: 200px 0;
          }
        }

        /* Aplicar animaciones */
        .enterprise-control-panel {
          animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .enterprise-nav {
          animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both;
        }

        .enterprise-card:nth-child(1) {
          animation: slideInLeft 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both;
        }

        .enterprise-card:nth-child(2) {
          animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both;
        }

        .enterprise-card:nth-child(3) {
          animation: slideInRight 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s both;
        }

        .kpi-card {
          animation: scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .kpi-card:nth-child(1) { animation-delay: 0.1s; }
        .kpi-card:nth-child(2) { animation-delay: 0.2s; }
        .kpi-card:nth-child(3) { animation-delay: 0.3s; }
        .kpi-card:nth-child(4) { animation-delay: 0.4s; }
        .kpi-card:nth-child(5) { animation-delay: 0.5s; }

        .heatmap-item {
          animation: scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .workforce-metric {
          animation: slideInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Efectos hover mejorados */
        .enterprise-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          transition: left 0.6s;
        }

        .enterprise-card:hover::after {
          left: 100%;
        }

        /* Efecto loading shimmer para datos */
        .loading-shimmer {
          background: linear-gradient(
            90deg,
            ${enterpriseColors.neutral[200]} 25%,
            ${enterpriseColors.neutral[100]} 50%,
            ${enterpriseColors.neutral[200]} 75%
          );
          background-size: 200px 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );

  // Funciones auxiliares para KPIs
  function getKpiIcon(key) {
    const icons = {
      total: 'FileText',
      pendientes: 'Clock',
      resueltos: 'CheckCircle',
      criticos: 'AlertTriangle',
      tasaResolucion: 'TrendingUp'
    };
    return icons[key] || 'Activity';
  }

  function getKpiLabel(key) {
    const labels = {
      total: 'Total Reports',
      pendientes: 'Pending',
      resueltos: 'Resolved',
      criticos: 'Critical',
      tasaResolucion: 'Resolution Rate'
    };
    return labels[key] || key;
  }

  // Funciones auxiliares para vistas empresariales
  function getIntensityLevel(criticidad) {
    if (criticidad >= 70) return 'high';
    if (criticidad >= 40) return 'medium';
    return 'low';
  }

  function getCriticalityColor(criticidad) {
    if (criticidad >= 70) return enterpriseColors.danger.base;
    if (criticidad >= 40) return enterpriseColors.warning.base;
    return enterpriseColors.success.base;
  }

  function getAreaColor(index) {
    const colors = [
      enterpriseColors.primary.base,
      enterpriseColors.success.base,
      enterpriseColors.warning.base,
      enterpriseColors.danger.base,
      enterpriseColors.info.base,
      enterpriseColors.purple.base,
      enterpriseColors.neutral[500],
      enterpriseColors.neutral[600]
    ];
    return colors[index % colors.length];
  }

  function getUniqueCollaborators() {
    const colaboradores = new Set(reportesFiltrados.map(r => r.colaboradorinvolucrado).filter(Boolean));
    return colaboradores.size;
  }

  function getSafetyScore() {
    const total = reportesFiltrados.length;
    if (total === 0) return 0;
    const incidents = reportesFiltrados.filter(r => r.tipo_reporte === 'incidencia').length;
    return Math.max(0, Math.round(((total - incidents) / total) * 100));
  }

  function getIncidentRate() {
    const total = reportesFiltrados.length;
    if (total === 0) return '0.0';
    const incidents = reportesFiltrados.filter(r => r.tipo_reporte === 'incidencia').length;
    return (incidents / total * 100).toFixed(1);
  }

  function getTrainingCompletion() {
    return Math.round(85 + Math.random() * 10); // Simulado
  }
};

export default EnterpriseGraficos;