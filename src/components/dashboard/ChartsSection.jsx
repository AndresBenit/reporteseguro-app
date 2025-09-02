import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer,
  Area, AreaChart
} from 'recharts';
import { Icon } from '../common/Icons';

const ChartsSection = ({ reportes = [] }) => {
  // Procesamiento de datos para gráficos
  const chartsData = useMemo(() => {
    if (!reportes || !Array.isArray(reportes) || reportes.length === 0) return null;

    // 1. Reportes por área
    const reportesPorArea = reportes.reduce((acc, reporte) => {
      const area = reporte.area || 'Sin área';
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {});

    const areaData = Object.entries(reportesPorArea).map(([area, cantidad]) => ({
      area: area.length > 20 ? area.substring(0, 20) + '...' : area,
      areaCompleta: area,
      cantidad,
      fill: getRandomColor(area)
    })).sort((a, b) => b.cantidad - a.cantidad);

    // 2. Distribución por severidad
    const reportesPorSeveridad = reportes.reduce((acc, reporte) => {
      const severidad = reporte.severidad || 'Sin definir';
      acc[severidad] = (acc[severidad] || 0) + 1;
      return acc;
    }, {});

    const severidadData = Object.entries(reportesPorSeveridad).map(([severidad, cantidad]) => ({
      name: severidad.charAt(0).toUpperCase() + severidad.slice(1),
      value: cantidad,
      fill: getSeverityColor(severidad)
    }));

    // 3. Estados de reportes
    const reportesPorEstado = reportes.reduce((acc, reporte) => {
      const estado = reporte.estado || 'Sin estado';
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {});

    const estadoData = Object.entries(reportesPorEstado).map(([estado, cantidad]) => ({
      estado: estado.charAt(0).toUpperCase() + estado.slice(1).replace('_', ' '),
      cantidad,
      fill: getStatusColor(estado)
    }));

    // 4. Tendencia temporal (últimos 7 días)
    const tendenciaData = obtenerDatosUltimos7Dias(reportes);

    // 5. Tipos de reportes
    const tiposData = reportes.reduce((acc, reporte) => {
      const tipo = reporte.tipo_reporte || reporte.tipo || 'Otros';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    // Debug: mostrar tipos encontrados
    console.log('📊 Tipos de reportes encontrados:', tiposData);
    console.log('📊 Reportes por tipo_reporte:', reportes.map(r => ({ 
      id: r.id, 
      tipo_reporte: r.tipo_reporte, 
      tipo: r.tipo 
    })));

    const tipoReporteData = Object.entries(tiposData).map(([tipo, cantidad]) => ({
      tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1),
      cantidad,
      fill: getTypeColor(tipo)
    }));

    return {
      areaData,
      severidadData,
      estadoData,
      tendenciaData,
      tipoReporteData
    };
  }, [reportes]);

  // Funciones auxiliares para colores
  function getRandomColor(str) {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  function getSeverityColor(severidad) {
    switch (severidad.toLowerCase()) {
      case 'alta': case 'crítica': case 'critica': return '#ef4444';
      case 'media': return '#f59e0b';
      case 'baja': return '#10b981';
      default: return '#6b7280';
    }
  }

  function getStatusColor(estado) {
    switch (estado.toLowerCase()) {
      case 'resuelto': case 'cerrado': return '#10b981';
      case 'proceso': case 'en_proceso': case 'asignado': return '#f59e0b';
      case 'pendiente': return '#ef4444';
      default: return '#6b7280';
    }
  }

  function getTypeColor(tipo) {
    const colors = {
      'incidencia': '#ef4444',
      'observacion': '#f59e0b', 
      'personal': '#3b82f6',
      'seguimiento': '#10b981',
      'abordaje': '#8b5cf6',
      'recomendacion': '#06b6d4'
    };
    return colors[tipo.toLowerCase()] || '#6b7280';
  }

  function obtenerDatosUltimos7Dias(reportes) {
    const today = new Date();
    const days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = reportes.filter(r => {
        const reportDate = new Date(r.created_at || r.fecha);
        return reportDate.toISOString().split('T')[0] === dateStr;
      }).length;
      
      days.push({
        fecha: date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        reportes: count
      });
    }
    
    return days;
  }

  if (!chartsData || !reportes || reportes.length === 0) {
    return (
      <div className="charts-section">
        <div className="charts-header">
          <h2>
            <Icon name="BarChart3" size={24} />
            Análisis Visual de Datos
          </h2>
          <p>Los gráficos aparecerán cuando tengas reportes en el sistema</p>
        </div>
        <div className="no-data-message">
          <Icon name="FileText" size={48} color="#9ca3af" />
          <h3>Sin datos para mostrar</h3>
          <p>Crea algunos reportes para ver los gráficos de análisis</p>
        </div>
        <style jsx>{`
          .charts-section {
            margin: 32px 0;
            position: relative;
            z-index: 1;
          }
          .charts-header {
            text-align: center;
            margin-bottom: 32px;
            background: white;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }
          .charts-header h2 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
          }
          .charts-header p {
            color: #6b7280;
            margin: 0;
          }
          .no-data-message {
            text-align: center;
            padding: 60px 20px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }
          .no-data-message h3 {
            color: #4b5563;
            margin: 16px 0 8px;
          }
          .no-data-message p {
            color: #9ca3af;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  const { areaData, severidadData, estadoData, tendenciaData, tipoReporteData } = chartsData;

  return (
    <div className="charts-section">
      <div className="charts-header">
        <h2>
          <Icon name="BarChart3" size={24} />
          Análisis Visual de Datos
        </h2>
        <p>Gráficos interactivos basados en {reportes.length} reportes</p>
      </div>

      <div className="charts-grid">
        {/* 1. Reportes por Área */}
        <div className="chart-card">
          <div className="chart-title">
            <Icon name="Building2" size={20} />
            <h3>Reportes por Área</h3>
            <span className="chart-count">{areaData.length} áreas</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={areaData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="area" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
                stroke="#64748b"
              />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value, name, props) => [
                  value,
                  'Reportes',
                  props.payload.areaCompleta
                ]}
              />
              <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Distribución por Severidad */}
        <div className="chart-card">
          <div className="chart-title">
            <Icon name="AlertCircle" size={20} />
            <h3>Distribución por Severidad</h3>
            <span className="chart-count">{severidadData.reduce((sum, item) => sum + item.value, 0)} total</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={severidadData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {severidadData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Estados de Reportes */}
        <div className="chart-card">
          <div className="chart-title">
            <Icon name="Activity" size={20} />
            <h3>Estados de Reportes</h3>
            <span className="chart-count">{estadoData.length} estados</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={estadoData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="estado" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 4. Tendencia Temporal */}
        <div className="chart-card chart-wide">
          <div className="chart-title">
            <Icon name="TrendingUp" size={20} />
            <h3>Tendencia de Reportes (Últimos 7 días)</h3>
            <span className="chart-count">Actividad diaria</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={tendenciaData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorReportes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="fecha" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="reportes" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorReportes)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 5. Tipos de Reportes */}
        <div className="chart-card">
          <div className="chart-title">
            <Icon name="FileText" size={20} />
            <h3>Tipos de Reportes</h3>
            <span className="chart-count">{tipoReporteData.length} tipos</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tipoReporteData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="cantidad"
                label={({ tipo, percent }) => `${tipo}: ${(percent * 100).toFixed(0)}%`}
              >
                {tipoReporteData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style jsx>{`
        .charts-section {
          margin: 32px 0;
          position: relative;
          z-index: 1;
        }

        .charts-header {
          text-align: center;
          margin-bottom: 32px;
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .charts-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .charts-header p {
          color: #6b7280;
          margin: 0;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
        }

        .chart-wide {
          grid-column: 1 / -1;
        }

        .chart-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .chart-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        }

        .chart-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f1f5f9;
        }

        .chart-title h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          flex: 1;
        }

        .chart-count {
          font-size: 0.875rem;
          color: #6b7280;
          background: #f8fafc;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .charts-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .chart-card {
            padding: 20px;
          }

          .charts-header {
            padding: 20px;
          }

          .charts-header h2 {
            font-size: 1.25rem;
          }
        }

        @media (max-width: 480px) {
          .chart-title {
            flex-wrap: wrap;
            gap: 8px;
          }

          .chart-title h3 {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ChartsSection;