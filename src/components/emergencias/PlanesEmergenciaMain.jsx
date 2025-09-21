import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Icon } from '../common/Icons';

const PlanesEmergenciaMain = () => {
  const [vistaActiva, setVistaActiva] = useState('dashboard');
  const [planes, setPlanes] = useState([]);
  const [simulacros, setSimulacros] = useState([]);
  const [brigadas, setBrigadas] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentForm, setCurrentForm] = useState('plan');

  const [formData, setFormData] = useState({
    // Campos básicos
    nombre: '',
    codigo_plan: '',
    version: '1.0',
    estado: 'borrador',
    tipo_emergencia: 'evacuacion',
    area_aplicacion: 'general',
    alcance: '',

    // Campos de gestión
    responsable_plan: '',
    fecha_elaboracion: new Date().toISOString().split('T')[0],
    fecha_revision: '',
    fecha_aprobacion: '',
    fecha_vigencia: '',

    // Contenido del plan
    objetivos: [],
    alcance_detallado: '',
    marco_legal: '',
    definiciones: {},
    roles_responsabilidades: {},
    estructura_organizacional: {},

    // Procedimientos y activación
    procedimiento_activacion: {},
    procedimientos_respuesta: {},
    comunicaciones: {},
    evacuacion: {},

    // Recursos y equipos
    recursos_materiales: [],
    recursos_humanos: [],
    equipos_emergencia: [],

    // Información de contacto y ubicaciones
    contactos_emergencia: [],
    rutas_evacuacion: [],
    puntos_encuentro: [],
    areas_seguras: [],

    // Capacitación y entrenamiento
    programa_capacitacion: {},
    cronograma_simulacros: [],

    // Documentación
    documentos_anexos: [],
    planos_mapas: [],

    // Seguimiento
    observaciones: '',
    lecciones_aprendidas: '',
    mejoras_identificadas: []
  });

  const [simulacroData, setSimulacroData] = useState({
    // Campos básicos
    plan_emergencia_id: '',
    codigo_simulacro: '',
    nombre_simulacro: '',
    tipo_simulacro: 'programado',
    estado: 'programado',

    // Fechas y horarios
    fecha_simulacro: new Date().toISOString().split('T')[0],
    hora_inicio: '09:00',
    hora_fin: '',
    duracion_estimada: 30,

    // Ubicación y alcance
    area_simulacro: 'general',
    ubicaciones_especificas: [],
    tipo_evacuacion: 'total',

    // Participantes
    participantes_esperados: 0,
    participantes_reales: 0,
    participantes_ausentes: [],

    // Objetivos y escenario
    objetivos_simulacro: [],
    escenario_emergencia: '',
    condiciones_climaticas: '',

    // Responsables
    coordinador_general: '',
    responsable_simulacro: '',
    observadores: [],
    evaluadores: [],

    // Tiempos y resultados
    tiempo_evacuacion_objetivo: 5,
    tiempo_evacuacion_real: 0,
    tiempo_activacion_alarma: 0,
    tiempo_llegada_brigadas: 0,

    // Evaluación
    calificacion_general: 0,
    aspectos_positivos: [],
    oportunidades_mejora: [],
    acciones_correctivas: [],

    // Documentación
    evidencias_fotograficas: [],
    video_simulacro: '',
    acta_simulacro: '',

    // Seguimiento
    observaciones: '',
    recomendaciones: '',
    fecha_proximo_simulacro: ''
  });

  const [brigadaData, setBrigadaData] = useState({
    // Información básica
    nombre: '',
    codigo_brigada: '',
    tipo_brigada: 'evacuacion',
    estado: 'activo',

    // Colaborador
    colaborador_id: '',
    cargo_brigada: 'brigadista',
    es_coordinador: false,

    // Responsabilidades
    area_responsabilidad: '',
    responsabilidades_especificas: [],
    ubicacion_base: '',

    // Capacitación
    nivel_capacitacion: 'basico',
    fecha_capacitacion: '',
    vigencia_capacitacion: '',
    institucion_capacitadora: '',
    certificado_url: '',

    // Equipamiento
    equipos_asignados: [],
    ubicacion_equipos: '',

    // Disponibilidad
    turnos_disponibles: [],
    contacto_emergencia: '',
    telefono_emergencia: '',

    // Seguimiento
    participacion_simulacros: [],
    evaluaciones_desempeno: [],

    observaciones: ''
  });

  const tiposEmergencia = [
    'evacuacion', 'incendio', 'sismo', 'accidente_industrial',
    'derrame_quimico', 'emergencia_medica', 'colapso_estructural',
    'inundacion', 'explosion', 'amenaza_terrorista', 'otro'
  ];

  const estadosPlanes = ['borrador', 'revision', 'aprobado', 'vigente', 'desactualizado', 'obsoleto'];
  const tiposSimulacro = ['programado', 'sorpresa', 'parcial', 'total', 'nocturno'];
  const estadosSimulacro = ['programado', 'en_progreso', 'ejecutado', 'cancelado', 'pospuesto'];
  const tiposBrigada = ['evacuacion', 'primeros_auxilios', 'contra_incendios', 'busqueda_rescate', 'comunicaciones', 'coordinacion_general', 'materiales_peligrosos', 'psicosocial'];
  const cargosBrigada = ['coordinador', 'subcoordinador', 'brigadista', 'suplente', 'instructor'];
  const nivelesCapacitacion = ['basico', 'intermedio', 'avanzado', 'instructor', 'especialista'];
  const areasAplicacion = ['general', 'centro_industrial', 'hornos_solera', 'ambas', 'administrativa', 'operativa'];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar datos de forma defensiva con manejo de errores individual
      const [planesRes, simulacrosRes, brigadasRes, colaboradoresRes] = await Promise.all([
        supabase.from('planes_emergencia_sst').select('*').order('created_at', { ascending: false }).then(res => res).catch(() => ({ data: [], error: null })),
        supabase.from('simulacros_emergencia').select('*').order('fecha_simulacro', { ascending: false }).then(res => res).catch(() => ({ data: [], error: null })),
        supabase.from('brigadas_emergencia').select('*').order('created_at', { ascending: false }).then(res => res).catch(() => ({ data: [], error: null })),
        supabase.from('colaboradores').select('id, nombre_completo').eq('activo', true).then(res => res).catch(() => ({ data: [], error: null }))
      ]);

      // Solo lanzar error si es crítico, sino usar arrays vacíos como fallback
      setPlanes(planesRes.data || []);
      setSimulacros(simulacrosRes.data || []);
      setBrigadas(brigadasRes.data || []);
      setColaboradores(colaboradoresRes.data || []);

      // Mostrar mensaje informativo si las tablas no existen
      if (!planesRes.data && !simulacrosRes.data && !brigadasRes.data) {
        setMensaje('Las tablas de emergencia no están configuradas en la base de datos. Contacte al administrador del sistema.');
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      setMensaje('Error al cargar los datos. Verificando configuración de base de datos...');
      // Inicializar con datos vacíos para evitar crashes
      setPlanes([]);
      setSimulacros([]);
      setBrigadas([]);
      setColaboradores([]);
    } finally {
      setLoading(false);
    }
  };

  const getEstadisticas = () => {
    const planesVigentes = planes.filter(p => p.estado === 'vigente').length;
    const planesTotal = planes.length;
    const simulacrosEsteAno = simulacros.filter(s =>
      new Date(s.fecha_simulacro).getFullYear() === new Date().getFullYear()
    ).length;
    const simulacrosEjecutados = simulacros.filter(s => s.estado === 'ejecutado').length;
    const brigadistasActivos = brigadas.filter(b => b.estado === 'activo').length;
    const brigadistasTotal = brigadas.length;
    const simulacrosPendientes = simulacros.filter(s => s.estado === 'programado').length;
    const planesDesactualizados = planes.filter(p =>
      p.fecha_vigencia && new Date(p.fecha_vigencia) < new Date()
    ).length;

    return {
      planesVigentes,
      planesTotal,
      planesDesactualizados,
      simulacrosEsteAno,
      simulacrosEjecutados,
      brigadistasActivos,
      brigadistasTotal,
      simulacrosPendientes
    };
  };

  const vistas = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'BarChart3',
      color: 'from-rose-600 to-rose-700',
      description: 'Vista analítica de planes de emergencia, simulacros y brigadas de respuesta'
    },
    {
      id: 'planes',
      label: 'Gestionar Planes',
      icon: 'Shield',
      color: 'from-red-600 to-red-700',
      description: 'Crear y gestionar planes de emergencia y procedimientos de respuesta'
    },
    {
      id: 'simulacros',
      label: 'Simulacros',
      icon: 'Clock',
      color: 'from-pink-600 to-pink-700',
      description: 'Programar y gestionar simulacros de emergencia y evaluaciones'
    },
    {
      id: 'brigadas',
      label: 'Brigadas',
      icon: 'Users',
      color: 'from-red-700 to-pink-700',
      description: 'Administrar brigadas de emergencia y asignación de responsabilidades'
    }
  ];

  const vistaActual = vistas.find(v => v.id === vistaActiva);

  const handleSubmitPlan = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      setMensaje('El nombre del plan es obligatorio');
      return;
    }

    try {
      const planData = {
        ...formData,
        activo: formData.estado === 'vigente'
      };

      let result;
      if (editingItem) {
        result = await supabase
          .from('planes_emergencia_sst')
          .update(planData)
          .eq('id', editingItem.id);
      } else {
        result = await supabase
          .from('planes_emergencia_sst')
          .insert([planData]);
      }

      if (result.error) {
        if (result.error.message?.includes('relation') || result.error.message?.includes('does not exist')) {
          throw new Error('La tabla de planes de emergencia no existe en la base de datos. Contacte al administrador del sistema.');
        }
        throw result.error;
      }

      setMensaje(editingItem ? 'Plan actualizado exitosamente' : 'Plan creado exitosamente');
      resetForm();
      await cargarDatos();

    } catch (error) {
      console.error('Error:', error);
      setMensaje(error.message || 'Error al guardar el plan');
    }
  };

  const handleSubmitSimulacro = async (e) => {
    e.preventDefault();

    if (!simulacroData.plan_emergencia_id || !simulacroData.responsable_simulacro.trim()) {
      setMensaje('Plan de emergencia y responsable son obligatorios');
      return;
    }

    try {
      let result;
      if (editingItem) {
        result = await supabase
          .from('simulacros_emergencia')
          .update(simulacroData)
          .eq('id', editingItem.id);
      } else {
        result = await supabase
          .from('simulacros_emergencia')
          .insert([simulacroData]);
      }

      if (result.error) {
        if (result.error.message?.includes('relation') || result.error.message?.includes('does not exist')) {
          throw new Error('La tabla de simulacros no existe en la base de datos. Contacte al administrador del sistema.');
        }
        throw result.error;
      }

      setMensaje(editingItem ? 'Simulacro actualizado exitosamente' : 'Simulacro programado exitosamente');
      resetForm();
      await cargarDatos();

    } catch (error) {
      console.error('Error:', error);
      setMensaje(error.message || 'Error al guardar el simulacro');
    }
  };

  const handleSubmitBrigada = async (e) => {
    e.preventDefault();

    if (!brigadaData.nombre.trim() || !brigadaData.colaborador_id) {
      setMensaje('Nombre y colaborador son obligatorios');
      return;
    }

    try {
      let result;
      if (editingItem) {
        result = await supabase
          .from('brigadas_emergencia')
          .update(brigadaData)
          .eq('id', editingItem.id);
      } else {
        result = await supabase
          .from('brigadas_emergencia')
          .insert([brigadaData]);
      }

      if (result.error) {
        if (result.error.message?.includes('relation') || result.error.message?.includes('does not exist')) {
          throw new Error('La tabla de brigadas no existe en la base de datos. Contacte al administrador del sistema.');
        }
        throw result.error;
      }

      setMensaje(editingItem ? 'Brigadista actualizado exitosamente' : 'Brigadista agregado exitosamente');
      resetForm();
      await cargarDatos();

    } catch (error) {
      console.error('Error:', error);
      setMensaje(error.message || 'Error al guardar el brigadista');
    }
  };

  const resetForm = () => {
    setFormData({
      // Campos básicos
      nombre: '',
      codigo_plan: '',
      version: '1.0',
      estado: 'borrador',
      tipo_emergencia: 'evacuacion',
      area_aplicacion: 'general',
      alcance: '',

      // Campos de gestión
      responsable_plan: '',
      fecha_elaboracion: new Date().toISOString().split('T')[0],
      fecha_revision: '',
      fecha_aprobacion: '',
      fecha_vigencia: '',

      // Contenido del plan
      objetivos: [],
      alcance_detallado: '',
      marco_legal: '',
      definiciones: {},
      roles_responsabilidades: {},
      estructura_organizacional: {},

      // Procedimientos y activación
      procedimiento_activacion: {},
      procedimientos_respuesta: {},
      comunicaciones: {},
      evacuacion: {},

      // Recursos y equipos
      recursos_materiales: [],
      recursos_humanos: [],
      equipos_emergencia: [],

      // Información de contacto y ubicaciones
      contactos_emergencia: [],
      rutas_evacuacion: [],
      puntos_encuentro: [],
      areas_seguras: [],

      // Capacitación y entrenamiento
      programa_capacitacion: {},
      cronograma_simulacros: [],

      // Documentación
      documentos_anexos: [],
      planos_mapas: [],

      // Seguimiento
      observaciones: '',
      lecciones_aprendidas: '',
      mejoras_identificadas: []
    });
    setSimulacroData({
      // Campos básicos
      plan_emergencia_id: '',
      codigo_simulacro: '',
      nombre_simulacro: '',
      tipo_simulacro: 'programado',
      estado: 'programado',

      // Fechas y horarios
      fecha_simulacro: new Date().toISOString().split('T')[0],
      hora_inicio: '09:00',
      hora_fin: '',
      duracion_estimada: 30,

      // Ubicación y alcance
      area_simulacro: 'general',
      ubicaciones_especificas: [],
      tipo_evacuacion: 'total',

      // Participantes
      participantes_esperados: 0,
      participantes_reales: 0,
      participantes_ausentes: [],

      // Objetivos y escenario
      objetivos_simulacro: [],
      escenario_emergencia: '',
      condiciones_climaticas: '',

      // Responsables
      coordinador_general: '',
      responsable_simulacro: '',
      observadores: [],
      evaluadores: [],

      // Tiempos y resultados
      tiempo_evacuacion_objetivo: 5,
      tiempo_evacuacion_real: 0,
      tiempo_activacion_alarma: 0,
      tiempo_llegada_brigadas: 0,

      // Evaluación
      calificacion_general: 0,
      aspectos_positivos: [],
      oportunidades_mejora: [],
      acciones_correctivas: [],

      // Documentación
      evidencias_fotograficas: [],
      video_simulacro: '',
      acta_simulacro: '',

      // Seguimiento
      observaciones: '',
      recomendaciones: '',
      fecha_proximo_simulacro: ''
    });
    setBrigadaData({
      // Información básica
      nombre: '',
      codigo_brigada: '',
      tipo_brigada: 'evacuacion',
      estado: 'activo',

      // Colaborador
      colaborador_id: '',
      cargo_brigada: 'brigadista',
      es_coordinador: false,

      // Responsabilidades
      area_responsabilidad: '',
      responsabilidades_especificas: [],
      ubicacion_base: '',

      // Capacitación
      nivel_capacitacion: 'basico',
      fecha_capacitacion: '',
      vigencia_capacitacion: '',
      institucion_capacitadora: '',
      certificado_url: '',

      // Equipamiento
      equipos_asignados: [],
      ubicacion_equipos: '',

      // Disponibilidad
      turnos_disponibles: [],
      contacto_emergencia: '',
      telefono_emergencia: '',

      // Seguimiento
      participacion_simulacros: [],
      evaluaciones_desempeno: [],

      observaciones: ''
    });
    setEditingItem(null);
    setShowModal(false);
    setMensaje('');
  };

  const handleEdit = (item, tipo) => {
    setEditingItem(item);
    setCurrentForm(tipo);

    if (tipo === 'plan') {
      setFormData({
        ...item,
        fecha_elaboracion: item.fecha_elaboracion ? item.fecha_elaboracion.split('T')[0] : '',
        fecha_revision: item.fecha_revision ? item.fecha_revision.split('T')[0] : '',
        fecha_aprobacion: item.fecha_aprobacion ? item.fecha_aprobacion.split('T')[0] : '',
        fecha_vigencia: item.fecha_vigencia ? item.fecha_vigencia.split('T')[0] : ''
      });
    } else if (tipo === 'simulacro') {
      setSimulacroData({
        ...item,
        fecha_simulacro: item.fecha_simulacro ? item.fecha_simulacro.split('T')[0] : '',
        fecha_proximo_simulacro: item.fecha_proximo_simulacro ? item.fecha_proximo_simulacro.split('T')[0] : ''
      });
    } else if (tipo === 'brigada') {
      setBrigadaData({
        ...item,
        fecha_capacitacion: item.fecha_capacitacion ? item.fecha_capacitacion.split('T')[0] : '',
        vigencia_capacitacion: item.vigencia_capacitacion ? item.vigencia_capacitacion.split('T')[0] : ''
      });
    }

    setShowModal(true);
  };

  const handleDelete = async (id, tabla) => {
    if (!window.confirm('¿Estás seguro de eliminar este elemento?')) return;

    try {
      const result = await supabase.from(tabla).delete().eq('id', id);

      if (result.error) {
        if (result.error.message?.includes('relation') || result.error.message?.includes('does not exist')) {
          throw new Error(`La tabla ${tabla} no existe en la base de datos. Contacte al administrador del sistema.`);
        }
        throw result.error;
      }

      setMensaje('Elemento eliminado exitosamente');
      await cargarDatos();
    } catch (error) {
      console.error('Error eliminando:', error);
      setMensaje(error.message || 'Error al eliminar el elemento');
    }
  };

  const estadisticas = getEstadisticas();

  const renderDashboard = () => {
    const estadisticas = getEstadisticas();

    return (
      <div className="space-y-8">
        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Planes Vigentes</p>
                <p className="text-3xl font-bold text-rose-600">{estadisticas.planesVigentes}</p>
                <p className="text-xs text-slate-500 mt-1">de {estadisticas.planesTotal} totales</p>
              </div>
              <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-lg p-3">
                <Icon name="Shield" size={24} className="text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Simulacros Este Año</p>
                <p className="text-3xl font-bold text-red-600">{estadisticas.simulacrosEsteAno}</p>
                <p className="text-xs text-slate-500 mt-1">{estadisticas.simulacrosEjecutados} ejecutados</p>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-3">
                <Icon name="Clock" size={24} className="text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Brigadistas Activos</p>
                <p className="text-3xl font-bold text-pink-600">{estadisticas.brigadistasActivos}</p>
                <p className="text-xs text-slate-500 mt-1">de {estadisticas.brigadistasTotal} totales</p>
              </div>
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-3">
                <Icon name="Users" size={24} className="text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pendientes</p>
                <p className="text-3xl font-bold text-amber-600">{estadisticas.simulacrosPendientes}</p>
                <p className="text-xs text-slate-500 mt-1">simulacros programados</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-3">
                <Icon name="AlertTriangle" size={24} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Alertas importantes */}
        {estadisticas.planesDesactualizados > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-amber-500 rounded-lg p-2">
                <Icon name="AlertTriangle" size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-amber-800">Planes Desactualizados</h3>
                <p className="text-amber-700 mt-1">
                  Hay {estadisticas.planesDesactualizados} planes que han superado su fecha de vigencia y requieren revisión.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actividad reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
              <Icon name="Activity" size={20} className="text-rose-600" />
              <span>Simulacros Recientes</span>
            </h3>
            <div className="space-y-3">
              {simulacros.slice(0, 5).map(simulacro => (
                <div key={simulacro.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="font-medium text-slate-900">{simulacro.nombre_simulacro || 'Simulacro'}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(simulacro.fecha_simulacro).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    simulacro.estado === 'ejecutado' ? 'bg-green-100 text-green-800' :
                    simulacro.estado === 'programado' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {simulacro.estado}
                  </span>
                </div>
              ))}
              {simulacros.length === 0 && (
                <p className="text-slate-500 text-center py-4">No hay simulacros registrados</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
              <Icon name="Users" size={20} className="text-rose-600" />
              <span>Brigadas por Tipo</span>
            </h3>
            <div className="space-y-3">
              {tiposBrigada.map(tipo => {
                const count = brigadas.filter(b => b.tipo_brigada === tipo && b.estado === 'activo').length;
                return (
                  <div key={tipo} className="flex items-center justify-between py-2">
                    <span className="text-slate-700 capitalize">{tipo.replace('_', ' ')}</span>
                    <span className="font-semibold text-slate-900">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPlanesTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Planes de Emergencia</h2>
            <p className="text-slate-600">Gestión de planes de emergencia por tipo y área</p>
          </div>
          <button
            onClick={() => {
              setCurrentForm('plan');
              setShowModal(true);
              setEditingItem(null);
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white px-4 py-2 rounded-lg hover:from-rose-700 hover:to-rose-800 transition-all shadow-lg"
          >
            <Icon name="Plus" size={20} />
            <span>Nuevo Plan</span>
          </button>
        </div>

        {planes.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Shield" size={24} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay planes de emergencia</h3>
            <p className="text-slate-600 mb-6">Crea el primer plan de emergencia para tu organización</p>
            <button
              onClick={() => {
                setCurrentForm('plan');
                setShowModal(true);
                setEditingItem(null);
              }}
              className="bg-gradient-to-r from-rose-600 to-rose-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-rose-700 hover:to-rose-800 transition-all"
            >
              Crear Primer Plan
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Área</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Versión</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {planes.map((plan) => (
                    <tr key={plan.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-900">{plan.nombre}</div>
                          {plan.alcance && <div className="text-sm text-slate-600">{plan.alcance}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{plan.tipo_emergencia}</td>
                      <td className="px-6 py-4 text-slate-700">{plan.area_aplicacion}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          plan.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {plan.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{plan.version}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(plan, 'plan')}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Editar"
                          >
                            <Icon name="Edit" size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(plan.id, 'planes_emergencia_sst')}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Eliminar"
                          >
                            <Icon name="Trash2" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSimulacrosTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Simulacros de Emergencia</h2>
            <p className="text-slate-600">Programación y seguimiento de simulacros</p>
          </div>
          <button
            onClick={() => {
              setCurrentForm('simulacro');
              setShowModal(true);
              setEditingItem(null);
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg"
          >
            <Icon name="Plus" size={20} />
            <span>Nuevo Simulacro</span>
          </button>
        </div>

        {simulacros.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Clock" size={24} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay simulacros registrados</h3>
            <p className="text-slate-600 mb-6">Programa el primer simulacro de emergencia</p>
            <button
              onClick={() => {
                setCurrentForm('simulacro');
                setShowModal(true);
                setEditingItem(null);
              }}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all"
            >
              Programar Primer Simulacro
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Responsable</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {simulacros.map((simulacro) => (
                    <tr key={simulacro.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {simulacro.planes_emergencia_sst?.nombre || 'Plan no encontrado'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {new Date(simulacro.fecha_simulacro).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-slate-700">{simulacro.tipo_simulacro}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          simulacro.estado === 'ejecutado' ? 'bg-green-100 text-green-800' :
                          simulacro.estado === 'programado' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {simulacro.estado.charAt(0).toUpperCase() + simulacro.estado.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{simulacro.responsable_simulacro}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(simulacro, 'simulacro')}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Editar"
                          >
                            <Icon name="Edit" size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(simulacro.id, 'simulacros_emergencia')}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Eliminar"
                          >
                            <Icon name="Trash2" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBrigadasTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Brigadas de Emergencia</h2>
            <p className="text-slate-600">Gestión de brigadistas y responsabilidades</p>
          </div>
          <button
            onClick={() => {
              setCurrentForm('brigada');
              setShowModal(true);
              setEditingItem(null);
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-pink-600 to-pink-700 text-white px-4 py-2 rounded-lg hover:from-pink-700 hover:to-pink-800 transition-all shadow-lg"
          >
            <Icon name="Plus" size={20} />
            <span>Nuevo Brigadista</span>
          </button>
        </div>

        {brigadas.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Users" size={24} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay brigadistas registrados</h3>
            <p className="text-slate-600 mb-6">Registra el primer miembro de la brigada de emergencia</p>
            <button
              onClick={() => {
                setCurrentForm('brigada');
                setShowModal(true);
                setEditingItem(null);
              }}
              className="bg-gradient-to-r from-pink-600 to-pink-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-700 hover:to-pink-800 transition-all"
            >
              Registrar Primer Brigadista
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Brigadista</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tipo Brigada</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cargo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Área</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {brigadas.map((brigada) => (
                    <tr key={brigada.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-900">
                            {brigada.colaboradores?.nombre_completo || 'Colaborador no encontrado'}
                          </div>
                          <div className="text-sm text-slate-600">{brigada.nombre}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{brigada.tipo_brigada}</td>
                      <td className="px-6 py-4 text-slate-700">{brigada.cargo_brigada}</td>
                      <td className="px-6 py-4 text-slate-700">{brigada.area_responsabilidad}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          brigada.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {brigada.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(brigada, 'brigada')}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Editar"
                          >
                            <Icon name="Edit" size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(brigada.id, 'brigadas_emergencia')}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Eliminar"
                          >
                            <Icon name="Trash2" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (vistaActiva) {
      case 'dashboard':
        return renderDashboard();
      case 'planes':
        return renderPlanesTab();
      case 'simulacros':
        return renderSimulacrosTab();
      case 'brigadas':
        return renderBrigadasTab();
      default:
        return renderDashboard();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <div className="text-slate-600 font-medium">Cargando planes de emergencia...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50">
      {/* Header Principal */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-rose-700 to-red-700 rounded-2xl p-3 shadow-lg">
                <Icon name="Shield" size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-700 to-red-700 bg-clip-text text-transparent">
                  Sistema de Planes de Emergencia SST
                </h1>
                <p className="text-slate-600 font-medium">
                  Preparación • Respuesta • Brigadas de Emergencia • Simulacros • Continuidad Operacional
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Sistema Emergencias Activo</span>
              </div>
              <div className="w-px h-6 bg-slate-300"></div>
              <span className="font-medium">
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {vistas.map(vista => (
              <button
                key={vista.id}
                onClick={() => setVistaActiva(vista.id)}
                className={`
                  flex items-center space-x-3 px-6 py-4 rounded-t-xl font-semibold transition-all duration-300
                  ${vistaActiva === vista.id
                    ? `bg-gradient-to-r ${vista.color} text-white shadow-lg transform scale-105`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                <Icon
                  name={vista.icon}
                  size={20}
                  className={vistaActiva === vista.id ? 'text-white' : 'text-slate-500'}
                />
                <span>{vista.label}</span>
                {vistaActiva === vista.id && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vista Activa Info */}
      <div className="bg-gradient-to-r from-slate-50 to-rose-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <Icon name="Info" size={16} className="text-slate-500" />
            <p className="text-slate-700 font-medium">
              {vistaActual?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {mensaje && (
          <div className={`
            mb-6 p-4 rounded-xl border
            ${
              mensaje.includes('Error')
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-green-50 border-green-200 text-green-800'
            }
          `}>
            <div className="flex items-center space-x-2">
              <Icon
                name={mensaje.includes('Error') ? 'AlertCircle' : 'CheckCircle'}
                size={16}
                className={mensaje.includes('Error') ? 'text-red-600' : 'text-green-600'}
              />
              <span className="font-medium">{mensaje}</span>
            </div>
          </div>
        )}

        {renderContent()}
      </div>


      {/* Modal para formularios */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className={`px-6 py-4 border-b border-slate-200 flex items-center justify-between ${
              currentForm === 'plan' ? 'bg-gradient-to-r from-rose-50 to-red-50' :
              currentForm === 'simulacro' ? 'bg-gradient-to-r from-red-50 to-pink-50' :
              'bg-gradient-to-r from-pink-50 to-rose-50'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  currentForm === 'plan' ? 'bg-rose-600' :
                  currentForm === 'simulacro' ? 'bg-red-600' :
                  'bg-pink-600'
                }`}>
                  <Icon
                    name={currentForm === 'plan' ? 'Shield' : currentForm === 'simulacro' ? 'Clock' : 'Users'}
                    size={20}
                    className="text-white"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingItem ? 'Editar' : 'Nuevo'} {currentForm === 'plan' ? 'Plan de Emergencia' : currentForm === 'simulacro' ? 'Simulacro' : 'Brigadista'}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {currentForm === 'plan' ? 'Configuración completa del plan de emergencia' :
                     currentForm === 'simulacro' ? 'Programación y seguimiento de simulacro' :
                     'Registro de miembro de brigada de emergencia'}
                  </p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
              >
                <Icon name="X" size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {currentForm === 'plan' && (
                <form onSubmit={handleSubmitPlan} className="p-6">
                  <div className="space-y-8">
                    {/* Información Básica */}
                    <div className="bg-slate-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                        <Icon name="FileText" size={20} className="text-rose-600" />
                        <span>Información Básica</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nombre del Plan *
                          </label>
                          <input
                            type="text"
                            value={formData.nombre}
                            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            placeholder="Ej: Plan de Evacuación General"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Código del Plan
                          </label>
                          <input
                            type="text"
                            value={formData.codigo_plan}
                            onChange={(e) => setFormData({...formData, codigo_plan: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            placeholder="Ej: PE-EVA-001"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Tipo de Emergencia
                          </label>
                          <select
                            value={formData.tipo_emergencia}
                            onChange={(e) => setFormData({...formData, tipo_emergencia: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                          >
                            {tiposEmergencia.map(tipo => (
                              <option key={tipo} value={tipo} className="capitalize">
                                {tipo.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Área de Aplicación
                          </label>
                          <select
                            value={formData.area_aplicacion}
                            onChange={(e) => setFormData({...formData, area_aplicacion: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                          >
                            {areasAplicacion.map(area => (
                              <option key={area} value={area} className="capitalize">
                                {area.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Versión
                          </label>
                          <input
                            type="text"
                            value={formData.version}
                            onChange={(e) => setFormData({...formData, version: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            placeholder="1.0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Estado
                          </label>
                          <select
                            value={formData.estado}
                            onChange={(e) => setFormData({...formData, estado: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                          >
                            {estadosPlanes.map(estado => (
                              <option key={estado} value={estado} className="capitalize">
                                {estado.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Gestión y Fechas */}
                    <div className="bg-blue-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                        <Icon name="Calendar" size={20} className="text-blue-600" />
                        <span>Gestión y Fechas</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Responsable del Plan
                          </label>
                          <input
                            type="text"
                            value={formData.responsable_plan}
                            onChange={(e) => setFormData({...formData, responsable_plan: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Nombre del responsable"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Fecha de Elaboración
                          </label>
                          <input
                            type="date"
                            value={formData.fecha_elaboracion}
                            onChange={(e) => setFormData({...formData, fecha_elaboracion: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Fecha de Revisión
                          </label>
                          <input
                            type="date"
                            value={formData.fecha_revision}
                            onChange={(e) => setFormData({...formData, fecha_revision: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Fecha de Aprobación
                          </label>
                          <input
                            type="date"
                            value={formData.fecha_aprobacion}
                            onChange={(e) => setFormData({...formData, fecha_aprobacion: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Fecha de Vigencia
                          </label>
                          <input
                            type="date"
                            value={formData.fecha_vigencia}
                            onChange={(e) => setFormData({...formData, fecha_vigencia: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contenido del Plan */}
                    <div className="bg-green-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                        <Icon name="BookOpen" size={20} className="text-green-600" />
                        <span>Contenido del Plan</span>
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Alcance
                          </label>
                          <textarea
                            value={formData.alcance}
                            onChange={(e) => setFormData({...formData, alcance: e.target.value})}
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                            placeholder="Describe el alcance del plan de emergencia..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Alcance Detallado
                          </label>
                          <textarea
                            value={formData.alcance_detallado}
                            onChange={(e) => setFormData({...formData, alcance_detallado: e.target.value})}
                            rows={4}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                            placeholder="Descripción detallada del alcance y limitaciones..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Marco Legal
                          </label>
                          <textarea
                            value={formData.marco_legal}
                            onChange={(e) => setFormData({...formData, marco_legal: e.target.value})}
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                            placeholder="Normativas y regulaciones aplicables..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Observaciones
                          </label>
                          <textarea
                            value={formData.observaciones}
                            onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                            placeholder="Observaciones generales del plan..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 p-6 bg-slate-50 mt-6">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200 font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold"
                    >
                      {editingItem ? 'Actualizar' : 'Crear'} Plan
                    </button>
                  </div>
                </form>
              )}

              {currentForm === 'simulacro' && (
                <form onSubmit={handleSubmitSimulacro} className="p-6">
                  <div className="space-y-8">
                    {/* Información Básica */}
                    <div className="bg-slate-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                        <Icon name="Clock" size={20} className="text-red-600" />
                        <span>Información Básica</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Plan de Emergencia *
                          </label>
                          <select
                            value={simulacroData.plan_emergencia_id}
                            onChange={(e) => setSimulacroData({...simulacroData, plan_emergencia_id: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            required
                          >
                            <option value="">Seleccionar plan...</option>
                            {planes.filter(p => p.estado === 'vigente').map(plan => (
                              <option key={plan.id} value={plan.id}>{plan.nombre}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Código del Simulacro
                          </label>
                          <input
                            type="text"
                            value={simulacroData.codigo_simulacro}
                            onChange={(e) => setSimulacroData({...simulacroData, codigo_simulacro: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="Ej: SIM-EVA-2024-001"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nombre del Simulacro
                          </label>
                          <input
                            type="text"
                            value={simulacroData.nombre_simulacro}
                            onChange={(e) => setSimulacroData({...simulacroData, nombre_simulacro: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="Ej: Simulacro de Evacuación General"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Tipo de Simulacro
                          </label>
                          <select
                            value={simulacroData.tipo_simulacro}
                            onChange={(e) => setSimulacroData({...simulacroData, tipo_simulacro: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          >
                            {tiposSimulacro.map(tipo => (
                              <option key={tipo} value={tipo} className="capitalize">
                                {tipo.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Estado
                          </label>
                          <select
                            value={simulacroData.estado}
                            onChange={(e) => setSimulacroData({...simulacroData, estado: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          >
                            {estadosSimulacro.map(estado => (
                              <option key={estado} value={estado} className="capitalize">
                                {estado.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Área del Simulacro
                          </label>
                          <select
                            value={simulacroData.area_simulacro}
                            onChange={(e) => setSimulacroData({...simulacroData, area_simulacro: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          >
                            {areasAplicacion.map(area => (
                              <option key={area} value={area} className="capitalize">
                                {area.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Fechas y Horarios */}
                    <div className="bg-blue-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                        <Icon name="Calendar" size={20} className="text-blue-600" />
                        <span>Fechas y Horarios</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Fecha del Simulacro *
                          </label>
                          <input
                            type="date"
                            value={simulacroData.fecha_simulacro}
                            onChange={(e) => setSimulacroData({...simulacroData, fecha_simulacro: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Hora de Inicio *
                          </label>
                          <input
                            type="time"
                            value={simulacroData.hora_inicio}
                            onChange={(e) => setSimulacroData({...simulacroData, hora_inicio: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Hora de Fin
                          </label>
                          <input
                            type="time"
                            value={simulacroData.hora_fin}
                            onChange={(e) => setSimulacroData({...simulacroData, hora_fin: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Duración Estimada (minutos)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={simulacroData.duracion_estimada}
                            onChange={(e) => setSimulacroData({...simulacroData, duracion_estimada: parseInt(e.target.value) || 30})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Fecha Próximo Simulacro
                          </label>
                          <input
                            type="date"
                            value={simulacroData.fecha_proximo_simulacro}
                            onChange={(e) => setSimulacroData({...simulacroData, fecha_proximo_simulacro: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Participantes y Responsables */}
                    <div className="bg-green-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                        <Icon name="Users" size={20} className="text-green-600" />
                        <span>Participantes y Responsables</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Coordinador General
                          </label>
                          <input
                            type="text"
                            value={simulacroData.coordinador_general}
                            onChange={(e) => setSimulacroData({...simulacroData, coordinador_general: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Nombre del coordinador general"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Responsable del Simulacro *
                          </label>
                          <input
                            type="text"
                            value={simulacroData.responsable_simulacro}
                            onChange={(e) => setSimulacroData({...simulacroData, responsable_simulacro: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Nombre del responsable"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Participantes Esperados
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={simulacroData.participantes_esperados}
                            onChange={(e) => setSimulacroData({...simulacroData, participantes_esperados: parseInt(e.target.value) || 0})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Participantes Reales
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={simulacroData.participantes_reales}
                            onChange={(e) => setSimulacroData({...simulacroData, participantes_reales: parseInt(e.target.value) || 0})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tiempos y Resultados */}
                    <div className="bg-amber-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                        <Icon name="Timer" size={20} className="text-amber-600" />
                        <span>Tiempos y Resultados</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Tiempo Objetivo (min)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={simulacroData.tiempo_evacuacion_objetivo}
                            onChange={(e) => setSimulacroData({...simulacroData, tiempo_evacuacion_objetivo: parseInt(e.target.value) || 5})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Tiempo Real (min)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={simulacroData.tiempo_evacuacion_real}
                            onChange={(e) => setSimulacroData({...simulacroData, tiempo_evacuacion_real: parseFloat(e.target.value) || 0})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Tiempo Activación (min)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={simulacroData.tiempo_activacion_alarma}
                            onChange={(e) => setSimulacroData({...simulacroData, tiempo_activacion_alarma: parseFloat(e.target.value) || 0})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Calificación (1-10)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={simulacroData.calificacion_general}
                            onChange={(e) => setSimulacroData({...simulacroData, calificacion_general: parseInt(e.target.value) || 0})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Observaciones */}
                    <div className="bg-slate-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                        <Icon name="FileText" size={20} className="text-slate-600" />
                        <span>Observaciones y Seguimiento</span>
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Escenario de Emergencia
                          </label>
                          <textarea
                            value={simulacroData.escenario_emergencia}
                            onChange={(e) => setSimulacroData({...simulacroData, escenario_emergencia: e.target.value})}
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
                            placeholder="Describe el escenario del simulacro..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Observaciones
                          </label>
                          <textarea
                            value={simulacroData.observaciones}
                            onChange={(e) => setSimulacroData({...simulacroData, observaciones: e.target.value})}
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
                            placeholder="Observaciones generales del simulacro..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Recomendaciones
                          </label>
                          <textarea
                            value={simulacroData.recomendaciones}
                            onChange={(e) => setSimulacroData({...simulacroData, recomendaciones: e.target.value})}
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
                            placeholder="Recomendaciones para futuros simulacros..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 p-6 bg-slate-50 mt-6">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200 font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold"
                    >
                      {editingItem ? 'Actualizar' : 'Programar'} Simulacro
                    </button>
                  </div>
                </form>
              )}

              {currentForm === 'brigada' && (
                <form onSubmit={handleSubmitBrigada} className="p-6">
                  <div className="space-y-8">
                    {/* Información Básica */}
                    <div className="bg-slate-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                        <Icon name="Users" size={20} className="text-pink-600" />
                        <span>Información Básica</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nombre de la Brigada *
                          </label>
                          <input
                            type="text"
                            value={brigadaData.nombre}
                            onChange={(e) => setBrigadaData({...brigadaData, nombre: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            placeholder="Ej: Brigada de Evacuación Norte"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Código de Brigada
                          </label>
                          <input
                            type="text"
                            value={brigadaData.codigo_brigada}
                            onChange={(e) => setBrigadaData({...brigadaData, codigo_brigada: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            placeholder="Ej: BRG-EVA-001"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Colaborador *
                          </label>
                          <select
                            value={brigadaData.colaborador_id}
                            onChange={(e) => setBrigadaData({...brigadaData, colaborador_id: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            required
                          >
                            <option value="">Seleccionar colaborador...</option>
                            {colaboradores.map(colaborador => (
                              <option key={colaborador.id} value={colaborador.id}>
                                {colaborador.nombre_completo}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Estado
                          </label>
                          <select
                            value={brigadaData.estado}
                            onChange={(e) => setBrigadaData({...brigadaData, estado: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          >
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                            <option value="suspendido">Suspendido</option>
                            <option value="en_capacitacion">En Capacitación</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Tipo de Brigada
                          </label>
                          <select
                            value={brigadaData.tipo_brigada}
                            onChange={(e) => setBrigadaData({...brigadaData, tipo_brigada: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          >
                            {tiposBrigada.map(tipo => (
                              <option key={tipo} value={tipo} className="capitalize">
                                {tipo.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Cargo en la Brigada
                          </label>
                          <select
                            value={brigadaData.cargo_brigada}
                            onChange={(e) => setBrigadaData({...brigadaData, cargo_brigada: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          >
                            {cargosBrigada.map(cargo => (
                              <option key={cargo} value={cargo} className="capitalize">
                                {cargo.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={brigadaData.es_coordinador}
                            onChange={(e) => setBrigadaData({...brigadaData, es_coordinador: e.target.checked})}
                            className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-pink-500"
                          />
                          <span className="text-sm font-medium text-slate-700">
                            Es coordinador de brigada
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Responsabilidades y Ubicación */}
                    <div className="bg-blue-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                        <Icon name="MapPin" size={20} className="text-blue-600" />
                        <span>Responsabilidades y Ubicación</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Área de Responsabilidad
                          </label>
                          <input
                            type="text"
                            value={brigadaData.area_responsabilidad}
                            onChange={(e) => setBrigadaData({...brigadaData, area_responsabilidad: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ej: Planta de Producción, Oficinas Administrativas"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Ubicación Base
                          </label>
                          <input
                            type="text"
                            value={brigadaData.ubicacion_base}
                            onChange={(e) => setBrigadaData({...brigadaData, ubicacion_base: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ej: Oficina 205, Almacén Central"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Ubicación de Equipos
                          </label>
                          <input
                            type="text"
                            value={brigadaData.ubicacion_equipos}
                            onChange={(e) => setBrigadaData({...brigadaData, ubicacion_equipos: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ubicación de equipos de emergencia"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Capacitación */}
                    <div className="bg-green-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                        <Icon name="BookOpen" size={20} className="text-green-600" />
                        <span>Capacitación y Certificación</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nivel de Capacitación
                          </label>
                          <select
                            value={brigadaData.nivel_capacitacion}
                            onChange={(e) => setBrigadaData({...brigadaData, nivel_capacitacion: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            {nivelesCapacitacion.map(nivel => (
                              <option key={nivel} value={nivel} className="capitalize">
                                {nivel.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Institución Capacitadora
                          </label>
                          <input
                            type="text"
                            value={brigadaData.institucion_capacitadora}
                            onChange={(e) => setBrigadaData({...brigadaData, institucion_capacitadora: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Nombre de la institución"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Fecha de Capacitación
                          </label>
                          <input
                            type="date"
                            value={brigadaData.fecha_capacitacion}
                            onChange={(e) => setBrigadaData({...brigadaData, fecha_capacitacion: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Vigencia de Capacitación
                          </label>
                          <input
                            type="date"
                            value={brigadaData.vigencia_capacitacion}
                            onChange={(e) => setBrigadaData({...brigadaData, vigencia_capacitacion: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            URL del Certificado
                          </label>
                          <input
                            type="url"
                            value={brigadaData.certificado_url}
                            onChange={(e) => setBrigadaData({...brigadaData, certificado_url: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="https://ejemplo.com/certificado.pdf"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contacto y Disponibilidad */}
                    <div className="bg-amber-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                        <Icon name="Phone" size={20} className="text-amber-600" />
                        <span>Contacto y Disponibilidad</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Contacto de Emergencia
                          </label>
                          <input
                            type="text"
                            value={brigadaData.contacto_emergencia}
                            onChange={(e) => setBrigadaData({...brigadaData, contacto_emergencia: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            placeholder="Nombre del contacto de emergencia"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Teléfono de Emergencia
                          </label>
                          <input
                            type="tel"
                            value={brigadaData.telefono_emergencia}
                            onChange={(e) => setBrigadaData({...brigadaData, telefono_emergencia: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            placeholder="Teléfono de contacto"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Observaciones */}
                    <div className="bg-slate-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                        <Icon name="FileText" size={20} className="text-slate-600" />
                        <span>Observaciones</span>
                      </h3>
                      <div>
                        <textarea
                          value={brigadaData.observaciones}
                          onChange={(e) => setBrigadaData({...brigadaData, observaciones: e.target.value})}
                          rows={4}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
                          placeholder="Observaciones adicionales sobre el brigadista..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 p-6 bg-slate-50 mt-6">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200 font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold"
                    >
                      {editingItem ? 'Actualizar' : 'Agregar'} Brigadista
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanesEmergenciaMain;