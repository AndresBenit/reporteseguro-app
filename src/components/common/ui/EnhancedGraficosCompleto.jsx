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
  RadialBar
} from 'recharts';
import { Icon } from '../Icons';

const EnhancedGraficosCompleto = ({ reportes = [] }) => {
  // Validar que reportes sea un array válido
  const reportesValidos = Array.isArray(reportes) ? reportes : [];
  
  // Estados para filtros
  const [filtroFecha, setFiltroFecha] = useState('30dias');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroArea, setFiltroArea] = useState('todas');
  const [vistaActiva, setVistaActiva] = useState('resumen');

  // Colores del sistema
  const colores = {
    primary: '#3b82f6',
    success: '#10b981', 
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    purple: '#8b5cf6',
    indigo: '#6366f1',
    pink: '#ec4899',
    slate: '#64748b',
    emerald: '#059669',
    orange: '#ea580c',
    teal: '#0d9488'
  };

  // Opciones de filtrado
  const opcionesFecha = [
    { value: '7dias', label: 'Últimos 7 días' },
    { value: '30dias', label: 'Últimos 30 días' },
    { value: '90dias', label: 'Últimos 3 meses' },
    { value: '6meses', label: 'Últimos 6 meses' },
    { value: '1año', label: 'Último año' },
    { value: 'todos', label: 'Todo el período' }
  ];

  const opcionesTipo = [
    { value: 'todos', label: 'Todos los tipos' },
    { value: 'incidencia', label: 'Incidencias' },
    { value: 'observacion', label: 'Observaciones' },
    { value: 'personal', label: 'Personal' },
    { value: 'seguimiento', label: 'Seguimientos' },
    { value: 'abordaje', label: 'Abordajes' },
    { value: 'recomendacion', label: 'Recomendaciones' }
  ];

  // Filtrar reportes según criterios
  const reportesFiltrados = useMemo(() => {
    let filtrados = [...reportes];

    // Filtro por fecha
    if (filtroFecha !== 'todos') {
      const ahora = new Date();
      const fechaLimite = new Date();

      switch (filtroFecha) {
        case '7dias':
          fechaLimite.setDate(ahora.getDate() - 7);
          break;
        case '30dias':
          fechaLimite.setDate(ahora.getDate() - 30);
          break;
        case '90dias':
          fechaLimite.setDate(ahora.getDate() - 90);
          break;
        case '6meses':
          fechaLimite.setMonth(ahora.getMonth() - 6);
          break;
        case '1año':
          fechaLimite.setFullYear(ahora.getFullYear() - 1);
          break;
      }

      filtrados = filtrados.filter(reporte => {
        const fechaReporte = new Date(reporte.created_at);
        return fechaReporte >= fechaLimite;
      });
    }

    // Filtro por tipo
    if (filtroTipo !== 'todos') {
      filtrados = filtrados.filter(reporte => reporte.tipo_reporte === filtroTipo);
    }

    // Filtro por área
    if (filtroArea !== 'todas') {
      filtrados = filtrados.filter(reporte => reporte.area === filtroArea);
    }

    return filtrados;
  }, [reportes, filtroFecha, filtroTipo, filtroArea]);

  // Obtener áreas únicas para filtro
  const areasUnicas = useMemo(() => {
    const areas = [...new Set(reportes.map(r => r.area).filter(Boolean))];
    return areas.sort();
  }, [reportes]);

  // Procesamiento de datos para gráficos
  const datosGraficos = useMemo(() => {
    if (!reportesFiltrados.length) {
      return {
        tiposReporte: [],
        severidadDistribucion: [],
        estadosReporte: [],
        tendenciaTemporal: [],
        reportesPorArea: [],
        reportesPorMes: [],
        colaboradoresTop: [],
        prioridadDistribucion: [],
        reportantesFrecuencia: [],
        resolucionTiempo: [],
        kpis: {
          total: 0,
          pendientes: 0,
          resueltos: 0,
          criticos: 0,
          promedioResolucion: 0
        }
      };
    }

    // 1. Tipos de Reporte
    const tiposData = reportesFiltrados.reduce((acc, reporte) => {
      const tipo = reporte.tipo_reporte || 'otros';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    const tiposReporte = Object.entries(tiposData).map(([tipo, cantidad]) => ({
      tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1),
      cantidad,
      fill: getColorByType(tipo)
    }));

    // 2. Severidad
    const severidadData = reportesFiltrados.reduce((acc, reporte) => {
      const severidad = reporte.severidad || 'sin definir';
      acc[severidad] = (acc[severidad] || 0) + 1;
      return acc;
    }, {});

    const severidadDistribucion = Object.entries(severidadData).map(([severidad, cantidad]) => ({
      severidad: severidad.charAt(0).toUpperCase() + severidad.slice(1),
      cantidad,
      fill: getColorBySeverity(severidad)
    }));

    // 3. Estados
    const estadosData = reportesFiltrados.reduce((acc, reporte) => {
      const estado = reporte.estado || 'sin estado';
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {});

    const estadosReporte = Object.entries(estadosData).map(([estado, cantidad]) => ({
      estado: estado.charAt(0).toUpperCase() + estado.slice(1),
      cantidad,
      fill: getColorByStatus(estado)
    }));

    // 4. Tendencia temporal (últimos días según filtro)
    const tendenciaTemporal = getTendenciaTemporal(reportesFiltrados, filtroFecha);

    // 5. Reportes por área
    const areasData = reportesFiltrados.reduce((acc, reporte) => {
      const area = reporte.area || 'Sin área';
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {});

    const reportesPorArea = Object.entries(areasData)
      .map(([area, cantidad]) => ({
        area: area.length > 20 ? area.substring(0, 20) + '...' : area,
        areaCompleta: area,
        cantidad,
        fill: colores.primary
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

    // 6. Reportes por mes
    const reportesPorMes = getReportesPorMes(reportesFiltrados);

    // 7. Colaboradores con más reportes
    const colaboradoresData = reportesFiltrados.reduce((acc, reporte) => {
      const colaborador = reporte.colaboradorinvolucrado || 'Sin especificar';
      if (colaborador !== 'Sin especificar') {
        acc[colaborador] = (acc[colaborador] || 0) + 1;
      }
      return acc;
    }, {});

    const colaboradoresTop = Object.entries(colaboradoresData)
      .map(([colaborador, cantidad]) => ({
        colaborador: colaborador.length > 15 ? colaborador.substring(0, 15) + '...' : colaborador,
        colaboradorCompleto: colaborador,
        cantidad
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);

    // 8. Distribución de prioridades
    const prioridadData = reportesFiltrados.reduce((acc, reporte) => {
      const prioridad = reporte.prioridad || 'normal';
      acc[prioridad] = (acc[prioridad] || 0) + 1;
      return acc;
    }, {});

    const prioridadDistribucion = Object.entries(prioridadData).map(([prioridad, cantidad]) => ({
      prioridad: prioridad.charAt(0).toUpperCase() + prioridad.slice(1),
      cantidad,
      fill: getColorByPriority(prioridad)
    }));

    // 9. Reportantes más frecuentes
    const reportantesData = reportesFiltrados.reduce((acc, reporte) => {
      const reportante = reporte.reportante || 'Anónimo';
      acc[reportante] = (acc[reportante] || 0) + 1;
      return acc;
    }, {});

    const reportantesFrecuencia = Object.entries(reportantesData)
      .map(([reportante, cantidad]) => ({
        reportante: reportante.length > 12 ? reportante.substring(0, 12) + '...' : reportante,
        reportanteCompleto: reportante,
        cantidad
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 8);

    // 10. KPIs generales
    const total = reportesFiltrados.length;
    const pendientes = reportesFiltrados.filter(r => r.estado === 'pendiente').length;
    const resueltos = reportesFiltrados.filter(r => ['resuelto', 'cerrado'].includes(r.estado)).length;
    const criticos = reportesFiltrados.filter(r => r.severidad === 'alta' || r.severidad === 'critica').length;

    const kpis = {
      total,
      pendientes,
      resueltos,
      criticos,
      tasaResolucion: total > 0 ? Math.round((resueltos / total) * 100) : 0,
      promedioResolucion: 2.5 // Simulado por ahora
    };

    return {
      tiposReporte,
      severidadDistribucion,
      estadosReporte,
      tendenciaTemporal,
      reportesPorArea,
      reportesPorMes,
      colaboradoresTop,
      prioridadDistribucion,
      reportantesFrecuencia,
      kpis
    };
  }, [reportesFiltrados, filtroFecha]);

  // Funciones auxiliares para colores
  function getColorByType(tipo) {
    const colors = {
      'incidencia': colores.danger,
      'observacion': colores.warning,
      'personal': colores.primary,
      'seguimiento': colores.success,
      'abordaje': colores.purple,
      'recomendacion': colores.info
    };
    return colors[tipo.toLowerCase()] || colores.slate;
  }

  function getColorBySeverity(severidad) {
    switch (severidad.toLowerCase()) {
      case 'alta': case 'critica': return colores.danger;
      case 'media': return colores.warning;
      case 'baja': return colores.success;
      default: return colores.slate;
    }
  }

  function getColorByStatus(estado) {
    switch (estado.toLowerCase()) {
      case 'resuelto': case 'cerrado': return colores.success;
      case 'proceso': case 'en_proceso': return colores.warning;
      case 'pendiente': return colores.danger;
      default: return colores.slate;
    }
  }

  function getColorByPriority(prioridad) {
    switch (prioridad.toLowerCase()) {
      case 'alta': return colores.danger;
      case 'normal': return colores.primary;
      case 'baja': return colores.success;
      default: return colores.slate;
    }
  }

  function getTendenciaTemporal(reportes, filtroFecha) {
    const datos = [];
    const ahora = new Date();
    let dias = 30;

    switch (filtroFecha) {
      case '7dias': dias = 7; break;
      case '30dias': dias = 30; break;
      case '90dias': dias = 90; break;
      case '6meses': dias = 180; break;
      case '1año': dias = 365; break;
      default: dias = 30;
    }

    for (let i = dias - 1; i >= 0; i--) {
      const fecha = new Date(ahora);
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = fecha.toISOString().split('T')[0];
      
      const reportesDelDia = reportesValidos.filter(r => {
        const fechaReporte = new Date(r.created_at);
        return fechaReporte.toISOString().split('T')[0] === fechaStr;
      }).length;

      datos.push({
        fecha: fecha.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        reportes: reportesDelDia,
        fechaCompleta: fecha.toLocaleDateString('es-ES')
      });
    }

    return datos;
  }

  function getReportesPorMes(reportes) {
    const meses = {};
    const ahora = new Date();

    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const mesStr = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
      meses[mesStr] = 0;
    }

    reportes.forEach(reporte => {
      const fecha = new Date(reporte.created_at);
      const mesStr = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
      if (meses.hasOwnProperty(mesStr)) {
        meses[mesStr]++;
      }
    });

    return Object.entries(meses).map(([mes, cantidad]) => ({
      mes,
      cantidad
    }));
  }

  if (!reportesValidos.length) {
    return (
      <div className="enhanced-graficos">
        <div className="no-data-container">
          <Icon name="BarChart3" size={80} color="#e5e7eb" />
          <h3>Sin datos para análisis</h3>
          <p>Crea algunos reportes para ver las visualizaciones</p>
        </div>

        <style jsx>{`
          .enhanced-graficos {
            padding: 40px;
          }
          .no-data-container {
            text-align: center;
            padding: 60px 20px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .no-data-container h3 {
            color: #4b5563;
            margin: 20px 0 8px;
          }
          .no-data-container p {
            color: #9ca3af;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="enhanced-graficos">
      {/* Panel de Filtros */}
      <div className="filtros-panel">
        <div className="filtros-row">
          <div className="filtro-group">
            <label>📅 Período</label>
            <select value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)}>
              {opcionesFecha.map(opcion => (
                <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
              ))}
            </select>
          </div>

          <div className="filtro-group">
            <label>📊 Tipo</label>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              {opcionesTipo.map(opcion => (
                <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
              ))}
            </select>
          </div>

          <div className="filtro-group">
            <label>🏢 Área</label>
            <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}>
              <option value="todas">Todas las áreas</option>
              {areasUnicas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-value">{datosGraficos.kpis.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-value" style={{color: colores.danger}}>{datosGraficos.kpis.pendientes}</span>
            <span className="stat-label">Pendientes</span>
          </div>
          <div className="stat-item">
            <span className="stat-value" style={{color: colores.success}}>{datosGraficos.kpis.resueltos}</span>
            <span className="stat-label">Resueltos</span>
          </div>
          <div className="stat-item">
            <span className="stat-value" style={{color: colores.warning}}>{datosGraficos.kpis.criticos}</span>
            <span className="stat-label">Críticos</span>
          </div>
          <div className="stat-item">
            <span className="stat-value" style={{color: colores.info}}>{datosGraficos.kpis.tasaResolucion}%</span>
            <span className="stat-label">Eficacia</span>
          </div>
        </div>
      </div>

      {/* Navegación de vistas */}
      <div className="vistas-nav">
        {[
          { id: 'resumen', label: 'Resumen', icon: 'Analytics' },
          { id: 'tendencias', label: 'Tendencias', icon: 'TrendingUp' },
          { id: 'areas', label: 'Por Áreas', icon: 'Building2' },
          { id: 'personal', label: 'Personal', icon: 'Users' }
        ].map(vista => (
          <button
            key={vista.id}
            onClick={() => setVistaActiva(vista.id)}
            className={`vista-btn ${vistaActiva === vista.id ? 'active' : ''}`}
          >
            <Icon name={vista.icon} size={18} />
            {vista.label}
          </button>
        ))}
      </div>

      {/* Vista Resumen */}
      {vistaActiva === 'resumen' && (
        <div className="graficos-grid">
          {/* Tipos de Reporte */}
          <div className="grafico-card">
            <div className="grafico-header">
              <h3><Icon name="FileText" size={20} />Tipos de Reporte</h3>
              <span className="count">{datosGraficos.tiposReporte.length} tipos</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={datosGraficos.tiposReporte}
                  dataKey="cantidad"
                  nameKey="tipo"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ tipo, percent }) => `${tipo}: ${(percent * 100).toFixed(0)}%`}
                >
                  {datosGraficos.tiposReporte.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Severidad */}
          <div className="grafico-card">
            <div className="grafico-header">
              <h3><Icon name="AlertCircle" size={20} />Distribución por Severidad</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosGraficos.severidadDistribucion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="severidad" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                  {datosGraficos.severidadDistribucion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Estados */}
          <div className="grafico-card">
            <div className="grafico-header">
              <h3><Icon name="Activity" size={20} />Estados de Reportes</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={datosGraficos.estadosReporte}
                  dataKey="cantidad"
                  nameKey="estado"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  label={({ estado, percent }) => `${estado}: ${(percent * 100).toFixed(0)}%`}
                >
                  {datosGraficos.estadosReporte.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Prioridades */}
          <div className="grafico-card">
            <div className="grafico-header">
              <h3><Icon name="Flag" size={20} />Distribución por Prioridad</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart data={datosGraficos.prioridadDistribucion}>
                <RadialBar dataKey="cantidad" cornerRadius={10} fill="#8884d8">
                  {datosGraficos.prioridadDistribucion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </RadialBar>
                <Tooltip />
                <Legend />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Vista Tendencias */}
      {vistaActiva === 'tendencias' && (
        <div className="graficos-grid">
          {/* Tendencia temporal */}
          <div className="grafico-card grafico-wide">
            <div className="grafico-header">
              <h3><Icon name="TrendingUp" size={20} />Tendencia Temporal</h3>
              <span className="count">Últimos {filtroFecha}</span>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={datosGraficos.tendenciaTemporal}>
                <defs>
                  <linearGradient id="colorReportes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colores.primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={colores.primary} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip 
                  labelFormatter={(label) => {
                    const item = datosGraficos.tendenciaTemporal.find(d => d.fecha === label);
                    return item ? item.fechaCompleta : label;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="reportes" 
                  stroke={colores.primary} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorReportes)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Reportes por mes */}
          <div className="grafico-card">
            <div className="grafico-header">
              <h3><Icon name="Calendar" size={20} />Reportes por Mes</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosGraficos.reportesPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill={colores.info} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Vista Por Áreas */}
      {vistaActiva === 'areas' && (
        <div className="graficos-grid">
          {/* Reportes por área */}
          <div className="grafico-card grafico-wide">
            <div className="grafico-header">
              <h3><Icon name="Building2" size={20} />Reportes por Área</h3>
              <span className="count">{datosGraficos.reportesPorArea.length} áreas</span>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={datosGraficos.reportesPorArea} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="area" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={11}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name, props) => [
                    value,
                    'Reportes',
                    props.payload.areaCompleta
                  ]}
                />
                <Bar dataKey="cantidad" fill={colores.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Vista Personal */}
      {vistaActiva === 'personal' && (
        <div className="graficos-grid">
          {/* Top colaboradores */}
          <div className="grafico-card">
            <div className="grafico-header">
              <h3><Icon name="Users" size={20} />Colaboradores Más Reportados</h3>
              <span className="count">Top {datosGraficos.colaboradoresTop.length}</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosGraficos.colaboradoresTop} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="colaborador" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={10}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name, props) => [
                    value,
                    'Reportes',
                    props.payload.colaboradorCompleto
                  ]}
                />
                <Bar dataKey="cantidad" fill={colores.warning} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top reportantes */}
          <div className="grafico-card">
            <div className="grafico-header">
              <h3><Icon name="User" size={20} />Reportantes Más Activos</h3>
              <span className="count">Top {datosGraficos.reportantesFrecuencia.length}</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosGraficos.reportantesFrecuencia} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="reportante" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={10}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name, props) => [
                    value,
                    'Reportes',
                    props.payload.reportanteCompleto
                  ]}
                />
                <Bar dataKey="cantidad" fill={colores.success} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <style jsx>{`
        .enhanced-graficos {
          padding: 20px 0;
        }

        .filtros-panel {
          background: white;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 32px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .filtros-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .filtro-group label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          font-size: 0.9rem;
        }

        .filtro-group select {
          width: 100%;
          padding: 10px 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 0.9rem;
          background: white;
          transition: border-color 0.3s ease;
        }

        .filtro-group select:focus {
          outline: none;
          border-color: ${colores.primary};
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .stats-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 20px;
          padding: 20px 0;
          border-top: 1px solid #f1f5f9;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 2rem;
          font-weight: 800;
          color: ${colores.primary};
          line-height: 1;
        }

        .stat-label {
          display: block;
          font-size: 0.8rem;
          color: #6b7280;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }

        .vistas-nav {
          display: flex;
          gap: 4px;
          background: white;
          padding: 8px;
          border-radius: 12px;
          margin-bottom: 32px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .vista-btn {
          flex: 1;
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: #6b7280;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 0.9rem;
        }

        .vista-btn:hover {
          background: #f8fafc;
          color: #374151;
        }

        .vista-btn.active {
          background: ${colores.primary};
          color: white;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        .graficos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
        }

        .grafico-wide {
          grid-column: 1 / -1;
        }

        .grafico-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .grafico-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .grafico-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f1f5f9;
        }

        .grafico-header h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .count {
          font-size: 0.85rem;
          color: #6b7280;
          background: #f8fafc;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .graficos-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .filtros-row {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .stats-summary {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .vistas-nav {
            flex-direction: column;
          }

          .vista-btn {
            justify-content: flex-start;
          }

          .enhanced-graficos {
            padding: 16px 0;
          }

          .grafico-card {
            padding: 20px;
          }
        }

        @media (max-width: 480px) {
          .stats-summary {
            grid-template-columns: 1fr;
          }

          .stat-value {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedGraficosCompleto;