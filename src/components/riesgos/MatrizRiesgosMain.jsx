import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Icon } from '../common/Icons';

const MatrizRiesgosMain = () => {
  const [activeTab, setActiveTab] = useState('matriz');
  const [riesgos, setRiesgos] = useState([]);
  const [controles, setControles] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentForm, setCurrentForm] = useState('riesgo');

  const [formData, setFormData] = useState({
    codigo_riesgo: '',
    version: '1.0',
    fecha_evaluacion: new Date().toISOString().split('T')[0],
    proceso: '',
    actividad: '',
    tarea: '',
    area: '',
    puesto_trabajo: '',
    peligro_identificado: '',
    clasificacion_peligro: 'Físico',
    descripcion_riesgo: '',
    efectos_salud: [],
    personas_expuestas: 1,
    tiempo_exposicion_horas: 8,
    rutinario: true,
    controles_existentes: {
      medio: [],
      fuente: [],
      persona: []
    },
    nivel_deficiencia: 10,
    nivel_exposicion: 4,
    nivel_probabilidad: null,
    interpretacion_probabilidad: '',
    nivel_consecuencia: 25,
    interpretacion_consecuencia: '',
    nivel_riesgo: null,
    interpretacion_riesgo: '',
    aceptabilidad_riesgo: '',
    medidas_control_requeridas: {
      epp: [],
      ingenieria: [],
      eliminacion: [],
      sustitucion: [],
      administrativas: []
    },
    responsable_implementacion: '',
    fecha_implementacion: '',
    nivel_riesgo_residual: null,
    aceptabilidad_residual: '',
    seguimiento_medicion: '',
    fecha_revision: '',
    responsable_revision: '',
    estado_riesgo: 'identificado',
    observaciones: ''
  });

  const [controlData, setControlData] = useState({
    riesgo_id: '',
    tipo_control: 'Controles de Ingeniería',
    descripcion_control: '',
    responsable: '',
    fecha_implementacion: '',
    eficacia: 'Media',
    costo_estimado: 0,
    recursos_necesarios: ''
  });

  const clasificacionesPeligro = [
    'Biológico', 'Físico', 'Químico', 'Psicosocial', 'Biomecánico',
    'Condiciones de Seguridad', 'Fenómenos Naturales'
  ];

  const areas = [
    'Centro Industrial', 'Hornos Solera', 'Administrativa', 'Logística',
    'Mantenimiento', 'Calidad', 'Laboratorio', 'Bodega'
  ];

  const estadosRiesgo = [
    'identificado', 'evaluado', 'controlado', 'monitoreado', 'cerrado'
  ];

  const efectosSalud = [
    'Lesiones musculoesqueléticas', 'Enfermedades respiratorias',
    'Dermatitis/Alergias', 'Intoxicaciones', 'Quemaduras', 'Traumatismos',
    'Estrés/Ansiedad', 'Fatiga', 'Pérdida auditiva', 'Problemas visuales'
  ];

  const tiposControl = [
    'Eliminación', 'Sustitución', 'Controles de Ingeniería',
    'Controles Administrativos', 'EPP'
  ];

  const nivelesDeficiencia = [
    { valor: 10, texto: 'Muy Alto (MA)' },
    { valor: 6, texto: 'Alto (A)' },
    { valor: 2, texto: 'Medio (M)' }
  ];

  const nivelesExposicion = [
    { valor: 4, texto: 'Continua (EC)' },
    { valor: 3, texto: 'Frecuente (EF)' },
    { valor: 2, texto: 'Ocasional (EO)' },
    { valor: 1, texto: 'Esporádica (EE)' }
  ];

  const nivelesConsecuencia = [
    { valor: 100, texto: 'Mortal o Catastrófico (M)' },
    { valor: 60, texto: 'Muy Grave (MG)' },
    { valor: 25, texto: 'Grave (G)' },
    { valor: 10, texto: 'Leve (L)' }
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!formData.codigo_riesgo && activeTab === 'matriz') {
      generarCodigoRiesgo();
    }
  }, [activeTab]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const [riesgosRes, controlesRes, evaluacionesRes] = await Promise.all([
        supabase.from('matriz_riesgos').select('*').order('nivel_riesgo', { ascending: false }),
        supabase.from('controles_riesgo').select('*, matriz_riesgos(codigo_riesgo)').order('created_at', { ascending: false }),
        supabase.from('evaluaciones_riesgo').select('*').order('fecha_evaluacion', { ascending: false })
      ]);

      if (riesgosRes.error) throw riesgosRes.error;
      if (controlesRes.error) throw controlesRes.error;
      if (evaluacionesRes.error) throw evaluacionesRes.error;

      setRiesgos(riesgosRes.data || []);
      setControles(controlesRes.data || []);
      setEvaluaciones(evaluacionesRes.data || []);

    } catch (error) {
      console.error('Error cargando datos:', error);
      setMensaje('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const generarCodigoRiesgo = () => {
    const año = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-4);
    const codigo = `RG-${año}-${timestamp}`;
    setFormData(prev => ({ ...prev, codigo_riesgo: codigo }));
  };

  // Funciones de cálculo según metodología GTC-45
  const calcularNivelProbabilidad = (deficiencia, exposicion) => {
    return deficiencia * exposicion;
  };

  const interpretarProbabilidad = (nivelProbabilidad) => {
    if (nivelProbabilidad >= 40) return 'Muy Alta (MA)';
    if (nivelProbabilidad >= 20) return 'Alta (A)';
    if (nivelProbabilidad >= 10) return 'Media (M)';
    return 'Baja (B)';
  };

  const interpretarConsecuencia = (nivelConsecuencia) => {
    if (nivelConsecuencia >= 100) return 'Mortal o Catastrófico (M)';
    if (nivelConsecuencia >= 60) return 'Muy Grave (MG)';
    if (nivelConsecuencia >= 25) return 'Grave (G)';
    if (nivelConsecuencia >= 10) return 'Leve (L)';
    return 'Sin Lesión (SL)';
  };

  const calcularNivelRiesgo = (probabilidad, consecuencia) => {
    return probabilidad * consecuencia;
  };

  const interpretarRiesgo = (nivelRiesgo) => {
    if (nivelRiesgo >= 4000) return 'Crítico (I)';
    if (nivelRiesgo >= 600) return 'Alto (II)';
    if (nivelRiesgo >= 150) return 'Medio (III)';
    return 'Bajo (IV)';
  };

  const determinarAceptabilidad = (interpretacionRiesgo) => {
    if (interpretacionRiesgo.includes('Crítico') || interpretacionRiesgo.includes('Alto')) {
      return 'No Aceptable';
    }
    if (interpretacionRiesgo.includes('Medio')) {
      return 'Aceptable con Control Específico';
    }
    return 'Aceptable';
  };

  const actualizarCalculosRiesgo = (newFormData) => {
    const deficiencia = parseInt(newFormData.nivel_deficiencia) || 0;
    const exposicion = parseInt(newFormData.nivel_exposicion) || 0;
    const consecuencia = parseInt(newFormData.nivel_consecuencia) || 0;

    const probabilidad = calcularNivelProbabilidad(deficiencia, exposicion);
    const interpretacionProbabilidad = interpretarProbabilidad(probabilidad);
    const interpretacionConsecuencia = interpretarConsecuencia(consecuencia);
    const riesgo = calcularNivelRiesgo(probabilidad, consecuencia);
    const interpretacionRiesgo = interpretarRiesgo(riesgo);
    const aceptabilidad = determinarAceptabilidad(interpretacionRiesgo);

    return {
      ...newFormData,
      nivel_probabilidad: probabilidad,
      interpretacion_probabilidad: interpretacionProbabilidad,
      interpretacion_consecuencia: interpretacionConsecuencia,
      nivel_riesgo: riesgo,
      interpretacion_riesgo: interpretacionRiesgo,
      aceptabilidad_riesgo: aceptabilidad
    };
  };

  const getEstadisticas = () => {
    const totalRiesgos = riesgos.length;
    const riesgosCriticos = riesgos.filter(r => r.interpretacion_riesgo?.includes('Crítico')).length;
    const riesgosAltos = riesgos.filter(r => r.interpretacion_riesgo?.includes('Alto')).length;
    const riesgosNoAceptables = riesgos.filter(r => r.aceptabilidad_riesgo === 'No Aceptable').length;

    return { totalRiesgos, riesgosCriticos, riesgosAltos, riesgosNoAceptables };
  };

  const getRiesgoColor = (interpretacion) => {
    if (!interpretacion) return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
    
    if (interpretacion.includes('Crítico')) return { bg: '#1e1b4b', color: '#ffffff', border: '#312e81' };
    if (interpretacion.includes('Alto')) return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
    if (interpretacion.includes('Medio')) return { bg: '#fef3c7', color: '#d97706', border: '#fde68a' };
    if (interpretacion.includes('Bajo')) return { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' };
    
    return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
  };

  const getAceptabilidadColor = (aceptabilidad) => {
    switch (aceptabilidad) {
      case 'No Aceptable': return { bg: '#fef2f2', color: '#dc2626' };
      case 'Aceptable con Control': return { bg: '#fef3c7', color: '#d97706' };
      case 'Aceptable': return { bg: '#f0fdf4', color: '#166534' };
      default: return { bg: '#f8fafc', color: '#64748b' };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones de campos obligatorios
    if (!formData.codigo_riesgo.trim()) {
      setMensaje('El código de riesgo es obligatorio');
      return;
    }
    if (!formData.proceso.trim()) {
      setMensaje('El proceso es obligatorio');
      return;
    }
    if (!formData.actividad.trim()) {
      setMensaje('La actividad es obligatoria');
      return;
    }
    if (!formData.peligro_identificado.trim()) {
      setMensaje('El peligro identificado es obligatorio');
      return;
    }
    if (!formData.descripcion_riesgo.trim()) {
      setMensaje('La descripción del riesgo es obligatoria');
      return;
    }

    try {
      // Recalcular automáticamente antes de guardar
      const riesgoData = actualizarCalculosRiesgo(formData);

      let result;
      if (editingItem) {
        result = await supabase
          .from('matriz_riesgos')
          .update(riesgoData)
          .eq('id', editingItem.id);
      } else {
        result = await supabase
          .from('matriz_riesgos')
          .insert([riesgoData]);
      }

      if (result.error) throw result.error;

      setMensaje(editingItem ? 'Riesgo actualizado exitosamente' : 'Riesgo identificado exitosamente');
      resetForm();
      await cargarDatos();
      
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al guardar el riesgo');
    }
  };

  const resetForm = () => {
    setFormData({
      codigo_riesgo: '', proceso: '', actividad: '', tarea: '',
      area: 'Centro Industrial', puesto_trabajo: '', peligro_identificado: '',
      clasificacion_peligro: 'Físico', descripcion_riesgo: '', efectos_salud: '',
      personas_expuestas: 1, tiempo_exposicion_horas: 8, rutinario: true,
      nivel_deficiencia: 10, nivel_exposicion: 4, nivel_consecuencia: 25,
      responsable_implementacion: '', fecha_implementacion: '', observaciones: ''
    });
    setControlData({
      riesgo_id: '', tipo_control: 'Controles de Ingeniería', descripcion_control: '',
      responsable: '', fecha_implementacion: '', eficacia: 'Media',
      costo_estimado: 0, recursos_necesarios: ''
    });
    setEditingItem(null);
    setShowModal(false);
    setMensaje('');
    if (activeTab === 'matriz') {
      generarCodigoRiesgo();
    }
  };

  const handleEdit = (item, tipo) => {
    setEditingItem(item);
    setCurrentForm(tipo);
    
    if (tipo === 'riesgo') {
      setFormData({
        ...item,
        efectos_salud: item.efectos_salud?.join(', ') || ''
      });
    } else if (tipo === 'control') {
      setControlData(item);
    }
    
    setShowModal(true);
  };

  const handleDelete = async (id, tabla) => {
    if (!window.confirm('¿Estás seguro de eliminar este elemento?')) return;

    try {
      const result = await supabase.from(tabla).delete().eq('id', id);
      
      if (result.error) throw result.error;

      setMensaje('Elemento eliminado exitosamente');
      await cargarDatos();
    } catch (error) {
      console.error('Error eliminando:', error);
      setMensaje('Error al eliminar el elemento');
    }
  };

  const estadisticas = getEstadisticas();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-200 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
            <Icon name="Loader" size={24} className="text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Cargando Matriz de Riesgos SST</h3>
          <p className="text-slate-600">Obteniendo datos de riesgos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50">
      {/* Header Principal */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-red-700 to-red-700 rounded-2xl p-3 shadow-lg">
                <Icon name="AlertTriangle" size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-700 to-red-700 bg-clip-text text-transparent">
                  Matriz de Riesgos SST
                </h1>
                <p className="text-slate-600 font-medium">
                  Identificación • Evaluación • Control de Riesgos • Metodología GTC 45
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4 text-sm text-slate-600">
              <div className="text-right">
                <p className="font-medium">Total de Riesgos</p>
                <p className="text-2xl font-bold text-red-600">{estadisticas.totalRiesgos}</p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Estadísticas Dashboard */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Riesgos</p>
                <p className="text-3xl font-bold text-blue-600">{estadisticas.totalRiesgos}</p>
                <p className="text-xs text-slate-500 mt-1">registrados</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
                <Icon name="FileText" size={24} className="text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Riesgos Críticos</p>
                <p className="text-3xl font-bold text-indigo-900">{estadisticas.riesgosCriticos}</p>
                <p className="text-xs text-slate-500 mt-1">requieren acción inmediata</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-800 to-indigo-900 rounded-lg p-3">
                <Icon name="AlertTriangle" size={24} className="text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Riesgos Altos</p>
                <p className="text-3xl font-bold text-red-600">{estadisticas.riesgosAltos}</p>
                <p className="text-xs text-slate-500 mt-1">prioritarios</p>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-3">
                <Icon name="AlertCircle" size={24} className="text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">No Aceptables</p>
                <p className="text-3xl font-bold text-orange-600">{estadisticas.riesgosNoAceptables}</p>
                <p className="text-xs text-slate-500 mt-1">requieren control</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-3">
                <Icon name="XCircle" size={24} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {mensaje && (
        <div className="max-w-7xl mx-auto px-6">
          <div className={`${
            mensaje.includes('Error')
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-green-50 border-green-200 text-green-800'
          } border rounded-lg p-4 mb-6 flex items-center space-x-3`}>
            <Icon
              name={mensaje.includes('Error') ? 'AlertCircle' : 'CheckCircle'}
              size={20}
              className={mensaje.includes('Error') ? 'text-red-500' : 'text-green-500'}
            />
            <span className="font-medium">{mensaje}</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {[
              { key: 'matriz', label: 'Matriz de Riesgos', icon: 'AlertTriangle', color: 'from-red-600 to-red-700' },
              { key: 'controles', label: 'Controles', icon: 'Shield', color: 'from-red-700 to-red-800' },
              { key: 'evaluaciones', label: 'Evaluaciones', icon: 'BarChart3', color: 'from-orange-600 to-red-600' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex items-center space-x-3 px-6 py-4 rounded-t-xl font-semibold transition-all duration-300
                  ${
                    activeTab === tab.key
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg transform scale-105`
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                <Icon
                  name={tab.icon}
                  size={20}
                  className={activeTab === tab.key ? 'text-white' : 'text-slate-500'}
                />
                <span>{tab.label}</span>
                {activeTab === tab.key && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Botón Nuevo */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <button
          onClick={() => {
            const formMap = { 'matriz': 'riesgo', 'controles': 'control', 'evaluaciones': 'evaluacion' };
            setCurrentForm(formMap[activeTab]);
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Icon name="Plus" size={20} className="text-white" />
          <span>
            {activeTab === 'matriz' ? 'Nuevo Riesgo' :
             activeTab === 'controles' ? 'Nuevo Control' : 'Nueva Evaluación'}
          </span>
        </button>
      </div>

      {/* Contenido por Tab */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        {activeTab === 'matriz' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            {riesgos.length === 0 ? (
              <div className="text-center py-20">
                <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <Icon name="AlertTriangle" size={32} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No hay riesgos identificados</h3>
                <p className="text-slate-600 mb-6">Comienza la identificación del primer riesgo</p>
                <button
                  onClick={() => {
                    setCurrentForm('riesgo');
                    setShowModal(true);
                  }}
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300"
                >
                  Identificar Primer Riesgo
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Riesgo</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Proceso</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Clasificación</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Nivel de Riesgo</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Aceptabilidad</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {riesgos.map((riesgo) => {
                      const riesgoColor = getRiesgoColor(riesgo.interpretacion_riesgo);
                      const aceptabilidadColor = getAceptabilidadColor(riesgo.aceptabilidad_riesgo);
                      return (
                        <tr key={riesgo.id} className="hover:bg-slate-50 transition-colors duration-200">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-semibold text-slate-900 mb-1">
                                {riesgo.codigo_riesgo}
                              </div>
                              <div className="text-sm text-slate-600">
                                {riesgo.peligro_identificado}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-700">{riesgo.proceso}</td>
                          <td className="px-6 py-4 text-slate-700">{riesgo.clasificacion_peligro}</td>
                          <td className="px-6 py-4">
                            <span
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: riesgoColor.bg,
                                color: riesgoColor.color,
                                border: `1px solid ${riesgoColor.border}`
                              }}
                            >
                              {riesgo.interpretacion_riesgo || 'No Evaluado'}
                            </span>
                            <div className="text-xs text-slate-500 mt-1">
                              NR: {riesgo.nivel_riesgo || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: aceptabilidadColor.bg,
                                color: aceptabilidadColor.color
                              }}
                            >
                              {riesgo.aceptabilidad_riesgo || 'No Evaluado'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => handleEdit(riesgo, 'riesgo')}
                                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                                title="Editar"
                              >
                                <Icon name="Edit" size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(riesgo.id, 'matriz_riesgos')}
                                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                                title="Eliminar"
                              >
                                <Icon name="Trash2" size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Contenido simplificado para otros tabs */}
        {activeTab === 'controles' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mb-4">
                <Icon name="Shield" size={24} className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Controles de Riesgo - {controles.length} controles
              </h3>
              <p className="text-slate-600 mb-6">
                Jerarquía de controles: Eliminación, Sustitución, Ingeniería, Administrativos, EPP
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  🚧 Módulo en desarrollo - Próximamente disponible
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'evaluaciones' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mb-4">
                <Icon name="BarChart3" size={24} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Evaluaciones de Riesgo - {evaluaciones.length} evaluaciones
              </h3>
              <p className="text-slate-600 mb-6">
                Historial de evaluaciones con metodología GTC 45
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  🚧 Módulo en desarrollo - Próximamente disponible
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal modernizado */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Icon name="AlertTriangle" size={24} className="text-white" />
                  <h2 className="text-xl font-bold text-white">
                    {editingItem ? 'Editar' : 'Nuevo'} Riesgo - Metodología GTC 45
                  </h2>
                </div>
                <button
                  onClick={resetForm}
                  className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Icon name="X" size={20} />
                </button>
              </div>
              <p className="text-red-100 mt-2">
                Los cálculos de nivel de riesgo se realizan automáticamente según la metodología colombiana.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="p-6 space-y-8">
                {/* Información Básica */}
                <div className="bg-slate-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                    <Icon name="FileText" size={20} className="text-red-600" />
                    <span>Información Básica</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Código del Riesgo *
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={formData.codigo_riesgo}
                          onChange={(e) => setFormData({...formData, codigo_riesgo: e.target.value})}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="RG-2024-001"
                          required
                        />
                        <button
                          type="button"
                          onClick={generarCodigoRiesgo}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          title="Generar código automático"
                        >
                          <Icon name="RefreshCw" size={16} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Versión
                      </label>
                      <input
                        type="text"
                        value={formData.version}
                        onChange={(e) => setFormData({...formData, version: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Fecha de Evaluación *
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_evaluacion}
                        onChange={(e) => setFormData({...formData, fecha_evaluacion: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Identificación del Proceso */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                    <Icon name="Workflow" size={20} className="text-blue-600" />
                    <span>Identificación del Proceso</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Proceso *
                      </label>
                      <input
                        type="text"
                        value={formData.proceso}
                        onChange={(e) => setFormData({...formData, proceso: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: Producción, Mantenimiento, Logística"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Actividad *
                      </label>
                      <input
                        type="text"
                        value={formData.actividad}
                        onChange={(e) => setFormData({...formData, actividad: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: Operación de maquinaria, Soldadura"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Tarea Específica
                      </label>
                      <input
                        type="text"
                        value={formData.tarea}
                        onChange={(e) => setFormData({...formData, tarea: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: Corte de material, Inspección visual"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Área
                      </label>
                      <select
                        value={formData.area}
                        onChange={(e) => setFormData({...formData, area: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Seleccionar área</option>
                        {areas.map(area => (
                          <option key={area} value={area}>{area}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Puesto de Trabajo
                      </label>
                      <input
                        type="text"
                        value={formData.puesto_trabajo}
                        onChange={(e) => setFormData({...formData, puesto_trabajo: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: Operario de máquina, Soldador, Supervisor"
                      />
                    </div>
                  </div>
                </div>

                {/* Identificación de Peligros */}
                <div className="bg-orange-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                    <Icon name="AlertTriangle" size={20} className="text-orange-600" />
                    <span>Identificación de Peligros</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Peligro Identificado *
                      </label>
                      <input
                        type="text"
                        value={formData.peligro_identificado}
                        onChange={(e) => setFormData({...formData, peligro_identificado: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Ej: Ruido, Vapores químicos, Superficies calientes"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Clasificación del Peligro *
                      </label>
                      <select
                        value={formData.clasificacion_peligro}
                        onChange={(e) => setFormData({...formData, clasificacion_peligro: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      >
                        {clasificacionesPeligro.map(tipo => (
                          <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Descripción del Riesgo *
                      </label>
                      <textarea
                        value={formData.descripcion_riesgo}
                        onChange={(e) => setFormData({...formData, descripcion_riesgo: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-20 resize-none"
                        placeholder="Describe el riesgo asociado al peligro identificado..."
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Evaluación de Exposición */}
                <div className="bg-purple-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                    <Icon name="Users" size={20} className="text-purple-600" />
                    <span>Evaluación de Exposición</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Personas Expuestas
                      </label>
                      <input
                        type="number"
                        value={formData.personas_expuestas}
                        onChange={(e) => setFormData({...formData, personas_expuestas: parseInt(e.target.value) || 1})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Tiempo de Exposición (horas)
                      </label>
                      <input
                        type="number"
                        value={formData.tiempo_exposicion_horas}
                        onChange={(e) => setFormData({...formData, tiempo_exposicion_horas: parseFloat(e.target.value) || 8})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        step="0.5"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Tipo de Exposición
                      </label>
                      <div className="flex items-center space-x-4 pt-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="rutinario"
                            checked={formData.rutinario}
                            onChange={() => setFormData({...formData, rutinario: true})}
                            className="text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm">Rutinario</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="rutinario"
                            checked={!formData.rutinario}
                            onChange={() => setFormData({...formData, rutinario: false})}
                            className="text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm">No Rutinario</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evaluación del Riesgo - GTC 45 */}
                <div className="bg-red-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                    <Icon name="Calculator" size={20} className="text-red-600" />
                    <span>Evaluación del Riesgo (GTC-45)</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nivel de Deficiencia (ND)
                      </label>
                      <select
                        value={formData.nivel_deficiencia}
                        onChange={(e) => {
                          const newFormData = {...formData, nivel_deficiencia: parseInt(e.target.value)};
                          const updatedData = actualizarCalculosRiesgo(newFormData);
                          setFormData(updatedData);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        {nivelesDeficiencia.map(nivel => (
                          <option key={nivel.valor} value={nivel.valor}>{nivel.texto}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nivel de Exposición (NE)
                      </label>
                      <select
                        value={formData.nivel_exposicion}
                        onChange={(e) => {
                          const newFormData = {...formData, nivel_exposicion: parseInt(e.target.value)};
                          const updatedData = actualizarCalculosRiesgo(newFormData);
                          setFormData(updatedData);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        {nivelesExposicion.map(nivel => (
                          <option key={nivel.valor} value={nivel.valor}>{nivel.texto}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nivel de Consecuencia (NC)
                      </label>
                      <select
                        value={formData.nivel_consecuencia}
                        onChange={(e) => {
                          const newFormData = {...formData, nivel_consecuencia: parseInt(e.target.value)};
                          const updatedData = actualizarCalculosRiesgo(newFormData);
                          setFormData(updatedData);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        {nivelesConsecuencia.map(nivel => (
                          <option key={nivel.valor} value={nivel.valor}>{nivel.texto}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Resultados Automáticos */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="text-sm text-slate-600">Nivel de Probabilidad</div>
                      <div className="text-xl font-bold text-slate-900">{formData.nivel_probabilidad || 0}</div>
                      <div className="text-xs text-slate-500">{formData.interpretacion_probabilidad}</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="text-sm text-slate-600">Nivel de Riesgo</div>
                      <div className="text-xl font-bold text-slate-900">{formData.nivel_riesgo || 0}</div>
                      <div className="text-xs text-slate-500">{formData.interpretacion_riesgo}</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="text-sm text-slate-600">Interpretación</div>
                      <div className="text-sm font-semibold text-slate-900">{formData.interpretacion_consecuencia}</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="text-sm text-slate-600">Aceptabilidad</div>
                      <div className={`text-sm font-semibold ${
                        formData.aceptabilidad_riesgo === 'No Aceptable' ? 'text-red-600' :
                        formData.aceptabilidad_riesgo?.includes('Control') ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {formData.aceptabilidad_riesgo}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información Adicional */}
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                    <Icon name="Settings" size={20} className="text-green-600" />
                    <span>Información Adicional</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Responsable de Implementación
                      </label>
                      <input
                        type="text"
                        value={formData.responsable_implementacion}
                        onChange={(e) => setFormData({...formData, responsable_implementacion: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Nombre del responsable"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Fecha de Implementación
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_implementacion}
                        onChange={(e) => setFormData({...formData, fecha_implementacion: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Estado del Riesgo
                      </label>
                      <select
                        value={formData.estado_riesgo}
                        onChange={(e) => setFormData({...formData, estado_riesgo: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        {estadosRiesgo.map(estado => (
                          <option key={estado} value={estado} className="capitalize">
                            {estado.charAt(0).toUpperCase() + estado.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Observaciones
                      </label>
                      <textarea
                        value={formData.observaciones}
                        onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 h-20 resize-none"
                        placeholder="Observaciones adicionales sobre el riesgo..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer del formulario */}
              <div className="flex justify-end space-x-4 p-6 bg-slate-50 border-t border-slate-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg"
                >
                  {editingItem ? 'Actualizar' : 'Guardar'} Riesgo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatrizRiesgosMain;