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
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const crearReporte = async (e) => {
    e.preventDefault();

    if (!form.descripcion.trim() || !form.area.trim() || !form.estadoImplementacion.trim()) {
      setMensaje("Por favor completa todos los campos obligatorios");
      setTimeout(() => setMensaje(""), 5000);
      return;
    }

    setEnviando(true);
    try {
      await dbHelpers.create('reportes', {
        tipo: form.tipo,
        descripcion: form.descripcion,
        area: form.area,
        reportante: form.reportante || "Anónimo",
        estado: form.estado,
        tipo_reporte: "seguimiento",
        prioridad: "normal",
        reporteoriginalid: form.reporteOriginalId,
        estadoimplementacion: form.estadoImplementacion,
        eficacia: form.eficacia,
        requiereaccionadicional: form.requiereAccionAdicional,
        proximarevision: form.proximaRevision
      });

      setMensaje("¡Reporte de seguimiento enviado exitosamente!");
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
        title="Reporte de Seguimiento"
        subtitle="Evalúa la efectividad de las acciones implementadas"
        onBack={onBack}
        icon=""
      />

      <form onSubmit={crearReporte}>
        <FormMessage
          type={mensaje.includes("exitosamente") ? "success" : "error"}
          message={mensaje}
          onClose={() => setMensaje("")}
        />

        <FormSection title="Identificación del Reporte Original">
          <FormField label="ID del reporte original" help="Ingresa el número de identificación del reporte que estás dando seguimiento">
            <FormInput
              type="text"
              name="reporteOriginalId"
              placeholder="Ej: RPT-2024-001"
              value={form.reporteOriginalId}
              onChange={handleChange}
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

            <FormField label="Evaluado por">
              <FormInput
                type="text"
                name="reportante"
                placeholder="Tu nombre (opcional)"
                value={form.reportante}
                onChange={handleChange}
              />
            </FormField>
          </FormRow>
        </FormSection>

        <FormSection title="Estado de Implementación">
          <FormRow columns={2}>
            <FormField label="Estado de implementación" required>
              <FormSelect
                name="estadoImplementacion"
                value={form.estadoImplementacion}
                onChange={handleChange}
                options={implementationStatuses}
                placeholder="Selecciona el estado..."
                required
              />
            </FormField>

            <FormField label="Nivel de eficacia">
              <FormSelect
                name="eficacia"
                value={form.eficacia}
                onChange={handleChange}
                options={eficacyLevels}
                placeholder="Evalúa la efectividad..."
              />
            </FormField>
          </FormRow>

          <FormField label="Descripción del seguimiento" required>
            <FormTextarea
              name="descripcion"
              placeholder="Describe el estado actual de las acciones implementadas, resultados observados y cualquier hallazgo relevante..."
              value={form.descripcion}
              onChange={handleChange}
              rows={5}
              required
            />
          </FormField>
        </FormSection>

        <FormSection title="Acciones Futuras">
          <FormField>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="requiereAccionAdicional"
                checked={form.requiereAccionAdicional}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
              />
              <label className="text-sm font-medium text-gray-700">
                Requiere acción adicional
              </label>
            </div>
          </FormField>

          {form.requiereAccionAdicional && (
            <FormField label="Fecha de próxima revisión">
              <FormInput
                type="date"
                name="proximaRevision"
                value={form.proximaRevision}
                onChange={handleChange}
              />
            </FormField>
          )}
        </FormSection>

        <FormButtonGroup>
          <FormButton
            variant="primary"
            type="submit"
            loading={enviando}
          >
            Enviar Reporte de Seguimiento
          </FormButton>
        </FormButtonGroup>
      </form>
    </FormContainer>
  );
};

export default FollowUpReportForm;