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
  ComposedChart
} from 'recharts';
import { Icon } from '../Icons';

const GraficosEspañol = ({ reportes = [] }) => {
  const [seccionActiva, setSeccionActiva] = useState('resumen');
  const [periodoTiempo, setPeriodoTiempo] = useState('6meses');

  // 🎨 PALETA DE COLORES PROFESIONAL
  const colores = {
    primario: '#2563eb',      // Azul principal
    exito: '#059669',         // Verde éxito
    advertencia: '#d97706',   // Amarillo advertencia  
    peligro: '#dc2626',       // Rojo peligro
    info: '#0891b2',          // Cian información
    morado: '#7c3aed',        // Morado
    rosa: '#e11d48',          // Rosa
    gris: '#64748b',          // Gris neutro
    // Estados específicos
    pendiente: '#3b82f6',
    proceso: '#f59e0b', 
    resuelto: '#10b981',
    critico: '#dc2626'
  };

  // 🇪🇸 MAPEO DE ESTADOS Y SEVERIDADES EN ESPAÑOL
  const mapaEstados = {
    'pendiente': 'Pendiente',
    'proceso': 'En Proceso',
    'en_proceso': 'En Proceso', 
    'asignado': 'Asignado',
    'resuelto': 'Resuelto',
    'cerrado': 'Cerrado',
    'cancelado': 'Cancelado'
  };

  const mapaSeveridades = {
    'baja': 'Baja',
    'media': 'Media',
    'alta': 'Alta', 
    'critica': 'Crítica',
    'crítica': 'Crítica'
  };

  // 📊 PROCESAMIENTO DE DATOS MEJORADO
  const datosGraficos = useMemo(() => {
    const reportesValidos = Array.isArray(reportes) ? reportes : [];
    
    console.log('🇪🇸 Procesando datos:', reportesValidos.length, 'reportes');
    
    if (!reportesValidos.length) {
      return {
        tendencia: [],
        estados: [],
        severidades: [],
        areas: [],
        mensual: [],
        estadisticas: { total: 0, resueltos: 0, criticos: 0, tasaResolucion: 0 }
      };
    }

    // 📈 DATOS TEMPORALES - Configurables por período
    const mesesMostrar = periodoTiempo === '3meses' ? 3 : 
                        periodoTiempo === '6meses' ? 6 : 
                        periodoTiempo === '12meses' ? 12 : 6;
    
    const datosMensuales = {};
    const ahora = new Date();
    
    // Inicializar meses
    for (let i = mesesMostrar - 1; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      const mesNombre = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
      
      datosMensuales[mesKey] = {
        mes: mesNombre,
        total: 0,
        pendientes: 0,
        proceso: 0,
        resueltos: 0,
        criticos: 0,
        nuevos: 0,
        promedio: 0
      };
    }
    
    // Procesar reportes por fecha
    reportesValidos.forEach(reporte => {
      let fechaReporte;
      
      // Manejar diferentes formatos de fecha
      if (reporte.created_at) {
        fechaReporte = new Date(reporte.created_at);
      } else if (reporte.fecha) {
        fechaReporte = reporte.fecha instanceof Date ? reporte.fecha : new Date(reporte.fecha);
      } else {
        return; // Skip si no hay fecha
      }
      
      const mesKey = `${fechaReporte.getFullYear()}-${String(fechaReporte.getMonth() + 1).padStart(2, '0')}`;
      
      if (datosMensuales[mesKey]) {
        datosMensuales[mesKey].total++;
        datosMensuales[mesKey].nuevos++;
        
        // Categorizar por estado
        const estado = (reporte.estado || 'pendiente').toLowerCase();
        if (estado === 'pendiente') datosMensuales[mesKey].pendientes++;
        else if (['proceso', 'en_proceso', 'asignado'].includes(estado)) datosMensuales[mesKey].proceso++;
        else if (['resuelto', 'cerrado'].includes(estado)) datosMensuales[mesKey].resueltos++;
        
        // Contar críticos
        const severidad = (reporte.severidad || '').toLowerCase();
        if (severidad === 'critica' || severidad === 'crítica') {
          datosMensuales[mesKey].criticos++;
        }
      }
    });

    // Calcular promedios mensuales
    const valoresMensuales = Object.values(datosMensuales);
    valoresMensuales.forEach(mes => {
      mes.promedio = mes.total > 0 ? Math.round(mes.total / 30) : 0; // Promedio diario aproximado
    });

    // 📊 DISTRIBUCIÓN POR ESTADOS
    const conteoEstados = {};
    reportesValidos.forEach(reporte => {
      const estado = (reporte.estado || 'pendiente').toLowerCase();
      const estadoEspañol = mapaEstados[estado] || 'Pendiente';
      conteoEstados[estadoEspañol] = (conteoEstados[estadoEspañol] || 0) + 1;
    });

    const datosEstados = Object.entries(conteoEstados).map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
      porcentaje: Math.round((cantidad / reportesValidos.length) * 100),
      color: nombre === 'Pendiente' ? colores.pendiente :
             nombre === 'En Proceso' || nombre === 'Asignado' ? colores.proceso :
             nombre === 'Resuelto' || nombre === 'Cerrado' ? colores.resuelto :
             colores.gris
    }));

    // 🎯 DISTRIBUCIÓN POR SEVERIDADES  
    const conteoSeveridades = {};
    reportesValidos.forEach(reporte => {
      const severidad = (reporte.severidad || 'media').toLowerCase();
      const severidadEspañol = mapaSeveridades[severidad] || 'Media';
      conteoSeveridades[severidadEspañol] = (conteoSeveridades[severidadEspañol] || 0) + 1;
    });

    const datosSeveridades = Object.entries(conteoSeveridades).map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
      porcentaje: Math.round((cantidad / reportesValidos.length) * 100),
      color: nombre === 'Crítica' ? colores.critico :
             nombre === 'Alta' ? colores.peligro :
             nombre === 'Media' ? colores.advertencia :
             nombre === 'Baja' ? colores.exito :
             colores.gris
    }));

    // 🏢 DISTRIBUCIÓN POR ÁREAS
    const conteoAreas = {};
    reportesValidos.forEach(reporte => {
      const area = reporte.area || 
                   reporte.lugarLabor || 
                   reporte.ubicacion ||
                   reporte.departamento ||
                   'Área no especificada';
      
      if (!conteoAreas[area]) {
        conteoAreas[area] = { 
          area, 
          total: 0, 
          resueltos: 0, 
          pendientes: 0, 
          criticos: 0 
        };
      }
      
      conteoAreas[area].total++;
      
      const estado = (reporte.estado || '').toLowerCase();
      if (['resuelto', 'cerrado'].includes(estado)) {
        conteoAreas[area].resueltos++;
      } else {
        conteoAreas[area].pendientes++;
      }
      
      const severidad = (reporte.severidad || '').toLowerCase();
      if (severidad === 'critica' || severidad === 'crítica') {
        conteoAreas[area].criticos++;
      }
    });

    const datosAreas = Object.values(conteoAreas)
      .map(area => ({
        ...area,
        eficiencia: area.total > 0 ? Math.round((area.resueltos / area.total) * 100) : 0,
        // Truncar nombres largos para visualización
        nombreCorto: area.area.length > 20 ? area.area.substring(0, 20) + '...' : area.area
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // Top 8 áreas

    // 📈 ESTADÍSTICAS GENERALES
    const resueltos = reportesValidos.filter(r => 
      ['resuelto', 'cerrado'].includes((r.estado || '').toLowerCase())
    ).length;
    
    const criticos = reportesValidos.filter(r => 
      ((r.severidad || '').toLowerCase() === 'critica') || 
      ((r.severidad || '').toLowerCase() === 'crítica')
    ).length;
    
    const estadisticas = {
      total: reportesValidos.length,
      resueltos,
      criticos,
      tasaResolucion: reportesValidos.length > 0 ? Math.round((resueltos / reportesValidos.length) * 100) : 0
    };

    return {
      tendencia: valoresMensuales,
      estados: datosEstados,
      severidades: datosSeveridades,
      areas: datosAreas,
      mensual: valoresMensuales,
      estadisticas
    };
  }, [reportes, periodoTiempo]);

  // 🎨 TOOLTIP PERSONALIZADO
  const TooltipPersonalizado = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          fontSize: '14px',
          minWidth: '150px'
        }}>
          <p style={{ 
            color: '#1f2937', 
            fontWeight: '600', 
            marginBottom: '8px',
            borderBottom: '1px solid #f3f4f6',
            paddingBottom: '4px'
          }}>
            📅 {label}
          </p>
          {payload.map((entrada, index) => (
            <div key={index} style={{ 
              color: entrada.color, 
              margin: '4px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '12px',
                height: '12px', 
                backgroundColor: entrada.color,
                borderRadius: '2px'
              }} />
              <span style={{ fontWeight: '500' }}>{entrada.name}:</span>
              <strong>{entrada.value}</strong>
              {entrada.unit && <span style={{ fontSize: '12px', opacity: 0.7 }}>{entrada.unit}</span>}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // 📱 PESTAÑAS DE NAVEGACIÓN
  const pestañas = [
    { id: 'resumen', nombre: '📊 Resumen General', icono: 'BarChart3' },
    { id: 'tendencias', nombre: '📈 Tendencias', icono: 'TrendingUp' },
    { id: 'distribucion', nombre: '🎯 Distribución', icono: 'PieChart' },
    { id: 'areas', nombre: '🏢 Por Áreas', icono: 'Building2' },
    { id: 'detalle', nombre: '🔍 Análisis Detallado', icono: 'Analytics' }
  ];

  // ⏱️ FILTROS DE TIEMPO  
  const filtrosTiempo = [
    { valor: '3meses', etiqueta: 'Últimos 3 meses' },
    { valor: '6meses', etiqueta: 'Últimos 6 meses' },
    { valor: '12meses', etiqueta: 'Último año' }
  ];

  // 🚫 COMPONENTE SIN DATOS
  const SinDatos = ({ mensaje = "No hay reportes para mostrar" }) => (
    <div style={{
      textAlign: 'center',
      padding: '80px 40px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      borderRadius: '20px',
      border: '2px dashed #cbd5e1',
      margin: '20px 0'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.4 }}>📊</div>
      <h3 style={{ 
        color: '#475569', 
        marginBottom: '12px', 
        fontSize: '1.25rem',
        fontWeight: '600'
      }}>
        {mensaje}
      </h3>
      <p style={{ 
        color: '#64748b', 
        fontSize: '0.95rem',
        lineHeight: '1.6'
      }}>
        Los gráficos y análisis aparecerán aquí una vez que se registren reportes de incidentes
      </p>
    </div>
  );

  if (!datosGraficos.estadisticas.total) {
    return <SinDatos mensaje="No hay reportes de seguridad registrados" />;
  }

  return (
    <div style={{ 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: '#f8fafc',
      minHeight: '100vh',
      padding: '24px'
    }}>
      {/* 🎛️ CONTROLES SUPERIORES */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {/* Pestañas principales */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {pestañas.map(pestaña => (
              <button
                key={pestaña.id}
                onClick={() => setSeccionActiva(pestaña.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  border: `2px solid ${seccionActiva === pestaña.id ? colores.primario : '#e2e8f0'}`,
                  background: seccionActiva === pestaña.id ? colores.primario : 'white',
                  color: seccionActiva === pestaña.id ? 'white' : '#64748b',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s ease-in-out',
                  transform: seccionActiva === pestaña.id ? 'translateY(-1px)' : 'none',
                  boxShadow: seccionActiva === pestaña.id ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (seccionActiva !== pestaña.id) {
                    e.target.style.borderColor = colores.primario;
                    e.target.style.color = colores.primario;
                  }
                }}
                onMouseLeave={(e) => {
                  if (seccionActiva !== pestaña.id) {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.color = '#64748b';
                  }
                }}
              >
                {pestaña.nombre}
              </button>
            ))}
          </div>

          {/* Selector de período */}
          <select
            value={periodoTiempo}
            onChange={(e) => setPeriodoTiempo(e.target.value)}
            style={{
              padding: '10px 14px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              background: 'white',
              color: '#374151',
              fontWeight: '500',
              fontSize: '14px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {filtrosTiempo.map(filtro => (
              <option key={filtro.valor} value={filtro.valor}>
                {filtro.etiqueta}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 📊 SECCIÓN RESUMEN GENERAL */}
      {seccionActiva === 'resumen' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* KPIs principales */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '20px' 
          }}>
            {[
              {
                titulo: 'Total de Reportes',
                valor: datosGraficos.estadisticas.total,
                icono: '📊',
                color: colores.primario,
                descripcion: 'Reportes registrados'
              },
              {
                titulo: 'Tasa de Resolución', 
                valor: `${datosGraficos.estadisticas.tasaResolucion}%`,
                icono: '✅',
                color: colores.exito,
                descripcion: 'Casos resueltos'
              },
              {
                titulo: 'Reportes Críticos',
                valor: datosGraficos.estadisticas.criticos,
                icono: '🚨', 
                color: colores.critico,
                descripcion: 'Requieren atención urgente'
              },
              {
                titulo: 'Área Más Activa',
                valor: datosGraficos.areas[0]?.area || 'N/A',
                icono: '🏢',
                color: colores.info,
                descripcion: 'Mayor cantidad de reportes'
              }
            ].map((kpi, index) => (
              <div key={index} style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                border: `2px solid ${kpi.color}20`,
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '80px',
                  height: '80px',
                  background: `${kpi.color}10`,
                  borderRadius: '0 0 0 80px'
                }} />
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <div>
                    <h3 style={{ 
                      color: '#1e293b', 
                      fontSize: '16px', 
                      fontWeight: '600',
                      marginBottom: '4px'
                    }}>
                      {kpi.titulo}
                    </h3>
                    <p style={{ 
                      color: '#64748b', 
                      fontSize: '13px',
                      margin: 0
                    }}>
                      {kpi.descripcion}
                    </p>
                  </div>
                  <span style={{ fontSize: '24px' }}>{kpi.icono}</span>
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: kpi.color,
                  marginTop: '8px'
                }}>
                  {kpi.valor}
                </div>
              </div>
            ))}
          </div>

          {/* Gráfico de resumen combinado */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '24px'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ 
                color: '#1e293b', 
                marginBottom: '20px',
                fontSize: '18px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📈 Evolución Mensual de Reportes
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={datosGraficos.tendencia}>
                  <defs>
                    <linearGradient id="gradienteTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colores.primario} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={colores.primario} stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="mes" 
                    stroke="#64748b"
                    fontSize={12}
                    fontWeight="500"
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                  />
                  <Tooltip content={<TooltipPersonalizado />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke={colores.primario}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#gradienteTotal)"
                    name="Total Reportes"
                  />
                  <Bar
                    dataKey="criticos"
                    fill={colores.critico}
                    name="Críticos"
                    opacity={0.8}
                  />
                  <Line
                    type="monotone"
                    dataKey="resueltos"
                    stroke={colores.exito}
                    strokeWidth={3}
                    name="Resueltos"
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ 
                color: '#1e293b', 
                marginBottom: '20px',
                fontSize: '18px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🎯 Distribución por Estado
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={datosGraficos.estados}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={40}
                    dataKey="cantidad"
                    labelLine={false}
                    label={({ nombre, porcentaje }) => porcentaje > 5 ? `${porcentaje}%` : ''}
                  >
                    {datosGraficos.estados.map((entrada, index) => (
                      <Cell key={`celda-${index}`} fill={entrada.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipPersonalizado />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 🎯 SECCIÓN DISTRIBUCIÓN */}
      {seccionActiva === 'distribucion' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ 
              color: '#1e293b', 
              marginBottom: '20px',
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📊 Estados de Reportes
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={datosGraficos.estados}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  dataKey="cantidad"
                  labelLine={false}
                  label={({ nombre, porcentaje }) => `${nombre}: ${porcentaje}%`}
                >
                  {datosGraficos.estados.map((entrada, index) => (
                    <Cell key={`celda-${index}`} fill={entrada.color} />
                  ))}
                </Pie>
                <Tooltip content={<TooltipPersonalizado />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ 
              color: '#1e293b', 
              marginBottom: '20px',
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🎯 Niveles de Severidad
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={datosGraficos.severidades} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis 
                  type="category" 
                  dataKey="nombre" 
                  stroke="#64748b" 
                  fontSize={12}
                  width={80}
                />
                <Tooltip content={<TooltipPersonalizado />} />
                <Bar 
                  dataKey="cantidad" 
                  radius={[0, 8, 8, 0]}
                  fill={(entry) => entry.color}
                >
                  {datosGraficos.severidades.map((entrada, index) => (
                    <Cell key={`celda-${index}`} fill={entrada.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 🏢 SECCIÓN POR ÁREAS */}
      {seccionActiva === 'areas' && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ 
            color: '#1e293b', 
            marginBottom: '24px',
            fontSize: '24px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            🏢 Análisis por Áreas de Trabajo
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <div>
              <h4 style={{ color: '#475569', marginBottom: '16px', fontSize: '16px' }}>
                📊 Reportes por Área
              </h4>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={datosGraficos.areas} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#64748b" fontSize={12} />
                  <YAxis 
                    type="category" 
                    dataKey="nombreCorto" 
                    stroke="#64748b" 
                    fontSize={11}
                    width={120}
                  />
                  <Tooltip content={<TooltipPersonalizado />} />
                  <Legend />
                  <Bar dataKey="total" fill={colores.primario} name="Total" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="criticos" fill={colores.critico} name="Críticos" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="resueltos" fill={colores.exito} name="Resueltos" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h4 style={{ color: '#475569', marginBottom: '16px', fontSize: '16px' }}>
                ⚡ Eficiencia por Área
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {datosGraficos.areas.slice(0, 6).map((area, index) => (
                  <div key={index} style={{
                    background: '#f8fafc',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{ 
                        fontWeight: '600', 
                        color: '#1e293b',
                        fontSize: '14px'
                      }}>
                        {area.nombreCorto}
                      </span>
                      <span style={{ 
                        fontWeight: '700', 
                        color: area.eficiencia >= 70 ? colores.exito : 
                               area.eficiencia >= 50 ? colores.advertencia : colores.peligro
                      }}>
                        {area.eficiencia}%
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '6px',
                      background: '#e2e8f0',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${area.eficiencia}%`,
                        height: '100%',
                        background: area.eficiencia >= 70 ? colores.exito : 
                                   area.eficiencia >= 50 ? colores.advertencia : colores.peligro,
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 SECCIÓN ANÁLISIS DETALLADO */}
      {seccionActiva === 'detalle' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ 
              color: '#1e293b', 
              marginBottom: '24px',
              fontSize: '24px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              🔍 Análisis Estadístico Detallado
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '32px' }}>
              <div>
                <h4 style={{ color: '#475569', marginBottom: '16px' }}>📈 Métricas Clave</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { etiqueta: 'Total de Reportes', valor: datosGraficos.estadisticas.total },
                    { etiqueta: 'Tasa de Resolución', valor: `${datosGraficos.estadisticas.tasaResolucion}%` },
                    { etiqueta: 'Reportes Críticos', valor: datosGraficos.estadisticas.criticos },
                    { etiqueta: 'Áreas Monitoreadas', valor: datosGraficos.areas.length }
                  ].map((metrica, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '12px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <span style={{ color: '#475569', fontWeight: '500' }}>{metrica.etiqueta}</span>
                      <span style={{ color: '#1e293b', fontWeight: '700' }}>{metrica.valor}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ color: '#475569', marginBottom: '16px' }}>🎯 Top Áreas</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {datosGraficos.areas.slice(0, 5).map((area, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      background: index === 0 ? '#fef3c7' : '#f8fafc',
                      borderRadius: '8px',
                      border: `1px solid ${index === 0 ? '#fbbf24' : '#e2e8f0'}`
                    }}>
                      <span style={{ 
                        fontWeight: '700',
                        color: index === 0 ? '#92400e' : '#64748b',
                        minWidth: '20px'
                      }}>
                        #{index + 1}
                      </span>
                      <span style={{ 
                        flex: 1,
                        color: '#1e293b',
                        fontWeight: '500',
                        fontSize: '14px'
                      }}>
                        {area.nombreCorto}
                      </span>
                      <span style={{
                        background: colores.primario,
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {area.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ color: '#475569', marginBottom: '16px' }}>📊 Distribución</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={datosGraficos.severidades}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="cantidad"
                      label={({ porcentaje }) => `${porcentaje}%`}
                    >
                      {datosGraficos.severidades.map((entrada, index) => (
                        <Cell key={`celda-${index}`} fill={entrada.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<TooltipPersonalizado />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📈 SECCIÓN TENDENCIAS */}
      {seccionActiva === 'tendencias' && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ 
            color: '#1e293b', 
            marginBottom: '24px',
            fontSize: '24px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            📈 Análisis de Tendencias Temporales
          </h2>
          <ResponsiveContainer width="100%" height={500}>
            <AreaChart data={datosGraficos.tendencia}>
              <defs>
                <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colores.primario} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={colores.primario} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="criticosGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colores.critico} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={colores.critico} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="mes" 
                stroke="#64748b"
                fontSize={14}
                fontWeight="500"
              />
              <YAxis 
                stroke="#64748b"
                fontSize={14}
              />
              <Tooltip content={<TooltipPersonalizado />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="total"
                stroke={colores.primario}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#totalGradient)"
                name="Total de Reportes"
              />
              <Area
                type="monotone"
                dataKey="criticos"
                stroke={colores.critico}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#criticosGradient)"
                name="Reportes Críticos"
              />
              <Area
                type="monotone"
                dataKey="resueltos"
                stroke={colores.exito}
                strokeWidth={2}
                fillOpacity={0.6}
                fill={colores.exito}
                name="Reportes Resueltos"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 🎨 CSS AVANZADO PARA DESKTOP Y MÓVIL */}
      <style jsx>{`
        /* 💻 ESTILOS PARA DESKTOP (≥1200px) */
        @media (min-width: 1200px) {
          .contenedor-graficos {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 24px;
          }
          
          .grafico-completo {
            grid-column: span 12;
          }
          
          .grafico-grande {
            grid-column: span 8;
          }
          
          .grafico-mediano {
            grid-column: span 6;
          }
          
          .grafico-pequeño {
            grid-column: span 4;
          }
          
          .grafico-alto {
            grid-row: span 2;
          }
          
          /* Efectos hover para desktop */
          .tarjeta-grafico:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .pestañas-navegacion {
            position: sticky;
            top: 20px;
            z-index: 100;
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.95);
          }
        }
        
        /* 📱 ESTILOS PARA TABLET (768px - 1199px) */
        @media (min-width: 768px) and (max-width: 1199px) {
          .contenedor-graficos {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 20px;
          }
          
          .grafico-completo, .grafico-grande {
            grid-column: span 8;
          }
          
          .grafico-mediano {
            grid-column: span 4;
          }
          
          .grafico-pequeño {
            grid-column: span 8; /* En tablet, ocupar todo el ancho */
          }
        }
        
        /* 📱 ESTILOS PARA MÓVIL (<768px) */
        @media (max-width: 767px) {
          .pestañas-navegacion {
            padding: 16px 12px !important;
          }
          
          .pestañas-botones {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px !important;
          }
          
          .pestañas-botones button {
            justify-content: center !important;
            padding: 12px 16px !important;
          }
          
          .contenedor-graficos {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          
          .tarjeta-grafico {
            padding: 16px !important;
            margin: 0 !important;
          }
          
          .titulo-grafico {
            font-size: 16px !important;
          }
          
          .selector-periodo {
            width: 100% !important;
            margin-top: 16px !important;
          }
          
          .grid-kpis {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          
          .kpi-valor {
            font-size: 20px !important;
          }
        }
        
        /* 🎨 ESTILOS GENERALES MEJORADOS */
        .animacion-entrada {
          animation: entradaSuave 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        @keyframes entradaSuave {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .barra-progreso {
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .efecto-hover {
          transition: all 0.2s ease-in-out;
          cursor: pointer;
        }
        
        .efecto-hover:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        /* Scrollbar personalizada */
        .contenedor-scroll::-webkit-scrollbar {
          width: 6px;
        }
        
        .contenedor-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        
        .contenedor-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        .contenedor-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        /* Efectos de loading suaves */
        .cargando {
          animation: pulso 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulso {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        /* Mejoras de accesibilidad */
        .boton-pestaña:focus {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }
        
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .tarjeta-grafico {
            background: #1e293b !important;
            border-color: #334155 !important;
            color: #f1f5f9 !important;
          }
          
          .pestañas-navegacion {
            background: rgba(30, 41, 59, 0.95) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default GraficosEspañol;