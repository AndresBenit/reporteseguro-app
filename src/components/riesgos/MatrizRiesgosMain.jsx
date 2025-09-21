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
    proceso: '',
    actividad: '',
    tarea: '',
    area: 'Centro Industrial',
    puesto_trabajo: '',
    peligro_identificado: '',
    clasificacion_peligro: 'Físico',
    descripcion_riesgo: '',
    efectos_salud: '',
    personas_expuestas: 1,
    tiempo_exposicion_horas: 8,
    rutinario: true,
    nivel_deficiencia: 10,
    nivel_exposicion: 4,
    nivel_consecuencia: 25,
    responsable_implementacion: '',
    fecha_implementacion: '',
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

  const handleSubmitRiesgo = async (e) => {
    e.preventDefault();
    
    if (!formData.codigo_riesgo.trim() || !formData.proceso.trim()) {
      setMensaje('Código de riesgo y proceso son obligatorios');
      return;
    }

    try {
      const riesgoData = {
        ...formData,
        efectos_salud: formData.efectos_salud ? formData.efectos_salud.split(',').map(e => e.trim()).filter(e => e) : []
      };

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

            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 text-sm flex items-center space-x-2">
                  <Icon name="Info" size={16} className="text-blue-600" />
                  <span>🚧 Formulario completo en desarrollo - Próximamente disponible</span>
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg"
                >
                  Guardar Riesgo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatrizRiesgosMain;