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

const PersonnelReportForm = ({ onBack }) => {
  const [form, setForm] = useState({
    tipo: "Personal",
    subtipo: "",
    descripcion: "",
    severidad: "baja",
    area: "",
    reportante: "",
    colaboradorInvolucrado: "",
    accionRecomendada: "",
    estado: "pendiente"
  });

  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const personnelTypes = [
    "Comportamiento riesgoso",
    "Necesidad de capacitación",
    "Reconocimiento positivo",
    "Incumplimiento de procedimiento",
    "Falta de EPP",
    "Actitud positiva hacia seguridad"
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
        tipo_reporte: "personal",
        prioridad: "normal",
        colaboradorinvolucrado: form.colaboradorInvolucrado,
        accionrecomendada: form.accionRecomendada
      });

      setMensaje("¡Reporte de personal enviado exitosamente!");
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
        title="Reporte de Personal"
        subtitle="Documenta comportamientos y necesidades de capacitación del personal"
        onBack={onBack}
        icon=""
      />

      <form onSubmit={crearReporte}>
        <FormMessage
          type={mensaje.includes("exitosamente") ? "success" : "error"}
          message={mensaje}
          onClose={() => setMensaje("")}
        />

        <FormSection title="Información del Personal">
          <FormField label="Tipo de reporte" required>
            <FormSelect
              name="subtipo"
              value={form.subtipo}
              onChange={handleChange}
              options={personnelTypes}
              placeholder="Selecciona el tipo de reporte..."
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

            <FormField label="Colaborador involucrado">
              <FormInput
                type="text"
                name="colaboradorInvolucrado"
                placeholder="Nombre del colaborador"
                value={form.colaboradorInvolucrado}
                onChange={handleChange}
              />
            </FormField>
          </FormRow>

          <FormField label="Reportado por">
            <FormInput
              type="text"
              name="reportante"
              placeholder="Tu nombre (opcional)"
              value={form.reportante}
              onChange={handleChange}
            />
          </FormField>
        </FormSection>

        <FormSection title="Descripción del Comportamiento">
          <FormField label="¿Qué comportamiento observaste?" required>
            <FormTextarea
              name="descripcion"
              placeholder="Describe el comportamiento observado de manera objetiva y específica..."
              value={form.descripcion}
              onChange={handleChange}
              rows={5}
              required
            />
          </FormField>

          <FormField label="Acción recomendada">
            <FormTextarea
              name="accionRecomendada"
              placeholder="¿Qué acción recomiendas? (capacitación, reconocimiento, seguimiento, etc.)"
              value={form.accionRecomendada}
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
            Enviar Reporte de Personal
          </FormButton>
        </FormButtonGroup>
      </form>
    </FormContainer>
  );
};

export default PersonnelReportForm;