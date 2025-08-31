import React, { useState } from "react";
import { dbHelpers } from "../../../services/supabase";
import { Icon } from "../../common/Icons";

const ObservationReportForm = ({ onBack }) => {
  const [form, setForm] = useState({
    tipo: "Observación",
    subtipo: "",
    descripcion: "",
    severidad: "media",
    area: "",
    reportante: "",
    mejoraSugerida: "",
    estado: "pendiente"
  });

  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const observationTypes = [
    "Condición insegura",
    "Acto inseguro observado", 
    "Oportunidad de mejora",
    "Riesgo potencial",
    "Práctica no estándar",
    "Sugerencia de seguridad"
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const crearReporte = async (e) => {
    e.preventDefault();
    
    if (!form.descripcion.trim() || !form.area.trim() || !form.subtipo.trim()) {
      setMensaje("❌ Por favor completa todos los campos obligatorios");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }

    setEnviando(true);
    try {
      await dbHelpers.create('reportes', { 
        tipo: form.tipo,
        subtipo: form.subtipo,
        descripcion: form.descripcion,
        severidad: form.severidad,
        area: form.area,
        reportante: form.reportante || "Anónimo",
        estado: form.estado,
        tipo_reporte: "observacion",
        prioridad: "normal",
        mejorasugerida: form.mejoraSugerida
      });
      
      setMensaje("✅ ¡Reporte de observación enviado exitosamente!");
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
    <div className="observation-form-container">
      <div className="form-header">
        <button onClick={onBack} className="back-button">
          <Icon name="ArrowLeft" size={20} />
          Volver al selector
        </button>
        
        <div className="form-title-section">
          <h1>
            <Icon name="Eye" size={28} color="#f59e0b" />
            Reporte de Observación
          </h1>
          <p>Documenta condiciones inseguras y oportunidades de mejora</p>
        </div>
      </div>

      <form onSubmit={crearReporte} className="observation-form">
        {mensaje && (
          <div className={`message ${mensaje.includes("✅") ? 'success' : 'error'}`}>
            {mensaje}
          </div>
        )}

        <div className="form-section">
          <h3>
            <Icon name="Eye" size={18} />
            Tipo de Observación
          </h3>
          
          <div className="form-group">
            <label className="form-label">🔍 ¿Qué observaste? *</label>
            <select
              name="subtipo"
              value={form.subtipo}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Selecciona el tipo de observación...</option>
              {observationTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
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

            <div className="form-group">
              <label className="form-label">👤 Reportado por</label>
              <input
                type="text"
                name="reportante"
                placeholder="Tu nombre (opcional)"
                value={form.reportante}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>
            <Icon name="FileText" size={18} />
            Descripción Detallada
          </h3>
          
          <div className="form-group">
            <label className="form-label">📝 ¿Qué observaste exactamente? *</label>
            <textarea
              name="descripcion"
              placeholder="Describe detalladamente la condición o comportamiento observado..."
              value={form.descripcion}
              onChange={handleChange}
              className="form-textarea"
              required
              style={{ minHeight: "120px" }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">💡 Sugerencia de mejora</label>
            <textarea
              name="mejoraSugerida"
              placeholder="¿Cómo crees que se podría mejorar esta situación?"
              value={form.mejoraSugerida}
              onChange={handleChange}
              className="form-textarea"
              style={{ minHeight: "80px" }}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>
            <Icon name="Activity" size={18} />
            Nivel de Prioridad
          </h3>
          
          <div className="severity-options">
            {["baja", "media", "alta"].map(severity => (
              <label key={severity} className={`severity-option ${form.severidad === severity ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="severidad"
                  value={severity}
                  checked={form.severidad === severity}
                  onChange={handleChange}
                  style={{ display: "none" }}
                />
                <div 
                  className="severity-indicator"
                  style={{ 
                    background: severity === 'baja' ? '#10b981' : 
                                severity === 'media' ? '#f59e0b' : '#ef4444'
                  }}
                />
                <span className="severity-label">
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </span>
              </label>
            ))}
          </div>
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
                Enviando observación...
              </>
            ) : (
              <>
                👁️ Enviar Reporte de Observación
              </>
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        .observation-form-container {
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
          color: #f59e0b;
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

        .observation-form {
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
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }

        .severity-options {
          display: flex;
          gap: 16px;
        }

        .severity-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          flex: 1;
          justify-content: center;
        }

        .severity-option.selected {
          border-color: #f59e0b;
          background: rgba(245, 158, 11, 0.05);
        }

        .severity-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .severity-label {
          font-weight: 600;
          text-transform: capitalize;
        }

        .form-submit {
          text-align: center;
          padding-top: 24px;
          border-top: 2px solid #f3f4f6;
        }

        .submit-button {
          width: 100%;
          padding: 16px 32px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 768px) {
          .observation-form-container {
            padding: 16px;
          }

          .observation-form {
            padding: 20px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .severity-options {
            flex-direction: column;
          }

          .form-title-section h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ObservationReportForm;