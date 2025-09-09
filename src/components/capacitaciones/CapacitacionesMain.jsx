import React, { useState, useEffect } from 'react';
import { dbHelpers } from '../../services/supabase';
import { Icon } from '../common/Icons';

const CapacitacionesMain = () => {
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCapacitacion, setEditingCapacitacion] = useState(null);
  const [mensaje, setMensaje] = useState('');

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha_realizacion: '',
    area: '',
    tipo_capacitacion: '',
    instructor: '',
    duracion_horas: '',
    certificado_url: '',
    fecha_vencimiento: '',
    estado: 'completada'
  });

  const tiposCapacitacion = [
    'Seguridad Industrial',
    'Uso de EPP',
    'Primeros Auxilios',
    'Prevención de Riesgos',
    'Trabajo en Alturas',
    'Espacios Confinados',
    'Manejo de Químicos',
    'Emergencias y Evacuación',
    'Higiene Industrial',
    'Ergonomía',
    'Otro'
  ];

  const areas = [
    'Centro Industrial',
    'Hornos Solera'
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const capacitacionesData = await dbHelpers.getAll('capacitaciones_sst', {
        orderBy: 'fecha_realizacion',
        ascending: false
      });

      setCapacitaciones(capacitacionesData || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setMensaje('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.area || !formData.fecha_realizacion) {
      setMensaje('Por favor complete los campos obligatorios');
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        duracion_horas: parseFloat(formData.duracion_horas) || 0,
        created_at: editingCapacitacion ? undefined : new Date().toISOString()
      };

      if (editingCapacitacion) {
        await dbHelpers.update('capacitaciones_sst', editingCapacitacion.id, dataToSave);
        setMensaje('Capacitación actualizada exitosamente');
      } else {
        await dbHelpers.create('capacitaciones_sst', dataToSave);
        setMensaje('Capacitación registrada exitosamente');
      }

      await cargarDatos();
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error guardando capacitación:', error);
      setMensaje('Error al guardar la capacitación');
    }
  };

  const handleEdit = (capacitacion) => {
    setEditingCapacitacion(capacitacion);
    setFormData({
      titulo: capacitacion.titulo || '',
      descripcion: capacitacion.descripcion || '',
      fecha_realizacion: capacitacion.fecha_realizacion || '',
      area: capacitacion.area || '',
      tipo_capacitacion: capacitacion.tipo_capacitacion || '',
      instructor: capacitacion.instructor || '',
      duracion_horas: capacitacion.duracion_horas || '',
      certificado_url: capacitacion.certificado_url || '',
      fecha_vencimiento: capacitacion.fecha_vencimiento || '',
      estado: capacitacion.estado || 'completada'
    });
    setShowForm(true);
  };

  const handleDelete = async (id, titulo) => {
    if (!window.confirm(`¿Está seguro de eliminar la capacitación "${titulo}"?`)) {
      return;
    }

    try {
      console.log('🗑️ Intentando eliminar capacitación con ID:', id);
      const result = await dbHelpers.delete('capacitaciones_sst', id);
      console.log('✅ Resultado de eliminación:', result);
      
      await cargarDatos();
      setMensaje('Capacitación eliminada exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando capacitación:', error);
      console.error('❌ Detalles del error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Mensaje más específico basado en el tipo de error
      if (error.code === '42501') {
        setMensaje('Error: No tienes permisos para eliminar esta capacitación');
      } else if (error.code === '23503') {
        setMensaje('Error: No se puede eliminar porque está siendo referenciada');
      } else {
        setMensaje(`Error al eliminar: ${error.message || 'Error desconocido'}`);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      fecha_realizacion: '',
      area: '',
      tipo_capacitacion: '',
      instructor: '',
      duracion_horas: '',
      certificado_url: '',
      fecha_vencimiento: '',
      estado: 'completada'
    });
    setEditingCapacitacion(null);
    setMensaje('');
  };


  const isVencida = (fechaVencimiento) => {
    if (!fechaVencimiento) return false;
    return new Date(fechaVencimiento) < new Date();
  };

  const isProximaVencer = (fechaVencimiento) => {
    if (!fechaVencimiento) return false;
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diasRestantes = (vencimiento - hoy) / (1000 * 60 * 60 * 24);
    return diasRestantes > 0 && diasRestantes <= 30;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <div>Cargando capacitaciones...</div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 8px 0'
          }}>
            Capacitaciones SST
          </h1>
          <p style={{
            color: '#64748b',
            margin: 0
          }}>
            Gestión de capacitaciones en Seguridad y Salud en el Trabajo
          </p>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'transform 0.2s',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
          }}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
        >
          <Icon name="Plus" size={18} />
          {showForm ? 'Cancelar' : 'Nueva Capacitación'}
        </button>
      </div>

      {/* Estadísticas */}
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
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              padding: '10px',
              borderRadius: '8px'
            }}>
              <Icon name="BookOpen" size={20} color="white" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Total</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
                {capacitaciones.length}
              </p>
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '10px',
              borderRadius: '8px'
            }}>
              <Icon name="CheckCircle" size={20} color="white" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Vigentes</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
                {capacitaciones.filter(c => !isVencida(c.fecha_vencimiento)).length}
              </p>
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              padding: '10px',
              borderRadius: '8px'
            }}>
              <Icon name="AlertTriangle" size={20} color="white" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Por Vencer</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
                {capacitaciones.filter(c => isProximaVencer(c.fecha_vencimiento)).length}
              </p>
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              padding: '10px',
              borderRadius: '8px'
            }}>
              <Icon name="XCircle" size={20} color="white" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Vencidas</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
                {capacitaciones.filter(c => isVencida(c.fecha_vencimiento)).length}
              </p>
            </div>
          </div>
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

      {/* Formulario */}
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
            {editingCapacitacion ? 'Editar Capacitación' : 'Nueva Capacitación'}
          </h3>

          <form onSubmit={handleSubmit}>
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
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
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
                  Área *
                </label>
                <select
                  value={formData.area}
                  onChange={(e) => setFormData({...formData, area: e.target.value})}
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
                    <option key={area} value={area}>
                      {area}
                    </option>
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
                  Tipo de Capacitación
                </label>
                <select
                  value={formData.tipo_capacitacion}
                  onChange={(e) => setFormData({...formData, tipo_capacitacion: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Seleccionar tipo</option>
                  {tiposCapacitacion.map(tipo => (
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
                  Fecha de Realización *
                </label>
                <input
                  type="date"
                  value={formData.fecha_realizacion}
                  onChange={(e) => setFormData({...formData, fecha_realizacion: e.target.value})}
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
                  Instructor
                </label>
                <input
                  type="text"
                  value={formData.instructor}
                  onChange={(e) => setFormData({...formData, instructor: e.target.value})}
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
                  Duración (horas)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.duracion_horas}
                  onChange={(e) => setFormData({...formData, duracion_horas: e.target.value})}
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
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  value={formData.fecha_vencimiento}
                  onChange={(e) => setFormData({...formData, fecha_vencimiento: e.target.value})}
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
                  URL del Certificado
                </label>
                <input
                  type="url"
                  value={formData.certificado_url}
                  onChange={(e) => setFormData({...formData, certificado_url: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  placeholder="https://..."
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
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
                placeholder="Descripción de la capacitación..."
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#374151',
                  fontSize: '14px',
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
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                {editingCapacitacion ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Capacitaciones */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#1e293b',
            margin: 0
          }}>
            Historial de Capacitaciones ({capacitaciones.length})
          </h3>
        </div>

        {capacitaciones.length === 0 ? (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <Icon name="BookOpen" size={48} color="#cbd5e1" />
            <p style={{ marginTop: '16px', fontSize: '16px' }}>
              No hay capacitaciones registradas
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
              Haga clic en "Nueva Capacitación" para comenzar
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Capacitación
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Área
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Tipo
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Fecha
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Vencimiento
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Estado
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {capacitaciones.map((capacitacion, index) => {
                  const vencida = isVencida(capacitacion.fecha_vencimiento);
                  const proximaVencer = isProximaVencer(capacitacion.fecha_vencimiento);
                  
                  return (
                    <tr 
                      key={capacitacion.id} 
                      style={{
                        borderBottom: index < capacitaciones.length - 1 ? '1px solid #f1f5f9' : 'none',
                        background: vencida ? '#fef2f2' : proximaVencer ? '#fffbeb' : 'white'
                      }}
                    >
                      <td style={{ padding: '16px' }}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#1e293b', marginBottom: '4px' }}>
                            {capacitacion.titulo}
                          </div>
                          {capacitacion.descripcion && (
                            <div style={{ fontSize: '14px', color: '#64748b' }}>
                              {capacitacion.descripcion}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: capacitacion.area === 'Centro Industrial' ? '#fef3c7' : '#fee2e2',
                          color: capacitacion.area === 'Centro Industrial' ? '#92400e' : '#991b1b'
                        }}>
                          {capacitacion.area === 'Centro Industrial' ? '🏭 Centro Industrial' : '🔥 Hornos Solera'}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: '#f0f9ff',
                          color: '#0369a1'
                        }}>
                          {capacitacion.tipo_capacitacion || 'Sin tipo'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#374151', fontSize: '14px' }}>
                        {capacitacion.fecha_realizacion ? 
                          new Date(capacitacion.fecha_realizacion).toLocaleDateString('es-ES') : 
                          '-'
                        }
                      </td>
                      <td style={{ padding: '16px', color: '#374151', fontSize: '14px' }}>
                        {capacitacion.fecha_vencimiento ? 
                          new Date(capacitacion.fecha_vencimiento).toLocaleDateString('es-ES') : 
                          'Sin vencimiento'
                        }
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: vencida ? '#fef2f2' : proximaVencer ? '#fffbeb' : '#f0fdf4',
                          color: vencida ? '#dc2626' : proximaVencer ? '#d97706' : '#166534'
                        }}>
                          {vencida ? 'Vencida' : proximaVencer ? 'Por vencer' : 'Vigente'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {capacitacion.certificado_url && (
                            <button
                              onClick={() => window.open(capacitacion.certificado_url, '_blank')}
                              style={{
                                padding: '6px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                background: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Ver certificado"
                            >
                              <Icon name="ExternalLink" size={14} color="#6b7280" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleEdit(capacitacion)}
                            style={{
                              padding: '6px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              background: 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Editar"
                          >
                            <Icon name="Edit" size={14} color="#6b7280" />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(capacitacion.id, capacitacion.titulo)}
                            style={{
                              padding: '6px',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              background: '#fef2f2',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Eliminar"
                          >
                            <Icon name="Trash" size={14} color="#dc2626" />
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
    </div>
  );
};

export default CapacitacionesMain;