import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dbHelpers } from "../../services/supabase";
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

const areasAccidente = [
  "Central de mezclas", "Central de cribado", "Laboratorio",
  "Caseta de procesamiento de muestras", "Cárcamo",
  "Almacenamiento de combustible", "Taller de mantenimiento",
  "Patio de almacenamiento 7", "Patio de almacenamiento de la pluma",
  "Centro industrial 2", "Hornos solera", "Almacén centro industrial",
  "Ambiental", "Oficinas administrativas", "Comedor",
  "Estacionamiento", "Acceso principal", "Área de carga y descarga"
];

const tiposAccidente = [
  "Caída",
  "Golpe",
  "Corte",
  "Atrapamiento",
  "Contacto",
  "Exposición",
  "Incendio",
  "Explosión",
  "Tránsito",
  "Otro"
];

const nivelesGravedad = [
  "Leve",
  "Grave",
  "Mortal",
  "Catastrófico"
];

const metodologiasInvestigacion = [
  "Árbol de Causas",
  "Espina de Pescado (Ishikawa)",
  "Análisis de Barreras",
  "TRIPOD",
  "Método SCRA",
  "Análisis de Factores Humanos",
  "Otro"
];

const estadosInvestigacion = [
  "abierta",
  "en_investigacion",
  "cerrada",
  "reabierta"
];

const InvestigacionForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    numero_caso: "",
    fecha_accidente: "",
    hora_accidente: "",
    lugar_accidente: "",
    area_accidente: "",
    tipo_accidente: "",
    gravedad: "",
    persona_afectada: "",
    cedula_afectado: "",
    cargo_afectado: "",
    descripcion_hechos: "",
    testigos: "",
    lesiones_descripcion: "",
    parte_cuerpo_afectada: "",
    dias_incapacidad: 0,
    atencion_medica: false,
    centro_atencion: "",
    investigador_principal: "",
    fecha_inicio_investigacion: "",
    fecha_fin_investigacion: "",
    metodologia_investigacion: "Árbol de Causas",
    evidencias_recolectadas: "",
    estado_investigacion: "iniciada",
    conclusiones: "",
    recomendaciones: ""
  });

  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Estados para autocompletado de colaboradores
  const [searchTerm, setSearchTerm] = useState("");
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [colaboradoresFiltrados, setColaboradoresFiltrados] = useState([]);

  // Cargar colaboradores al montar
  useEffect(() => {
    cargarColaboradores();
    generarNumeroCaso();
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

  const generarNumeroCaso = () => {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);

    const numeroCaso = `INV-${año}${mes}${dia}-${timestamp}`;
    setForm(prev => ({ ...prev, numero_caso: numeroCaso }));
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
      persona_afectada: value,
      cedula_afectado: "",
      cargo_afectado: ""
    }));
  };

  const handleSelectColaborador = (colaborador) => {
    setForm(prev => ({
      ...prev,
      persona_afectada: colaborador.nombre,
      cedula_afectado: colaborador.cedula || "",
      cargo_afectado: colaborador.cargo || ""
    }));
    setSearchTerm(colaborador.nombre);
    setShowSugerencias(false);
  };

  const validarFormulario = () => {
    const errores = [];

    // Campos obligatorios
    if (!form.numero_caso.trim()) errores.push("Número de caso");
    if (!form.fecha_accidente) errores.push("Fecha del accidente");
    if (!form.hora_accidente) errores.push("Hora del accidente");
    if (!form.lugar_accidente.trim()) errores.push("Lugar del accidente");
    if (!form.area_accidente) errores.push("Área del accidente");
    if (!form.tipo_accidente) errores.push("Tipo de accidente");
    if (!form.gravedad) errores.push("Gravedad");
    if (!form.persona_afectada.trim()) errores.push("Persona afectada");
    if (!form.cedula_afectado.trim()) errores.push("Cédula del afectado");
    if (!form.cargo_afectado.trim()) errores.push("Cargo del afectado");
    if (!form.descripcion_hechos.trim()) errores.push("Descripción de los hechos");
    if (!form.investigador_principal.trim()) errores.push("Investigador principal");
    if (!form.fecha_inicio_investigacion) errores.push("Fecha inicio de investigación");

    return errores;
  };

  const enviarInvestigacion = async (e) => {
    e.preventDefault();

    // Validar formulario
    const errores = validarFormulario();
    if (errores.length > 0) {
      setMensaje(`Por favor completa los campos obligatorios: ${errores.join(", ")}`);
      setTimeout(() => setMensaje(""), 5000);
      return;
    }

    setLoading(true);
    setMensaje("Guardando investigación...");

    try {
      // Preparar datos para la base de datos
      const investigacionData = {
        numero_caso: form.numero_caso.trim(),
        fecha_accidente: form.fecha_accidente,
        hora_accidente: form.hora_accidente,
        lugar_accidente: form.lugar_accidente.trim(),
        area_accidente: form.area_accidente,
        tipo_accidente: form.tipo_accidente,
        gravedad: form.gravedad,
        persona_afectada: form.persona_afectada.trim(),
        cedula_afectado: form.cedula_afectado.trim(),
        cargo_afectado: form.cargo_afectado.trim(),
        descripcion_hechos: form.descripcion_hechos.trim(),
        // Convertir testigos de string a array si no está vacío
        testigos: form.testigos.trim()
          ? form.testigos.split(',').map(t => t.trim()).filter(t => t.length > 0)
          : [],
        lesiones_descripcion: form.lesiones_descripcion.trim() || null,
        parte_cuerpo_afectada: form.parte_cuerpo_afectada.trim() || null,
        dias_incapacidad: Number(form.dias_incapacidad) || 0,
        atencion_medica: Boolean(form.atencion_medica),
        centro_atencion: form.centro_atencion.trim() || null,
        investigador_principal: form.investigador_principal.trim(),
        fecha_inicio_investigacion: form.fecha_inicio_investigacion,
        fecha_fin_investigacion: form.fecha_fin_investigacion || null,
        metodologia_investigacion: form.metodologia_investigacion,
        // Convertir evidencias de string a JSON si no está vacío
        evidencias_recolectadas: form.evidencias_recolectadas.trim()
          ? form.evidencias_recolectadas.split(',').map(e => ({
              descripcion: e.trim(),
              fecha_recoleccion: new Date().toISOString(),
              tipo: "general"
            })).filter(e => e.descripcion.length > 0)
          : [],
        estado_investigacion: form.estado_investigacion,
        conclusiones: form.conclusiones.trim() || null,
        recomendaciones: form.recomendaciones.trim() || null
      };

      console.log('Datos a enviar:', investigacionData);

      await dbHelpers.create('investigaciones_accidentes', investigacionData);

      setMensaje("¡Investigación registrada exitosamente!");

      // Limpiar formulario después de 2 segundos
      setTimeout(() => {
        // Reset form con valores por defecto
        setForm({
          numero_caso: "",
          fecha_accidente: "",
          hora_accidente: "",
          lugar_accidente: "",
          area_accidente: "",
          tipo_accidente: "",
          gravedad: "",
          persona_afectada: "",
          cedula_afectado: "",
          cargo_afectado: "",
          descripcion_hechos: "",
          testigos: "",
          lesiones_descripcion: "",
          parte_cuerpo_afectada: "",
          dias_incapacidad: 0,
          atencion_medica: false,
          centro_atencion: "",
          investigador_principal: "",
          fecha_inicio_investigacion: "",
          fecha_fin_investigacion: "",
          metodologia_investigacion: "Árbol de Causas",
          evidencias_recolectadas: "",
          estado_investigacion: "iniciada",
          conclusiones: "",
          recomendaciones: ""
        });
        setSearchTerm("");
        setMensaje("");
        generarNumeroCaso();
      }, 2000);

    } catch (error) {
      console.error('Error creando investigación:', error);
      setMensaje("Error al registrar la investigación. Intenta nuevamente.");
      setTimeout(() => setMensaje(""), 5000);
    }

    setLoading(false);
  };

  return (
    <FormContainer>
      <FormHeader
        title="Investigación de Accidentes SST"
        subtitle="Registro detallado de investigación de accidentes laborales"
        onBack={() => navigate('/investigacion')}
        icon="AlertTriangle"
      />

      <form onSubmit={enviarInvestigacion}>
        <FormMessage
          type={mensaje.includes("exitosamente") ? "success" : "error"}
          message={mensaje}
          onClose={() => setMensaje("")}
        />

        <FormSection title="Información del Caso">
          <FormRow columns={2}>
            <FormField label="Número de caso" required>
              <FormInput
                type="text"
                name="numero_caso"
                value={form.numero_caso}
                onChange={handleChange}
                readOnly
                className="bg-gray-50"
                required
              />
            </FormField>

            <FormField label="Fecha del accidente" required>
              <FormInput
                type="date"
                name="fecha_accidente"
                value={form.fecha_accidente}
                onChange={handleChange}
                required
              />
            </FormField>
          </FormRow>

          <FormRow columns={3}>
            <FormField label="Hora del accidente" required>
              <FormInput
                type="time"
                name="hora_accidente"
                value={form.hora_accidente}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Área del accidente" required>
              <FormSelect
                name="area_accidente"
                value={form.area_accidente}
                onChange={handleChange}
                options={areasAccidente}
                placeholder="Selecciona el área..."
                required
              />
            </FormField>

            <FormField label="Gravedad" required>
              <FormSelect
                name="gravedad"
                value={form.gravedad}
                onChange={handleChange}
                options={nivelesGravedad}
                placeholder="Selecciona gravedad..."
                required
              />
            </FormField>
          </FormRow>

          <FormRow columns={2}>
            <FormField label="Lugar específico del accidente" required>
              <FormInput
                type="text"
                name="lugar_accidente"
                placeholder="Describe el lugar específico..."
                value={form.lugar_accidente}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Tipo de accidente" required>
              <FormSelect
                name="tipo_accidente"
                value={form.tipo_accidente}
                onChange={handleChange}
                options={tiposAccidente}
                placeholder="Selecciona el tipo..."
                required
              />
            </FormField>
          </FormRow>
        </FormSection>

        <FormSection title="Persona Afectada">
          <FormField label="Buscar colaborador afectado" required>
            <div className="relative">
              <FormInput
                type="text"
                placeholder="Nombre o cédula del colaborador afectado..."
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
            <FormField label="Cédula del afectado" required>
              <FormInput
                type="text"
                name="cedula_afectado"
                placeholder="Cédula automática"
                value={form.cedula_afectado}
                onChange={handleChange}
                readOnly
                className="bg-gray-50"
                required
              />
            </FormField>

            <FormField label="Cargo del afectado" required>
              <FormInput
                type="text"
                name="cargo_afectado"
                placeholder="Cargo automático"
                value={form.cargo_afectado}
                onChange={handleChange}
                required
              />
            </FormField>
          </FormRow>
        </FormSection>

        <FormSection title="Descripción del Accidente">
          <FormField label="Descripción detallada de los hechos" required>
            <FormTextarea
              name="descripcion_hechos"
              placeholder="Describe detalladamente cómo ocurrió el accidente, las circunstancias, actividades que se realizaban, etc..."
              value={form.descripcion_hechos}
              onChange={handleChange}
              rows={5}
              required
            />
          </FormField>

          <FormField label="Testigos del accidente">
            <FormTextarea
              name="testigos"
              placeholder="Nombres de los testigos separados por comas (opcional)"
              value={form.testigos}
              onChange={handleChange}
              rows={2}
            />
          </FormField>
        </FormSection>

        <FormSection title="Lesiones y Atención Médica">
          <FormRow columns={2}>
            <FormField label="Descripción de lesiones">
              <FormTextarea
                name="lesiones_descripcion"
                placeholder="Describe las lesiones sufridas..."
                value={form.lesiones_descripcion}
                onChange={handleChange}
                rows={3}
              />
            </FormField>

            <FormField label="Parte del cuerpo afectada">
              <FormInput
                type="text"
                name="parte_cuerpo_afectada"
                placeholder="Ej: Mano derecha, pierna izquierda..."
                value={form.parte_cuerpo_afectada}
                onChange={handleChange}
              />
            </FormField>
          </FormRow>

          <FormRow columns={3}>
            <FormField label="Días de incapacidad">
              <FormInput
                type="number"
                name="dias_incapacidad"
                value={form.dias_incapacidad}
                onChange={handleChange}
                min="0"
              />
            </FormField>

            <FormField label="¿Requirió atención médica?">
              <div className="flex items-center space-x-3 h-full">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="atencion_medica"
                    checked={form.atencion_medica}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Sí, requirió atención médica
                </label>
              </div>
            </FormField>

            <FormField label="Centro de atención">
              <FormInput
                type="text"
                name="centro_atencion"
                placeholder="Hospital, clínica, etc..."
                value={form.centro_atencion}
                onChange={handleChange}
                disabled={!form.atencion_medica}
              />
            </FormField>
          </FormRow>
        </FormSection>

        <FormSection title="Investigación">
          <FormRow columns={2}>
            <FormField label="Investigador principal" required>
              <FormInput
                type="text"
                name="investigador_principal"
                placeholder="Nombre del responsable de la investigación"
                value={form.investigador_principal}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Fecha inicio investigación" required>
              <FormInput
                type="date"
                name="fecha_inicio_investigacion"
                value={form.fecha_inicio_investigacion}
                onChange={handleChange}
                required
              />
            </FormField>
          </FormRow>

          <FormRow columns={3}>
            <FormField label="Fecha fin investigación">
              <FormInput
                type="date"
                name="fecha_fin_investigacion"
                value={form.fecha_fin_investigacion}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Metodología">
              <FormSelect
                name="metodologia_investigacion"
                value={form.metodologia_investigacion}
                onChange={handleChange}
                options={metodologiasInvestigacion}
              />
            </FormField>

            <FormField label="Estado de investigación">
              <FormSelect
                name="estado_investigacion"
                value={form.estado_investigacion}
                onChange={handleChange}
                options={estadosInvestigacion}
              />
            </FormField>
          </FormRow>

          <FormField label="Evidencias recolectadas">
            <FormTextarea
              name="evidencias_recolectadas"
              placeholder="Lista las evidencias recolectadas, separadas por comas (fotografías, videos, documentos, etc.)"
              value={form.evidencias_recolectadas}
              onChange={handleChange}
              rows={3}
            />
          </FormField>
        </FormSection>

        <FormSection title="Conclusiones y Recomendaciones">
          <FormField label="Conclusiones de la investigación">
            <FormTextarea
              name="conclusiones"
              placeholder="Conclusiones obtenidas de la investigación..."
              value={form.conclusiones}
              onChange={handleChange}
              rows={4}
            />
          </FormField>

          <FormField label="Recomendaciones">
            <FormTextarea
              name="recomendaciones"
              placeholder="Recomendaciones para prevenir futuros accidentes similares..."
              value={form.recomendaciones}
              onChange={handleChange}
              rows={4}
            />
          </FormField>
        </FormSection>

        <FormButtonGroup>
          <FormButton
            variant="primary"
            type="submit"
            loading={loading}
          >
            {loading ? "Registrando investigación..." : "Registrar Investigación"}
          </FormButton>
        </FormButtonGroup>
      </form>
    </FormContainer>
  );
};

export default InvestigacionForm;