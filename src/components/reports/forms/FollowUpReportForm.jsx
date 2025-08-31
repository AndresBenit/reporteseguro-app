import React, { useState } from "react";
import { dbHelpers } from "../../../services/supabase";
import { Icon } from "../../common/Icons";

const FollowUpReportForm = ({ onBack }) => {
  const [form, setForm] = useState({
    tipo: "Seguimiento",
    reporteOriginalId: "",
    descripcion: "",
    estadoImplementacion: "",
    eficacia: "",
    area: "",
    reportante: "",
    requiereAccionAdicional: false,
    proximaRevision: "",
    estado: "proceso"
  });

  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const implementationStatuses = [
    "Completamente implementado",
    "Parcialmente implementado", 
    "En proceso de implementación",
    "No implementado",
    "No aplicable"
  ];

  const eficacyLevels = [
    "Muy efectivo",
    "Efectivo",
    "Parcialmente efectivo",
    "No efectivo",
    "Requiere más tiempo para evaluar"
  ];

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const crearReporte = async (e) => {
    e.preventDefault();
    
    if (!form.descripcion.trim() || !form.area.trim() || !form.estadoImplementacion.trim()) {
      setMensaje("❌ Por favor completa todos los campos obligatorios");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }

    setEnviando(true);
    try {
      await dbHelpers.create('reportes', { 
        ...form,
        fecha: new Date().toISOString(),
        reportante: form.reportante || "Anónimo",
        tipoReporte: "seguimiento",
        prioridad: "normal"
      });
      
      setMensaje("✅ ¡Reporte de seguimiento enviado exitosamente!");
      setTimeout(() => {
        setMensaje("");
        onBack();
      }, 3000);
      
    } catch (error) {
      console.error("Error enviando reporte:", error);
      setMensaje("❌ Error al enviar el reporte. Intenta nuevamente.");
      setTimeout(() => setMensaje(""), 3000);
    }
    setEnviando(false);
  };

  return (
    <div className="followup-form-container">
      <div className="form-header">
        <button onClick={onBack} className="back-button">
          <Icon name="ArrowLeft" size={20} />
          Volver al selector
        </button>
        
        <div className="form-title-section">
          <h1>
            <Icon name="CheckCircle" size={28} color="#059669" />
            Reporte de Seguimiento
          </h1>
          <p>Verifica la implementación de medidas correctivas</p>
        </div>
      </div>

      <form onSubmit={crearReporte} className="followup-form">
        {mensaje && (
          <div className={`message ${mensaje.includes("✅") ? 'success' : 'error'}`}>
            {mensaje}
          </div>
        )}

        <div className="form-section">
          <h3>
            <Icon name="Link" size={18} />
            Información de Referencia
          </h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">🔗 ID del reporte original</label>
              <input
                type="text"
                name="reporteOriginalId"
                placeholder="ID del reporte que se está siguiendo"
                value={form.reporteOriginalId}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">🏢 Área *</label>
              <select
                name="area"
                value={form.area}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Selecciona un área...</option>
                <option value="Central de mezclas">Central de mezclas</option>
                <option value="Central de cribado">Central de cribado</option>
                <option value="Laboratorio">Laboratorio</option>
                <option value="Caseta de procesamiento de muestras">Caseta de procesamiento de muestras</option>
                <option value="Cárcamo">Cárcamo</option>
                <option value="Almacenamiento de combustible">Almacenamiento de combustible</option>
                <option value="Taller de mantenimiento">Taller de mantenimiento</option>
                <option value="Patio de almacenamiento 7">Patio de almacenamiento 7</option>
                <option value="Patio de almacenamiento de la pluma">Patio de almacenamiento de la pluma</option>
                <option value="Centro industrial 2">Centro industrial 2</option>
                <option value="Hornos solera">Hornos solera</option>
                <option value="Almacén centro industrial">Almacén centro industrial</option>
                <option value="Ambiental">Ambiental</option>
                <option value="Oficinas administrativas">Oficinas administrativas</option>
                <option value="Comedor">Comedor</option>
                <option value="Estacionamiento">Estacionamiento</option>
                <option value="Acceso principal">Acceso principal</option>
                <option value="Área de carga y descarga">Área de carga y descarga</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">👤 Verificado por</label>
            <input
              type="text"
              name="reportante"
              placeholder="Nombre de quien verifica"
              value={form.reportante}
              onChange={handleChange}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>
            <Icon name="CheckSquare" size={18} />
            Estado de Implementación
          </h3>
          
          <div className="form-group">
            <label className="form-label">📊 Estado de implementación *</label>
            <select
              name="estadoImplementacion"
              value={form.estadoImplementacion}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Selecciona el estado...</option>
              {implementationStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">⚡ Nivel de eficacia</label>
            <select
              name="eficacia"
              value={form.eficacia}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">Evalúa la eficacia...</option>
              {eficacyLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">📝 Detalles de la verificación *</label>
            <textarea
              name="descripcion"
              placeholder="Describe qué se verificó, qué se encontró y el estado actual de las medidas implementadas..."
              value={form.descripcion}
              onChange={handleChange}
              className="form-textarea"
              required
              style={{ minHeight: "120px" }}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>
            <Icon name="Calendar" size={18} />
            Próximos Pasos
          </h3>
          
          <div className="form-group">
            <label className="additional-action-checkbox">
              <input
                type="checkbox"
                name="requiereAccionAdicional"
                checked={form.requiereAccionAdicional}
                onChange={handleChange}
              />
              <span className="checkbox-custom"></span>
              🔄 Requiere acción adicional
            </label>
          </div>

          {form.requiereAccionAdicional && (
            <div className="form-group">
              <label className="form-label">📅 Fecha de próxima revisión</label>
              <input
                type="date"
                name="proximaRevision"
                value={form.proximaRevision}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          )}
        </div>

        <div className="form-submit">
          <button 
            type="submit" 
            className="submit-button"
            disabled={enviando}
          >
            {enviando ? (
              <>
                <span className="pulse">⏳</span>
                Enviando seguimiento...
              </>
            ) : (
              <>
                ✅ Enviar Reporte de Seguimiento
              </>
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        .followup-form-container {
          max-width: 700px;
          margin: 0 auto;
          padding: 20px;
        }

        .form-header {
          margin-bottom: 30px;
        }

        .back-button {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 8px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          color: #374151;
          transition: all 0.2s ease;
          margin-bottom: 20px;
        }

        .back-button:hover {
          background: #e5e7eb;
        }

        .form-title-section {
          text-align: center;
        }

        .form-title-section h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #059669;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .form-title-section p {
          color: #6b7280;
          font-size: 1rem;
        }

        .followup-form {
          background: white;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
        }

        .message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 600;
          text-align: center;
        }

        .message.success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .message.error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .form-section {
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid #f3f4f6;
        }

        .form-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .form-section h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 8px;
          border-bottom: 2px solid #f3f4f6;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #374151;
          font-size: 0.95rem;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: white;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
        }

        .additional-action-checkbox {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-weight: 600;
          color: #059669;
        }

        .checkbox-custom {
          width: 20px;
          height: 20px;
          border: 2px solid #059669;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .additional-action-checkbox input[type="checkbox"]:checked + .checkbox-custom {
          background: #059669;
        }

        .additional-action-checkbox input[type="checkbox"]:checked + .checkbox-custom::after {
          content: "✓";
          color: white;
          font-weight: bold;
          font-size: 12px;
        }

        .form-submit {
          text-align: center;
          padding-top: 24px;
          border-top: 2px solid #f3f4f6;
        }

        .submit-button {
          width: 100%;
          padding: 16px 32px;
          background: linear-gradient(135deg, #059669, #047857);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(5, 150, 105, 0.4);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 768px) {
          .followup-form-container {
            padding: 16px;
          }

          .followup-form {
            padding: 20px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .form-title-section h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default FollowUpReportForm;