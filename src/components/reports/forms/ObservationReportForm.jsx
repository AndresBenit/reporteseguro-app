import React, { useState } from "react";
import { dbHelpers } from "../../../services/supabase";
import {
  FormContainer,
  FormHeader,
  FormSection,
  FormRow,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormButton,
  FormButtonGroup,
  FormMessage
} from "../../common/FormComponents";

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

  const areasDisponibles = [
    "Central de mezclas", "Central de cribado", "Laboratorio",
    "Caseta de procesamiento de muestras", "Cárcamo",
    "Almacenamiento de combustible", "Taller de mantenimiento",
    "Patio de almacenamiento 7", "Patio de almacenamiento de la pluma",
    "Centro industrial 2", "Hornos solera", "Almacén centro industrial",
    "Ambiental", "Oficinas administrativas", "Comedor",
    "Estacionamiento", "Acceso principal", "Área de carga y descarga"
  ];

  const nivelesSeveridad = [
    { value: "baja", label: "Baja - Observación general" },
    { value: "media", label: "Media - Requiere atención" },
    { value: "alta", label: "Alta - Requiere acción inmediata" }
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const crearReporte = async (e) => {
    e.preventDefault();

    if (!form.descripcion.trim() || !form.area.trim() || !form.subtipo.trim()) {
      setMensaje("Por favor completa todos los campos obligatorios");
      setTimeout(() => setMensaje(""), 5000);
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
        prioridad: form.severidad === "alta" ? "alta" : "normal",
        mejora_sugerida: form.mejoraSugerida
      });

      setMensaje("¡Reporte de observación enviado exitosamente!");
      setTimeout(() => {
        setMensaje("");
        onBack();
      }, 2000);

    } catch (error) {
      console.error("Error enviando reporte:", error);
      setMensaje("Error al enviar el reporte. Intenta nuevamente.");
      setTimeout(() => setMensaje(""), 5000);
    }
    setEnviando(false);
  };

  return (
    <FormContainer>
      <FormHeader
        title="Reporte de Observación"
        subtitle="Documenta observaciones de seguridad y oportunidades de mejora"
        onBack={onBack}
        icon=""
      />

      <form onSubmit={crearReporte}>
        <FormMessage
          type={mensaje.includes("exitosamente") ? "success" : "error"}
          message={mensaje}
          onClose={() => setMensaje("")}
        />

        <FormSection title="Información de la Observación">
          <FormField label="Tipo de observación" required>
            <FormSelect
              name="subtipo"
              value={form.subtipo}
              onChange={handleChange}
              options={observationTypes}
              placeholder="Selecciona el tipo de observación..."
              required
            />
          </FormField>

          <FormRow columns={2}>
            <FormField label="Área" required>
              <FormSelect
                name="area"
                value={form.area}
                onChange={handleChange}
                options={areasDisponibles}
                placeholder="Selecciona un área..."
                required
              />
            </FormField>

            <FormField label="Nivel de prioridad">
              <FormSelect
                name="severidad"
                value={form.severidad}
                onChange={handleChange}
                options={nivelesSeveridad}
              />
            </FormField>
          </FormRow>

          <FormField label="Observado por">
            <FormInput
              type="text"
              name="reportante"
              placeholder="Tu nombre (opcional)"
              value={form.reportante}
              onChange={handleChange}
            />
          </FormField>
        </FormSection>

        <FormSection title="Descripción de la Observación">
          <FormField label="¿Qué observaste?" required>
            <FormTextarea
              name="descripcion"
              placeholder="Describe detalladamente lo que observaste, las condiciones y el contexto..."
              value={form.descripcion}
              onChange={handleChange}
              rows={5}
              required
            />
          </FormField>

          <FormField label="Mejora sugerida">
            <FormTextarea
              name="mejoraSugerida"
              placeholder="¿Qué mejoras o acciones sugieres para abordar esta observación?"
              value={form.mejoraSugerida}
              onChange={handleChange}
              rows={3}
            />
          </FormField>
        </FormSection>

        <FormButtonGroup>
          <FormButton
            variant="primary"
            type="submit"
            loading={enviando}
          >
            Enviar Reporte de Observación
          </FormButton>
        </FormButtonGroup>
      </form>
    </FormContainer>
  );
};

export default ObservationReportForm;