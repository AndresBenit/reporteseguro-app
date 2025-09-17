import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbHelpers } from '../../services/supabase';
import { Icon } from '../common/Icons';
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
} from '../common/FormComponents';

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

const frecuencias = [
  "diaria",
  "semanal",
  "quincenal",
  "mensual",
  "bimensual",
  "trimestral",
  "semestral",
  "anual"
];

const diasSemana = [
  { valor: 1, nombre: "Lunes" },
  { valor: 2, nombre: "Martes" },
  { valor: 3, nombre: "Miércoles" },
  { valor: 4, nombre: "Jueves" },
  { valor: 5, nombre: "Viernes" },
  { valor: 6, nombre: "Sábado" },
  { valor: 0, nombre: "Domingo" }
];

const nivelesPrioridad = [
  "baja",
  "media",
  "alta",
  "critica"
];

const ProgramacionForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre_programacion: "",
    descripcion: "",
    tipo_inspeccion: "Seguridad General",
    area_inspeccion: "",
    frecuencia: "mensual",
    dia_semana: null,
    dia_mes: null,
    hora_programada: "08:00",
    inspector_asignado: "",
    prioridad: "media",
    activa: true,
    fecha_inicio: "",
    fecha_fin: "",
    checklist_template: "",
    observaciones_template: ""
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
    // Establecer fecha de inicio por defecto a mañana
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    setForm(prev => ({
      ...prev,
      fecha_inicio: mañana.toISOString().split('T')[0]
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
      inspector_asignado: value
    }));
  };

  const handleSelectColaborador = (colaborador) => {
    setForm(prev => ({
      ...prev,
      inspector_asignado: colaborador.nombre
    }));
    setSearchTerm(colaborador.nombre);
    setShowSugerencias(false);
  };

  const validarFormulario = () => {
    const errores = [];

    // Campos obligatorios
    if (!form.nombre_programacion.trim()) errores.push("Nombre de la programación");
    if (!form.tipo_inspeccion) errores.push("Tipo de inspección");
    if (!form.frecuencia) errores.push("Frecuencia");
    if (!form.fecha_inicio) errores.push("Fecha de inicio");
    if (!form.inspector_asignado.trim()) errores.push("Inspector asignado");

    // Validaciones específicas por frecuencia
    if (form.frecuencia === 'semanal' && (form.dia_semana === null || form.dia_semana === '')) {
      errores.push("Día de la semana (requerido para frecuencia semanal)");
    }

    if (['mensual', 'bimensual', 'trimestral'].includes(form.frecuencia)) {
      if (!form.dia_mes || form.dia_mes < 1 || form.dia_mes > 28) {
        errores.push("Día del mes (debe ser entre 1 y 28)");
      }
    }

    // Validar fechas
    if (form.fecha_fin && form.fecha_inicio) {
      if (new Date(form.fecha_fin) <= new Date(form.fecha_inicio)) {
        errores.push("Fecha de fin debe ser posterior a fecha de inicio");
      }
    }

    return errores;
  };

  const enviarProgramacion = async (e) => {
    e.preventDefault();

    // Validar formulario
    const errores = validarFormulario();
    if (errores.length > 0) {
      setMensaje(`Por favor completa los campos obligatorios: ${errores.join(", ")}`);
      setTimeout(() => setMensaje(""), 5000);
      return;
    }

    setLoading(true);
    setMensaje("Guardando programación...");

    try {
      // Preparar datos para la base de datos
      const programacionData = {
        nombre_programacion: form.nombre_programacion.trim(),
        descripcion: form.descripcion.trim() || null,
        tipo_inspeccion: form.tipo_inspeccion,
        area_inspeccion: form.area_inspeccion || null,
        frecuencia: form.frecuencia,
        dia_semana: form.dia_semana !== null && form.dia_semana !== '' ? parseInt(form.dia_semana) : null,
        dia_mes: form.dia_mes ? parseInt(form.dia_mes) : null,
        hora_programada: form.hora_programada || "08:00",
        inspector_asignado: form.inspector_asignado.trim(),
        prioridad: form.prioridad,
        activa: Boolean(form.activa),
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin || null,
        // Convertir templates de string a array/JSON
        checklist_template: form.checklist_template.trim()
          ? form.checklist_template.split('\n').map((item, index) => ({
              id: index + 1,
              descripcion: item.trim(),
              obligatorio: true
            })).filter(item => item.descripcion.length > 0)
          : [],
        observaciones_template: form.observaciones_template.trim() || null,
        proxima_ejecucion: form.fecha_inicio, // Se calculará automáticamente por la base de datos
        ultima_ejecucion: null,
        total_ejecutadas: 0
      };

      console.log('Datos a enviar:', programacionData);

      await dbHelpers.create('programacion_inspecciones', programacionData);

      setMensaje("¡Programación creada exitosamente!");

      // Limpiar formulario después de 2 segundos
      setTimeout(() => {
        setForm({
          nombre_programacion: "",
          descripcion: "",
          tipo_inspeccion: "Seguridad General",
          area_inspeccion: "",
          frecuencia: "mensual",
          dia_semana: null,
          dia_mes: null,
          hora_programada: "08:00",
          inspector_asignado: "",
          prioridad: "media",
          activa: true,
          fecha_inicio: "",
          fecha_fin: "",
          checklist_template: "",
          observaciones_template: ""
        });
        setSearchTerm("");
        setMensaje("");

        // Establecer fecha por defecto nuevamente
        const mañana = new Date();
        mañana.setDate(mañana.getDate() + 1);
        setForm(prev => ({
          ...prev,
          fecha_inicio: mañana.toISOString().split('T')[0]
        }));
      }, 2000);

    } catch (error) {
      console.error('Error creando programación:', error);
      setMensaje("Error al crear la programación. Intenta nuevamente.");
      setTimeout(() => setMensaje(""), 5000);
    }

    setLoading(false);
  };

  // Generar descripción automática de la frecuencia
  const getDescripcionFrecuencia = () => {
    const { frecuencia, dia_semana, dia_mes, hora_programada } = form;

    let descripcion = "Se ejecutará ";

    switch (frecuencia) {
      case 'diaria':
        descripcion += `todos los días a las ${hora_programada}`;
        break;
      case 'semanal':
        const nombreDia = dia_semana !== null ? diasSemana.find(d => d.valor === parseInt(dia_semana))?.nombre : 'día seleccionado';
        descripcion += `todos los ${nombreDia || 'días'} a las ${hora_programada}`;
        break;
      case 'quincenal':
        descripcion += `cada 15 días a las ${hora_programada}`;
        break;
      case 'mensual':
        descripcion += `el día ${dia_mes || 'X'} de cada mes a las ${hora_programada}`;
        break;
      case 'bimensual':
        descripcion += `el día ${dia_mes || 'X'} cada 2 meses a las ${hora_programada}`;
        break;
      case 'trimestral':
        descripcion += `el día ${dia_mes || 'X'} cada 3 meses a las ${hora_programada}`;
        break;
      case 'semestral':
        descripcion += `cada 6 meses a las ${hora_programada}`;
        break;
      case 'anual':
        descripcion += `una vez al año a las ${hora_programada}`;
        break;
      default:
        descripcion += `según frecuencia ${frecuencia}`;
    }

    return descripcion;
  };

  return (
    <FormContainer>
      <FormHeader
        title="Programación de Inspecciones"
        subtitle="Configurar inspecciones automáticas y recurrentes"
        onBack={() => navigate('/inspecciones')}
        icon="Calendar"
      />

      <form onSubmit={enviarProgramacion}>
        <FormMessage
          type={mensaje.includes("exitosamente") ? "success" : "error"}
          message={mensaje}
          onClose={() => setMensaje("")}
        />

        <FormSection title="Información General">
          <FormField label="Nombre de la programación" required>
            <FormInput
              type="text"
              name="nombre_programacion"
              placeholder="Ej: Inspección mensual de seguridad - Planta de trituración"
              value={form.nombre_programacion}
              onChange={handleChange}
              required
            />
          </FormField>

          <FormField label="Descripción">
            <FormTextarea
              name="descripcion"
              placeholder="Descripción detallada de la programación de inspecciones..."
              value={form.descripcion}
              onChange={handleChange}
              rows={3}
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
        </FormSection>

        <FormSection title="Configuración de Frecuencia">
          <FormRow columns={2}>
            <FormField label="Frecuencia" required>
              <FormSelect
                name="frecuencia"
                value={form.frecuencia}
                onChange={handleChange}
                options={frecuencias}
                required
              />
            </FormField>

            <FormField label="Hora programada" required>
              <FormInput
                type="time"
                name="hora_programada"
                value={form.hora_programada}
                onChange={handleChange}
                required
              />
            </FormField>
          </FormRow>

          {/* Configuraciones específicas por frecuencia */}
          {form.frecuencia === 'semanal' && (
            <FormField label="Día de la semana" required>
              <FormSelect
                name="dia_semana"
                value={form.dia_semana || ''}
                onChange={handleChange}
                options={diasSemana.map(dia => ({ value: dia.valor, label: dia.nombre }))}
                placeholder="Selecciona el día..."
                required
              />
            </FormField>
          )}

          {['mensual', 'bimensual', 'trimestral'].includes(form.frecuencia) && (
            <FormField label="Día del mes" required>
              <FormInput
                type="number"
                name="dia_mes"
                min="1"
                max="28"
                placeholder="Día del mes (1-28)"
                value={form.dia_mes || ''}
                onChange={handleChange}
                required
              />
              <p className="text-sm text-slate-600 mt-1">
                Se recomienda usar días del 1 al 28 para evitar problemas en meses con menos días
              </p>
            </FormField>
          )}

          {/* Vista previa de la frecuencia */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Icon name="Info" size={16} className="text-blue-600" />
              <div>
                <span className="text-blue-800 font-medium">Vista previa: </span>
                <span className="text-blue-700">{getDescripcionFrecuencia()}</span>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection title="Configuración de Fechas">
          <FormRow columns={2}>
            <FormField label="Fecha de inicio" required>
              <FormInput
                type="date"
                name="fecha_inicio"
                value={form.fecha_inicio}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Fecha de fin (opcional)">
              <FormInput
                type="date"
                name="fecha_fin"
                value={form.fecha_fin}
                onChange={handleChange}
              />
            </FormField>
          </FormRow>
        </FormSection>

        <FormSection title="Asignación">
          <FormField label="Inspector asignado" required>
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

          <FormRow columns={2}>
            <FormField label="Prioridad">
              <FormSelect
                name="prioridad"
                value={form.prioridad}
                onChange={handleChange}
                options={nivelesPrioridad}
              />
            </FormField>

            <FormField label="Estado">
              <div className="flex items-center space-x-3 h-full">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="activa"
                    checked={form.activa}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Programación activa
                </label>
              </div>
            </FormField>
          </FormRow>
        </FormSection>

        <FormSection title="Templates">
          <FormField label="Template de checklist">
            <FormTextarea
              name="checklist_template"
              placeholder="Lista los items del checklist template, uno por línea:
Señalización visible y clara
Rutas de evacuación despejadas
Extintores en su lugar y vigentes
EPP disponible y en buen estado"
              value={form.checklist_template}
              onChange={handleChange}
              rows={6}
            />
            <p className="text-sm text-slate-600 mt-1">
              Estos items se incluirán automáticamente en cada inspección generada
            </p>
          </FormField>

          <FormField label="Template de observaciones">
            <FormTextarea
              name="observaciones_template"
              placeholder="Template de observaciones que se incluirá en cada inspección..."
              value={form.observaciones_template}
              onChange={handleChange}
              rows={3}
            />
          </FormField>
        </FormSection>

        <FormButtonGroup>
          <FormButton
            variant="primary"
            type="submit"
            loading={loading}
          >
            {loading ? "Creando programación..." : "Crear Programación"}
          </FormButton>
        </FormButtonGroup>
      </form>
    </FormContainer>
  );
};

export default ProgramacionForm;