import React, { useMemo } from "react";
import { Icon } from "../common/Icons";

const ExecutiveAlerts = ({ reportes = [] }) => {
  // 🚨 ANÁLISIS DE ALERTAS CRÍTICAS
  const alertsData = useMemo(() => {
    // Validar que reportes sea un array válido
    const reportesValidos = Array.isArray(reportes) ? reportes : [];
    const criticos = reportesValidos.filter((r) => r?.severidad === "critica");
    const pendientesCriticos = criticos.filter((r) => r.estado === "pendiente");
    const sinResolver = reportesValidos.filter((r) => {
      const fecha = r.fecha instanceof Date ? r.fecha : r.fecha?.toDate();
      const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return fecha < hace7Dias && !["resuelto", "cerrado"].includes(r.estado);
    });

    // Áreas problemáticas
    const areaStats = reportesValidos.reduce((acc, r) => {
      const area = r.area || r.lugarLabor || "Sin especificar";
      if (!acc[area]) acc[area] = { total: 0, criticos: 0 };
      acc[area].total++;
      if (r.severidad === "critica") acc[area].criticos++;
      return acc;
    }, {});

    const areasProblematicas = Object.entries(areaStats)
      .filter(([_, stats]) => stats.criticos > 0)
      .sort((a, b) => b[1].criticos - a[1].criticos)
      .slice(0, 3);

    return {
      criticos: criticos.length,
      pendientesCriticos: pendientesCriticos.length,
      sinResolver: sinResolver.length,
      areasProblematicas,
      totalReportes: reportesValidos.length,
    };
  }, [reportesValidos]);

  // 🎯 GENERAR ALERTAS INTELIGENTES
  const alerts = useMemo(() => {
    const alertsList = [];

    if (alertsData.pendientesCriticos > 0) {
      alertsList.push({
        id: "criticos-pendientes",
        tipo: "critico",
        icono: "AlertTriangle",
        titulo: "Reportes Críticos Pendientes",
        mensaje: `${alertsData.pendientesCriticos} reporte${
          alertsData.pendientesCriticos > 1 ? "s" : ""
        } crítico${alertsData.pendientesCriticos > 1 ? "s" : ""} requiere${
          alertsData.pendientesCriticos === 1 ? "" : "n"
        } atención inmediata`,
        accion: "Revisar ahora",
        color: "#dc2626",
      });
    }

    if (alertsData.sinResolver > 0) {
      alertsList.push({
        id: "sin-resolver",
        tipo: "advertencia",
        icono: "Clock",
        titulo: "Reportes Sin Resolver",
        mensaje: `${alertsData.sinResolver} reporte${
          alertsData.sinResolver > 1 ? "s" : ""
        } lleva${
          alertsData.sinResolver === 1 ? "" : "n"
        } más de 7 días sin resolverse`,
        accion: "Ver detalles",
        color: "#f59e0b",
      });
    }

    if (alertsData.areasProblematicas.length > 0) {
      const areaTop = alertsData.areasProblematicas[0];
      alertsList.push({
        id: "areas-problematicas",
        tipo: "info",
        icono: "MapPin",
        titulo: "Área Requiere Atención",
        mensaje: `${areaTop[0]} tiene ${areaTop[1].criticos} reporte${
          areaTop[1].criticos > 1 ? "s" : ""
        } crítico${areaTop[1].criticos > 1 ? "s" : ""}`,
        accion: "Analizar área",
        color: "#3b82f6",
      });
    }

    if (
      alertsData.pendientesCriticos === 0 &&
      alertsData.sinResolver === 0 &&
      alertsData.totalReportes > 0
    ) {
      alertsList.push({
        id: "todo-bien",
        tipo: "exito",
        icono: "CheckCircle",
        titulo: "Sistema Bajo Control",
        mensaje: "No hay reportes críticos pendientes ni casos sin resolver",
        accion: "Continuar",
        color: "#10b981",
      });
    }

    return alertsList;
  }, [alertsData]);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="executive-alerts">
      <div className="alerts-header">
        <h2 className="alerts-title">
          <Icon name="Bell" size={22} />
          Alertas Ejecutivas
        </h2>
        <p className="alerts-subtitle">
          Notificaciones importantes que requieren atención
        </p>
      </div>

      <div className="alerts-grid">
        {alerts.map((alert) => (
          <div key={alert.id} className={`alert-card alert-${alert.tipo}`}>
            <div className="alert-header">
              <div
                className="alert-icon"
                style={{ background: `${alert.color}15`, color: alert.color }}
              >
                <Icon name={alert.icono} size={20} />
              </div>
              <div
                className="alert-indicator"
                style={{ background: alert.color }}
              />
            </div>

            <div className="alert-content">
              <h3 className="alert-titulo">{alert.titulo}</h3>
              <p className="alert-mensaje">{alert.mensaje}</p>
            </div>

            <div className="alert-footer">
              <button
                className="alert-action"
                style={{
                  background: `${alert.color}10`,
                  color: alert.color,
                  border: `1px solid ${alert.color}30`,
                }}
              >
                {alert.accion}
                <Icon name="ArrowRight" size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen rápido */}
      <div className="quick-summary">
        <div className="summary-item">
          <div className="summary-number" style={{ color: "#dc2626" }}>
            {alertsData.criticos}
          </div>
          <div className="summary-label">Críticos</div>
        </div>

        <div className="summary-divider" />

        <div className="summary-item">
          <div className="summary-number" style={{ color: "#f59e0b" }}>
            {alertsData.sinResolver}
          </div>
          <div className="summary-label">Sin Resolver (+7d)</div>
        </div>

        <div className="summary-divider" />

        <div className="summary-item">
          <div className="summary-number" style={{ color: "#3b82f6" }}>
            {alertsData.areasProblematicas.length}
          </div>
          <div className="summary-label">Áreas Críticas</div>
        </div>

        <div className="summary-divider" />

        <div className="summary-item">
          <div className="summary-number" style={{ color: "#10b981" }}>
            {Math.round(
              ((alertsData.totalReportes - alertsData.criticos) /
                Math.max(alertsData.totalReportes, 1)) *
                100
            )}
            %
          </div>
          <div className="summary-label">Bajo Control</div>
        </div>
      </div>

      <style jsx>{`
        /* ... tus estilos tal como los tenías ... */
      `}</style>
    </div>
  );
};

export default ExecutiveAlerts;
