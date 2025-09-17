import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dbHelpers } from "../../services/supabase";
import { Icon } from "../common/Icons";
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
} from "../common/FormComponents";

const areasInspeccion = [
  "Central de mezclas", "Central de cribado", "Laboratorio",
  "Caseta de procesamiento de muestras", "Cárcamo",
  "Almacenamiento de combustible", "Taller de mantenimiento",
  "Patio de almacenamiento 7", "Patio de almacenamiento de la pluma",
  "Centro industrial 2", "Hornos solera", "Almacén centro industrial",
  "Ambiental", "Oficinas administrativas", "Comedor",
  "Estacionamiento", "Acceso principal", "Área de carga y descarga"
];

const tiposInspeccion = [
  "Seguridad General",
  "EPP",
  "Herramientas y Equipos",
  "Orden y Aseo",
  "Condiciones Locativas",
  "Sistemas de Emergencia",
  "Riesgo Eléctrico",
  "Trabajo en Alturas",
  "Espacios Confinados",
  "Maquinaria y Equipos",
  "Higiene Industrial",
  "Riesgo Químico",
  "Medio Ambiente",
  "Otro"
];

const estadosInspeccion = [
  "programada",
  "en_proceso",
  "completada",
  "cancelada"
];

const nivelesPrioridad = [
  "baja",
  "media",
  "alta",
  "critica"
];

const InspeccionForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    titulo: "",
    tipo_inspeccion: "Seguridad General",
    area_inspeccion: "",
    ubicacion_especifica: "",
    fecha_programada: "",
    fecha_realizada: "",
    hora_inicio: "",
    hora_fin: "",
    duracion_minutos: 0,
    inspector_responsable: "",
    acompanantes: "",
    checklist_items: "",
    observaciones_generales: "",
    recomendaciones: "",
    estado: "programada",
    prioridad: "media",
    requiere_seguimiento: false,
    fecha_seguimiento: ""
  });

  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Estados para autocompletado de inspector
  const [searchTerm, setSearchTerm] = useState("");
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [colaboradoresFiltrados, setColaboradoresFiltrados] = useState([]);

  // Cargar colaboradores al montar
  useEffect(() => {
    cargarColaboradores();
    // Establecer fecha programada por defecto a mañana
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    setForm(prev => ({
      ...prev,
      fecha_programada: mañana.toISOString().split('T')[0],
      hora_inicio: "08:00"
    }));
  }, []);

  // Filtrar colaboradores para autocompletado
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setColaboradoresFiltrados([]);
      setShowSugerencias(false);
    } else {
      const colaboradoresValidos = Array.isArray(colaboradores) ? colaboradores : [];
      const filtrados = colaboradoresValidos
        .filter(col =>
          col && col.nombre && col.cedula &&
          (col.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
           col.cedula.includes(searchTerm))
        )
        .slice(0, 8);
      setColaboradoresFiltrados(filtrados);
      setShowSugerencias(filtrados.length > 0);
    }
  }, [searchTerm, colaboradores]);

  const cargarColaboradores = async () => {
    try {
      const data = await dbHelpers.getAll('colaboradores', {
        orderBy: 'nombre',
        ascending: true
      });
      setColaboradores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando colaboradores:', error);
      setColaboradores([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setForm(prev => ({
      ...prev,
      inspector_responsable: value
    }));
  };

  const handleSelectColaborador = (colaborador) => {
    setForm(prev => ({
      ...prev,
      inspector_responsable: colaborador.nombre
    }));
    setSearchTerm(colaborador.nombre);
    setShowSugerencias(false);
  };

  const validarFormulario = () => {
    const errores = [];

    // Campos obligatorios
    if (!form.titulo.trim()) errores.push("Título");
    if (!form.tipo_inspeccion) errores.push("Tipo de inspección");
    if (!form.fecha_programada) errores.push("Fecha programada");
    if (!form.inspector_responsable.trim()) errores.push("Inspector responsable");

    return errores;
  };

  const calcularDuracion = () => {
    if (form.hora_inicio && form.hora_fin) {
      const inicio = new Date(`2000-01-01T${form.hora_inicio}:00`);
      const fin = new Date(`2000-01-01T${form.hora_fin}:00`);
      const duracionMs = fin.getTime() - inicio.getTime();
      const duracionMinutos = Math.round(duracionMs / (1000 * 60));

      if (duracionMinutos > 0) {
        setForm(prev => ({ ...prev, duracion_minutos: duracionMinutos }));
      }
    }
  };

  useEffect(() => {
    calcularDuracion();
  }, [form.hora_inicio, form.hora_fin]);

  const enviarInspeccion = async (e) => {
    e.preventDefault();

    // Validar formulario
    const errores = validarFormulario();
    if (errores.length > 0) {
      setMensaje(`Por favor completa los campos obligatorios: ${errores.join(", ")}`);
      setTimeout(() => setMensaje(""), 5000);
      return;
    }

    setLoading(true);
    setMensaje("Guardando inspección...");

    try {
      // Preparar datos para la base de datos
      const inspeccionData = {
        titulo: form.titulo.trim(),
        tipo_inspeccion: form.tipo_inspeccion,
        area_inspeccion: form.area_inspeccion || null,
        ubicacion_especifica: form.ubicacion_especifica.trim() || null,
        fecha_programada: form.fecha_programada,
        fecha_realizada: form.fecha_realizada || null,
        hora_inicio: form.hora_inicio || null,
        hora_fin: form.hora_fin || null,
        duracion_minutos: form.duracion_minutos || null,
        inspector_responsable: form.inspector_responsable.trim(),
        // Convertir acompañantes de string a array
        acompanantes: form.acompanantes.trim()
          ? form.acompanantes.split(',').map(a => a.trim()).filter(a => a.length > 0)
          : [],
        // Convertir checklist de string a JSON
        checklist_items: form.checklist_items.trim()
          ? form.checklist_items.split('\n').map((item, index) => ({
              id: index + 1,
              descripcion: item.trim(),
              cumple: null,
              observaciones: ""
            })).filter(item => item.descripcion.length > 0)
          : [],
        total_items: 0, // Se calculará automáticamente
        items_conformes: 0,
        items_no_conformes: 0,
        porcentaje_cumplimiento: null,
        hallazgos: [], // Se agregarán posteriormente
        observaciones_generales: form.observaciones_generales.trim() || null,
        recomendaciones: form.recomendaciones.trim() || null,
        estado: form.estado,
        prioridad: form.prioridad,
        evidencias_fotos: [], // Se agregarán posteriormente
        documento_url: null,
        requiere_seguimiento: Boolean(form.requiere_seguimiento),
        fecha_seguimiento: form.fecha_seguimiento || null
      };

      // Calcular total_items
      inspeccionData.total_items = inspeccionData.checklist_items.length;

      console.log('Datos a enviar:', inspeccionData);

      await dbHelpers.create('inspecciones_sst', inspeccionData);

      setMensaje("¡Inspección programada exitosamente!");

      // Limpiar formulario después de 2 segundos
      setTimeout(() => {
        setForm({
          titulo: "",
          tipo_inspeccion: "Seguridad General",
          area_inspeccion: "",
          ubicacion_especifica: "",
          fecha_programada: "",
          fecha_realizada: "",
          hora_inicio: "",
          hora_fin: "",
          duracion_minutos: 0,
          inspector_responsable: "",
          acompanantes: "",
          checklist_items: "",
          observaciones_generales: "",
          recomendaciones: "",
          estado: "programada",
          prioridad: "media",
          requiere_seguimiento: false,
          fecha_seguimiento: ""
        });
        setSearchTerm("");
        setMensaje("");

        // Establecer fecha por defecto nuevamente
        const mañana = new Date();
        mañana.setDate(mañana.getDate() + 1);
        setForm(prev => ({
          ...prev,
          fecha_programada: mañana.toISOString().split('T')[0],
          hora_inicio: "08:00"
        }));
      }, 2000);

    } catch (error) {
      console.error('Error creando inspección:', error);
      setMensaje("Error al programar la inspección. Intenta nuevamente.");
      setTimeout(() => setMensaje(""), 5000);
    }

    setLoading(false);
  };

  return (
    <FormContainer>
      <FormHeader
        title="Nueva Inspección SST"
        subtitle="Programar inspección de seguridad y salud en el trabajo"
        onBack={() => navigate('/inspecciones')}
        icon="CheckSquare"
      />

      <form onSubmit={enviarInspeccion}>
        <FormMessage
          type={mensaje.includes("exitosamente") ? "success" : "error"}
          message={mensaje}
          onClose={() => setMensaje("")}
        />

        <FormSection title="Información General">
          <FormField label="Título de la inspección" required>
            <FormInput
              type="text"
              name="titulo"
              placeholder="Ej: Inspección mensual de seguridad - Planta de trituración"
              value={form.titulo}
              onChange={handleChange}
              required
            />
          </FormField>

          <FormRow columns={2}>
            <FormField label="Tipo de inspección" required>
              <FormSelect
                name="tipo_inspeccion"
                value={form.tipo_inspeccion}
                onChange={handleChange}
                options={tiposInspeccion}
                required
              />
            </FormField>

            <FormField label="Área a inspeccionar">
              <FormSelect
                name="area_inspeccion"
                value={form.area_inspeccion}
                onChange={handleChange}
                options={areasInspeccion}
                placeholder="Selecciona el área..."
              />
            </FormField>
          </FormRow>

          <FormField label="Ubicación específica">
            <FormInput
              type="text"
              name="ubicacion_especifica"
              placeholder="Describe la ubicación específica dentro del área"
              value={form.ubicacion_especifica}
              onChange={handleChange}
            />
          </FormField>
        </FormSection>

        <FormSection title="Programación">
          <FormRow columns={3}>
            <FormField label="Fecha programada" required>
              <FormInput
                type="date"
                name="fecha_programada"
                value={form.fecha_programada}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Hora de inicio">
              <FormInput
                type="time"
                name="hora_inicio"
                value={form.hora_inicio}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Hora de fin">
              <FormInput
                type="time"
                name="hora_fin"
                value={form.hora_fin}
                onChange={handleChange}
              />
            </FormField>
          </FormRow>

          {form.duracion_minutos > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Icon name="Clock" size={16} className="text-blue-600" />
                <span className="text-blue-800 font-medium">
                  Duración estimada: {Math.floor(form.duracion_minutos / 60)}h {form.duracion_minutos % 60}m
                </span>
              </div>
            </div>
          )}

          <FormRow columns={2}>
            <FormField label="Estado">
              <FormSelect
                name="estado"
                value={form.estado}
                onChange={handleChange}
                options={estadosInspeccion}
              />
            </FormField>

            <FormField label="Prioridad">
              <FormSelect
                name="prioridad"
                value={form.prioridad}
                onChange={handleChange}
                options={nivelesPrioridad}
              />
            </FormField>
          </FormRow>
        </FormSection>

        <FormSection title="Personal">
          <FormField label="Inspector responsable" required>
            <div className="relative">
              <FormInput
                type="text"
                placeholder="Buscar por nombre o cédula..."
                value={searchTerm}
                onChange={handleSearchChange}
                required
              />
              {showSugerencias && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {colaboradoresFiltrados.map((colaborador) => (
                    <div
                      key={colaborador.id}
                      className="px-4 py-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100"
                      onClick={() => handleSelectColaborador(colaborador)}
                    >
                      <div className="font-medium text-gray-900">{colaborador.nombre}</div>
                      <div className="text-sm text-gray-600">
                        Cédula: {colaborador.cedula} | Cargo: {colaborador.cargo || 'No especificado'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          <FormField label="Acompañantes">
            <FormTextarea
              name="acompanantes"
              placeholder="Nombres de los acompañantes separados por comas (opcional)"
              value={form.acompanantes}
              onChange={handleChange}
              rows={2}
            />
          </FormField>
        </FormSection>

        <FormSection title="Checklist y Observaciones">
          <FormField label="Items del checklist">
            <FormTextarea
              name="checklist_items"
              placeholder="Lista los items a verificar, uno por línea:
Señalización visible y clara
Rutas de evacuación despejadas
Extintores en su lugar y vigentes
EPP disponible y en buen estado"
              value={form.checklist_items}
              onChange={handleChange}
              rows={6}
            />
          </FormField>

          <FormField label="Observaciones generales">
            <FormTextarea
              name="observaciones_generales"
              placeholder="Observaciones adicionales sobre la inspección..."
              value={form.observaciones_generales}
              onChange={handleChange}
              rows={3}
            />
          </FormField>

          <FormField label="Recomendaciones">
            <FormTextarea
              name="recomendaciones"
              placeholder="Recomendaciones para mejorar las condiciones de seguridad..."
              value={form.recomendaciones}
              onChange={handleChange}
              rows={3}
            />
          </FormField>
        </FormSection>

        <FormSection title="Seguimiento">
          <FormRow columns={2}>
            <FormField label="¿Requiere seguimiento?">
              <div className="flex items-center space-x-3 h-full">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="requiere_seguimiento"
                    checked={form.requiere_seguimiento}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Sí, requiere seguimiento posterior
                </label>
              </div>
            </FormField>

            <FormField label="Fecha de seguimiento">
              <FormInput
                type="date"
                name="fecha_seguimiento"
                value={form.fecha_seguimiento}
                onChange={handleChange}
                disabled={!form.requiere_seguimiento}
              />
            </FormField>
          </FormRow>
        </FormSection>

        <FormButtonGroup>
          <FormButton
            variant="primary"
            type="submit"
            loading={loading}
          >
            {loading ? "Programando inspección..." : "Programar Inspección"}
          </FormButton>
        </FormButtonGroup>
      </form>
    </FormContainer>
  );
};

export default InspeccionForm;