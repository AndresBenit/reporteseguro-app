import React, { useState } from "react";
import { reporteUtils, REPORTE_ESTADOS } from "../../constants/reporteStates";

const ReporteList = ({ reportes, actualizarEstado, eliminarReporte }) => {
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroSeveridad, setFiltroSeveridad] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [ordenPor, setOrdenPor] = useState("fecha");
  const [ordenDesc, setOrdenDesc] = useState(true);
  const [imagenModal, setImagenModal] = useState(null);

  // Filtrar y ordenar reportes
  const reportesFiltrados = reportes
    .filter(reporte => {
      // Normalizar estado para comparación
      const estadoNormalizado = reporteUtils.normalizeEstado(reporte.estado);
      const cumpleFiltroEstado = filtroEstado === "todos" || estadoNormalizado === filtroEstado;
      const cumpleFiltroSeveridad = filtroSeveridad === "todos" || reporte.severidad === filtroSeveridad;
      const cumpleBusqueda = busqueda === "" || 
        reporte.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
        reporte.area?.toLowerCase().includes(busqueda.toLowerCase()) ||
        reporte.reportante?.toLowerCase().includes(busqueda.toLowerCase());
      
      return cumpleFiltroEstado && cumpleFiltroSeveridad && cumpleBusqueda;
    })
    .sort((a, b) => {
      let valorA, valorB;
      
      switch (ordenPor) {
        case "fecha":
          valorA = a.fecha?.toDate() || new Date(0);
          valorB = b.fecha?.toDate() || new Date(0);
          break;
        case "severidad":
          const ordenSeveridad = { "baja": 1, "media": 2, "alta": 3, "critica": 4 };
          valorA = ordenSeveridad[a.severidad] || 0;
          valorB = ordenSeveridad[b.severidad] || 0;
          break;
        case "estado":
          const ordenEstado = { 
            [REPORTE_ESTADOS.PENDIENTE]: 1, 
            [REPORTE_ESTADOS.EN_PROCESO]: 2, 
            [REPORTE_ESTADOS.PROCESO]: 2, 
            [REPORTE_ESTADOS.RESUELTO]: 3,
            [REPORTE_ESTADOS.CERRADO]: 4
          };
          valorA = ordenEstado[reporteUtils.normalizeEstado(a.estado)] || 0;
          valorB = ordenEstado[reporteUtils.normalizeEstado(b.estado)] || 0;
          break;
        default:
          valorA = a[ordenPor] || "";
          valorB = b[ordenPor] || "";
      }
      
      if (valorA < valorB) return ordenDesc ? 1 : -1;
      if (valorA > valorB) return ordenDesc ? -1 : 1;
      return 0;
    });

  const getSeverityClass = (severidad) => `severity-pill severity-${severidad}`;
  const getStatusClass = (estado) => `status-pill status-${estado}`;

  const formatDate = (fecha) => {
    if (!fecha || !fecha.toDate) return "Sin fecha";
    return fecha.toDate().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityIcon = (severidad) => {
    return reporteUtils.getSeveridadIcon(severidad);
  };

  const getStatusIcon = (estado) => {
    return reporteUtils.getEstadoIcon(estado);
  };

  const handleEstadoChange = (id, nuevoEstado) => {
    actualizarEstado(id, nuevoEstado);
  };

  // Modal para ver imagen completa
  const ImageModal = ({ src, onClose }) => {
    if (!src) return null;
    
    return (
      <div 
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}
        onClick={onClose}
      >
        <div style={{ position: "relative", maxWidth: "90%", maxHeight: "90%" }}>
          <img 
            src={src} 
            alt="Imagen ampliada"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              borderRadius: "12px",
              boxShadow: "0 25px 75px rgba(0, 0, 0, 0.5)"
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "-15px",
              right: "-15px",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              fontSize: "1.2rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
            }}
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  if (reportes.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "50px 20px" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "20px", opacity: 0.3 }}>📋</div>
        <h3 style={{ color: "#6b7280", marginBottom: "10px" }}>No hay reportes registrados</h3>
        <p style={{ color: "#9ca3af" }}>
          Los reportes aparecerán aquí una vez que se registren algunas incidencias
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Controles de filtrado y búsqueda */}
      <div className="filter-controls">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">🔍 Buscar</label>
          <input
            type="text"
            placeholder="Buscar en descripción, área o reportante..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Estado</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="form-select"
          >
            <option value="todos">Todos</option>
            <option value={REPORTE_ESTADOS.PENDIENTE}>Pendiente</option>
            <option value={REPORTE_ESTADOS.EN_PROCESO}>En Proceso</option>
            <option value={REPORTE_ESTADOS.RESUELTO}>Resuelto</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Severidad</label>
          <select
            value={filtroSeveridad}
            onChange={(e) => setFiltroSeveridad(e.target.value)}
            className="form-select"
          >
            <option value="todos">Todas</option>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Ordenar</label>
          <div style={{ display: "flex", gap: "5px" }}>
            <select
              value={ordenPor}
              onChange={(e) => setOrdenPor(e.target.value)}
              className="form-select"
              style={{ flex: 1 }}
            >
              <option value="fecha">Fecha</option>
              <option value="severidad">Severidad</option>
              <option value="estado">Estado</option>
              <option value="area">Área</option>
            </select>
            <button
              type="button"
              onClick={() => setOrdenDesc(!ordenDesc)}
              style={{
                padding: "12px 10px",
                border: "2px solid #e5e7eb",
                borderRadius: "10px",
                background: "white",
                cursor: "pointer",
                fontSize: "0.9rem"
              }}
              title={ordenDesc ? "Orden descendente" : "Orden ascendente"}
            >
              {ordenDesc ? "⬇️" : "⬆️"}
            </button>
          </div>
        </div>
      </div>

      {/* Resumen de filtros */}
      <div style={{ 
        marginBottom: "18px", 
        padding: "12px 18px", 
        background: "#f8fafc", 
        borderRadius: "10px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px"
      }}>
        <span style={{ fontWeight: "600", color: "#374151", fontSize: "0.9rem" }}>
          📊 Mostrando {reportesFiltrados.length} de {reportes.length} reportes
        </span>
        {(filtroEstado !== "todos" || filtroSeveridad !== "todos" || busqueda) && (
          <button
            onClick={() => {
              setFiltroEstado("todos");
              setFiltroSeveridad("todos");
              setBusqueda("");
            }}
            style={{
              background: "none",
              border: "1px solid #d1d5db",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.8rem",
              color: "#6b7280"
            }}
          >
            🗑️ Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla de reportes - Desktop */}
      <div className="desktop-table">
        <div className="table-container">
          <table className="reports-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Área</th>
              <th>Reportante</th>
              <th>Severidad</th>
              <th>Estado</th>
              <th>Foto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reportesFiltrados.map((reporte) => (
              <tr key={reporte.id}>
                <td style={{ fontSize: "0.85rem", color: "#6b7280", minWidth: "120px" }}>
                  {formatDate(reporte.fecha)}
                </td>
                <td style={{ minWidth: "120px" }}>
                  <span style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "6px",
                    fontWeight: "600",
                    fontSize: "0.85rem"
                  }}>
                    {reporte.tipo === "Condición Insegura" ? "💡" : "⚠️"}
                    <span style={{ display: "block" }}>
                      {reporte.tipo}
                    </span>
                  </span>
                </td>
                <td style={{ maxWidth: "250px", minWidth: "200px" }}>
                  <div style={{ 
                    overflow: "hidden", 
                    textOverflow: "ellipsis", 
                    whiteSpace: "nowrap",
                    fontSize: "0.85rem"
                  }}>
                    {reporte.descripcion}
                  </div>
                </td>
                <td style={{ fontWeight: "600", fontSize: "0.85rem", minWidth: "120px" }}>
                  🏢 {reporte.area}
                </td>
                <td style={{ color: "#6b7280", fontSize: "0.85rem", minWidth: "100px" }}>
                  👤 {reporte.reportante || "Anónimo"}
                </td>
                <td style={{ minWidth: "80px" }}>
                  <span className={getSeverityClass(reporte.severidad)}>
                    {getSeverityIcon(reporte.severidad)} {reporte.severidad}
                  </span>
                </td>
                <td style={{ minWidth: "120px" }}>
                  <select
                    value={reporteUtils.normalizeEstado(reporte.estado)}
                    onChange={(e) => handleEstadoChange(reporte.id, e.target.value)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      background: "white",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      width: "100%"
                    }}
                  >
                    <option value={REPORTE_ESTADOS.PENDIENTE}>{reporteUtils.getEstadoIcon(REPORTE_ESTADOS.PENDIENTE)} {reporteUtils.getEstadoDisplay(REPORTE_ESTADOS.PENDIENTE)}</option>
                    <option value={REPORTE_ESTADOS.EN_PROCESO}>{reporteUtils.getEstadoIcon(REPORTE_ESTADOS.EN_PROCESO)} {reporteUtils.getEstadoDisplay(REPORTE_ESTADOS.EN_PROCESO)}</option>
                    <option value={REPORTE_ESTADOS.RESUELTO}>{reporteUtils.getEstadoIcon(REPORTE_ESTADOS.RESUELTO)} {reporteUtils.getEstadoDisplay(REPORTE_ESTADOS.RESUELTO)}</option>
                  </select>
                </td>
                <td style={{ minWidth: "80px" }}>
                  {reporte.fotoUrl ? (
                    <button
                      onClick={() => setImagenModal(reporte.fotoUrl)}
                      style={{
                        background: "none",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.8rem",
                        color: "#3b82f6",
                        width: "100%",
                        justifyContent: "center"
                      }}
                      title="Ver imagen"
                    >
                      📷 Ver
                    </button>
                  ) : (
                    <span style={{ 
                      color: "#9ca3af", 
                      fontSize: "0.8rem",
                      display: "block",
                      textAlign: "center"
                    }}>
                      Sin foto
                    </span>
                  )}
                </td>
                <td style={{ minWidth: "80px" }}>
                  <button
                    onClick={() => eliminarReporte(reporte.id)}
                    className="btn btn-danger"
                    style={{ 
                      padding: "6px 10px", 
                      fontSize: "0.8rem",
                      minWidth: "auto",
                      width: "100%"
                    }}
                    title="Eliminar reporte"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>

      {/* Vista móvil - Cards */}
      <div style={{ display: "none" }} className="mobile-cards">
        {reportesFiltrados.map((reporte) => (
          <div key={reporte.id} style={{
            background: "white",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "12px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            border: "1px solid #f1f5f9"
          }}>
            {/* Header de la card */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "12px"
            }}>
              <div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "4px"
                }}>
                  <span style={{ fontSize: "1.1rem" }}>
                    {reporte.tipo === "Condición Insegura" ? "💡" : "⚠️"}
                  </span>
                  <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                    {reporte.tipo}
                  </span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                  {formatDate(reporte.fecha)}
                </div>
              </div>
              <span className={getSeverityClass(reporte.severidad)}>
                {getSeverityIcon(reporte.severidad)} {reporte.severidad}
              </span>
            </div>

            {/* Descripción */}
            <div style={{ marginBottom: "12px" }}>
              <p style={{ 
                fontSize: "0.9rem", 
                lineHeight: "1.4",
                margin: 0,
                color: "#374151"
              }}>
                {reporte.descripcion}
              </p>
            </div>

            {/* Área y Reportante */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              marginBottom: "12px",
              fontSize: "0.8rem"
            }}>
              <div>
                <span style={{ color: "#6b7280" }}>🏢 Área:</span>
                <div style={{ fontWeight: "600" }}>{reporte.area}</div>
              </div>
              <div>
                <span style={{ color: "#6b7280" }}>👤 Reportante:</span>
                <div style={{ fontWeight: "600" }}>{reporte.reportante || "Anónimo"}</div>
              </div>
            </div>

            {/* Acciones */}
            <div style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap"
            }}>
              <select
                value={reporteUtils.normalizeEstado(reporte.estado)}
                onChange={(e) => handleEstadoChange(reporte.id, e.target.value)}
                style={{
                  flex: 1,
                  minWidth: "120px",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  background: "white",
                  fontSize: "0.8rem",
                  fontWeight: "600"
                }}
              >
                <option value={REPORTE_ESTADOS.PENDIENTE}>{reporteUtils.getEstadoIcon(REPORTE_ESTADOS.PENDIENTE)} {reporteUtils.getEstadoDisplay(REPORTE_ESTADOS.PENDIENTE)}</option>
                <option value={REPORTE_ESTADOS.EN_PROCESO}>{reporteUtils.getEstadoIcon(REPORTE_ESTADOS.EN_PROCESO)} {reporteUtils.getEstadoDisplay(REPORTE_ESTADOS.EN_PROCESO)}</option>
                <option value={REPORTE_ESTADOS.RESUELTO}>{reporteUtils.getEstadoIcon(REPORTE_ESTADOS.RESUELTO)} {reporteUtils.getEstadoDisplay(REPORTE_ESTADOS.RESUELTO)}</option>
              </select>

              {reporte.fotoUrl && (
                <button
                  onClick={() => setImagenModal(reporte.fotoUrl)}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    background: "white",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    color: "#3b82f6"
                  }}
                >
                  📷 Ver
                </button>
              )}

              <button
                onClick={() => eliminarReporte(reporte.id)}
                style={{
                  padding: "8px 12px",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.8rem"
                }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {reportesFiltrados.length === 0 && reportes.length > 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "15px", opacity: 0.3 }}>🔍</div>
          <h4 style={{ color: "#6b7280", marginBottom: "10px" }}>No se encontraron reportes</h4>
          <p style={{ color: "#9ca3af" }}>
            Intenta ajustar los filtros de búsqueda
          </p>
        </div>
      )}

      {/* Modal para imagen */}
      <ImageModal 
        src={imagenModal} 
        onClose={() => setImagenModal(null)} 
      />

      {/* Estilos adicionales para responsive */}
      <style>
        {`
          @media (max-width: 768px) {
            .desktop-table {
              display: none !important;
            }
            .mobile-cards {
              display: block !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ReporteList;
