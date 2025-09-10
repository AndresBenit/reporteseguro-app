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
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: '#64748b' }}>Cargando matriz de riesgos...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '40px', height: '40px', background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icon name="AlertTriangle" size={24} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>
              Matriz de Riesgos SST
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '16px' }}>
              Identificación, evaluación y control de riesgos - Metodología GTC 45
            </p>
          </div>
        </div>

        {/* Estadísticas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#2563eb', marginBottom: '4px' }}>
              {estadisticas.totalRiesgos}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Total Riesgos</div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e1b4b', marginBottom: '4px' }}>
              {estadisticas.riesgosCriticos}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Riesgos Críticos</div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626', marginBottom: '4px' }}>
              {estadisticas.riesgosAltos}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Riesgos Altos</div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#ea580c', marginBottom: '4px' }}>
              {estadisticas.riesgosNoAceptables}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>No Aceptables</div>
          </div>
        </div>
      </div>

      {mensaje && (
        <div style={{
          background: mensaje.includes('Error') ? '#fef2f2' : '#f0fdf4',
          color: mensaje.includes('Error') ? '#dc2626' : '#166534',
          padding: '12px 16px', borderRadius: '8px', marginBottom: '24px',
          border: `1px solid ${mensaje.includes('Error') ? '#fecaca' : '#bbf7d0'}`
        }}>
          {mensaje}
        </div>
      )}

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '32px' }}>
          {[
            { key: 'matriz', label: 'Matriz de Riesgos', icon: 'AlertTriangle' },
            { key: 'controles', label: 'Controles', icon: 'Shield' },
            { key: 'evaluaciones', label: 'Evaluaciones', icon: 'BarChart3' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 0', background: 'none', border: 'none',
                fontSize: '16px', fontWeight: 500, cursor: 'pointer',
                color: activeTab === tab.key ? '#dc2626' : '#64748b',
                borderBottom: activeTab === tab.key ? '2px solid #dc2626' : '2px solid transparent'
              }}
            >
              <Icon name={tab.icon} size={20} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Botón Nuevo */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => {
            const formMap = { 'matriz': 'riesgo', 'controles': 'control', 'evaluaciones': 'evaluacion' };
            setCurrentForm(formMap[activeTab]);
            setShowModal(true);
          }}
          style={{
            background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
            color: 'white', border: 'none', padding: '12px 24px',
            borderRadius: '8px', fontSize: '16px', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Icon name="Plus" size={20} />
          {activeTab === 'matriz' ? 'Nuevo Riesgo' : 
           activeTab === 'controles' ? 'Nuevo Control' : 'Nueva Evaluación'}
        </button>
      </div>

      {/* Contenido por Tab */}
      {activeTab === 'matriz' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {riesgos.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <Icon name="AlertTriangle" size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>No hay riesgos identificados</h3>
              <p>Comienza la identificación del primer riesgo</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Riesgo</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Proceso</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Clasificación</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Nivel de Riesgo</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Aceptabilidad</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {riesgos.map((riesgo) => {
                    const riesgoColor = getRiesgoColor(riesgo.interpretacion_riesgo);
                    const aceptabilidadColor = getAceptabilidadColor(riesgo.aceptabilidad_riesgo);
                    return (
                      <tr key={riesgo.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                              {riesgo.codigo_riesgo}
                            </div>
                            <div style={{ fontSize: '14px', color: '#64748b' }}>
                              {riesgo.peligro_identificado}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px', color: '#64748b' }}>{riesgo.proceso}</td>
                        <td style={{ padding: '16px', color: '#64748b' }}>{riesgo.clasificacion_peligro}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600,
                            background: riesgoColor.bg, color: riesgoColor.color,
                            border: `1px solid ${riesgoColor.border}`
                          }}>
                            {riesgo.interpretacion_riesgo || 'No Evaluado'}
                          </span>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                            NR: {riesgo.nivel_riesgo || 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600,
                            background: aceptabilidadColor.bg, color: aceptabilidadColor.color
                          }}>
                            {riesgo.aceptabilidad_riesgo || 'No Evaluado'}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleEdit(riesgo, 'riesgo')}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                padding: '8px', borderRadius: '6px', color: '#6b7280'
                              }}
                              title="Editar"
                            >
                              <Icon name="Edit" size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(riesgo.id, 'matriz_riesgos')}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                padding: '8px', borderRadius: '6px', color: '#ef4444'
                              }}
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
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <h3>Controles de Riesgo - {controles.length} controles</h3>
          <p style={{ color: '#64748b' }}>Jerarquía de controles: Eliminación, Sustitución, Ingeniería, Administrativos, EPP</p>
        </div>
      )}

      {activeTab === 'evaluaciones' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <h3>Evaluaciones de Riesgo - {evaluaciones.length} evaluaciones</h3>
          <p style={{ color: '#64748b' }}>Historial de evaluaciones con metodología GTC 45</p>
        </div>
      )}

      {/* Modal simplificado */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', borderRadius: '12px', width: '90%',
            maxWidth: '600px', maxHeight: '90vh', overflow: 'auto', padding: '24px'
          }}>
            <h2 style={{ marginBottom: '16px' }}>
              {editingItem ? 'Editar' : 'Nuevo'} Riesgo - Metodología GTC 45
            </h2>
            <p style={{ color: '#64748b', marginBottom: '16px' }}>
              Los cálculos de nivel de riesgo se realizan automáticamente según la metodología colombiana.
            </p>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={resetForm}
                style={{
                  padding: '12px 24px', border: '1px solid #d1d5db',
                  background: 'white', borderRadius: '8px', cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                style={{
                  padding: '12px 24px', background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                  color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
                }}
              >
                Guardar Riesgo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatrizRiesgosMain;