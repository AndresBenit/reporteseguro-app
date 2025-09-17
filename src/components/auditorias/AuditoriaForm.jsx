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

const tiposAuditoria = [
  'Interna',
  'Externa',
  'Gubernamental',
  'Certificación',
  'Seguimiento'
];

const estadosAuditoria = [
  'planificada',
  'en_ejecucion',
  'en_revision',
  'cerrada',
  'cancelada'
];

const metodologias = [
  'ISO 45001',
  'OHSAS 18001',
  'ISO 9001',
  'ISO 14001',
  'Integrada',
  'Personalizada'
];

const AuditoriaForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    codigo_auditoria: '',
    nombre_auditoria: '',
    tipo_auditoria: 'Interna',
    alcance_auditoria: '',
    objetivo_auditoria: '',
    criterios_auditoria: '',
    fecha_programada: '',
    fecha_inicio: '',
    fecha_fin: '',
    auditor_lider: '',
    equipo_auditor: '',
    areas_auditadas: '',
    procesos_auditados: '',
    metodologia: 'Entrevistas, Revisión Documental, Observación',
    norma_referencia: 'ISO 45001:2018',
    estado_auditoria: 'planificada'
  });

  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Estados para autocompletado de auditor líder
  const [searchTerm, setSearchTerm] = useState('');
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [colaboradoresFiltrados, setColaboradoresFiltrados] = useState([]);

  // Cargar colaboradores al montar
  useEffect(() => {
    cargarColaboradores();
    generarCodigoAuditoria();
    // Establecer fecha programada por defecto a próxima semana
    const proximaSemana = new Date();
    proximaSemana.setDate(proximaSemana.getDate() + 7);
    setForm(prev => ({
      ...prev,
      fecha_planificada: proximaSemana.toISOString().split('T')[0]
    }));
  }, []);

  // Filtrar colaboradores para autocompletado
  useEffect(() => {
    if (searchTerm.trim() === '') {
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

  const generarCodigoAuditoria = () => {
    const año = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-4);
    const codigo = `AUD-${año}-${timestamp}`;
    setForm(prev => ({ ...prev, codigo_auditoria: codigo }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setForm(prev => ({
      ...prev,
      auditor_lider: value
    }));
  };

  const handleSelectColaborador = (colaborador) => {
    setForm(prev => ({
      ...prev,
      auditor_lider: colaborador.nombre
    }));
    setSearchTerm(colaborador.nombre);
    setShowSugerencias(false);
  };

  const validarFormulario = () => {
    const errores = [];

    // Campos obligatorios
    if (!form.codigo_auditoria.trim()) errores.push('Código de auditoría');
    if (!form.nombre_auditoria.trim()) errores.push('Nombre de auditoría');
    if (!form.tipo_auditoria) errores.push('Tipo de auditoría');
    if (!form.alcance_auditoria.trim()) errores.push('Alcance');
    if (!form.fecha_programada) errores.push('Fecha programada');
    if (!form.auditor_lider.trim()) errores.push('Auditor líder');

    // Validar fechas
    if (form.fecha_inicio && form.fecha_fin) {
      if (new Date(form.fecha_fin) <= new Date(form.fecha_inicio)) {
        errores.push('Fecha de fin debe ser posterior a fecha de inicio');
      }
    }

    if (form.fecha_programada) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaProgramada = new Date(form.fecha_programada);

      if (fechaProgramada < hoy) {
        errores.push('Fecha programada no puede ser anterior a hoy');
      }
    }

    return errores;
  };

  const enviarAuditoria = async (e) => {
    e.preventDefault();

    // Validar formulario
    const errores = validarFormulario();
    if (errores.length > 0) {
      setMensaje(`Por favor completa los campos obligatorios: ${errores.join(', ')}`);
      setTimeout(() => setMensaje(''), 5000);
      return;
    }

    setLoading(true);
    setMensaje('Planificando auditoría...');

    try {
      // Preparar datos para la base de datos (estructura real de Supabase)
      const auditoriaData = {
        codigo_auditoria: form.codigo_auditoria.trim(),
        nombre_auditoria: form.nombre_auditoria.trim(),
        tipo_auditoria: form.tipo_auditoria,
        alcance_auditoria: form.alcance_auditoria.trim(),
        objetivo_auditoria: form.objetivo_auditoria.trim(),
        criterios_auditoria: form.criterios_auditoria.trim(),
        fecha_programada: form.fecha_programada,
        fecha_inicio: form.fecha_inicio || null,
        fecha_fin: form.fecha_fin || null,
        auditor_lider: form.auditor_lider.trim(),
        // Convertir equipo auditor de string a array
        equipo_auditor: form.equipo_auditor.trim()
          ? form.equipo_auditor.split(',').map(e => e.trim()).filter(e => e.length > 0)
          : [],
        // Convertir áreas de string a array
        areas_auditadas: form.areas_auditadas.trim()
          ? form.areas_auditadas.split(',').map(a => a.trim()).filter(a => a.length > 0)
          : [],
        // Convertir procesos de string a array
        procesos_auditados: form.procesos_auditados.trim()
          ? form.procesos_auditados.split(',').map(p => p.trim()).filter(p => p.length > 0)
          : [],
        metodologia: form.metodologia,
        norma_referencia: form.norma_referencia,
        estado_auditoria: form.estado_auditoria,
        // Campos con valores por defecto
        plan_auditoria: {},
        hallazgos_totales: 0,
        no_conformidades_mayores: 0,
        no_conformidades_menores: 0,
        observaciones_auditoria: 0,
        oportunidades_mejora: 0,
        fortalezas_identificadas: [],
        seguimiento_requerido: true,
        documentos_evidencia: []
      };

      console.log('Datos a enviar:', auditoriaData);

      await dbHelpers.create('auditorias_sst', auditoriaData);

      setMensaje('¡Auditoría planificada exitosamente!');

      // Limpiar formulario después de 2 segundos
      setTimeout(() => {
        setForm({
          codigo_auditoria: '',
          nombre_auditoria: '',
          tipo_auditoria: 'Interna',
          alcance_auditoria: '',
          objetivo_auditoria: '',
          criterios_auditoria: '',
          fecha_programada: '',
          fecha_inicio: '',
          fecha_fin: '',
          auditor_lider: '',
          equipo_auditor: '',
          areas_auditadas: '',
          procesos_auditados: '',
          metodologia: 'Entrevistas, Revisión Documental, Observación',
          norma_referencia: 'ISO 45001:2018',
          estado_auditoria: 'planificada'
        });
        setSearchTerm('');
        setMensaje('');

        // Generar nuevo código y fecha por defecto
        generarCodigoAuditoria();
        const proximaSemana = new Date();
        proximaSemana.setDate(proximaSemana.getDate() + 7);
        setForm(prev => ({
          ...prev,
          fecha_programada: proximaSemana.toISOString().split('T')[0]
        }));
      }, 2000);

    } catch (error) {
      console.error('Error creando auditoría:', error);
      setMensaje('Error al planificar la auditoría. Intenta nuevamente.');
      setTimeout(() => setMensaje(''), 5000);
    }

    setLoading(false);
  };

  // Calcular duración estimada
  const getDuracionEstimada = () => {
    if (form.fecha_inicio && form.fecha_fin) {
      const inicio = new Date(form.fecha_inicio);
      const fin = new Date(form.fecha_fin);
      const diffTime = Math.abs(fin - inicio);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días
      return diffDays;
    }
    return null;
  };

  const duracionEstimada = getDuracionEstimada();

  return (
    <FormContainer>
      <FormHeader
        title="Nueva Auditoría SST"
        subtitle="Planificar auditoría interna o externa del sistema de seguridad y salud en el trabajo"
        onBack={() => navigate('/auditorias')}
        icon="Settings"
      />

      <form onSubmit={enviarAuditoria}>
        <FormMessage
          type={mensaje.includes('exitosamente') ? 'success' : 'error'}
          message={mensaje}
          onClose={() => setMensaje('')}
        />

        <FormSection title="Información General">
          <FormRow columns={2}>
            <FormField label="Código de auditoría" required>
              <FormInput
                type="text"
                name="codigo_auditoria"
                placeholder="Ej: AUD-2024-001"
                value={form.codigo_auditoria}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Tipo de auditoría" required>
              <FormSelect
                name="tipo_auditoria"
                value={form.tipo_auditoria}
                onChange={handleChange}
                options={tiposAuditoria}
                required
              />
            </FormField>
          </FormRow>

          <FormField label="Nombre de la auditoría" required>
            <FormInput
              type="text"
              name="nombre_auditoria"
              placeholder="Ej: Auditoría Interna del Sistema de Gestión SST"
              value={form.nombre_auditoria}
              onChange={handleChange}
              required
            />
          </FormField>

          <FormField label="Alcance de la auditoría" required>
            <FormTextarea
              name="alcance_auditoria"
              placeholder="Describe el alcance específico de la auditoría (áreas, procesos, normas a evaluar)..."
              value={form.alcance_auditoria}
              onChange={handleChange}
              rows={3}
              required
            />
          </FormField>

          <FormField label="Objetivo de la auditoría" required>
            <FormTextarea
              name="objetivo_auditoria"
              placeholder="Objetivo específico de esta auditoría..."
              value={form.objetivo_auditoria}
              onChange={handleChange}
              rows={2}
              required
            />
          </FormField>

          <FormField label="Criterios de auditoría">
            <FormTextarea
              name="criterios_auditoria"
              placeholder="Lista los criterios de auditoría separados por comas:
ISO 45001:2018, Decreto 1072/2015, Procedimientos internos, etc."
              value={form.criterios_auditoria}
              onChange={handleChange}
              rows={3}
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

            <FormField label="Fecha de inicio">
              <FormInput
                type="date"
                name="fecha_inicio"
                value={form.fecha_inicio}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Fecha de fin">
              <FormInput
                type="date"
                name="fecha_fin"
                value={form.fecha_fin}
                onChange={handleChange}
              />
            </FormField>
          </FormRow>

          {duracionEstimada && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Icon name="Calendar" size={16} className="text-blue-600" />
                <span className="text-blue-800 font-medium">
                  Duración estimada: {duracionEstimada} día{duracionEstimada > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          <FormRow columns={2}>
            <FormField label="Metodología">
              <FormSelect
                name="metodologia"
                value={form.metodologia}
                onChange={handleChange}
                options={metodologias}
              />
            </FormField>

            <FormField label="Estado inicial">
              <FormSelect
                name="estado_auditoria"
                value={form.estado_auditoria}
                onChange={handleChange}
                options={estadosAuditoria.map(estado => ({
                  value: estado,
                  label: estado.charAt(0).toUpperCase() + estado.slice(1).replace('_', ' ')
                }))}
              />
            </FormField>
          </FormRow>
        </FormSection>

        <FormSection title="Equipo Auditor">
          <FormField label="Auditor líder" required>
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

          <FormField label="Equipo auditor">
            <FormTextarea
              name="equipo_auditor"
              placeholder="Nombres de los auditores del equipo separados por comas..."
              value={form.equipo_auditor}
              onChange={handleChange}
              rows={2}
            />
          </FormField>

          <FormField label="Auditados">
            <FormTextarea
              name="auditados"
              placeholder="Nombres de las personas a auditar separados por comas..."
              value={form.auditados}
              onChange={handleChange}
              rows={2}
            />
          </FormField>
        </FormSection>

        <FormSection title="Alcance Detallado">
          <FormField label="Áreas a auditar">
            <FormTextarea
              name="areas_auditadas"
              placeholder="Áreas específicas separadas por comas:
Planta de producción, Oficinas administrativas, Almacén, etc."
              value={form.areas_auditadas}
              onChange={handleChange}
              rows={2}
            />
          </FormField>

          <FormField label="Procesos a auditar">
            <FormTextarea
              name="procesos_auditados"
              placeholder="Procesos específicos separados por comas:
Gestión de riesgos, Capacitación SST, Investigación de incidentes, etc."
              value={form.procesos_auditados}
              onChange={handleChange}
              rows={2}
            />
          </FormField>

          <FormField label="Norma de referencia">
            <FormInput
              type="text"
              name="norma_referencia"
              placeholder="Ej: ISO 45001:2018"
              value={form.norma_referencia}
              onChange={handleChange}
            />
          </FormField>
        </FormSection>

        <FormSection title="Observaciones">
          <FormField label="Observaciones adicionales">
            <FormTextarea
              name="observaciones"
              placeholder="Observaciones adicionales sobre la planificación de la auditoría..."
              value={form.observaciones}
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
            {loading ? 'Planificando auditoría...' : 'Planificar Auditoría'}
          </FormButton>
        </FormButtonGroup>
      </form>
    </FormContainer>
  );
};

export default AuditoriaForm;