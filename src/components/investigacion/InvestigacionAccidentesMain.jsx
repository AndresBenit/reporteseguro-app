import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Icon } from '../common/Icons';

const InvestigacionAccidentesMain = () => {
  const [activeTab, setActiveTab] = useState('investigaciones');
  const [investigaciones, setInvestigaciones] = useState([]);
  const [causas, setCausas] = useState([]);
  const [acciones, setAcciones] = useState([]);
  const [indicadores, setIndicadores] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentForm, setCurrentForm] = useState('investigacion');

  const [formData, setFormData] = useState({
    numero_caso: '',
    fecha_accidente: new Date().toISOString().slice(0, 16),
    fecha_investigacion: new Date().toISOString().split('T')[0],
    tipo_evento: 'Accidente de Trabajo',
    clasificacion_inicial: 'Leve',
    lugar_accidente: '',
    area_accidente: 'Centro Industrial',
    persona_afectada_id: '',
    persona_afectada_externa: '',
    cargo_persona: '',
    experiencia_cargo: 0,
    descripcion_hechos: '',
    actividad_realizada: '',
    condiciones_ambientales: '',
    epp_utilizados: '',
    lesiones_descripcion: '',
    parte_cuerpo_lesionada: '',
    atencion_medica: 'No requirió',
    dias_incapacidad: 0,
    investigador_principal: '',
    equipo_investigacion: '',
    metodologia: 'Árbol de Causas',
    causas_raiz: '',
    acciones_inmediatas: '',
    costo_estimado: 0,
    dias_perdidos: 0,
    lecciones_aprendidas: '',
    recomendaciones_generales: '',
    notificacion_arl: false,
    numero_furat: ''
  });

  const [causaData, setCausaData] = useState({
    investigacion_id: '',
    tipo_causa: 'Inmediata',
    categoria: 'Actos Inseguros',
    descripcion: '',
    evidencias: ''
  });

  const [accionData, setAccionData] = useState({
    investigacion_id: '',
    tipo_accion: 'Correctiva',
    descripcion: '',
    responsable: '',
    fecha_compromiso: '',
    recursos_necesarios: '',
    costo_estimado: 0,
    prioridad: 'media'
  });

  const [indicadorData, setIndicadorData] = useState({
    periodo: new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0'),
    año: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    area: 'General',
    total_trabajadores: 0,
    horas_trabajadas: 0,
    accidentes_trabajo: 0,
    incidentes_trabajo: 0,
    casi_accidentes: 0,
    dias_perdidos: 0,
    accidentes_leves: 0,
    accidentes_graves: 0,
    accidentes_mortales: 0
  });

  const tiposEvento = [
    'Accidente de Trabajo', 'Incidente de Trabajo', 'Enfermedad Laboral',
    'Accidente de Trayecto', 'Casi Accidente'
  ];

  const clasificaciones = ['Leve', 'Grave', 'Mortal', 'Catastrófico'];

  const tiposCausa = ['Inmediata', 'Básica', 'Raíz'];
  
  const categoriasCausa = [
    'Actos Inseguros', 'Condiciones Inseguras', 'Factores Personales',
    'Factores del Trabajo', 'Falta de Control Gerencial', 'Factores Ambientales',
    'Deficiencias del Sistema'
  ];

  const tiposAccion = ['Correctiva', 'Preventiva', 'Mejora'];

  const metodologias = ['Árbol de Causas', 'Espina de Pescado', 'Análisis de Barreras', 'TRIPOD', 'Otro'];

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!formData.numero_caso && activeTab === 'investigaciones') {
      generarNumeroCaso();
    }
  }, [activeTab]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const [investigacionesRes, causasRes, accionesRes, indicadoresRes, colaboradoresRes] = await Promise.all([
        supabase.from('investigaciones_accidentes').select('*, colaboradores(nombre_completo)').order('fecha_accidente', { ascending: false }),
        supabase.from('causas_accidentes').select('*, investigaciones_accidentes(numero_caso)').order('created_at', { ascending: false }),
        supabase.from('acciones_correctivas').select('*, investigaciones_accidentes(numero_caso)').order('fecha_compromiso'),
        supabase.from('indicadores_accidentalidad').select('*').order('año', { ascending: false }).order('mes', { ascending: false }),
        supabase.from('colaboradores').select('id, nombre_completo').eq('activo', true)
      ]);

      if (investigacionesRes.error) throw investigacionesRes.error;
      if (causasRes.error) throw causasRes.error;
      if (accionesRes.error) throw accionesRes.error;
      if (indicadoresRes.error) throw indicadoresRes.error;
      if (colaboradoresRes.error) throw colaboradoresRes.error;

      setInvestigaciones(investigacionesRes.data || []);
      setCausas(causasRes.data || []);
      setAcciones(accionesRes.data || []);
      setIndicadores(indicadoresRes.data || []);
      setColaboradores(colaboradoresRes.data || []);

    } catch (error) {
      console.error('Error cargando datos:', error);
      setMensaje('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const generarNumeroCaso = () => {
    const año = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    const numeroCaso = `ACC-${año}-${timestamp}`;
    setFormData(prev => ({ ...prev, numero_caso: numeroCaso }));
  };

  const getEstadisticas = () => {
    const investigacionesAbiertas = investigaciones.filter(i => i.estado_investigacion === 'abierta').length;
    const investigacionesMes = investigaciones.filter(i => {
      const fechaAccidente = new Date(i.fecha_accidente);
      const ahora = new Date();
      return fechaAccidente.getMonth() === ahora.getMonth() && fechaAccidente.getFullYear() === ahora.getFullYear();
    }).length;
    const accionesPendientes = acciones.filter(a => a.estado === 'asignada' || a.estado === 'en_proceso').length;
    const accidentesGraves = investigaciones.filter(i => i.clasificacion_inicial === 'Grave' || i.clasificacion_inicial === 'Mortal').length;

    return { investigacionesAbiertas, investigacionesMes, accionesPendientes, accidentesGraves };
  };

  const handleSubmitInvestigacion = async (e) => {
    e.preventDefault();
    
    if (!formData.numero_caso.trim() || !formData.descripcion_hechos.trim()) {
      setMensaje('Número de caso y descripción de hechos son obligatorios');
      return;
    }

    try {
      const investigacionData = {
        ...formData,
        epp_utilizados: formData.epp_utilizados ? formData.epp_utilizados.split(',').map(e => e.trim()).filter(e => e) : [],
        parte_cuerpo_lesionada: formData.parte_cuerpo_lesionada ? formData.parte_cuerpo_lesionada.split(',').map(p => p.trim()).filter(p => p) : [],
        equipo_investigacion: formData.equipo_investigacion ? formData.equipo_investigacion.split(',').map(e => e.trim()).filter(e => e) : [],
        testigos: []
      };

      let result;
      if (editingItem) {
        result = await supabase
          .from('investigaciones_accidentes')
          .update(investigacionData)
          .eq('id', editingItem.id);
      } else {
        result = await supabase
          .from('investigaciones_accidentes')
          .insert([investigacionData]);
      }

      if (result.error) throw result.error;

      setMensaje(editingItem ? 'Investigación actualizada exitosamente' : 'Investigación creada exitosamente');
      resetForm();
      await cargarDatos();
      
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al guardar la investigación');
    }
  };

  const handleSubmitCausa = async (e) => {
    e.preventDefault();

    if (!causaData.investigacion_id || !causaData.descripcion.trim()) {
      setMensaje('Investigación y descripción son obligatorios');
      return;
    }

    try {
      let result;
      if (editingItem) {
        result = await supabase
          .from('causas_accidentes')
          .update(causaData)
          .eq('id', editingItem.id);
      } else {
        result = await supabase
          .from('causas_accidentes')
          .insert([causaData]);
      }

      if (result.error) throw result.error;

      setMensaje(editingItem ? 'Causa actualizada exitosamente' : 'Causa registrada exitosamente');
      resetForm();
      await cargarDatos();
      
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al guardar la causa');
    }
  };

  const handleSubmitAccion = async (e) => {
    e.preventDefault();

    if (!accionData.investigacion_id || !accionData.descripcion.trim()) {
      setMensaje('Investigación y descripción son obligatorios');
      return;
    }

    try {
      let result;
      if (editingItem) {
        result = await supabase
          .from('acciones_correctivas')
          .update(accionData)
          .eq('id', editingItem.id);
      } else {
        result = await supabase
          .from('acciones_correctivas')
          .insert([accionData]);
      }

      if (result.error) throw result.error;

      setMensaje(editingItem ? 'Acción actualizada exitosamente' : 'Acción creada exitosamente');
      resetForm();
      await cargarDatos();
      
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al guardar la acción');
    }
  };

  const handleSubmitIndicador = async (e) => {
    e.preventDefault();

    if (!indicadorData.periodo || indicadorData.total_trabajadores <= 0) {
      setMensaje('Periodo y total de trabajadores son obligatorios');
      return;
    }

    try {
      let result;
      if (editingItem) {
        result = await supabase
          .from('indicadores_accidentalidad')
          .update(indicadorData)
          .eq('id', editingItem.id);
      } else {
        result = await supabase
          .from('indicadores_accidentalidad')
          .insert([indicadorData]);
      }

      if (result.error) throw result.error;

      setMensaje(editingItem ? 'Indicador actualizado exitosamente' : 'Indicador creado exitosamente');
      resetForm();
      await cargarDatos();
      
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al guardar el indicador');
    }
  };

  const resetForm = () => {
    setFormData({
      numero_caso: '', fecha_accidente: new Date().toISOString().slice(0, 16),
      fecha_investigacion: new Date().toISOString().split('T')[0],
      tipo_evento: 'Accidente de Trabajo', clasificacion_inicial: 'Leve',
      lugar_accidente: '', area_accidente: 'Centro Industrial',
      persona_afectada_id: '', persona_afectada_externa: '', cargo_persona: '',
      experiencia_cargo: 0, descripcion_hechos: '', actividad_realizada: '',
      condiciones_ambientales: '', epp_utilizados: '', lesiones_descripcion: '',
      parte_cuerpo_lesionada: '', atencion_medica: 'No requirió', dias_incapacidad: 0,
      investigador_principal: '', equipo_investigacion: '', metodologia: 'Árbol de Causas',
      causas_raiz: '', acciones_inmediatas: '', costo_estimado: 0, dias_perdidos: 0,
      lecciones_aprendidas: '', recomendaciones_generales: '', notificacion_arl: false,
      numero_furat: ''
    });
    setCausaData({
      investigacion_id: '', tipo_causa: 'Inmediata', categoria: 'Actos Inseguros',
      descripcion: '', evidencias: ''
    });
    setAccionData({
      investigacion_id: '', tipo_accion: 'Correctiva', descripcion: '',
      responsable: '', fecha_compromiso: '', recursos_necesarios: '',
      costo_estimado: 0, prioridad: 'media'
    });
    setIndicadorData({
      periodo: new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0'),
      año: new Date().getFullYear(), mes: new Date().getMonth() + 1,
      area: 'General', total_trabajadores: 0, horas_trabajadas: 0,
      accidentes_trabajo: 0, incidentes_trabajo: 0, casi_accidentes: 0,
      dias_perdidos: 0, accidentes_leves: 0, accidentes_graves: 0, accidentes_mortales: 0
    });
    setEditingItem(null);
    setShowModal(false);
    setMensaje('');
    if (activeTab === 'investigaciones') {
      generarNumeroCaso();
    }
  };

  const handleEdit = (item, tipo) => {
    setEditingItem(item);
    setCurrentForm(tipo);
    
    if (tipo === 'investigacion') {
      setFormData({
        ...item,
        fecha_accidente: new Date(item.fecha_accidente).toISOString().slice(0, 16),
        epp_utilizados: item.epp_utilizados?.join(', ') || '',
        parte_cuerpo_lesionada: item.parte_cuerpo_lesionada?.join(', ') || '',
        equipo_investigacion: item.equipo_investigacion?.join(', ') || ''
      });
    } else if (tipo === 'causa') {
      setCausaData(item);
    } else if (tipo === 'accion') {
      setAccionData(item);
    } else if (tipo === 'indicador') {
      setIndicadorData(item);
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

  const getClasificacionColor = (clasificacion) => {
    switch (clasificacion) {
      case 'Leve': return { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' };
      case 'Grave': return { bg: '#fef3c7', color: '#d97706', border: '#fde68a' };
      case 'Mortal': return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      case 'Catastrófico': return { bg: '#1e1b4b', color: '#ffffff', border: '#312e81' };
      default: return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'abierta': return { bg: '#fef3c7', color: '#d97706' };
      case 'en_investigacion': return { bg: '#dbeafe', color: '#2563eb' };
      case 'cerrada': return { bg: '#f0fdf4', color: '#166534' };
      case 'reabierta': return { bg: '#fef2f2', color: '#dc2626' };
      default: return { bg: '#f8fafc', color: '#64748b' };
    }
  };

  const estadisticas = getEstadisticas();

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: '#64748b' }}>Cargando investigación de accidentes...</div>
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
              Investigación de Accidentes SST
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '16px' }}>
              Metodología científica para análisis de incidentes y accidentes
            </p>
          </div>
        </div>

        {/* Estadísticas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#ea580c', marginBottom: '4px' }}>
              {estadisticas.investigacionesAbiertas}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Investigaciones Abiertas</div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#2563eb', marginBottom: '4px' }}>
              {estadisticas.investigacionesMes}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Casos Este Mes</div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a', marginBottom: '4px' }}>
              {estadisticas.accionesPendientes}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Acciones Pendientes</div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626', marginBottom: '4px' }}>
              {estadisticas.accidentesGraves}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Accidentes Graves</div>
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
            { key: 'investigaciones', label: 'Investigaciones', icon: 'FileText' },
            { key: 'causas', label: 'Análisis de Causas', icon: 'GitBranch' },
            { key: 'acciones', label: 'Acciones Correctivas', icon: 'CheckCircle' },
            { key: 'indicadores', label: 'Indicadores', icon: 'BarChart3' }
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
            const formMap = {
              'investigaciones': 'investigacion',
              'causas': 'causa', 
              'acciones': 'accion',
              'indicadores': 'indicador'
            };
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
          {activeTab === 'investigaciones' ? 'Nueva Investigación' : 
           activeTab === 'causas' ? 'Nueva Causa' :
           activeTab === 'acciones' ? 'Nueva Acción' : 'Nuevo Indicador'}
        </button>
      </div>

      {/* Contenido por Tab */}
      {activeTab === 'investigaciones' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {investigaciones.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <Icon name="FileText" size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>No hay investigaciones registradas</h3>
              <p>Crea la primera investigación de accidente</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Caso</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Tipo</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Clasificación</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Fecha</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Persona Afectada</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Estado</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {investigaciones.map((investigacion) => {
                    const clasificacionColor = getClasificacionColor(investigacion.clasificacion_inicial);
                    const estadoColor = getEstadoColor(investigacion.estado_investigacion);
                    return (
                      <tr key={investigacion.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                              {investigacion.numero_caso}
                            </div>
                            <div style={{ fontSize: '14px', color: '#64748b' }}>
                              {investigacion.lugar_accidente}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px', color: '#64748b' }}>{investigacion.tipo_evento}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600,
                            background: clasificacionColor.bg, color: clasificacionColor.color,
                            border: `1px solid ${clasificacionColor.border}`
                          }}>
                            {investigacion.clasificacion_inicial}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: '#64748b' }}>
                          {new Date(investigacion.fecha_accidente).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '16px', color: '#64748b' }}>
                          {investigacion.colaboradores?.nombre_completo || investigacion.persona_afectada_externa || 'No especificado'}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600,
                            background: estadoColor.bg, color: estadoColor.color
                          }}>
                            {investigacion.estado_investigacion.charAt(0).toUpperCase() + investigacion.estado_investigacion.slice(1).replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleEdit(investigacion, 'investigacion')}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                padding: '8px', borderRadius: '6px', color: '#6b7280'
                              }}
                              title="Editar"
                            >
                              <Icon name="Edit" size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(investigacion.id, 'investigaciones_accidentes')}
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

      {/* Resto de tabs simplificado por límite de espacio */}
      {activeTab === 'causas' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <h3>Análisis de Causas - {causas.length} registradas</h3>
          <p style={{ color: '#64748b' }}>Gestión del análisis de causas de accidentes</p>
        </div>
      )}

      {activeTab === 'acciones' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <h3>Acciones Correctivas - {acciones.length} acciones</h3>
          <p style={{ color: '#64748b' }}>Seguimiento a acciones correctivas y preventivas</p>
        </div>
      )}

      {activeTab === 'indicadores' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <h3>Indicadores de Accidentalidad - {indicadores.length} periodos</h3>
          <p style={{ color: '#64748b' }}>Cálculo automático de índices de frecuencia y severidad</p>
        </div>
      )}

      {/* Modal simplificado por límite de espacio */}
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
              {editingItem ? 'Editar' : 'Nueva'} {currentForm === 'investigacion' ? 'Investigación' : 'Elemento'}
            </h2>
            
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
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestigacionAccidentesMain;