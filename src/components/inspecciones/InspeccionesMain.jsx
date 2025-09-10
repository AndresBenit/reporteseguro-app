import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Icon } from '../common/Icons';

const InspeccionesMain = () => {
  const [activeTab, setActiveTab] = useState('inspecciones');
  const [inspecciones, setInspecciones] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [hallazgos, setHallazgos] = useState([]);
  const [programacion, setProgramacion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentForm, setCurrentForm] = useState('inspeccion');

  const [formData, setFormData] = useState({
    titulo: '',
    tipo_inspeccion: 'Seguridad General',
    area_inspeccion: 'General',
    ubicacion_especifica: '',
    fecha_programada: new Date().toISOString().split('T')[0],
    fecha_realizada: '',
    hora_inicio: '08:00',
    hora_fin: '',
    inspector_responsable: '',
    acompanantes: '',
    observaciones_generales: '',
    recomendaciones: '',
    prioridad: 'media',
    requiere_seguimiento: false,
    fecha_seguimiento: ''
  });

  const [plantillaData, setPlantillaData] = useState({
    nombre: '',
    tipo_inspeccion: 'Seguridad General',
    descripcion: '',
    items: ''
  });

  const [hallazgoData, setHallazgoData] = useState({
    inspeccion_id: '',
    descripcion: '',
    tipo_hallazgo: 'Condición Insegura',
    severidad: 'media',
    ubicacion: '',
    accion_requerida: '',
    responsable_accion: '',
    fecha_compromiso: '',
    observaciones: ''
  });

  const [programacionData, setProgramacionData] = useState({
    nombre_programa: '',
    descripcion: '',
    tipo_inspeccion: 'Seguridad General',
    area_objetivo: 'General',
    frecuencia: 'mensual',
    dia_semana: '',
    dia_mes: '',
    inspector_asignado: ''
  });

  const tiposInspeccion = [
    'Seguridad General', 'EPP', 'Herramientas y Equipos', 'Orden y Aseo',
    'Condiciones Locativas', 'Sistemas de Emergencia', 'Riesgo Eléctrico',
    'Trabajo en Alturas', 'Espacios Confinados', 'Maquinaria y Equipos',
    'Higiene Industrial', 'Otro'
  ];

  const tiposHallazgo = [
    'Condición Insegura', 'Acto Inseguro', 'Falta de EPP', 'Deficiencia Equipos',
    'Falta Señalización', 'Orden y Aseo', 'Documentación', 'Capacitación', 'Otro'
  ];

  const frecuencias = [
    'diaria', 'semanal', 'quincenal', 'mensual', 'bimestral', 'trimestral', 'semestral', 'anual'
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const [inspeccionesRes, plantillasRes, hallazgosRes, programacionRes] = await Promise.all([
        supabase.from('inspecciones_sst').select('*').order('fecha_programada', { ascending: false }),
        supabase.from('plantillas_checklist').select('*').order('nombre'),
        supabase.from('hallazgos_inspeccion').select(`*, inspecciones_sst(titulo)`).order('created_at', { ascending: false }),
        supabase.from('programacion_inspecciones').select('*').order('nombre_programa')
      ]);

      if (inspeccionesRes.error) throw inspeccionesRes.error;
      if (plantillasRes.error) throw plantillasRes.error;
      if (hallazgosRes.error) throw hallazgosRes.error;
      if (programacionRes.error) throw programacionRes.error;

      setInspecciones(inspeccionesRes.data || []);
      setPlantillas(plantillasRes.data || []);
      setHallazgos(hallazgosRes.data || []);
      setProgramacion(programacionRes.data || []);

    } catch (error) {
      console.error('Error cargando datos:', error);
      setMensaje('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const getEstadisticas = () => {
    const inspeccionesProgramadas = inspecciones.filter(i => i.estado === 'programada').length;
    const inspeccionesCompletadas = inspecciones.filter(i => i.estado === 'completada').length;
    const hallazgosPendientes = hallazgos.filter(h => h.estado_accion === 'pendiente').length;
    const hallazgosCriticos = hallazgos.filter(h => h.severidad === 'critica').length;

    return { inspeccionesProgramadas, inspeccionesCompletadas, hallazgosPendientes, hallazgosCriticos };
  };

  const handleSubmitInspeccion = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo.trim() || !formData.inspector_responsable.trim()) {
      setMensaje('Título e inspector responsable son obligatorios');
      return;
    }

    try {
      const inspeccionData = {
        ...formData,
        acompanantes: formData.acompanantes ? formData.acompanantes.split(',').map(a => a.trim()).filter(a => a) : []
      };

      let result;
      if (editingItem) {
        result = await supabase
          .from('inspecciones_sst')
          .update(inspeccionData)
          .eq('id', editingItem.id);
      } else {
        result = await supabase
          .from('inspecciones_sst')
          .insert([inspeccionData]);
      }

      if (result.error) throw result.error;

      setMensaje(editingItem ? 'Inspección actualizada exitosamente' : 'Inspección programada exitosamente');
      resetForm();
      await cargarDatos();
      
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al guardar la inspección');
    }
  };

  const handleSubmitPlantilla = async (e) => {
    e.preventDefault();

    if (!plantillaData.nombre.trim() || !plantillaData.items.trim()) {
      setMensaje('Nombre e items son obligatorios');
      return;
    }

    try {
      const itemsArray = plantillaData.items.split('\n').map(item => ({
        item: item.trim(),
        tipo: 'boolean',
        obligatorio: true
      })).filter(item => item.item);

      const plantillaToSave = {
        ...plantillaData,
        items: itemsArray
      };

      let result;
      if (editingItem) {
        result = await supabase
          .from('plantillas_checklist')
          .update(plantillaToSave)
          .eq('id', editingItem.id);
      } else {
        result = await supabase
          .from('plantillas_checklist')
          .insert([plantillaToSave]);
      }

      if (result.error) throw result.error;

      setMensaje(editingItem ? 'Plantilla actualizada exitosamente' : 'Plantilla creada exitosamente');
      resetForm();
      await cargarDatos();
      
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al guardar la plantilla');
    }
  };

  const handleSubmitHallazgo = async (e) => {
    e.preventDefault();

    if (!hallazgoData.inspeccion_id || !hallazgoData.descripcion.trim()) {
      setMensaje('Inspección y descripción son obligatorios');
      return;
    }

    try {
      let result;
      if (editingItem) {
        result = await supabase
          .from('hallazgos_inspeccion')
          .update(hallazgoData)
          .eq('id', editingItem.id);
      } else {
        result = await supabase
          .from('hallazgos_inspeccion')
          .insert([hallazgoData]);
      }

      if (result.error) throw result.error;

      setMensaje(editingItem ? 'Hallazgo actualizado exitosamente' : 'Hallazgo registrado exitosamente');
      resetForm();
      await cargarDatos();
      
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al guardar el hallazgo');
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '', tipo_inspeccion: 'Seguridad General', area_inspeccion: 'General',
      ubicacion_especifica: '', fecha_programada: new Date().toISOString().split('T')[0],
      fecha_realizada: '', hora_inicio: '08:00', hora_fin: '',
      inspector_responsable: '', acompanantes: '', observaciones_generales: '',
      recomendaciones: '', prioridad: 'media', requiere_seguimiento: false, fecha_seguimiento: ''
    });
    setPlantillaData({
      nombre: '', tipo_inspeccion: 'Seguridad General', descripcion: '', items: ''
    });
    setHallazgoData({
      inspeccion_id: '', descripcion: '', tipo_hallazgo: 'Condición Insegura',
      severidad: 'media', ubicacion: '', accion_requerida: '', responsable_accion: '',
      fecha_compromiso: '', observaciones: ''
    });
    setProgramacionData({
      nombre_programa: '', descripcion: '', tipo_inspeccion: 'Seguridad General',
      area_objetivo: 'General', frecuencia: 'mensual', dia_semana: '',
      dia_mes: '', inspector_asignado: ''
    });
    setEditingItem(null);
    setShowModal(false);
    setMensaje('');
  };

  const handleEdit = (item, tipo) => {
    setEditingItem(item);
    setCurrentForm(tipo);
    
    if (tipo === 'inspeccion') {
      setFormData({
        ...item,
        acompanantes: item.acompanantes?.join(', ') || ''
      });
    } else if (tipo === 'plantilla') {
      setPlantillaData({
        ...item,
        items: item.items?.map(i => i.item).join('\n') || ''
      });
    } else if (tipo === 'hallazgo') {
      setHallazgoData(item);
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

  const getSeveridadColor = (severidad) => {
    switch (severidad) {
      case 'critica': return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      case 'alta': return { bg: '#fef3c7', color: '#d97706', border: '#fde68a' };
      case 'media': return { bg: '#fef3c7', color: '#ca8a04', border: '#fde047' };
      case 'baja': return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
      default: return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'completada': return { bg: '#f0fdf4', color: '#16a34a' };
      case 'en_proceso': return { bg: '#fef3c7', color: '#ca8a04' };
      case 'programada': return { bg: '#eff6ff', color: '#2563eb' };
      case 'cerrada': return { bg: '#f8fafc', color: '#64748b' };
      default: return { bg: '#f8fafc', color: '#64748b' };
    }
  };

  const estadisticas = getEstadisticas();

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: '#64748b' }}>Cargando sistema de inspecciones...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '40px', height: '40px', background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icon name="CheckSquare" size={24} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>
              Sistema de Inspecciones SST
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '16px' }}>
              Inspecciones preventivas y control de hallazgos
            </p>
          </div>
        </div>

        {/* Estadísticas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#2563eb', marginBottom: '4px' }}>
              {estadisticas.inspeccionesProgramadas}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Programadas</div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a', marginBottom: '4px' }}>
              {estadisticas.inspeccionesCompletadas}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Completadas</div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#ea580c', marginBottom: '4px' }}>
              {estadisticas.hallazgosPendientes}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Hallazgos Pendientes</div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626', marginBottom: '4px' }}>
              {estadisticas.hallazgosCriticos}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Hallazgos Críticos</div>
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
            { key: 'inspecciones', label: 'Inspecciones', icon: 'CheckSquare' },
            { key: 'hallazgos', label: 'Hallazgos', icon: 'AlertTriangle' },
            { key: 'plantillas', label: 'Plantillas', icon: 'FileText' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 0', background: 'none', border: 'none',
                fontSize: '16px', fontWeight: 500, cursor: 'pointer',
                color: activeTab === tab.key ? '#0f766e' : '#64748b',
                borderBottom: activeTab === tab.key ? '2px solid #0f766e' : '2px solid transparent'
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
            setCurrentForm(activeTab === 'inspecciones' ? 'inspeccion' : activeTab === 'hallazgos' ? 'hallazgo' : 'plantilla');
            setShowModal(true);
          }}
          style={{
            background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
            color: 'white', border: 'none', padding: '12px 24px',
            borderRadius: '8px', fontSize: '16px', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Icon name="Plus" size={20} />
          {activeTab === 'inspecciones' ? 'Nueva Inspección' : activeTab === 'hallazgos' ? 'Nuevo Hallazgo' : 'Nueva Plantilla'}
        </button>
      </div>

      {/* Contenido por Tab */}
      {activeTab === 'inspecciones' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {inspecciones.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <Icon name="CheckSquare" size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>No hay inspecciones programadas</h3>
              <p>Programa la primera inspección de seguridad</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Inspección</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Tipo</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Área</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Fecha</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Estado</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Inspector</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {inspecciones.map((inspeccion) => {
                    const estadoColor = getEstadoColor(inspeccion.estado);
                    return (
                      <tr key={inspeccion.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                              {inspeccion.titulo}
                            </div>
                            {inspeccion.ubicacion_especifica && (
                              <div style={{ fontSize: '14px', color: '#64748b' }}>
                                {inspeccion.ubicacion_especifica}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px', color: '#64748b' }}>{inspeccion.tipo_inspeccion}</td>
                        <td style={{ padding: '16px', color: '#64748b' }}>{inspeccion.area_inspeccion}</td>
                        <td style={{ padding: '16px', color: '#64748b' }}>
                          {new Date(inspeccion.fecha_programada).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600,
                            background: estadoColor.bg, color: estadoColor.color
                          }}>
                            {inspeccion.estado.charAt(0).toUpperCase() + inspeccion.estado.slice(1).replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: '#64748b' }}>{inspeccion.inspector_responsable}</td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleEdit(inspeccion, 'inspeccion')}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                padding: '8px', borderRadius: '6px', color: '#6b7280'
                              }}
                              title="Editar"
                            >
                              <Icon name="Edit" size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(inspeccion.id, 'inspecciones_sst')}
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

      {activeTab === 'hallazgos' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {hallazgos.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <Icon name="AlertTriangle" size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>No hay hallazgos registrados</h3>
              <p>Los hallazgos de las inspecciones aparecerán aquí</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Hallazgo</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Tipo</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Severidad</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Responsable</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Estado</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {hallazgos.map((hallazgo) => {
                    const severidadColor = getSeveridadColor(hallazgo.severidad);
                    return (
                      <tr key={hallazgo.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                              {hallazgo.descripcion}
                            </div>
                            <div style={{ fontSize: '14px', color: '#64748b' }}>
                              {hallazgo.inspecciones_sst?.titulo || 'Inspección no encontrada'}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px', color: '#64748b' }}>{hallazgo.tipo_hallazgo}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600,
                            background: severidadColor.bg, color: severidadColor.color,
                            border: `1px solid ${severidadColor.border}`
                          }}>
                            {hallazgo.severidad.charAt(0).toUpperCase() + hallazgo.severidad.slice(1)}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: '#64748b' }}>{hallazgo.responsable_accion}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600,
                            background: hallazgo.estado_accion === 'completada' ? '#dcfce7' : '#fef3c7',
                            color: hallazgo.estado_accion === 'completada' ? '#166534' : '#92400e'
                          }}>
                            {hallazgo.estado_accion.charAt(0).toUpperCase() + hallazgo.estado_accion.slice(1).replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleEdit(hallazgo, 'hallazgo')}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                padding: '8px', borderRadius: '6px', color: '#6b7280'
                              }}
                              title="Editar"
                            >
                              <Icon name="Edit" size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(hallazgo.id, 'hallazgos_inspeccion')}
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

      {activeTab === 'plantillas' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {plantillas.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <Icon name="FileText" size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>No hay plantillas creadas</h3>
              <p>Crea la primera plantilla de checklist</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Plantilla</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Tipo</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Items</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Estado</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {plantillas.map((plantilla) => (
                    <tr key={plantilla.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                            {plantilla.nombre}
                          </div>
                          {plantilla.descripcion && (
                            <div style={{ fontSize: '14px', color: '#64748b' }}>
                              {plantilla.descripcion}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#64748b' }}>{plantilla.tipo_inspeccion}</td>
                      <td style={{ padding: '16px', color: '#64748b' }}>
                        {plantilla.items?.length || 0} items
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600,
                          background: plantilla.activa ? '#dcfce7' : '#fef2f2',
                          color: plantilla.activa ? '#166534' : '#dc2626'
                        }}>
                          {plantilla.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleEdit(plantilla, 'plantilla')}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              padding: '8px', borderRadius: '6px', color: '#6b7280'
                            }}
                            title="Editar"
                          >
                            <Icon name="Edit" size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(plantilla.id, 'plantillas_checklist')}
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal para formularios */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', borderRadius: '12px', width: '90%',
            maxWidth: '600px', maxHeight: '90vh', overflow: 'auto'
          }}>
            <div style={{
              padding: '24px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
                {editingItem ? 'Editar' : 'Nueva'} {currentForm === 'inspeccion' ? 'Inspección' : currentForm === 'hallazgo' ? 'Hallazgo' : 'Plantilla'}
              </h2>
              <button
                onClick={resetForm}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <Icon name="X" size={24} color="#64748b" />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {currentForm === 'inspeccion' && (
                <form onSubmit={handleSubmitInspeccion}>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Título de la Inspección *
                      </label>
                      <input
                        type="text"
                        value={formData.titulo}
                        onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px'
                        }}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                          Tipo de Inspección
                        </label>
                        <select
                          value={formData.tipo_inspeccion}
                          onChange={(e) => setFormData({...formData, tipo_inspeccion: e.target.value})}
                          style={{
                            width: '100%', padding: '12px', border: '1px solid #d1d5db',
                            borderRadius: '8px', fontSize: '16px'
                          }}
                        >
                          {tiposInspeccion.map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                          Área
                        </label>
                        <select
                          value={formData.area_inspeccion}
                          onChange={(e) => setFormData({...formData, area_inspeccion: e.target.value})}
                          style={{
                            width: '100%', padding: '12px', border: '1px solid #d1d5db',
                            borderRadius: '8px', fontSize: '16px'
                          }}
                        >
                          <option value="General">General</option>
                          <option value="Centro Industrial">Centro Industrial</option>
                          <option value="Hornos Solera">Hornos Solera</option>
                          <option value="Ambas">Ambas</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Ubicación Específica
                      </label>
                      <input
                        type="text"
                        value={formData.ubicacion_especifica}
                        onChange={(e) => setFormData({...formData, ubicacion_especifica: e.target.value})}
                        placeholder="Ej: Planta de trituración, Oficinas administrativas"
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                          Fecha Programada
                        </label>
                        <input
                          type="date"
                          value={formData.fecha_programada}
                          onChange={(e) => setFormData({...formData, fecha_programada: e.target.value})}
                          style={{
                            width: '100%', padding: '12px', border: '1px solid #d1d5db',
                            borderRadius: '8px', fontSize: '16px'
                          }}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                          Hora Inicio
                        </label>
                        <input
                          type="time"
                          value={formData.hora_inicio}
                          onChange={(e) => setFormData({...formData, hora_inicio: e.target.value})}
                          style={{
                            width: '100%', padding: '12px', border: '1px solid #d1d5db',
                            borderRadius: '8px', fontSize: '16px'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                          Prioridad
                        </label>
                        <select
                          value={formData.prioridad}
                          onChange={(e) => setFormData({...formData, prioridad: e.target.value})}
                          style={{
                            width: '100%', padding: '12px', border: '1px solid #d1d5db',
                            borderRadius: '8px', fontSize: '16px'
                          }}
                        >
                          <option value="baja">Baja</option>
                          <option value="media">Media</option>
                          <option value="alta">Alta</option>
                          <option value="critica">Crítica</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Inspector Responsable *
                      </label>
                      <input
                        type="text"
                        value={formData.inspector_responsable}
                        onChange={(e) => setFormData({...formData, inspector_responsable: e.target.value})}
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px'
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Acompañantes (separados por comas)
                      </label>
                      <input
                        type="text"
                        value={formData.acompanantes}
                        onChange={(e) => setFormData({...formData, acompanantes: e.target.value})}
                        placeholder="Nombre 1, Nombre 2, Nombre 3"
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Observaciones Generales
                      </label>
                      <textarea
                        value={formData.observaciones_generales}
                        onChange={(e) => setFormData({...formData, observaciones_generales: e.target.value})}
                        rows={3}
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px', resize: 'vertical'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={resetForm}
                      style={{
                        padding: '12px 24px', border: '1px solid #d1d5db',
                        background: 'white', borderRadius: '8px', cursor: 'pointer'
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '12px 24px', background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                        color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
                      }}
                    >
                      {editingItem ? 'Actualizar' : 'Programar'} Inspección
                    </button>
                  </div>
                </form>
              )}

              {currentForm === 'plantilla' && (
                <form onSubmit={handleSubmitPlantilla}>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Nombre de la Plantilla *
                      </label>
                      <input
                        type="text"
                        value={plantillaData.nombre}
                        onChange={(e) => setPlantillaData({...plantillaData, nombre: e.target.value})}
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px'
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Tipo de Inspección
                      </label>
                      <select
                        value={plantillaData.tipo_inspeccion}
                        onChange={(e) => setPlantillaData({...plantillaData, tipo_inspeccion: e.target.value})}
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px'
                        }}
                      >
                        {tiposInspeccion.map(tipo => (
                          <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Descripción
                      </label>
                      <textarea
                        value={plantillaData.descripcion}
                        onChange={(e) => setPlantillaData({...plantillaData, descripcion: e.target.value})}
                        rows={3}
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px', resize: 'vertical'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Items del Checklist (uno por línea) *
                      </label>
                      <textarea
                        value={plantillaData.items}
                        onChange={(e) => setPlantillaData({...plantillaData, items: e.target.value})}
                        rows={8}
                        placeholder="Señalización visible y clara&#10;Rutas de evacuación despejadas&#10;Extintores en su lugar y vigentes&#10;Botiquín completo y vigente"
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px', resize: 'vertical'
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={resetForm}
                      style={{
                        padding: '12px 24px', border: '1px solid #d1d5db',
                        background: 'white', borderRadius: '8px', cursor: 'pointer'
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '12px 24px', background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                        color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
                      }}
                    >
                      {editingItem ? 'Actualizar' : 'Crear'} Plantilla
                    </button>
                  </div>
                </form>
              )}

              {currentForm === 'hallazgo' && (
                <form onSubmit={handleSubmitHallazgo}>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Inspección Relacionada *
                      </label>
                      <select
                        value={hallazgoData.inspeccion_id}
                        onChange={(e) => setHallazgoData({...hallazgoData, inspeccion_id: e.target.value})}
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px'
                        }}
                        required
                      >
                        <option value="">Seleccionar inspección...</option>
                        {inspecciones.map(inspeccion => (
                          <option key={inspeccion.id} value={inspeccion.id}>{inspeccion.titulo}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Descripción del Hallazgo *
                      </label>
                      <textarea
                        value={hallazgoData.descripcion}
                        onChange={(e) => setHallazgoData({...hallazgoData, descripcion: e.target.value})}
                        rows={4}
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px', resize: 'vertical'
                        }}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                          Tipo de Hallazgo
                        </label>
                        <select
                          value={hallazgoData.tipo_hallazgo}
                          onChange={(e) => setHallazgoData({...hallazgoData, tipo_hallazgo: e.target.value})}
                          style={{
                            width: '100%', padding: '12px', border: '1px solid #d1d5db',
                            borderRadius: '8px', fontSize: '16px'
                          }}
                        >
                          {tiposHallazgo.map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                          Severidad
                        </label>
                        <select
                          value={hallazgoData.severidad}
                          onChange={(e) => setHallazgoData({...hallazgoData, severidad: e.target.value})}
                          style={{
                            width: '100%', padding: '12px', border: '1px solid #d1d5db',
                            borderRadius: '8px', fontSize: '16px'
                          }}
                        >
                          <option value="baja">Baja</option>
                          <option value="media">Media</option>
                          <option value="alta">Alta</option>
                          <option value="critica">Crítica</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Ubicación Específica
                      </label>
                      <input
                        type="text"
                        value={hallazgoData.ubicacion}
                        onChange={(e) => setHallazgoData({...hallazgoData, ubicacion: e.target.value})}
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Acción Requerida
                      </label>
                      <textarea
                        value={hallazgoData.accion_requerida}
                        onChange={(e) => setHallazgoData({...hallazgoData, accion_requerida: e.target.value})}
                        rows={3}
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px', resize: 'vertical'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                          Responsable de la Acción
                        </label>
                        <input
                          type="text"
                          value={hallazgoData.responsable_accion}
                          onChange={(e) => setHallazgoData({...hallazgoData, responsable_accion: e.target.value})}
                          style={{
                            width: '100%', padding: '12px', border: '1px solid #d1d5db',
                            borderRadius: '8px', fontSize: '16px'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                          Fecha Compromiso
                        </label>
                        <input
                          type="date"
                          value={hallazgoData.fecha_compromiso}
                          onChange={(e) => setHallazgoData({...hallazgoData, fecha_compromiso: e.target.value})}
                          style={{
                            width: '100%', padding: '12px', border: '1px solid #d1d5db',
                            borderRadius: '8px', fontSize: '16px'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={resetForm}
                      style={{
                        padding: '12px 24px', border: '1px solid #d1d5db',
                        background: 'white', borderRadius: '8px', cursor: 'pointer'
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '12px 24px', background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                        color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
                      }}
                    >
                      {editingItem ? 'Actualizar' : 'Registrar'} Hallazgo
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

export default InspeccionesMain;