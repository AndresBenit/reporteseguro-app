import React, { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area
} from "recharts";

const colores = {
  severidad: {
    baja: "#059669",
    media: "#d97706",
    alta: "#dc2626", 
    critica: "#991b1b",
  },
  estado: {
    pendiente: "#1d4ed8",
    proceso: "#7c3aed",
    resuelto: "#059669",
  },
  tipo: {
    "Condición Insegura": "#1e40af",
    "Acto Inseguro": "#be123c",
  }
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "rgba(255, 255, 255, 0.98)",
        padding: "12px 16px",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
        fontSize: "0.9rem"
      }}>
        <p style={{ margin: 0, fontWeight: "600", color: "#374151" }}>
          {`${label}: ${payload[0].value}`}
        </p>
      </div>
    );
  }
  return null;
};

const toPieData = (obj) =>
  Object.entries(obj).map(([name, value]) => ({ name, value }));

const Graficos = ({ reportes = [] }) => {
  const [filtroTiempo, setFiltroTiempo] = useState("todos");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [usarRangoPersonalizado, setUsarRangoPersonalizado] = useState(false);

  // Validar que reportes sea un array válido
  const reportesValidos = Array.isArray(reportes) ? reportes : [];

  // Filtrar reportes por período o rango personalizado
  const reportesFiltrados = useMemo(() => {
    if (usarRangoPersonalizado && fechaDesde && fechaHasta) {
      const desde = new Date(fechaDesde);
      const hasta = new Date(fechaHasta);
      hasta.setHours(23, 59, 59, 999); // Incluir todo el día

      return reportesValidos.filter(reporte => {
        if (!reporte.created_at) return false;
        const fechaReporte = new Date(reporte.created_at);
        return fechaReporte >= desde && fechaReporte <= hasta;
      });
    }

    if (filtroTiempo === "todos") return reportesValidos;

    const ahora = new Date();
    const fechaLimite = new Date();

    switch (filtroTiempo) {
      case "7dias":
        fechaLimite.setDate(ahora.getDate() - 7);
        break;
      case "30dias":
        fechaLimite.setDate(ahora.getDate() - 30);
        break;
      case "90dias":
        fechaLimite.setDate(ahora.getDate() - 90);
        break;
      case "6meses":
        fechaLimite.setMonth(ahora.getMonth() - 6);
        break;
      case "1año":
        fechaLimite.setFullYear(ahora.getFullYear() - 1);
        break;
      default:
        return reportesValidos;
    }

    return reportesValidos.filter(reporte => {
      if (!reporte.created_at) return false;
      const fechaReporte = new Date(reporte.created_at);
      return fechaReporte >= fechaLimite;
    });
  }, [reportesValidos, filtroTiempo, fechaDesde, fechaHasta, usarRangoPersonalizado]);

  const contarPorCampo = (campo) =>
    reportesFiltrados.reduce((acc, r) => {
      const value = r[campo];
      const key = value && value !== undefined && value !== null && value !== '' 
        ? String(value).trim() 
        : "Sin especificar";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  // Datos para gráficos CON FALLBACK GARANTIZADO
  const datosTipoRaw = toPieData(contarPorCampo("tipo"));
  const datosSeveridadRaw = toPieData(contarPorCampo("severidad"));
  const datosEstadoRaw = toPieData(contarPorCampo("estado"));

  // USAR SOLO DATOS REALES
  const datosTipo = datosTipoRaw;
  const datosSeveridad = datosSeveridadRaw;
  const datosEstado = datosEstadoRaw;

  // Datos para tendencias CON FALLBACK (últimos 30 días por defecto)
  const getTrendData = () => {
    const diasMostrar = filtroTiempo === "7dias" ? 7 : 
                      filtroTiempo === "30dias" ? 30 : 
                      filtroTiempo === "90dias" ? 30 : 30;

    const datos = Array.from({ length: diasMostrar }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (diasMostrar - 1 - i));
      return {
        fecha: date.toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: '2-digit' 
        }),
        reportes: 0,
        criticos: 0
      };
    });

    // Solo procesar si hay reportes filtrados
    if (reportesFiltrados.length > 0) {
      reportesFiltrados.forEach(reporte => {
        if (reporte.created_at) {
          const reporteDate = new Date(reporte.created_at);
          const daysDiff = Math.floor((new Date() - reporteDate) / (1000 * 60 * 60 * 24));

          if (daysDiff < diasMostrar && daysDiff >= 0) {
            const index = diasMostrar - 1 - daysDiff;
            if (datos[index]) {
              datos[index].reportes++;
              if (reporte.severidad === "critica" || reporte.severidad === "alta") {
                datos[index].criticos++;
              }
            }
          }
        }
      });
    }

    return datos;
  };

  // Datos por área CON FALLBACK (MEJORADO)
  const getDataPorArea = () => {
    const areaData = contarPorCampo("area");
    const datosReales = Object.entries(areaData)
      .filter(([area, cantidad]) => area && area !== "Sin especificar" && cantidad > 0)
      .map(([area, cantidad]) => {
        // Limpiar y formatear nombre del área
        const areaLimpia = String(area).trim();
        return {
          area: areaLimpia.length > 15 ? areaLimpia.substring(0, 15) + "..." : areaLimpia,
          areaCompleta: areaLimpia,
          cantidad
        };
      })
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 6); // Top 6 áreas para mejor visualización
    
    // Si no hay datos reales, retornar array vacío
    if (datosReales.length === 0) {
      return [];
    }
    
    return datosReales;
  };

  const trendData = getTrendData();
  const areaData = getDataPorArea();

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (percent < 0.08) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="11"
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const aplicarRangoPersonalizado = () => {
    if (!fechaDesde || !fechaHasta) {
      alert("Por favor selecciona ambas fechas");
      return;
    }
    if (new Date(fechaDesde) > new Date(fechaHasta)) {
      alert("La fecha 'desde' no puede ser posterior a la fecha 'hasta'");
      return;
    }
    setUsarRangoPersonalizado(true);
    setFiltroTiempo("personalizado");
  };

  const limpiarFiltros = () => {
    setUsarRangoPersonalizado(false);
    setFechaDesde("");
    setFechaHasta("");
    setFiltroTiempo("todos");
  };

  const establecerRangoRapido = (dias) => {
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(hasta.getDate() - dias);
    
    setFechaDesde(desde.toISOString().split('T')[0]);
    setFechaHasta(hasta.toISOString().split('T')[0]);
    setUsarRangoPersonalizado(true);
    setFiltroTiempo("personalizado");
  };

  // Custom tooltip para el gráfico de áreas
  const AreaTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: "white",
          padding: "8px 12px",
          borderRadius: "6px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          fontSize: "0.85rem"
        }}>
          <p style={{ margin: 0, fontWeight: "600", color: "#374151", marginBottom: "4px" }}>
            📍 {payload[0]?.payload?.areaCompleta || label}
          </p>
          <p style={{ margin: 0, color: "#3b82f6" }}>
            📊 {payload[0]?.value} reportes
          </p>
        </div>
      );
    }
    return null;
  };

  if (reportesValidos.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "4rem", marginBottom: "20px", opacity: 0.3 }}>📊</div>
        <h3 style={{ color: "#6b7280", marginBottom: "10px" }}>No hay datos para mostrar</h3>
        <p style={{ color: "#9ca3af" }}>
          Los gráficos aparecerán aquí una vez que se registren algunos reportes
        </p>
      </div>
    );
  }

  const filtros = [
    { value: "todos", label: "Todo el período" },
    { value: "7dias", label: "Últimos 7 días" },
    { value: "30dias", label: "Últimos 30 días" },
    { value: "90dias", label: "Últimos 90 días" },
    { value: "6meses", label: "Últimos 6 meses" },
    { value: "1año", label: "Último año" }
  ];

  return (
    <div>
      {/* Filtros de tiempo y rango de fechas */}
      <div className="chart-filters">
        {filtros.map(filtro => (
          <button
            key={filtro.value}
            className={`filter-btn ${filtroTiempo === filtro.value && !usarRangoPersonalizado ? 'active' : ''}`}
            onClick={() => {
              setFiltroTiempo(filtro.value);
              setUsarRangoPersonalizado(false);
            }}
          >
            {filtro.label}
          </button>
        ))}
      </div>

      {/* Selector de rango personalizado */}
      <div className="date-range-picker">
        <div className="date-input-group">
          <label className="date-input-label">📅 Desde</label>
          <input
            type="date"
            className="date-input"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            max={fechaHasta || new Date().toISOString().split('T')[0]}
          />
        </div>
        
        <div className="date-input-group">
          <label className="date-input-label">📅 Hasta</label>
          <input
            type="date"
            className="date-input"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            min={fechaDesde}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="date-range-actions">
          <button 
            className="date-btn primary"
            onClick={aplicarRangoPersonalizado}
            disabled={!fechaDesde || !fechaHasta}
          >
            📊 Aplicar Filtro
          </button>
          <button 
            className="date-btn"
            onClick={limpiarFiltros}
          >
            🗑️ Limpiar
          </button>
        </div>
      </div>

      {/* Resumen de período seleccionado */}
      <div style={{
        background: "#f8fafc",
        padding: "15px 20px",
        borderRadius: "10px",
        marginBottom: "25px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px",
        border: "1px solid #e5e7eb"
      }}>
        <span style={{ fontWeight: "600", color: "#374151" }}>
          📈 Análisis del período: 
          <strong style={{ color: "#3b82f6", marginLeft: "8px" }}>
            {usarRangoPersonalizado 
              ? `${fechaDesde} al ${fechaHasta}` 
              : filtros.find(f => f.value === filtroTiempo)?.label
            }
          </strong>
        </span>
        <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
          {reportesFiltrados.length} de {reportesValidos.length} reportes
        </span>
      </div>

      <div className="charts-container">
        {/* Gráfico de Tendencia */}
        <div className="chart-card" style={{ gridColumn: "1 / -1" }}>
          <div className="chart-title">
            <span style={{ fontSize: "1.2rem", marginRight: "8px" }}>📈</span>
            Tendencia de Reportes
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorReportes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCriticos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="fecha" 
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="reportes" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorReportes)"
                name="Total Reportes"
              />
              <Area 
                type="monotone" 
                dataKey="criticos" 
                stroke="#dc2626" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCriticos)"
                name="Críticos"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Tipos */}
        <div className="chart-card">
          <div className="chart-title">
            <span style={{ fontSize: "1.2rem", marginRight: "8px" }}>🔍</span>
            Tipos de Incidencia
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={datosTipo}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                labelLine={false}
                label={renderCustomLabel}
              >
                {datosTipo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colores.tipo[entry.name] || "#6b7280"} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                wrapperStyle={{ paddingTop: "15px", fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Severidad */}
        <div className="chart-card">
          <div className="chart-title">
            <span style={{ fontSize: "1.2rem", marginRight: "8px" }}>🎯</span>
            Distribución por Severidad
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={datosSeveridad}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                labelLine={false}
                label={renderCustomLabel}
              >
                {datosSeveridad.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colores.severidad[entry.name] || "#6b7280"} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                wrapperStyle={{ paddingTop: "15px", fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Estado */}
        <div className="chart-card">
          <div className="chart-title">
            <span style={{ fontSize: "1.2rem", marginRight: "8px" }}>📊</span>
            Estado de Reportes
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={datosEstado} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[6, 6, 0, 0]}
                maxBarSize={60}
              >
                {datosEstado.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colores.estado[entry.name] || "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico por Áreas - MEJORADO */}
        <div className="chart-card">
          <div className="chart-title">
            <span style={{ fontSize: "1.2rem", marginRight: "8px" }}>🏢</span>
            Reportes por Área (Top 6)
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart 
              data={areaData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <XAxis 
                dataKey="area"
                tick={{ fontSize: 10, angle: -45, textAnchor: 'end' }}
                axisLine={false}
                tickLine={false}
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<AreaTooltip />} />
              <Bar 
                dataKey="cantidad" 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Graficos;
