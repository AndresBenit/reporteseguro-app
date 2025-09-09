import React, { useState, useEffect } from 'react';
import { dbHelpers } from '../../services/supabase';
import { Icon } from '../common/Icons';

const COPASSTMain = () => {
  const [activeTab, setActiveTab] = useState('miembros');
  const [miembros, setMiembros] = useState([]);
  const [reuniones, setReuniones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [mensaje, setMensaje] = useState('');

  // Estados para formularios
  const [formDataMiembro, setFormDataMiembro] = useState({
    colaborador_nombre: '',
    cedula: '',
    cargo: '',
    area: '',
    tipo_miembro: '',
    es_principal: true,
    fecha_inicio: '',
    fecha_fin: '',
    telefono: '',
    email: '',
    capacitacion_copasst: false,
    fecha_capacitacion: '',
    institucion_capacitacion: ''
  });

  const [formDataReunion, setFormDataReunion] = useState({
    numero_reunion: '',
    fecha_reunion: '',
    hora_inicio: '',
    hora_fin: '',
    lugar: '',
    tipo_reunion: 'Ordinaria',
    presidente: '',
    secretario: '',
    orden_dia: '',
    desarrollo_reunion: '',
    compromisos: '',
    observaciones: '',
    asistentes: '',
    acta_url: '',
    aprobada: false
  });

  const tiposMiembro = [
    'Empleador',
    'Trabajador', 
    'Presidente',
    'Secretario'
  ];

  const areas = [
    'Centro Industrial',
    'Hornos Solera'
  ];

  const tiposReunion = [
    'Ordinaria',
    'Extraordinaria',
    'Instalación',
    'Virtual'
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const [miembrosData, reunionesData] = await Promise.all([
        dbHelpers.getAll('copasst_miembros', {
          orderBy: 'created_at',
          ascending: false
        }),
        dbHelpers.getAll('copasst_reuniones', {
          orderBy: 'fecha_reunion',
          ascending: false
        })
      ]);

      setMiembros(miembrosData || []);
      setReuniones(reunionesData || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setMensaje('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMiembro = async (e) => {
    e.preventDefault();
    
    if (!formDataMiembro.colaborador_nombre || !formDataMiembro.cedula || 
        !formDataMiembro.cargo || !formDataMiembro.area || 
        !formDataMiembro.tipo_miembro || !formDataMiembro.fecha_inicio || 
        !formDataMiembro.fecha_fin) {
      setMensaje('Por favor complete los campos obligatorios');
      return;
    }

    // Validar fechas
    const fechaInicio = new Date(formDataMiembro.fecha_inicio);
    const fechaFin = new Date(formDataMiembro.fecha_fin);
    
    if (fechaFin <= fechaInicio) {
      setMensaje('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    try {
      const dataToSave = {
        ...formDataMiembro,
        fecha_capacitacion: formDataMiembro.fecha_capacitacion || null,
        created_at: editingItem ? undefined : new Date().toISOString()
      };

      if (editingItem) {
        await dbHelpers.update('copasst_miembros', editingItem.id, dataToSave);
        setMensaje('Miembro actualizado exitosamente');
      } else {
        await dbHelpers.create('copasst_miembros', dataToSave);
        setMensaje('Miembro registrado exitosamente');
      }

      resetFormMiembro();
      setShowForm(false);
      setEditingItem(null);
      cargarDatos();

      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error guardando miembro:', error);
      setMensaje('Error al guardar el miembro');
    }
  };

  const handleSubmitReunion = async (e) => {
    e.preventDefault();
    
    if (!formDataReunion.numero_reunion || !formDataReunion.fecha_reunion || 
        !formDataReunion.hora_inicio || !formDataReunion.lugar ||
        !formDataReunion.presidente || !formDataReunion.secretario ||
        !formDataReunion.orden_dia || !formDataReunion.desarrollo_reunion) {
      setMensaje('Por favor complete los campos obligatorios');
      return;
    }

    // Validar horas si se proporciona hora_fin
    if (formDataReunion.hora_fin && formDataReunion.hora_inicio) {
      if (formDataReunion.hora_fin <= formDataReunion.hora_inicio) {
        setMensaje('La hora de fin debe ser posterior a la hora de inicio');
        return;
      }
    }

    try {
      const dataToSave = {
        ...formDataReunion,
        numero_reunion: parseInt(formDataReunion.numero_reunion),
        hora_fin: formDataReunion.hora_fin || null,
        asistentes: formDataReunion.asistentes ? 
          JSON.parse(`[${formDataReunion.asistentes.split(',').map(a => `"${a.trim()}"`).join(',')}]`) : 
          [],
        created_at: editingItem ? undefined : new Date().toISOString()
      };

      if (editingItem) {
        await dbHelpers.update('copasst_reuniones', editingItem.id, dataToSave);
        setMensaje('Reunión actualizada exitosamente');
      } else {
        await dbHelpers.create('copasst_reuniones', dataToSave);
        setMensaje('Reunión registrada exitosamente');
      }

      resetFormReunion();
      setShowForm(false);
      setEditingItem(null);
      cargarDatos();

      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error guardando reunión:', error);
      setMensaje('Error al guardar la reunión');
    }
  };

  const editarMiembro = (miembro) => {
    setFormDataMiembro({
      colaborador_nombre: miembro.colaborador_nombre || '',
      cedula: miembro.cedula || '',
      cargo: miembro.cargo || '',
      area: miembro.area || '',
      tipo_miembro: miembro.tipo_miembro || '',
      es_principal: miembro.es_principal !== false,
      fecha_inicio: miembro.fecha_inicio || '',
      fecha_fin: miembro.fecha_fin || '',
      telefono: miembro.telefono || '',
      email: miembro.email || '',
      capacitacion_copasst: miembro.capacitacion_copasst || false,
      fecha_capacitacion: miembro.fecha_capacitacion || '',
      institucion_capacitacion: miembro.institucion_capacitacion || ''
    });
    setEditingItem(miembro);
    setShowForm(true);
  };

  const editarReunion = (reunion) => {
    setFormDataReunion({
      numero_reunion: reunion.numero_reunion?.toString() || '',
      fecha_reunion: reunion.fecha_reunion || '',
      hora_inicio: reunion.hora_inicio || '',
      hora_fin: reunion.hora_fin || '',
      lugar: reunion.lugar || '',
      tipo_reunion: reunion.tipo_reunion || 'Ordinaria',
      presidente: reunion.presidente || '',
      secretario: reunion.secretario || '',
      orden_dia: reunion.orden_dia || '',
      desarrollo_reunion: reunion.desarrollo_reunion || '',
      compromisos: reunion.compromisos || '',
      observaciones: reunion.observaciones || '',
      asistentes: Array.isArray(reunion.asistentes) ? reunion.asistentes.join(', ') : '',
      acta_url: reunion.acta_url || '',
      aprobada: reunion.aprobada || false
    });
    setEditingItem(reunion);
    setShowForm(true);
  };

  const eliminar = async (id, tabla, tipo) => {
    if (window.confirm(`¿Está seguro de eliminar este ${tipo}?`)) {
      try {
        await dbHelpers.delete(tabla, id);
        setMensaje(`${tipo} eliminado exitosamente`);
        cargarDatos();
        setTimeout(() => setMensaje(''), 3000);
      } catch (error) {
        console.error(`Error eliminando ${tipo}:`, error);
        setMensaje(`Error al eliminar el ${tipo}`);
      }
    }
  };

  const resetFormMiembro = () => {
    setFormDataMiembro({
      colaborador_nombre: '',
      cedula: '',
      cargo: '',
      area: '',
      tipo_miembro: '',
      es_principal: true,
      fecha_inicio: '',
      fecha_fin: '',
      telefono: '',
      email: '',
      capacitacion_copasst: false,
      fecha_capacitacion: '',
      institucion_capacitacion: ''
    });
  };

  const resetFormReunion = () => {
    setFormDataReunion({
      numero_reunion: '',
      fecha_reunion: '',
      hora_inicio: '',
      hora_fin: '',
      lugar: '',
      tipo_reunion: 'Ordinaria',
      presidente: '',
      secretario: '',
      orden_dia: '',
      desarrollo_reunion: '',
      compromisos: '',
      observaciones: '',
      asistentes: '',
      acta_url: '',
      aprobada: false
    });
  };

  const cancelarForm = () => {
    setShowForm(false);
    setEditingItem(null);
    resetFormMiembro();
    resetFormReunion();
    setMensaje('');
  };

  // Estadísticas
  const miembrosActivos = miembros.filter(m => m.activo).length;
  const miembrosPrincipales = miembros.filter(m => m.es_principal && m.activo).length;
  const reunionesEsteAno = reuniones.filter(r => {
    const fechaReunion = new Date(r.fecha_reunion);
    return fechaReunion.getFullYear() === new Date().getFullYear();
  }).length;
  const actasAprobadas = reuniones.filter(r => r.aprobada).length;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <div>Cargando...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: '#1e293b',
            margin: '0 0 8px 0'
          }}>
            COPASST - Comité Paritario SST
          </h1>
          <p style={{ 
            color: '#64748b', 
            margin: 0,
            fontSize: '1rem'
          }}>
            Gestión del Comité Paritario de Seguridad y Salud en el Trabajo
          </p>
        </div>
        
        <button
          onClick={() => {
            setShowForm(true);
            if (activeTab === 'miembros') {
              resetFormMiembro();
            } else {
              resetFormReunion();
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          <Icon name="Plus" size={16} />
          {activeTab === 'miembros' ? 'Nuevo Miembro' : 'Nueva Reunión'}
        </button>
      </div>

      {/* Dashboard Estadísticas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>
            {miembrosActivos}
          </div>
          <div style={{ color: '#374151', fontWeight: '600' }}>Miembros Activos</div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#059669' }}>
            {miembrosPrincipales}
          </div>
          <div style={{ color: '#374151', fontWeight: '600' }}>Principales</div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#7c3aed' }}>
            {reunionesEsteAno}
          </div>
          <div style={{ color: '#374151', fontWeight: '600' }}>Reuniones {new Date().getFullYear()}</div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#dc2626' }}>
            {actasAprobadas}
          </div>
          <div style={{ color: '#374151', fontWeight: '600' }}>Actas Aprobadas</div>
        </div>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          background: mensaje.includes('Error') ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${mensaje.includes('Error') ? '#fecaca' : '#bbf7d0'}`,
          color: mensaje.includes('Error') ? '#dc2626' : '#166534'
        }}>
          {mensaje}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => setActiveTab('miembros')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'miembros' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'miembros' ? '#3b82f6' : '#6b7280',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Miembros del Comité
        </button>
        <button
          onClick={() => setActiveTab('reuniones')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'reuniones' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'reuniones' ? '#3b82f6' : '#6b7280',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Reuniones y Actas
        </button>
      </div>

      {/* Formularios */}
      {showForm && (
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          marginBottom: '30px'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '20px'
          }}>
            {activeTab === 'miembros' 
              ? (editingItem ? 'Editar Miembro' : 'Nuevo Miembro del COPASST')
              : (editingItem ? 'Editar Reunión' : 'Nueva Reunión del COPASST')
            }
          </h3>

          {/* Formulario de Miembro */}
          {activeTab === 'miembros' && (
            <form onSubmit={handleSubmitMiembro}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Nombre del Colaborador *
                  </label>
                  <input
                    type="text"
                    value={formDataMiembro.colaborador_nombre}
                    onChange={(e) => setFormDataMiembro({...formDataMiembro, colaborador_nombre: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    placeholder="Nombre completo del miembro"
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Cédula *
                  </label>
                  <input
                    type="text"
                    value={formDataMiembro.cedula}
                    onChange={(e) => setFormDataMiembro({...formDataMiembro, cedula: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    placeholder="Número de cédula"
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Cargo *
                  </label>
                  <input
                    type="text"
                    value={formDataMiembro.cargo}
                    onChange={(e) => setFormDataMiembro({...formDataMiembro, cargo: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    placeholder="Cargo del colaborador"
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Área *
                  </label>
                  <select
                    value={formDataMiembro.area}
                    onChange={(e) => setFormDataMiembro({...formDataMiembro, area: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    required
                  >
                    <option value="">Seleccionar área</option>
                    {areas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Tipo de Miembro *
                  </label>
                  <select
                    value={formDataMiembro.tipo_miembro}
                    onChange={(e) => setFormDataMiembro({...formDataMiembro, tipo_miembro: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    required
                  >
                    <option value="">Seleccionar tipo</option>
                    {tiposMiembro.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    value={formDataMiembro.fecha_inicio}
                    onChange={(e) => setFormDataMiembro({...formDataMiembro, fecha_inicio: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Fecha de Fin *
                  </label>
                  <input
                    type="date"
                    value={formDataMiembro.fecha_fin}
                    onChange={(e) => setFormDataMiembro({...formDataMiembro, fecha_fin: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formDataMiembro.telefono}
                    onChange={(e) => setFormDataMiembro({...formDataMiembro, telefono: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    placeholder="+57 300 123-4567"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formDataMiembro.email}
                    onChange={(e) => setFormDataMiembro({...formDataMiembro, email: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    placeholder="email@empresa.com"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Fecha de Capacitación
                  </label>
                  <input
                    type="date"
                    value={formDataMiembro.fecha_capacitacion}
                    onChange={(e) => setFormDataMiembro({...formDataMiembro, fecha_capacitacion: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Institución de Capacitación
                  </label>
                  <input
                    type="text"
                    value={formDataMiembro.institucion_capacitacion}
                    onChange={(e) => setFormDataMiembro({...formDataMiembro, institucion_capacitacion: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    placeholder="Nombre de la institución"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={formDataMiembro.es_principal}
                    onChange={(e) => setFormDataMiembro({...formDataMiembro, es_principal: e.target.checked})}
                  />
                  Es miembro principal (no suplente)
                </label>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={formDataMiembro.capacitacion_copasst}
                    onChange={(e) => setFormDataMiembro({...formDataMiembro, capacitacion_copasst: e.target.checked})}
                  />
                  Ha recibido capacitación específica para COPASST
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={cancelarForm}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#3b82f6',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {editingItem ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          )}

          {/* Formulario de Reunión */}
          {activeTab === 'reuniones' && (
            <form onSubmit={handleSubmitReunion}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Número de Reunión *
                  </label>
                  <input
                    type="number"
                    value={formDataReunion.numero_reunion}
                    onChange={(e) => setFormDataReunion({...formDataReunion, numero_reunion: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    placeholder="1"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Fecha de Reunión *
                  </label>
                  <input
                    type="date"
                    value={formDataReunion.fecha_reunion}
                    onChange={(e) => setFormDataReunion({...formDataReunion, fecha_reunion: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Hora de Inicio *
                  </label>
                  <input
                    type="time"
                    value={formDataReunion.hora_inicio}
                    onChange={(e) => setFormDataReunion({...formDataReunion, hora_inicio: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Hora de Fin
                  </label>
                  <input
                    type="time"
                    value={formDataReunion.hora_fin}
                    onChange={(e) => setFormDataReunion({...formDataReunion, hora_fin: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Lugar *
                  </label>
                  <input
                    type="text"
                    value={formDataReunion.lugar}
                    onChange={(e) => setFormDataReunion({...formDataReunion, lugar: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    placeholder="Sala de reuniones, oficina, etc."
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Tipo de Reunión
                  </label>
                  <select
                    value={formDataReunion.tipo_reunion}
                    onChange={(e) => setFormDataReunion({...formDataReunion, tipo_reunion: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    {tiposReunion.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Presidente *
                  </label>
                  <input
                    type="text"
                    value={formDataReunion.presidente}
                    onChange={(e) => setFormDataReunion({...formDataReunion, presidente: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    placeholder="Nombre del presidente"
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Secretario *
                  </label>
                  <input
                    type="text"
                    value={formDataReunion.secretario}
                    onChange={(e) => setFormDataReunion({...formDataReunion, secretario: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    placeholder="Nombre del secretario"
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    URL del Acta
                  </label>
                  <input
                    type="url"
                    value={formDataReunion.acta_url}
                    onChange={(e) => setFormDataReunion({...formDataReunion, acta_url: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Orden del Día *
                  </label>
                  <textarea
                    value={formDataReunion.orden_dia}
                    onChange={(e) => setFormDataReunion({...formDataReunion, orden_dia: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      minHeight: '100px',
                      resize: 'vertical'
                    }}
                    placeholder="1. Verificación de quórum&#10;2. Lectura del orden del día&#10;3. ..."
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Desarrollo de la Reunión *
                  </label>
                  <textarea
                    value={formDataReunion.desarrollo_reunion}
                    onChange={(e) => setFormDataReunion({...formDataReunion, desarrollo_reunion: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      minHeight: '100px',
                      resize: 'vertical'
                    }}
                    placeholder="Descripción detallada de los temas tratados..."
                    required
                  />
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Compromisos
                  </label>
                  <textarea
                    value={formDataReunion.compromisos}
                    onChange={(e) => setFormDataReunion({...formDataReunion, compromisos: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                    placeholder="Compromisos y responsables..."
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Observaciones
                  </label>
                  <textarea
                    value={formDataReunion.observaciones}
                    onChange={(e) => setFormDataReunion({...formDataReunion, observaciones: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                    placeholder="Observaciones adicionales..."
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Asistentes (separados por comas)
                </label>
                <input
                  type="text"
                  value={formDataReunion.asistentes}
                  onChange={(e) => setFormDataReunion({...formDataReunion, asistentes: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  placeholder="Juan Pérez, Ana García, Luis Rodríguez..."
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={formDataReunion.aprobada}
                    onChange={(e) => setFormDataReunion({...formDataReunion, aprobada: e.target.checked})}
                  />
                  Acta aprobada
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={cancelarForm}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#3b82f6',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {editingItem ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Contenido de las tabs */}
      {activeTab === 'miembros' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1e293b',
              margin: 0
            }}>
              Miembros del COPASST
            </h3>
          </div>

          {miembros.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.3 }}>👥</div>
              <h3 style={{ color: '#6b7280', marginBottom: '8px' }}>No hay miembros registrados</h3>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                Comience agregando el primer miembro del COPASST
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px', borderBottom: '1px solid #e2e8f0' }}>
                      Miembro
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px', borderBottom: '1px solid #e2e8f0' }}>
                      Cargo
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px', borderBottom: '1px solid #e2e8f0' }}>
                      Tipo
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px', borderBottom: '1px solid #e2e8f0' }}>
                      Período
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px', borderBottom: '1px solid #e2e8f0' }}>
                      Estado
                    </th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '14px', borderBottom: '1px solid #e2e8f0' }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {miembros.map((miembro) => (
                    <tr key={miembro.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px', color: '#374151', fontSize: '14px' }}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#1e293b' }}>
                            {miembro.colaborador_nombre}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {miembro.cedula} • {miembro.area}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#374151', fontSize: '14px' }}>
                        {miembro.cargo}
                      </td>
                      <td style={{ padding: '16px', color: '#374151', fontSize: '14px' }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>{miembro.tipo_miembro}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {miembro.es_principal ? 'Principal' : 'Suplente'}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#374151', fontSize: '14px' }}>
                        <div>
                          <div>{miembro.fecha_inicio}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            hasta {miembro.fecha_fin}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: miembro.activo ? '#f0fdf4' : '#fef2f2',
                          color: miembro.activo ? '#166534' : '#dc2626',
                          border: `1px solid ${miembro.activo ? '#bbf7d0' : '#fecaca'}`
                        }}>
                          {miembro.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => editarMiembro(miembro)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              border: 'none',
                              borderRadius: '6px',
                              background: '#f3f4f6',
                              color: '#374151',
                              cursor: 'pointer'
                            }}
                            title="Editar miembro"
                          >
                            <Icon name="Edit" size={14} />
                          </button>
                          <button
                            onClick={() => eliminar(miembro.id, 'copasst_miembros', 'miembro')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              border: 'none',
                              borderRadius: '6px',
                              background: '#fef2f2',
                              color: '#dc2626',
                              cursor: 'pointer'
                            }}
                            title="Eliminar miembro"
                          >
                            <Icon name="Trash2" size={14} />
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

      {activeTab === 'reuniones' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1e293b',
              margin: 0
            }}>
              Reuniones y Actas del COPASST
            </h3>
          </div>

          {reuniones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.3 }}>📋</div>
              <h3 style={{ color: '#6b7280', marginBottom: '8px' }}>No hay reuniones registradas</h3>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                Comience registrando la primera reunión del COPASST
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px', borderBottom: '1px solid #e2e8f0' }}>
                      Reunión
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px', borderBottom: '1px solid #e2e8f0' }}>
                      Fecha y Hora
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px', borderBottom: '1px solid #e2e8f0' }}>
                      Lugar
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px', borderBottom: '1px solid #e2e8f0' }}>
                      Presidida por
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px', borderBottom: '1px solid #e2e8f0' }}>
                      Estado
                    </th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '14px', borderBottom: '1px solid #e2e8f0' }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reuniones.map((reunion) => (
                    <tr key={reunion.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px', color: '#374151', fontSize: '14px' }}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#1e293b' }}>
                            Reunión #{reunion.numero_reunion}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {reunion.tipo_reunion}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#374151', fontSize: '14px' }}>
                        <div>
                          <div>{reunion.fecha_reunion}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {reunion.hora_inicio} {reunion.hora_fin && `- ${reunion.hora_fin}`}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#374151', fontSize: '14px' }}>
                        {reunion.lugar}
                      </td>
                      <td style={{ padding: '16px', color: '#374151', fontSize: '14px' }}>
                        <div>
                          <div style={{ fontWeight: '500' }}>{reunion.presidente}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            Sec: {reunion.secretario}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: reunion.aprobada ? '#f0fdf4' : '#fef3c7',
                          color: reunion.aprobada ? '#166534' : '#92400e',
                          border: `1px solid ${reunion.aprobada ? '#bbf7d0' : '#fcd34d'}`
                        }}>
                          {reunion.aprobada ? 'Aprobada' : 'Pendiente'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          {reunion.acta_url && (
                            <a
                              href={reunion.acta_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                border: 'none',
                                borderRadius: '6px',
                                background: '#eff6ff',
                                color: '#2563eb',
                                cursor: 'pointer',
                                textDecoration: 'none'
                              }}
                              title="Ver acta"
                            >
                              <Icon name="ExternalLink" size={14} />
                            </a>
                          )}
                          <button
                            onClick={() => editarReunion(reunion)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              border: 'none',
                              borderRadius: '6px',
                              background: '#f3f4f6',
                              color: '#374151',
                              cursor: 'pointer'
                            }}
                            title="Editar reunión"
                          >
                            <Icon name="Edit" size={14} />
                          </button>
                          <button
                            onClick={() => eliminar(reunion.id, 'copasst_reuniones', 'reunión')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              border: 'none',
                              borderRadius: '6px',
                              background: '#fef2f2',
                              color: '#dc2626',
                              cursor: 'pointer'
                            }}
                            title="Eliminar reunión"
                          >
                            <Icon name="Trash2" size={14} />
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
    </div>
  );
};

export default COPASSTMain;