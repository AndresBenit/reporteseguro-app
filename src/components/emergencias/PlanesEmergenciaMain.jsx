import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Icon } from '../common/Icons';

const PlanesEmergenciaMain = () => {
  const [activeTab, setActiveTab] = useState('planes');
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
    nombre: '',
    tipo_emergencia: 'Evacuación',
    area_aplicacion: 'General',
    alcance: '',
    objetivos: '',
    procedimientos: '',
    recursos_necesarios: '',
    responsables: '',
    rutas_evacuacion: '',
    puntos_encuentro: '',
    numeros_emergencia: '',
    observaciones: ''
  });

  const [simulacroData, setSimulacroData] = useState({
    plan_emergencia_id: '',
    fecha_simulacro: new Date().toISOString().split('T')[0],
    hora_inicio: '09:00',
    hora_fin: '',
    tipo_simulacro: 'Programado',
    area_simulacro: 'General',
    participantes_esperados: 0,
    tiempo_evacuacion_objetivo: 5,
    responsable_simulacro: '',
    observaciones: ''
  });

  const [brigadaData, setBrigadaData] = useState({
    nombre: '',
    tipo_brigada: 'Evacuación',
    colaborador_id: '',
    cargo_brigada: 'Brigadista',
    area_responsabilidad: '',
    fecha_capacitacion: '',
    vigencia_capacitacion: '',
    certificado_url: ''
  });

  const tiposEmergencia = [
    'Evacuación', 'Incendio', 'Sismo', 'Accidente Industrial', 
    'Derrame Químico', 'Emergencia Médica', 'Colapso Estructural', 'Inundación', 'Otro'
  ];

  const tiposSimulacro = ['Programado', 'Sorpresa', 'Parcial', 'Total'];
  const tiposBrigada = ['Evacuación', 'Primeros Auxilios', 'Contra Incendios', 'Búsqueda y Rescate', 'Comunicaciones', 'Coordinación General'];
  const cargosBrigada = ['Coordinador', 'Sub-coordinador', 'Brigadista', 'Suplente'];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const [planesRes, simulacrosRes, brigadasRes, colaboradoresRes] = await Promise.all([
        supabase.from('planes_emergencia_sst').select('*').order('created_at', { ascending: false }),
        supabase.from('simulacros_emergencia').select(`*, planes_emergencia_sst(nombre)`).order('fecha_simulacro', { ascending: false }),
        supabase.from('brigadas_emergencia').select(`*, colaboradores(nombre_completo)`).order('created_at', { ascending: false }),
        supabase.from('colaboradores').select('id, nombre_completo').eq('activo', true)
      ]);

      if (planesRes.error) throw planesRes.error;
      if (simulacrosRes.error) throw simulacrosRes.error;
      if (brigadasRes.error) throw brigadasRes.error;
      if (colaboradoresRes.error) throw colaboradoresRes.error;

      setPlanes(planesRes.data || []);
      setSimulacros(simulacrosRes.data || []);
      setBrigadas(brigadasRes.data || []);
      setColaboradores(colaboradoresRes.data || []);

    } catch (error) {
      console.error('Error cargando datos:', error);
      setMensaje('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const getEstadisticas = () => {
    const planesActivos = planes.filter(p => p.activo).length;
    const simulacrosEsteAno = simulacros.filter(s => 
      new Date(s.fecha_simulacro).getFullYear() === new Date().getFullYear()
    ).length;
    const brigadistasActivos = brigadas.filter(b => b.activo).length;
    const simulacrosPendientes = simulacros.filter(s => s.estado === 'programado').length;

    return { planesActivos, simulacrosEsteAno, brigadistasActivos, simulacrosPendientes };
  };

  const handleSubmitPlan = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      setMensaje('El nombre del plan es obligatorio');
      return;
    }

    try {
      const planData = {
        ...formData,
        objetivos: formData.objetivos ? formData.objetivos.split('\n').filter(o => o.trim()) : [],
        rutas_evacuacion: formData.rutas_evacuacion ? formData.rutas_evacuacion.split('\n').filter(r => r.trim()) : [],
        puntos_encuentro: formData.puntos_encuentro ? formData.puntos_encuentro.split('\n').filter(p => p.trim()) : [],
        numeros_emergencia: formData.numeros_emergencia ? formData.numeros_emergencia.split('\n').filter(n => n.trim()) : [],
        procedimientos: formData.procedimientos ? JSON.parse(`{"pasos": ${JSON.stringify(formData.procedimientos.split('\n').filter(p => p.trim()))}}`) : {},
        recursos_necesarios: formData.recursos_necesarios ? JSON.parse(`{"items": ${JSON.stringify(formData.recursos_necesarios.split('\n').filter(r => r.trim()))}}`) : {},
        responsables: formData.responsables ? JSON.parse(`{"roles": ${JSON.stringify(formData.responsables.split('\n').filter(r => r.trim()))}}`) : {}
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

      if (result.error) throw result.error;

      setMensaje(editingItem ? 'Plan actualizado exitosamente' : 'Plan creado exitosamente');
      resetForm();
      await cargarDatos();
      
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al guardar el plan');
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

      if (result.error) throw result.error;

      setMensaje(editingItem ? 'Simulacro actualizado exitosamente' : 'Simulacro programado exitosamente');
      resetForm();
      await cargarDatos();
      
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al guardar el simulacro');
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

      if (result.error) throw result.error;

      setMensaje(editingItem ? 'Brigadista actualizado exitosamente' : 'Brigadista agregado exitosamente');
      resetForm();
      await cargarDatos();
      
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al guardar el brigadista');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '', tipo_emergencia: 'Evacuación', area_aplicacion: 'General',
      alcance: '', objetivos: '', procedimientos: '', recursos_necesarios: '',
      responsables: '', rutas_evacuacion: '', puntos_encuentro: '', 
      numeros_emergencia: '', observaciones: ''
    });
    setSimulacroData({
      plan_emergencia_id: '', fecha_simulacro: new Date().toISOString().split('T')[0],
      hora_inicio: '09:00', hora_fin: '', tipo_simulacro: 'Programado',
      area_simulacro: 'General', participantes_esperados: 0,
      tiempo_evacuacion_objetivo: 5, responsable_simulacro: '', observaciones: ''
    });
    setBrigadaData({
      nombre: '', tipo_brigada: 'Evacuación', colaborador_id: '',
      cargo_brigada: 'Brigadista', area_responsabilidad: '',
      fecha_capacitacion: '', vigencia_capacitacion: '', certificado_url: ''
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
        objetivos: item.objetivos?.join('\n') || '',
        rutas_evacuacion: item.rutas_evacuacion?.join('\n') || '',
        puntos_encuentro: item.puntos_encuentro?.join('\n') || '',
        numeros_emergencia: item.numeros_emergencia?.join('\n') || '',
        procedimientos: item.procedimientos?.pasos?.join('\n') || '',
        recursos_necesarios: item.recursos_necesarios?.items?.join('\n') || '',
        responsables: item.responsables?.roles?.join('\n') || ''
      });
    } else if (tipo === 'simulacro') {
      setSimulacroData(item);
    } else if (tipo === 'brigada') {
      setBrigadaData(item);
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
        <div style={{ color: '#64748b' }}>Cargando planes de emergencia...</div>
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
            <Icon name="Shield" size={24} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>
              Planes de Emergencia SST
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '16px' }}>
              Gestión integral de emergencias y brigadas de respuesta
            </p>
          </div>
        </div>

        {/* Estadísticas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626', marginBottom: '4px' }}>
              {estadisticas.planesActivos}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Planes Activos</div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#ea580c', marginBottom: '4px' }}>
              {estadisticas.simulacrosEsteAno}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Simulacros Este Año</div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0d9488', marginBottom: '4px' }}>
              {estadisticas.brigadistasActivos}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Brigadistas Activos</div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#7c3aed', marginBottom: '4px' }}>
              {estadisticas.simulacrosPendientes}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Simulacros Pendientes</div>
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
            { key: 'planes', label: 'Planes de Emergencia', icon: 'FileText' },
            { key: 'simulacros', label: 'Simulacros', icon: 'Clock' },
            { key: 'brigadas', label: 'Brigadas', icon: 'Users' }
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
            setCurrentForm(activeTab === 'planes' ? 'plan' : activeTab === 'simulacros' ? 'simulacro' : 'brigada');
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
          {activeTab === 'planes' ? 'Nuevo Plan' : activeTab === 'simulacros' ? 'Nuevo Simulacro' : 'Nuevo Brigadista'}
        </button>
      </div>

      {/* Contenido por Tab */}
      {activeTab === 'planes' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {planes.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <Icon name="FileText" size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>No hay planes de emergencia</h3>
              <p>Crea el primer plan de emergencia para tu organización</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Plan</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Tipo</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Área</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Estado</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Versión</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {planes.map((plan, index) => (
                    <tr key={plan.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>{plan.nombre}</div>
                          {plan.alcance && <div style={{ fontSize: '14px', color: '#64748b' }}>{plan.alcance}</div>}
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#64748b' }}>{plan.tipo_emergencia}</td>
                      <td style={{ padding: '16px', color: '#64748b' }}>{plan.area_aplicacion}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600,
                          background: plan.activo ? '#dcfce7' : '#fef2f2',
                          color: plan.activo ? '#166534' : '#dc2626'
                        }}>
                          {plan.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#64748b' }}>{plan.version}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleEdit(plan, 'plan')}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              padding: '8px', borderRadius: '6px', color: '#6b7280'
                            }}
                            title="Editar"
                          >
                            <Icon name="Edit" size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(plan.id, 'planes_emergencia_sst')}
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

      {activeTab === 'simulacros' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {simulacros.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <Icon name="Clock" size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>No hay simulacros registrados</h3>
              <p>Programa el primer simulacro de emergencia</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Plan</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Fecha</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Tipo</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Estado</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Responsable</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {simulacros.map((simulacro) => (
                    <tr key={simulacro.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                          {simulacro.planes_emergencia_sst?.nombre || 'Plan no encontrado'}
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#64748b' }}>
                        {new Date(simulacro.fecha_simulacro).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px', color: '#64748b' }}>{simulacro.tipo_simulacro}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600,
                          background: simulacro.estado === 'ejecutado' ? '#dcfce7' : simulacro.estado === 'programado' ? '#fef3c7' : '#ddd6fe',
                          color: simulacro.estado === 'ejecutado' ? '#166534' : simulacro.estado === 'programado' ? '#92400e' : '#5b21b6'
                        }}>
                          {simulacro.estado.charAt(0).toUpperCase() + simulacro.estado.slice(1)}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#64748b' }}>{simulacro.responsable_simulacro}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleEdit(simulacro, 'simulacro')}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              padding: '8px', borderRadius: '6px', color: '#6b7280'
                            }}
                            title="Editar"
                          >
                            <Icon name="Edit" size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(simulacro.id, 'simulacros_emergencia')}
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

      {activeTab === 'brigadas' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {brigadas.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <Icon name="Users" size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>No hay brigadistas registrados</h3>
              <p>Registra el primer miembro de la brigada de emergencia</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Brigadista</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Tipo Brigada</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Cargo</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Área</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Estado</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {brigadas.map((brigada) => (
                    <tr key={brigada.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                            {brigada.colaboradores?.nombre_completo || 'Colaborador no encontrado'}
                          </div>
                          <div style={{ fontSize: '14px', color: '#64748b' }}>{brigada.nombre}</div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#64748b' }}>{brigada.tipo_brigada}</td>
                      <td style={{ padding: '16px', color: '#64748b' }}>{brigada.cargo_brigada}</td>
                      <td style={{ padding: '16px', color: '#64748b' }}>{brigada.area_responsabilidad}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600,
                          background: brigada.activo ? '#dcfce7' : '#fef2f2',
                          color: brigada.activo ? '#166534' : '#dc2626'
                        }}>
                          {brigada.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleEdit(brigada, 'brigada')}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              padding: '8px', borderRadius: '6px', color: '#6b7280'
                            }}
                            title="Editar"
                          >
                            <Icon name="Edit" size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(brigada.id, 'brigadas_emergencia')}
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
                {editingItem ? 'Editar' : 'Nuevo'} {currentForm === 'plan' ? 'Plan' : currentForm === 'simulacro' ? 'Simulacro' : 'Brigadista'}
              </h2>
              <button
                onClick={resetForm}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <Icon name="X" size={24} color="#64748b" />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {currentForm === 'plan' && (
                <form onSubmit={handleSubmitPlan}>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Nombre del Plan *
                      </label>
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
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
                          Tipo de Emergencia
                        </label>
                        <select
                          value={formData.tipo_emergencia}
                          onChange={(e) => setFormData({...formData, tipo_emergencia: e.target.value})}
                          style={{
                            width: '100%', padding: '12px', border: '1px solid #d1d5db',
                            borderRadius: '8px', fontSize: '16px'
                          }}
                        >
                          {tiposEmergencia.map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                          Área de Aplicación
                        </label>
                        <select
                          value={formData.area_aplicacion}
                          onChange={(e) => setFormData({...formData, area_aplicacion: e.target.value})}
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
                        Alcance
                      </label>
                      <textarea
                        value={formData.alcance}
                        onChange={(e) => setFormData({...formData, alcance: e.target.value})}
                        rows={3}
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px', resize: 'vertical'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Objetivos (uno por línea)
                      </label>
                      <textarea
                        value={formData.objetivos}
                        onChange={(e) => setFormData({...formData, objetivos: e.target.value})}
                        rows={4}
                        placeholder="Garantizar evacuación segura&#10;Proteger vidas humanas&#10;Minimizar daños materiales"
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px', resize: 'vertical'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Rutas de Evacuación (una por línea)
                      </label>
                      <textarea
                        value={formData.rutas_evacuacion}
                        onChange={(e) => setFormData({...formData, rutas_evacuacion: e.target.value})}
                        rows={3}
                        placeholder="Ruta A: Salida principal&#10;Ruta B: Salida auxiliar"
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px', resize: 'vertical'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Puntos de Encuentro (uno por línea)
                      </label>
                      <textarea
                        value={formData.puntos_encuentro}
                        onChange={(e) => setFormData({...formData, puntos_encuentro: e.target.value})}
                        rows={3}
                        placeholder="Punto 1: Parqueadero principal&#10;Punto 2: Cancha deportiva"
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px', resize: 'vertical'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Números de Emergencia (uno por línea)
                      </label>
                      <textarea
                        value={formData.numeros_emergencia}
                        onChange={(e) => setFormData({...formData, numeros_emergencia: e.target.value})}
                        rows={4}
                        placeholder="Bomberos: 119&#10;Cruz Roja: 132&#10;Policía: 123"
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
                        padding: '12px 24px', background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                        color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
                      }}
                    >
                      {editingItem ? 'Actualizar' : 'Crear'} Plan
                    </button>
                  </div>
                </form>
              )}

              {currentForm === 'simulacro' && (
                <form onSubmit={handleSubmitSimulacro}>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Plan de Emergencia *
                      </label>
                      <select
                        value={simulacroData.plan_emergencia_id}
                        onChange={(e) => setSimulacroData({...simulacroData, plan_emergencia_id: e.target.value})}
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px'
                        }}
                        required
                      >
                        <option value="">Seleccionar plan...</option>
                        {planes.filter(p => p.activo).map(plan => (
                          <option key={plan.id} value={plan.id}>{plan.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                          Fecha del Simulacro
                        </label>
                        <input
                          type="date"
                          value={simulacroData.fecha_simulacro}
                          onChange={(e) => setSimulacroData({...simulacroData, fecha_simulacro: e.target.value})}
                          style={{
                            width: '100%', padding: '12px', border: '1px solid #d1d5db',
                            borderRadius: '8px', fontSize: '16px'
                          }}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                          Hora de Inicio
                        </label>
                        <input
                          type="time"
                          value={simulacroData.hora_inicio}
                          onChange={(e) => setSimulacroData({...simulacroData, hora_inicio: e.target.value})}
                          style={{
                            width: '100%', padding: '12px', border: '1px solid #d1d5db',
                            borderRadius: '8px', fontSize: '16px'
                          }}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                          Tipo de Simulacro
                        </label>
                        <select
                          value={simulacroData.tipo_simulacro}
                          onChange={(e) => setSimulacroData({...simulacroData, tipo_simulacro: e.target.value})}
                          style={{
                            width: '100%', padding: '12px', border: '1px solid #d1d5db',
                            borderRadius: '8px', fontSize: '16px'
                          }}
                        >
                          {tiposSimulacro.map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                          Área del Simulacro
                        </label>
                        <select
                          value={simulacroData.area_simulacro}
                          onChange={(e) => setSimulacroData({...simulacroData, area_simulacro: e.target.value})}
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                          Participantes Esperados
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={simulacroData.participantes_esperados}
                          onChange={(e) => setSimulacroData({...simulacroData, participantes_esperados: parseInt(e.target.value) || 0})}
                          style={{
                            width: '100%', padding: '12px', border: '1px solid #d1d5db',
                            borderRadius: '8px', fontSize: '16px'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                          Tiempo Objetivo (minutos)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={simulacroData.tiempo_evacuacion_objetivo}
                          onChange={(e) => setSimulacroData({...simulacroData, tiempo_evacuacion_objetivo: parseInt(e.target.value) || 5})}
                          style={{
                            width: '100%', padding: '12px', border: '1px solid #d1d5db',
                            borderRadius: '8px', fontSize: '16px'
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Responsable del Simulacro *
                      </label>
                      <input
                        type="text"
                        value={simulacroData.responsable_simulacro}
                        onChange={(e) => setSimulacroData({...simulacroData, responsable_simulacro: e.target.value})}
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px'
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Observaciones
                      </label>
                      <textarea
                        value={simulacroData.observaciones}
                        onChange={(e) => setSimulacroData({...simulacroData, observaciones: e.target.value})}
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
                        padding: '12px 24px', background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                        color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
                      }}
                    >
                      {editingItem ? 'Actualizar' : 'Programar'} Simulacro
                    </button>
                  </div>
                </form>
              )}

              {currentForm === 'brigada' && (
                <form onSubmit={handleSubmitBrigada}>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Nombre de la Brigada *
                      </label>
                      <input
                        type="text"
                        value={brigadaData.nombre}
                        onChange={(e) => setBrigadaData({...brigadaData, nombre: e.target.value})}
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px'
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Colaborador *
                      </label>
                      <select
                        value={brigadaData.colaborador_id}
                        onChange={(e) => setBrigadaData({...brigadaData, colaborador_id: e.target.value})}
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px'
                        }}
                        required
                      >
                        <option value="">Seleccionar colaborador...</option>
                        {colaboradores.map(colaborador => (
                          <option key={colaborador.id} value={colaborador.id}>{colaborador.nombre_completo}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                          Tipo de Brigada
                        </label>
                        <select
                          value={brigadaData.tipo_brigada}
                          onChange={(e) => setBrigadaData({...brigadaData, tipo_brigada: e.target.value})}
                          style={{
                            width: '100%', padding: '12px', border: '1px solid #d1d5db',
                            borderRadius: '8px', fontSize: '16px'
                          }}
                        >
                          {tiposBrigada.map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                          Cargo en la Brigada
                        </label>
                        <select
                          value={brigadaData.cargo_brigada}
                          onChange={(e) => setBrigadaData({...brigadaData, cargo_brigada: e.target.value})}
                          style={{
                            width: '100%', padding: '12px', border: '1px solid #d1d5db',
                            borderRadius: '8px', fontSize: '16px'
                          }}
                        >
                          {cargosBrigada.map(cargo => (
                            <option key={cargo} value={cargo}>{cargo}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        Área de Responsabilidad
                      </label>
                      <input
                        type="text"
                        value={brigadaData.area_responsabilidad}
                        onChange={(e) => setBrigadaData({...brigadaData, area_responsabilidad: e.target.value})}
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                          Fecha de Capacitación
                        </label>
                        <input
                          type="date"
                          value={brigadaData.fecha_capacitacion}
                          onChange={(e) => setBrigadaData({...brigadaData, fecha_capacitacion: e.target.value})}
                          style={{
                            width: '100%', padding: '12px', border: '1px solid #d1d5db',
                            borderRadius: '8px', fontSize: '16px'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                          Vigencia de Capacitación
                        </label>
                        <input
                          type="date"
                          value={brigadaData.vigencia_capacitacion}
                          onChange={(e) => setBrigadaData({...brigadaData, vigencia_capacitacion: e.target.value})}
                          style={{
                            width: '100%', padding: '12px', border: '1px solid #d1d5db',
                            borderRadius: '8px', fontSize: '16px'
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#374151' }}>
                        URL del Certificado
                      </label>
                      <input
                        type="url"
                        value={brigadaData.certificado_url}
                        onChange={(e) => setBrigadaData({...brigadaData, certificado_url: e.target.value})}
                        placeholder="https://..."
                        style={{
                          width: '100%', padding: '12px', border: '1px solid #d1d5db',
                          borderRadius: '8px', fontSize: '16px'
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
                        padding: '12px 24px', background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                        color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
                      }}
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