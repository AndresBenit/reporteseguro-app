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

const tiposHallazgo = [
  'No Conformidad Mayor',
  'No Conformidad Menor',
  'Observación',
  'Oportunidad de Mejora',
  'Fortaleza'
];

const estadosHallazgo = [
  'abierto',
  'en_proceso',
  'cerrado',
  'vencido'
];

const prioridadesHallazgo = [
  'alta',
  'media',
  'baja'
];

const HallazgosForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    auditoria_id: '',
    numero_hallazgo: '',
    tipo_hallazgo: 'No Conformidad Menor',
    requisito_norma: '',
    proceso_afectado: '',
    area_afectada: '',
    descripcion_hallazgo: '',
    evidencia_objetiva: '',
    causa_raiz: '',
    accion_requerida: '',
    responsable_accion: '',
    fecha_compromiso: '',
    prioridad: 'media',
    estado_hallazgo: 'abierto'
  });

  const [auditorias, setAuditorias] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Estados para autocompletado de responsable
  const [searchTerm, setSearchTerm] = useState('');
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [colaboradoresFiltrados, setColaboradoresFiltrados] = useState([]);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
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

  // Generar número de hallazgo cuando se selecciona auditoría
  useEffect(() => {
    if (form.auditoria_id) {
      generarNumeroHallazgo(form.auditoria_id);
    }
  }, [form.auditoria_id]);

  const cargarDatosIniciales = async () => {
    try {
      const [auditoriasRes, colaboradoresRes] = await Promise.all([
        dbHelpers.getAll('auditorias_sst', {
          orderBy: 'fecha_planificada',
          ascending: false
        }),
        dbHelpers.getAll('colaboradores', {
          orderBy: 'nombre',
          ascending: true
        })
      ]);

      setAuditorias(Array.isArray(auditoriasRes) ? auditoriasRes : []);
      setColaboradores(Array.isArray(colaboradoresRes) ? colaboradoresRes : []);
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      setAuditorias([]);
      setColaboradores([]);
    }
  };

  const generarNumeroHallazgo = async (auditoriaId) => {
    try {
      // Obtener hallazgos existentes de esta auditoría
      const hallazgosExistentes = await dbHelpers.getAll('hallazgos_auditoria', {
        filter: { auditoria_id: auditoriaId }
      });

      const auditoria = auditorias.find(a => a.id === auditoriaId);
      const codigoAuditoria = auditoria?.codigo_auditoria || 'AUD';

      const numeroConsecutivo = (Array.isArray(hallazgosExistentes) ? hallazgosExistentes.length : 0) + 1;
      const numeroHallazgo = `${codigoAuditoria}-H${numeroConsecutivo.toString().padStart(3, '0')}`;

      setForm(prev => ({ ...prev, numero_hallazgo: numeroHallazgo }));
    } catch (error) {
      console.error('Error generando número de hallazgo:', error);
      const numeroGenerico = `H-${Date.now().toString().slice(-4)}`;
      setForm(prev => ({ ...prev, numero_hallazgo: numeroGenerico }));
    }
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
      responsable_accion: value
    }));
  };

  const handleSelectColaborador = (colaborador) => {
    setForm(prev => ({
      ...prev,
      responsable_accion: colaborador.nombre
    }));
    setSearchTerm(colaborador.nombre);
    setShowSugerencias(false);
  };

  const validarFormulario = () => {
    const errores = [];

    // Campos obligatorios
    if (!form.auditoria_id) errores.push('Auditoría asociada');
    if (!form.tipo_hallazgo) errores.push('Tipo de hallazgo');
    if (!form.descripcion_hallazgo.trim()) errores.push('Descripción del hallazgo');
    if (!form.evidencia_objetiva.trim()) errores.push('Evidencia objetiva');

    // Para no conformidades, requiere causa raíz y acción
    if (form.tipo_hallazgo.includes('No Conformidad')) {
      if (!form.causa_raiz.trim()) errores.push('Causa raíz (requerida para no conformidades)');
      if (!form.accion_requerida.trim()) errores.push('Acción requerida (requerida para no conformidades)');
      if (!form.responsable_accion.trim()) errores.push('Responsable de la acción (requerido para no conformidades)');
      if (!form.fecha_compromiso) errores.push('Fecha de compromiso (requerida para no conformidades)');
    }

    // Validar fecha de compromiso
    if (form.fecha_compromiso) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaCompromiso = new Date(form.fecha_compromiso);

      if (fechaCompromiso < hoy) {
        errores.push('Fecha de compromiso no puede ser anterior a hoy');
      }
    }

    return errores;
  };

  const enviarHallazgo = async (e) => {
    e.preventDefault();

    // Validar formulario
    const errores = validarFormulario();
    if (errores.length > 0) {
      setMensaje(`Por favor completa los campos obligatorios: ${errores.join(', ')}`);
      setTimeout(() => setMensaje(''), 7000);
      return;
    }

    setLoading(true);
    setMensaje('Registrando hallazgo...');

    try {
      // Preparar datos para la base de datos
      const hallazgoData = {
        auditoria_id: form.auditoria_id,
        numero_hallazgo: form.numero_hallazgo.trim(),
        tipo_hallazgo: form.tipo_hallazgo,
        requisito_norma: form.requisito_norma.trim() || null,
        proceso_afectado: form.proceso_afectado.trim() || null,
        area_afectada: form.area_afectada.trim() || null,
        descripcion_hallazgo: form.descripcion_hallazgo.trim(),
        evidencia_objetiva: form.evidencia_objetiva.trim(),
        causa_raiz: form.causa_raiz.trim() || null,
        accion_requerida: form.accion_requerida.trim() || null,
        responsable_accion: form.responsable_accion.trim() || null,
        fecha_compromiso: form.fecha_compromiso || null,
        prioridad: form.prioridad,
        estado_hallazgo: form.estado_hallazgo,
        // Campos adicionales
        fecha_cierre: null,
        evidencia_cierre: null,
        verificacion_eficacia: null,
        observaciones_cierre: null
      };

      console.log('Datos a enviar:', hallazgoData);

      await dbHelpers.create('hallazgos_auditoria', hallazgoData);

      setMensaje('¡Hallazgo registrado exitosamente!');

      // Limpiar formulario después de 2 segundos
      setTimeout(() => {
        setForm({
          auditoria_id: '',
          numero_hallazgo: '',
          tipo_hallazgo: 'No Conformidad Menor',
          requisito_norma: '',
          proceso_afectado: '',
          area_afectada: '',
          descripcion_hallazgo: '',
          evidencia_objetiva: '',
          causa_raiz: '',
          accion_requerida: '',
          responsable_accion: '',
          fecha_compromiso: '',
          prioridad: 'media',
          estado_hallazgo: 'abierto'
        });
        setSearchTerm('');
        setMensaje('');
      }, 2000);

    } catch (error) {
      console.error('Error creando hallazgo:', error);
      setMensaje('Error al registrar el hallazgo. Intenta nuevamente.');
      setTimeout(() => setMensaje(''), 5000);
    }

    setLoading(false);
  };

  // Obtener color del tipo de hallazgo
  const getHallazgoColor = (tipo) => {
    switch (tipo) {
      case 'No Conformidad Mayor': return 'text-red-600 bg-red-50 border-red-200';
      case 'No Conformidad Menor': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Observación': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Oportunidad de Mejora': return 'text-green-600 bg-green-50 border-green-200';
      case 'Fortaleza': return 'text-cyan-600 bg-cyan-50 border-cyan-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const esNoConformidad = form.tipo_hallazgo.includes('No Conformidad');

  return (
    <FormContainer>
      <FormHeader
        title="Nuevo Hallazgo de Auditoría"
        subtitle="Registrar no conformidades, observaciones y oportunidades de mejora"
        onBack={() => navigate('/auditorias')}
        icon="AlertCircle"
      />

      <form onSubmit={enviarHallazgo}>
        <FormMessage
          type={mensaje.includes('exitosamente') ? 'success' : 'error'}
          message={mensaje}
          onClose={() => setMensaje('')}
        />

        <FormSection title="Información General">
          <FormField label="Auditoría asociada" required>
            <FormSelect
              name="auditoria_id"
              value={form.auditoria_id}
              onChange={handleChange}
              placeholder="Selecciona la auditoría..."
              required
            >
              <option value="">Selecciona una auditoría...</option>
              {auditorias.map((auditoria) => (
                <option key={auditoria.id} value={auditoria.id}>
                  {auditoria.codigo_auditoria} - {auditoria.alcance?.substring(0, 50)}...
                </option>
              ))}
            </FormSelect>
          </FormField>

          <FormRow columns={2}>
            <FormField label="Número de hallazgo">
              <FormInput
                type="text"
                name="numero_hallazgo"
                placeholder="Se genera automáticamente..."
                value={form.numero_hallazgo}
                onChange={handleChange}
                disabled
              />
            </FormField>

            <FormField label="Tipo de hallazgo" required>
              <FormSelect
                name="tipo_hallazgo"
                value={form.tipo_hallazgo}
                onChange={handleChange}
                options={tiposHallazgo}
                required
              />
            </FormField>
          </FormRow>

          {/* Vista previa del tipo de hallazgo */}
          <div className={`p-4 rounded-lg border ${getHallazgoColor(form.tipo_hallazgo)}`}>
            <div className="flex items-center space-x-2">
              <Icon
                name={form.tipo_hallazgo.includes('No Conformidad') ? 'AlertTriangle' :
                     form.tipo_hallazgo === 'Observación' ? 'Eye' :
                     form.tipo_hallazgo === 'Fortaleza' ? 'Award' : 'TrendingUp'}
                size={16}
              />
              <span className="font-medium">
                {form.tipo_hallazgo}
                {esNoConformidad && ' - Requiere plan de acción'}
              </span>
            </div>
          </div>

          <FormRow columns={2}>
            <FormField label="Requisito de norma">
              <FormInput
                type="text"
                name="requisito_norma"
                placeholder="Ej: ISO 45001:2018 - 4.1, Decreto 1072..."
                value={form.requisito_norma}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Prioridad">
              <FormSelect
                name="prioridad"
                value={form.prioridad}
                onChange={handleChange}
                options={prioridadesHallazgo.map(p => ({
                  value: p,
                  label: p.charAt(0).toUpperCase() + p.slice(1)
                }))}
              />
            </FormField>
          </FormRow>

          <FormRow columns={2}>
            <FormField label="Proceso afectado">
              <FormInput
                type="text"
                name="proceso_afectado"
                placeholder="Ej: Gestión de riesgos, Capacitación SST..."
                value={form.proceso_afectado}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Área afectada">
              <FormInput
                type="text"
                name="area_afectada"
                placeholder="Ej: Planta de producción, Oficinas..."
                value={form.area_afectada}
                onChange={handleChange}
              />
            </FormField>
          </FormRow>
        </FormSection>

        <FormSection title="Descripción del Hallazgo">
          <FormField label="Descripción del hallazgo" required>
            <FormTextarea
              name="descripcion_hallazgo"
              placeholder="Describe detalladamente el hallazgo encontrado..."
              value={form.descripcion_hallazgo}
              onChange={handleChange}
              rows={4}
              required
            />
          </FormField>

          <FormField label="Evidencia objetiva" required>
            <FormTextarea
              name="evidencia_objetiva"
              placeholder="Describe las evidencias objetivas que sustentan este hallazgo (documentos, observaciones, registros)..."
              value={form.evidencia_objetiva}
              onChange={handleChange}
              rows={3}
              required
            />
          </FormField>
        </FormSection>

        {esNoConformidad && (
          <FormSection title="Plan de Acción" className="border-amber-200 bg-amber-50">
            <div className="mb-4 p-3 bg-amber-100 rounded-lg">
              <div className="flex items-center space-x-2 text-amber-800">
                <Icon name="AlertTriangle" size={16} />
                <span className="font-medium">
                  Esta sección es obligatoria para No Conformidades
                </span>
              </div>
            </div>

            <FormField label="Causa raíz" required>
              <FormTextarea
                name="causa_raiz"
                placeholder="Identifica la causa raíz del problema (análisis de por qué ocurrió)..."
                value={form.causa_raiz}
                onChange={handleChange}
                rows={3}
                required={esNoConformidad}
              />
            </FormField>

            <FormField label="Acción requerida" required>
              <FormTextarea
                name="accion_requerida"
                placeholder="Describe la acción específica requerida para corregir esta no conformidad..."
                value={form.accion_requerida}
                onChange={handleChange}
                rows={3}
                required={esNoConformidad}
              />
            </FormField>

            <FormRow columns={2}>
              <FormField label="Responsable de la acción" required>
                <div className="relative">
                  <FormInput
                    type="text"
                    placeholder="Buscar por nombre o cédula..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    required={esNoConformidad}
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

              <FormField label="Fecha de compromiso" required>
                <FormInput
                  type="date"
                  name="fecha_compromiso"
                  value={form.fecha_compromiso}
                  onChange={handleChange}
                  required={esNoConformidad}
                />
              </FormField>
            </FormRow>
          </FormSection>
        )}

        {!esNoConformidad && (
          <FormSection title="Información Adicional">
            <FormField label="Análisis/Comentarios">
              <FormTextarea
                name="causa_raiz"
                placeholder="Análisis adicional o comentarios sobre este hallazgo..."
                value={form.causa_raiz}
                onChange={handleChange}
                rows={2}
              />
            </FormField>

            <FormField label="Recomendaciones">
              <FormTextarea
                name="accion_requerida"
                placeholder="Recomendaciones para aprovechar esta oportunidad o fortaleza..."
                value={form.accion_requerida}
                onChange={handleChange}
                rows={2}
              />
            </FormField>
          </FormSection>
        )}

        <FormButtonGroup>
          <FormButton
            variant="primary"
            type="submit"
            loading={loading}
          >
            {loading ? 'Registrando hallazgo...' : 'Registrar Hallazgo'}
          </FormButton>
        </FormButtonGroup>
      </form>
    </FormContainer>
  );
};

export default HallazgosForm;