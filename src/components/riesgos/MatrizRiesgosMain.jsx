import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Icon } from '../common/Icons';

const MatrizRiesgosMain = () => {
  const [vistaActiva, setVistaActiva] = useState('dashboard');
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
      administrativos: []
    },
    responsable_implementacion: '',
    fecha_implementacion: '',
    costo_estimado: 0,
    recursos_necesarios: '',
    seguimiento_fecha: '',
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

  const vistas = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'BarChart3',
      color: 'from-red-600 to-red-700',
      description: 'Vista analítica de matriz de riesgos, evaluaciones GTC-45 y controles implementados'
    },
    {
      id: 'evaluacion',
      label: 'Evaluación de Riesgos',
      icon: 'AlertTriangle',
      color: 'from-amber-600 to-amber-700',
      description: 'Identificación y evaluación de peligros según metodología GTC-45'
    },
    {
      id: 'controles',
      label: 'Controles de Riesgos',
      icon: 'Shield',
      color: 'from-emerald-600 to-emerald-700',
      description: 'Gestión de medidas de control según jerarquía de controles SST'
    }
  ];

  const vistaActual = vistas.find(v => v.id === vistaActiva);

  const clasificacionesPeligro = [
    'Biológico', 'Físico', 'Químico', 'Psicosocial', 'Biomecánico',
    'Condiciones de Seguridad', 'Fenómenos Naturales'
  ];

  const areas = [
    'Centro Industrial', 'Hornos Solera', 'Administrativa', 'Logística',
    'Mantenimiento', 'Calidad', 'Laboratorio', 'Bodega'
  ];

  const nivelesDeficiencia = [
    { valor: 10, texto: 'Muy Alto (MA): Se han detectado factores de riesgo significativos' },
    { valor: 6, texto: 'Alto (A): Se han detectado algunos factores de riesgo importantes' },
    { valor: 2, texto: 'Medio (M): Se han detectado factores de riesgo de menor importancia' },
    { valor: 0, texto: 'Bajo (B): No se han detectado anomalías destacables' }
  ];

  const nivelesExposicion = [
    { valor: 4, texto: 'Continua (EC): Continuamente. Varias veces en su jornada laboral con tiempo prolongado' },
    { valor: 3, texto: 'Frecuente (EF): Varias veces en su jornada laboral aunque sea con tiempos cortos' },
    { valor: 2, texto: 'Ocasional (EO): Alguna vez en su jornada laboral y por un período de tiempo corto' },
    { valor: 1, texto: 'Esporádica (EE): Irregularmente' }
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
    if (!formData.codigo_riesgo && vistaActiva === 'dashboard') {
      generarCodigoRiesgo();
    }
  }, [vistaActiva]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [riesgosRes, controlesRes, evaluacionesRes] = await Promise.all([
        supabase.from('matriz_riesgos').select('*').order('nivel_riesgo', { ascending: false }),
        supabase.from('controles_riesgos').select('*').order('created_at', { ascending: false }),
        supabase.from('matriz_riesgos').select('*').order('fecha_evaluacion', { ascending: false })
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
    const numero = String(riesgos.length + 1).padStart(3, '0');
    setFormData({ ...formData, codigo_riesgo: `RG-${año}-${numero}` });
  };

  const calcularNivelProbabilidad = (nd, ne) => nd * ne;

  const interpretarProbabilidad = (np) => {
    if (np >= 20) return 'Muy Alto (MA)';
    if (np >= 8) return 'Alto (A)';
    if (np >= 2) return 'Medio (M)';
    return 'Bajo (B)';
  };

  const calcularNivelRiesgo = (np, nc) => np * nc;

  const interpretarRiesgo = (nr) => {
    if (nr >= 600) return 'I - No Aceptable';
    if (nr >= 150) return 'II - No Aceptable o Aceptable con Control';
    if (nr >= 40) return 'III - Mejorable';
    return 'IV - Aceptable';
  };

  const getAceptabilidadRiesgo = (interpretacion) => {
    if (interpretacion.includes('No Aceptable')) return 'No Aceptable';
    if (interpretacion.includes('Control')) return 'Aceptable con Control';
    if (interpretacion.includes('Mejorable')) return 'Mejorable';
    return 'Aceptable';
  };

  const getEstadisticas = () => {
    const totalRiesgos = riesgos.length;
    const riesgosCriticos = riesgos.filter(r => r.nivel_riesgo >= 600).length;
    const riesgosAltos = riesgos.filter(r => r.nivel_riesgo >= 150 && r.nivel_riesgo < 600).length;
    const riesgosMedios = riesgos.filter(r => r.nivel_riesgo >= 40 && r.nivel_riesgo < 150).length;
    const riesgosBajos = riesgos.filter(r => r.nivel_riesgo < 40).length;

    return {
      totalRiesgos,
      riesgosCriticos,
      riesgosAltos,
      riesgosMedios,
      riesgosBajos
    };
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
    if (vistaActiva === 'dashboard') {
      generarCodigoRiesgo();
    }
  };

  const estadisticas = getEstadisticas();

  const renderContent = () => {
    switch (vistaActiva) {
      case 'dashboard':
        return (
          <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
            {/* Estadísticas Cards */}
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
                    <p className="text-3xl font-bold text-red-600">{estadisticas.riesgosCriticos}</p>
                    <p className="text-xs text-slate-500 mt-1">requieren acción inmediata</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-3">
                    <Icon name="AlertTriangle" size={24} className="text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Riesgos Altos</p>
                    <p className="text-3xl font-bold text-orange-600">{estadisticas.riesgosAltos}</p>
                    <p className="text-xs text-slate-500 mt-1">necesitan control</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-3">
                    <Icon name="AlertCircle" size={24} className="text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Controles Activos</p>
                    <p className="text-3xl font-bold text-green-600">{controles.length}</p>
                    <p className="text-xs text-slate-500 mt-1">implementados</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
                    <Icon name="Shield" size={24} className="text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Botón para agregar nuevo riesgo */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Matriz de Riesgos - Metodología GTC 45</h2>
                <p className="text-slate-600 mt-1">Identificación, evaluación y control de riesgos laborales</p>
              </div>
              <button
                onClick={() => { setCurrentForm('riesgo'); setShowModal(true); }}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
              >
                <Icon name="Plus" size={20} />
                <span>Nuevo Riesgo</span>
              </button>
            </div>

            {/* Tabla de riesgos */}
            {riesgos.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold">Código</th>
                        <th className="px-6 py-4 text-left font-semibold">Proceso</th>
                        <th className="px-6 py-4 text-left font-semibold">Peligro</th>
                        <th className="px-6 py-4 text-left font-semibold">Clasificación</th>
                        <th className="px-6 py-4 text-left font-semibold">Nivel Riesgo</th>
                        <th className="px-6 py-4 text-left font-semibold">Aceptabilidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riesgos.map((riesgo, index) => (
                        <tr key={riesgo.id || index} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {riesgo.codigo_riesgo}
                          </td>
                          <td className="px-6 py-4 text-slate-700 max-w-xs truncate">
                            {riesgo.proceso}
                          </td>
                          <td className="px-6 py-4 text-slate-700 max-w-xs truncate">
                            {riesgo.peligro_identificado}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                              {riesgo.clasificacion_peligro}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-lg text-red-600">
                                {riesgo.nivel_riesgo || 'N/A'}
                              </span>
                              <span className="text-xs text-slate-500">
                                ({riesgo.interpretacion_riesgo})
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                              riesgo.aceptabilidad_riesgo === 'Aceptable' ? 'bg-green-100 text-green-800' :
                              riesgo.aceptabilidad_riesgo === 'Aceptable con controles' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {riesgo.aceptabilidad_riesgo || 'Sin evaluar'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 py-16">
                <div className="text-center">
                  <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Icon name="AlertTriangle" size={32} className="text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay riesgos registrados</h3>
                  <p className="text-slate-600 mb-6">Comienza creando tu primera evaluación de riesgo siguiendo la metodología GTC-45</p>
                  <button
                    onClick={() => { setCurrentForm('riesgo'); setShowModal(true); }}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 mx-auto"
                  >
                    <Icon name="Plus" size={20} />
                    <span>Crear Primer Riesgo</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'evaluacion':
        return (
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="AlertTriangle" size={32} className="text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Evaluación de Riesgos</h3>
              <p className="text-slate-600 mb-4">
                Identificación y evaluación de peligros según metodología GTC-45
              </p>
              <button
                onClick={() => { setCurrentForm('riesgo'); setShowModal(true); }}
                className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 mx-auto"
              >
                <Icon name="Plus" size={20} />
                <span>Nueva Evaluación</span>
              </button>
            </div>
          </div>
        );
      case 'controles':
        return (
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="Shield" size={32} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Controles de Riesgos</h3>
              <p className="text-slate-600 mb-4">
                Gestión de medidas de control según jerarquía de controles SST
              </p>
              <button
                onClick={() => { setCurrentForm('control'); setShowModal(true); }}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 mx-auto"
              >
                <Icon name="Plus" size={20} />
                <span>Nuevo Control</span>
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
            {/* Dashboard por defecto */}
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
            </div>
          </div>
        );
    }
  };

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
              <div className="bg-gradient-to-br from-red-700 to-amber-700 rounded-2xl p-3 shadow-lg">
                <Icon name="AlertTriangle" size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-700 to-amber-700 bg-clip-text text-transparent">
                  Matriz de Riesgos GTC-45
                </h1>
                <p className="text-slate-600 font-medium">
                  Identificación • Evaluación • Control • Seguimiento • Metodología GTC-45
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Sistema Riesgos Activo</span>
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
      <div className="bg-gradient-to-r from-slate-50 to-red-50 border-b border-slate-200">
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
      <div>
        {renderContent()}
      </div>

      {/* Mensaje de estado */}
      {mensaje && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {mensaje}
          <button
            onClick={() => setMensaje('')}
            className="ml-2 text-white/80 hover:text-white"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default MatrizRiesgosMain;