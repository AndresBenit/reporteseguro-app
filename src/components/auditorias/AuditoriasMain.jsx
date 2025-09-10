import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Icon } from '../common/Icons';

const AuditoriasMain = () => {
  const [activeTab, setActiveTab] = useState('auditorias');
  const [auditorias, setAuditorias] = useState([]);
  const [hallazgos, setHallazgos] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentForm, setCurrentForm] = useState('auditoria');

  const [formData, setFormData] = useState({
    codigo_auditoria: '',
    tipo_auditoria: 'Interna',
    alcance: '',
    objetivo: '',
    criterios_auditoria: '',
    fecha_planificada: new Date().toISOString().split('T')[0],
    fecha_inicio: '',
    fecha_fin: '',
    auditor_lider: '',
    equipo_auditor: '',
    auditados: '',
    areas_auditadas: '',
    procesos_auditados: '',
    metodologia: 'ISO 45001',
    normas_referencia: 'ISO 45001:2018, Decreto 1072/2015, Resolución 0312/2019',
    observaciones: ''
  });

  const [hallazgoData, setHallazgoData] = useState({
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
    fecha_compromiso: ''
  });

  const [programaData, setProgramaData] = useState({
    nombre_programa: '',
    año: new Date().getFullYear(),
    objetivo_programa: '',
    alcance_programa: '',
    criterios_programa: '',
    auditorias_planificadas: 0,
    responsable_programa: ''
  });

  const tiposAuditoria = ['Interna', 'Externa', 'Gubernamental', 'Certificación', 'Seguimiento'];
  const tiposHallazgo = ['No Conformidad Mayor', 'No Conformidad Menor', 'Observación', 'Oportunidad de Mejora', 'Fortaleza'];
  const metodologias = ['ISO 45001', 'OHSAS 18001', 'ISO 9001', 'Integrada', 'Personalizada'];

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!formData.codigo_auditoria && activeTab === 'auditorias') {
      generarCodigoAuditoria();
    }
  }, [activeTab]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const [auditoriasRes, hallazgosRes, programasRes, checklistsRes] = await Promise.all([
        supabase.from('auditorias_sst').select('*').order('fecha_planificada', { ascending: false }),
        supabase.from('hallazgos_auditoria').select('*, auditorias_sst(codigo_auditoria)').order('created_at', { ascending: false }),
        supabase.from('programas_auditoria').select('*').order('año', { ascending: false }),
        supabase.from('checklist_auditoria').select('*').order('nombre_checklist')
      ]);

      if (auditoriasRes.error) throw auditoriasRes.error;
      if (hallazgosRes.error) throw hallazgosRes.error;
      if (programasRes.error) throw programasRes.error;
      if (checklistsRes.error) throw checklistsRes.error;

      setAuditorias(auditoriasRes.data || []);
      setHallazgos(hallazgosRes.data || []);
      setProgramas(programasRes.data || []);
      setChecklists(checklistsRes.data || []);

    } catch (error) {
      console.error('Error cargando datos:', error);
      setMensaje('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const generarCodigoAuditoria = () => {
    const año = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-4);
    const codigo = `AUD-${año}-${timestamp}`;
    setFormData(prev => ({ ...prev, codigo_auditoria: codigo }));
  };

  const getEstadisticas = () => {
    const auditoriasEsteAño = auditorias.filter(a => {
      const fechaAuditoria = new Date(a.fecha_planificada);
      return fechaAuditoria.getFullYear() === new Date().getFullYear();
    }).length;
    
    const auditoriasEnEjecucion = auditorias.filter(a => a.estado_auditoria === 'en_ejecucion').length;
    const hallazgosAbiertos = hallazgos.filter(h => h.estado_hallazgo === 'abierto').length;
    const noConformidadesMayores = hallazgos.filter(h => h.tipo_hallazgo === 'No Conformidad Mayor').length;

    return { auditoriasEsteAño, auditoriasEnEjecucion, hallazgosAbiertos, noConformidadesMayores };
  };

  const handleSubmitAuditoria = async (e) => {
    e.preventDefault();
    
    if (!formData.codigo_auditoria.trim() || !formData.alcance.trim()) {
      setMensaje('Código y alcance son obligatorios');
      return;
    }

    try {
      const auditoriaData = {
        ...formData,
        criterios_auditoria: formData.criterios_auditoria ? formData.criterios_auditoria.split(',').map(c => c.trim()).filter(c => c) : [],
        equipo_auditor: formData.equipo_auditor ? formData.equipo_auditor.split(',').map(e => e.trim()).filter(e => e) : [],
        auditados: formData.auditados ? formData.auditados.split(',').map(a => a.trim()).filter(a => a) : [],
        areas_auditadas: formData.areas_auditadas ? formData.areas_auditadas.split(',').map(a => a.trim()).filter(a => a) : [],
        procesos_auditados: formData.procesos_auditados ? formData.procesos_auditados.split(',').map(p => p.trim()).filter(p => p) : [],
        normas_referencia: formData.normas_referencia ? formData.normas_referencia.split(',').map(n => n.trim()).filter(n => n) : []
      };

      let result;
      if (editingItem) {
        result = await supabase
          .from('auditorias_sst')
          .update(auditoriaData)
          .eq('id', editingItem.id);
      } else {
        result = await supabase
          .from('auditorias_sst')
          .insert([auditoriaData]);
      }

      if (result.error) throw result.error;

      setMensaje(editingItem ? 'Auditoría actualizada exitosamente' : 'Auditoría planificada exitosamente');
      resetForm();
      await cargarDatos();
      
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al guardar la auditoría');
    }
  };

  const resetForm = () => {
    setFormData({
      codigo_auditoria: '', tipo_auditoria: 'Interna', alcance: '', objetivo: '',
      criterios_auditoria: '', fecha_planificada: new Date().toISOString().split('T')[0],
      fecha_inicio: '', fecha_fin: '', auditor_lider: '', equipo_auditor: '',
      auditados: '', areas_auditadas: '', procesos_auditados: '', metodologia: 'ISO 45001',
      normas_referencia: 'ISO 45001:2018, Decreto 1072/2015, Resolución 0312/2019', observaciones: ''
    });
    setHallazgoData({
      auditoria_id: '', numero_hallazgo: '', tipo_hallazgo: 'No Conformidad Menor',
      requisito_norma: '', proceso_afectado: '', area_afectada: '', descripcion_hallazgo: '',
      evidencia_objetiva: '', causa_raiz: '', accion_requerida: '', responsable_accion: '',
      fecha_compromiso: ''
    });
    setProgramaData({
      nombre_programa: '', año: new Date().getFullYear(), objetivo_programa: '',
      alcance_programa: '', criterios_programa: '', auditorias_planificadas: 0,
      responsable_programa: ''
    });
    setEditingItem(null);
    setShowModal(false);
    setMensaje('');
    if (activeTab === 'auditorias') {
      generarCodigoAuditoria();
    }
  };

  const handleEdit = (item, tipo) => {
    setEditingItem(item);
    setCurrentForm(tipo);
    
    if (tipo === 'auditoria') {
      setFormData({
        ...item,
        criterios_auditoria: item.criterios_auditoria?.join(', ') || '',
        equipo_auditor: item.equipo_auditor?.join(', ') || '',
        auditados: item.auditados?.join(', ') || '',
        areas_auditadas: item.areas_auditadas?.join(', ') || '',
        procesos_auditados: item.procesos_auditados?.join(', ') || '',
        normas_referencia: item.normas_referencia?.join(', ') || ''
      });
    } else if (tipo === 'hallazgo') {
      setHallazgoData(item);
    } else if (tipo === 'programa') {
      setProgramaData({
        ...item,
        criterios_programa: item.criterios_programa?.join(', ') || ''
      });
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

  const getTipoAuditoriaColor = (tipo) => {
    switch (tipo) {
      case 'Interna': return { bg: '#dbeafe', color: '#2563eb' };
      case 'Externa': return { bg: '#fef3c7', color: '#d97706' };
      case 'Gubernamental': return { bg: '#fef2f2', color: '#dc2626' };
      case 'Certificación': return { bg: '#f0fdf4', color: '#166534' };
      case 'Seguimiento': return { bg: '#f3e8ff', color: '#7c3aed' };
      default: return { bg: '#f8fafc', color: '#64748b' };
    }
  };

  const getEstadoAuditoriaColor = (estado) => {
    switch (estado) {
      case 'planificada': return { bg: '#eff6ff', color: '#2563eb' };
      case 'en_ejecucion': return { bg: '#fef3c7', color: '#d97706' };
      case 'en_revision': return { bg: '#fef3c7', color: '#ca8a04' };
      case 'cerrada': return { bg: '#f0fdf4', color: '#166534' };
      case 'cancelada': return { bg: '#fef2f2', color: '#dc2626' };
      default: return { bg: '#f8fafc', color: '#64748b' };
    }
  };

  const getHallazgoColor = (tipo) => {
    switch (tipo) {
      case 'No Conformidad Mayor': return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      case 'No Conformidad Menor': return { bg: '#fef3c7', color: '#d97706', border: '#fde68a' };
      case 'Observación': return { bg: '#dbeafe', color: '#2563eb', border: '#bfdbfe' };
      case 'Oportunidad de Mejora': return { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' };
      case 'Fortaleza': return { bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' };
      default: return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
    }
  };

  const estadisticas = getEstadisticas();

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: '#64748b' }}>Cargando sistema de auditorías...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '40px', height: '40px', background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icon name="Settings" size={24} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>
              Auditorías SST
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '16px' }}>
              Sistema de auditorías internas y gestión de hallazgos
            </p>
          </div>
        </div>

        {/* Estadísticas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#2563eb', marginBottom: '4px' }}>
              {estadisticas.auditoriasEsteAño}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Auditorías Este Año</div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#d97706', marginBottom: '4px' }}>
              {estadisticas.auditoriasEnEjecucion}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>En Ejecución</div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#ea580c', marginBottom: '4px' }}>
              {estadisticas.hallazgosAbiertos}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Hallazgos Abiertos</div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626', marginBottom: '4px' }}>
              {estadisticas.noConformidadesMayores}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>NC Mayores</div>
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
            { key: 'auditorias', label: 'Auditorías', icon: 'Settings' },
            { key: 'hallazgos', label: 'Hallazgos', icon: 'AlertCircle' },
            { key: 'programas', label: 'Programas', icon: 'Calendar' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 0', background: 'none', border: 'none',
                fontSize: '16px', fontWeight: 500, cursor: 'pointer',
                color: activeTab === tab.key ? '#7c3aed' : '#64748b',
                borderBottom: activeTab === tab.key ? '2px solid #7c3aed' : '2px solid transparent'
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
            const formMap = { 'auditorias': 'auditoria', 'hallazgos': 'hallazgo', 'programas': 'programa' };
            setCurrentForm(formMap[activeTab]);
            setShowModal(true);
          }}
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
            color: 'white', border: 'none', padding: '12px 24px',
            borderRadius: '8px', fontSize: '16px', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Icon name="Plus" size={20} />
          {activeTab === 'auditorias' ? 'Nueva Auditoría' : 
           activeTab === 'hallazgos' ? 'Nuevo Hallazgo' : 'Nuevo Programa'}
        </button>
      </div>

      {/* Contenido por Tab */}
      {activeTab === 'auditorias' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {auditorias.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <Icon name="Settings" size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>No hay auditorías programadas</h3>
              <p>Planifica la primera auditoría del sistema SST</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Auditoría</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Tipo</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Fecha</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Auditor Líder</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Estado</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {auditorias.map((auditoria) => {
                    const tipoColor = getTipoAuditoriaColor(auditoria.tipo_auditoria);
                    const estadoColor = getEstadoAuditoriaColor(auditoria.estado_auditoria);
                    return (
                      <tr key={auditoria.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                              {auditoria.codigo_auditoria}
                            </div>
                            <div style={{ fontSize: '14px', color: '#64748b' }}>
                              {auditoria.alcance}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600,
                            background: tipoColor.bg, color: tipoColor.color
                          }}>
                            {auditoria.tipo_auditoria}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: '#64748b' }}>
                          {new Date(auditoria.fecha_planificada).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '16px', color: '#64748b' }}>{auditoria.auditor_lider}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600,
                            background: estadoColor.bg, color: estadoColor.color
                          }}>
                            {auditoria.estado_auditoria.charAt(0).toUpperCase() + auditoria.estado_auditoria.slice(1).replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleEdit(auditoria, 'auditoria')}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                padding: '8px', borderRadius: '6px', color: '#6b7280'
                              }}
                              title="Editar"
                            >
                              <Icon name="Edit" size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(auditoria.id, 'auditorias_sst')}
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
      {activeTab === 'hallazgos' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <h3>Hallazgos de Auditoría - {hallazgos.length} registrados</h3>
          <p style={{ color: '#64748b' }}>Gestión de no conformidades y oportunidades de mejora</p>
        </div>
      )}

      {activeTab === 'programas' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <h3>Programas de Auditoría - {programas.length} programas</h3>
          <p style={{ color: '#64748b' }}>Planificación anual de auditorías SST</p>
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
              {editingItem ? 'Editar' : 'Nueva'} {currentForm === 'auditoria' ? 'Auditoría' : 'Elemento'}
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
                  padding: '12px 24px', background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
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

export default AuditoriasMain;