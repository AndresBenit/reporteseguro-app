import React, { useMemo } from "react";
import { Icon } from "../common/Icons";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const DeepAnalytics = ({ reportes = [] }) => {
  // 📊 ANÁLISIS PROFUNDO DE PATRONES
  const analytics = useMemo(() => {
    if (reportes.length === 0) {
      return {
        patronesHorarios: [],
        patronesDiarios: [],
        efectividadAreas: [],
        timelineResolucion: [],
        colaboradoresTop: [],
        tendenciasSeveridad: [],
      };
    }

    // Patrones por hora del día
    const patronesHorarios = Array.from({ length: 24 }, (_, hora) => {
      const reportesHora = reportes.filter((r) => {
        const fecha = r.fecha instanceof Date ? r.fecha : r.fecha?.toDate();
        return fecha && fecha.getHours() === hora;
      });

      return {
        hora: `${hora.toString().padStart(2, "0")}:00`,
        cantidad: reportesHora.length,
        criticos: reportesHora.filter((r) => r.severidad === "critica").length,
      };
    }).filter((item) => item.cantidad > 0);

    // Patrones por día de la semana
    const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const patronesDiarios = Array.from({ length: 7 }, (_, dia) => {
      const reportesDia = reportes.filter((r) => {
        const fecha = r.fecha instanceof Date ? r.fecha : r.fecha?.toDate();
        return fecha && fecha.getDay() === dia;
      });

      return {
        dia: diasSemana[dia],
        cantidad: reportesDia.length,
        criticos: reportesDia.filter((r) => r.severidad === "critica").length,
        resueltos: reportesDia.filter((r) =>
          ["resuelto", "cerrado"].includes(r.estado)
        ).length,
      };
    });

    // Análisis básico sin complejidad
    const efectividadAreas = [];
    const timelineResolucion = [];
    const colaboradoresTop = [];
    const tendenciasSeveridad = [];

    return {
      patronesHorarios,
      patronesDiarios,
      efectividadAreas,
      timelineResolucion,
      colaboradoresTop,
      tendenciasSeveridad,
    };
  }, [reportes]);

  // 🎨 COLORES CONSISTENTES
  const colores = {
    primary: "#3b82f6",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
  };

  if (reportes.length === 0) {
    return (
      <div className="deep-analytics-container">
        <div className="no-data-message">
          <Icon name="BarChart3" size={64} color="#e5e7eb" />
          <h3>Sin Datos para Análisis Profundo</h3>
          <p>Cuando tengas más reportes, aquí verás análisis detallados</p>
        </div>

        <style jsx>{`
          .deep-analytics-container {
            margin-top: 40px;
            max-width: 1400px;
            margin-left: auto;
            margin-right: auto;
          }
          .no-data-message {
            text-align: center;
            padding: 60px 20px;
            color: #6b7280;
            background: white;
            border-radius: 16px;
            border: 1px solid #e5e7eb;
          }
          .no-data-message h3 {
            font-size: 1.5rem;
            margin: 20px 0 10px 0;
            color: #374151;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="deep-analytics-container">
      {/* 🎯 HEADER */}
      <div className="analytics-header">
        <h2 className="analytics-title">
          <Icon name="Activity" size={24} />
          Análisis de Patrones
        </h2>
        <p className="analytics-subtitle">
          Insights basados en {reportes.length} reportes
        </p>
      </div>

      {/* 📊 GRÁFICAS BÁSICAS */}
      <div className="analytics-grid">
        {/* Patrones por Día */}
        {analytics.patronesDiarios.length > 0 && (
          <div className="analytics-card full-width">
            <div className="card-header">
              <h3>📅 Actividad por Día de Semana</h3>
              <p>Distribución semanal de reportes</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.patronesDiarios}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="cantidad"
                  stroke={colores.primary}
                  strokeWidth={3}
                  dot={{ fill: colores.primary, strokeWidth: 2, r: 4 }}
                  name="Total"
                />
                <Line
                  type="monotone"
                  dataKey="resueltos"
                  stroke={colores.success}
                  strokeWidth={2}
                  dot={{ fill: colores.success, strokeWidth: 2, r: 3 }}
                  name="Resueltos"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <style jsx>{`
        .deep-analytics-container {
          margin-top: 40px;
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
        }
        .analytics-header {
          text-align: center;
          margin-bottom: 40px;
          padding: 25px;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          border-radius: 16px;
          color: white;
        }
        .analytics-title {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .analytics-subtitle {
          font-size: 1rem;
          opacity: 0.9;
          font-weight: 400;
        }
        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 20px;
        }
        .analytics-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }
        .analytics-card.full-width {
          grid-column: span 12;
        }
        .card-header {
          margin-bottom: 20px;
        }
        .card-header h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }
        .card-header p {
          font-size: 0.85rem;
          color: #6b7280;
        }
        @media (max-width: 768px) {
          .analytics-grid {
            gap: 15px;
          }
          .analytics-card {
            padding: 20px;
          }
          .analytics-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DeepAnalytics;
