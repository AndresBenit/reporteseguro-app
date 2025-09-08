import React, { useState, useMemo } from 'react';
import { 
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
  LineChart,
  Line,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { useReportes } from '../../hooks/useReportes';
import { Icon } from '../common/Icons';

const AnalisisEPP = () => {
  const { reportes, loading } = useReportes();
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 30);
    return fecha.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Filtrar solo reportes EPP
  const reportesEPP = useMemo(() => {
    return reportes.filter(r => r.tipo === 'epp' || r.tipo_reporte === 'epp');
  }, [reportes]);

  // Filtros de fecha por rango
  const reportesFiltrados = useMemo(() => {
    if (!fechaInicio || !fechaFin) return reportesEPP;

    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);
    fechaFinDate.setHours(23, 59, 59, 999); // Incluir todo el día final

    return reportesEPP.filter(reporte => {
      const fechaReporte = new Date(reporte.created_at);
      return fechaReporte >= fechaInicioDate && fechaReporte <= fechaFinDate;
    });
  }, [reportesEPP, fechaInicio, fechaFin]);

  // Funciones auxiliares de colores (DEBE estar antes del useMemo)
  const getColorByElement = (elemento) => {
    const colors = {
      'Casco': '#ef4444',
      'Guantes': '#3b82f6', 
      'Botas': '#8b5cf6',
      'Chaleco': '#f59e0b',
      'Gafas': '#10b981',
      'Tapabocas': '#ec4899',
      'Auriculares': '#6366f1'
    };
    return colors[elemento] || '#6b7280';
  };

  const getColorByArea = (area) => {
    const hash = area.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    return colors[Math.abs(hash) % colors.length];
  };

  // 📊 ANÁLISIS DE DATOS EPP
  const analisisEPP = useMemo(() => {
    // Validar que reportesFiltrados sea un array
    const reportesValidos = Array.isArray(reportesFiltrados) ? reportesFiltrados : [];
    
    // 1. Estadísticas generales
    const totalEntregas = reportesValidos.length;
    const elementosUnicos = [...new Set(reportesValidos.map(r => r?.elemento_epp).filter(Boolean))];
    const personasAtendidas = [...new Set(reportesValidos.map(r => r?.colaboradorinvolucrado).filter(Boolean))];
    const areasAtendidas = [...new Set(reportesValidos.map(r => r?.area).filter(Boolean))];

    // 2. EPP más pedidos (Top 5)
    const elementosMasPedidos = reportesValidos.reduce((acc, reporte) => {
      const elemento = reporte?.elemento_epp || 'Sin especificar';
      const cantidad = parseInt(reporte?.cantidad);
      const cantidadValida = isNaN(cantidad) ? 1 : Math.max(cantidad, 1);
      acc[elemento] = (acc[elemento] || 0) + cantidadValida;
      return acc;
    }, {});

    const top5Elementos = Object.entries(elementosMasPedidos)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([elemento, cantidad]) => ({
        elemento: elemento || 'Sin especificar',
        cantidad: isNaN(cantidad) ? 0 : cantidad,
        color: getColorByElement(elemento)
      }))
      .filter(item => item.cantidad > 0);

    // 3. Entregas por área
    const entregasPorArea = reportesValidos.reduce((acc, reporte) => {
      const area = reporte?.area || 'Sin área';
      const cantidad = parseInt(reporte?.cantidad);
      const cantidadValida = isNaN(cantidad) ? 1 : Math.max(cantidad, 1);
      acc[area] = (acc[area] || 0) + cantidadValida;
      return acc;
    }, {});

    const areasMasActivas = Object.entries(entregasPorArea)
      .sort(([,a], [,b]) => b - a)
      .map(([area, cantidad]) => ({
        area: area && area.length > 15 ? area.substring(0, 15) + '...' : (area || 'Sin área'),
        cantidad: isNaN(cantidad) ? 0 : cantidad,
        color: getColorByArea(area || 'Sin área')
      }))
      .filter(item => item.cantidad > 0);

    // 4. Personas que han pedido EPP
    const personasConEPP = reportesValidos.reduce((acc, reporte) => {
      const persona = reporte?.colaboradorinvolucrado || 'Anónimo';
      const cantidad = parseInt(reporte?.cantidad);
      const cantidadValida = isNaN(cantidad) ? 1 : Math.max(cantidad, 1);
      acc[persona] = (acc[persona] || 0) + cantidadValida;
      return acc;
    }, {});

    const topPersonas = Object.entries(personasConEPP)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([persona, cantidad]) => ({
        persona: persona && persona.length > 20 ? persona.substring(0, 20) + '...' : (persona || 'Anónimo'),
        cantidad: isNaN(cantidad) ? 0 : cantidad
      }))
      .filter(item => item.cantidad > 0);

    // 5. Entregas por mes (últimos 6 meses)
    const entregasPorMes = [];
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      const mesYear = `${fecha.toLocaleDateString('es-ES', { month: 'short' })} ${fecha.getFullYear()}`;
      
      const entregasDelMes = reportesValidos.filter(r => {
        const fechaReporte = new Date(r?.created_at);
        return fechaReporte.getMonth() === fecha.getMonth() && 
               fechaReporte.getFullYear() === fecha.getFullYear();
      }).reduce((sum, r) => {
        const cantidad = parseInt(r?.cantidad);
        const cantidadValida = isNaN(cantidad) ? 1 : Math.max(cantidad, 1);
        return sum + cantidadValida;
      }, 0);

      entregasPorMes.push({
        mes: mesYear,
        entregas: isNaN(entregasDelMes) ? 0 : entregasDelMes
      });
    }

    return {
      estadisticas: {
        totalEntregas: isNaN(totalEntregas) ? 0 : totalEntregas,
        elementosUnicos: isNaN(elementosUnicos.length) ? 0 : elementosUnicos.length,
        personasAtendidas: isNaN(personasAtendidas.length) ? 0 : personasAtendidas.length,
        areasAtendidas: isNaN(areasAtendidas.length) ? 0 : areasAtendidas.length
      },
      top5Elementos: top5Elementos || [],
      areasMasActivas: areasMasActivas || [],
      topPersonas: topPersonas || [],
      entregasPorMes: entregasPorMes || []
    };
  }, [reportesFiltrados, getColorByElement, getColorByArea]);


  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem', color: '#6b7280' }}>
          Cargando análisis de EPP...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700', 
          color: '#1f2937',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          🦺 Análisis Control EPP
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          Dashboard completo de gestión y distribución de Elementos de Protección Personal
        </p>
      </div>

      {/* Filtros de fecha */}
      <div style={{ 
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '30px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontWeight: '600', color: '#374151', minWidth: '120px' }}>
            📅 Fecha Inicio:
          </label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.9rem',
              minWidth: '150px',
              outline: 'none',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontWeight: '600', color: '#374151', minWidth: '120px' }}>
            📅 Fecha Fin:
          </label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.9rem',
              minWidth: '150px',
              outline: 'none',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        {/* Botones de período rápido */}
        <div style={{ display: 'flex', gap: '8px', marginLeft: '20px' }}>
          <span style={{ fontSize: '0.85rem', color: '#6b7280', alignSelf: 'center' }}>Rápido:</span>
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
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                background: 'white',
                color: '#374151',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
              }}
            >
              {periodo.label}
            </button>
          ))}
        </div>

        {/* Mostrar período seleccionado */}
        <div style={{
          marginLeft: 'auto',
          padding: '8px 12px',
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '6px',
          fontSize: '0.85rem',
          color: '#0369a1'
        }}>
          📊 Analizando: {new Date(fechaInicio).toLocaleDateString('es-ES')} - {new Date(fechaFin).toLocaleDateString('es-ES')}
        </div>
      </div>

      {/* Estadísticas principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {[
          { 
            titulo: 'Total Entregas',
            valor: analisisEPP.estadisticas.totalEntregas,
            icono: '📦',
            color: '#3b82f6'
          },
          {
            titulo: 'Elementos Diferentes',
            valor: analisisEPP.estadisticas.elementosUnicos,
            icono: '🦺',
            color: '#10b981'
          },
          {
            titulo: 'Personas Atendidas',
            valor: analisisEPP.estadisticas.personasAtendidas,
            icono: '👥',
            color: '#f59e0b'
          },
          {
            titulo: 'Áreas Cubiertas',
            valor: analisisEPP.estadisticas.areasAtendidas,
            icono: '🏭',
            color: '#ef4444'
          }
        ].map(stat => (
          <div key={stat.titulo} style={{
            background: 'white',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderLeft: `4px solid ${stat.color}`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <span style={{ fontSize: '2rem' }}>{stat.icono}</span>
              <span style={{ 
                fontSize: '2.5rem', 
                fontWeight: '700',
                color: stat.color
              }}>
                {stat.valor}
              </span>
            </div>
            <h3 style={{ 
              fontSize: '1rem',
              color: '#6b7280',
              margin: 0
            }}>
              {stat.titulo}
            </h3>
          </div>
        ))}
      </div>

      {/* Gráficos principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '30px',
        marginBottom: '30px'
      }}>
        {/* Top 5 EPP más pedidos */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            fontSize: '1.3rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            🏆 Top 5 EPP Más Pedidos
          </h3>
          {analisisEPP.top5Elementos && analisisEPP.top5Elementos.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analisisEPP.top5Elementos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="elemento" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="cantidad" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ 
              height: '300px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#6b7280',
              fontSize: '0.9rem'
            }}>
              No hay datos de EPP para mostrar
            </div>
          )}
        </div>

        {/* Entregas por área */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            fontSize: '1.3rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            🏭 Entregas por Área
          </h3>
          {analisisEPP.areasMasActivas && analisisEPP.areasMasActivas.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analisisEPP.areasMasActivas}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="cantidad"
                  label={({area, percent}) => `${area}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {analisisEPP.areasMasActivas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ 
              height: '300px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#6b7280',
              fontSize: '0.9rem'
            }}>
              No hay datos de áreas para mostrar
            </div>
          )}
        </div>
      </div>

      {/* Gráficos secundarios */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '30px'
      }}>
        {/* Entregas por mes */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            fontSize: '1.3rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            📈 Entregas Mensuales
          </h3>
          {analisisEPP.entregasPorMes && analisisEPP.entregasPorMes.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analisisEPP.entregasPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="entregas" 
                  stroke="#10b981" 
                  fill="#10b981"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ 
              height: '300px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#6b7280',
              fontSize: '0.9rem'
            }}>
              No hay datos mensuales para mostrar
            </div>
          )}
        </div>

        {/* Top personas */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            fontSize: '1.3rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            👥 Personas que más EPP han recibido
          </h3>
          {analisisEPP.topPersonas && analisisEPP.topPersonas.length > 0 ? (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {analisisEPP.topPersonas.map((persona, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <span style={{ fontSize: '0.9rem', color: '#374151' }}>
                    {persona.persona}
                  </span>
                  <span style={{ 
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#3b82f6'
                  }}>
                    {persona.cantidad}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              height: '300px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#6b7280',
              fontSize: '0.9rem'
            }}>
              No hay datos de personas para mostrar
            </div>
          )}
        </div>
      </div>

      {reportesFiltrados.length === 0 && (
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginTop: '30px'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📦</div>
          <h3 style={{ color: '#6b7280', fontSize: '1.2rem' }}>
            No hay registros de EPP en el período seleccionado
          </h3>
          <p style={{ color: '#9ca3af' }}>
            Ajusta el filtro de fecha o registra algunas entregas de EPP
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalisisEPP;