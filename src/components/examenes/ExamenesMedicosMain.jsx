import React, { useState, useEffect } from 'react';
import { dbHelpers } from '../../services/supabase';
import { Icon } from '../common/Icons';

const ExamenesMedicosMain = () => {
  const [examenes, setExamenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExamen, setEditingExamen] = useState(null);
  const [mensaje, setMensaje] = useState('');

  const [formData, setFormData] = useState({
    tipo_examen: '',
    area: '',
    fecha_realizacion: '',
    entidad_realiza: '',
    medico_tratante: '',
    resultado: 'pendiente',
    observaciones: '',
    fecha_vencimiento: '',
    archivo_url: ''
  });

  const tiposExamen = [
    'Ingreso',
    'Periódico',
    'Egreso', 
    'Post-incidente',
    'Reintegro',
    'Optométrico',
    'Audiométrico',
    'Espirometría',
    'Visiometría',
    'Rayos X Tórax',
    'Laboratorio Clínico',
    'Electrocardiograma',
    'Otro'
  ];

  const areas = [
    'Centro Industrial',
    'Hornos Solera'
  ];

  const resultadosPosibles = [
    'pendiente',
    'apto',
    'no_apto',
    'apto_con_restricciones'
  ];

  const entidadesMedicas = [
    'EPS',
    'ARL',
    'IPS Privada',
    'Clínica Ocupacional',
    'Hospital',
    'Centro Médico',
    'Otro'
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const examenesData = await dbHelpers.getAll('examenes_medicos_sst', {
        orderBy: 'fecha_realizacion',
        ascending: false
      });

      setExamenes(examenesData || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setMensaje('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.tipo_examen || !formData.area || !formData.fecha_realizacion) {
      setMensaje('Por favor complete los campos obligatorios');
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        created_at: editingExamen ? undefined : new Date().toISOString()
      };

      if (editingExamen) {
        await dbHelpers.update('examenes_medicos_sst', editingExamen.id, dataToSave);
        setMensaje('Examen médico actualizado exitosamente');
      } else {
        await dbHelpers.create('examenes_medicos_sst', dataToSave);
        setMensaje('Examen médico registrado exitosamente');
      }

      await cargarDatos();
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error guardando examen médico:', error);
      setMensaje('Error al guardar el examen médico');
    }
  };

  const handleEdit = (examen) => {
    setEditingExamen(examen);
    setFormData({
      tipo_examen: examen.tipo_examen || '',
      area: examen.area || '',
      fecha_realizacion: examen.fecha_realizacion || '',
      entidad_realiza: examen.entidad_realiza || '',
      medico_tratante: examen.medico_tratante || '',
      resultado: examen.resultado || 'pendiente',
      observaciones: examen.observaciones || '',
      fecha_vencimiento: examen.fecha_vencimiento || '',
      archivo_url: examen.archivo_url || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id, tipoExamen) => {
    if (!window.confirm(`¿Está seguro de eliminar el examen "${tipoExamen}"?`)) {
      return;
    }

    try {
      console.log('🗑️ Intentando eliminar examen con ID:', id);
      await dbHelpers.delete('examenes_medicos_sst', id);
      
      await cargarDatos();
      setMensaje('Examen médico eliminado exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando examen:', error);
      setMensaje(`Error al eliminar: ${error.message || 'Error desconocido'}`);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo_examen: '',
      area: '',
      fecha_realizacion: '',
      entidad_realiza: '',
      medico_tratante: '',
      resultado: 'pendiente',
      observaciones: '',
      fecha_vencimiento: '',
      archivo_url: ''
    });
    setEditingExamen(null);
    setMensaje('');
  };

  const isVencido = (fechaVencimiento) => {
    if (!fechaVencimiento) return false;
    return new Date(fechaVencimiento) < new Date();
  };

  const isProximoVencer = (fechaVencimiento) => {
    if (!fechaVencimiento) return false;
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diasRestantes = (vencimiento - hoy) / (1000 * 60 * 60 * 24);
    return diasRestantes > 0 && diasRestantes <= 30;
  };

  const getResultadoLabel = (resultado) => {
    const labels = {
      'pendiente': 'Pendiente',
      'apto': 'Apto',
      'no_apto': 'No Apto', 
      'apto_con_restricciones': 'Apto con Restricciones'
    };
    return labels[resultado] || resultado;
  };

  const getResultadoColor = (resultado) => {
    const colors = {
      'pendiente': { bg: '#fef3c7', color: '#92400e' },
      'apto': { bg: '#d1fae5', color: '#065f46' },
      'no_apto': { bg: '#fee2e2', color: '#991b1b' },
      'apto_con_restricciones': { bg: '#fef3c7', color: '#92400e' }
    };
    return colors[resultado] || { bg: '#f3f4f6', color: '#374151' };
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <div>Cargando exámenes médicos...</div>
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
            Exámenes Médicos SST
          </h1>
          <p style={{
            color: '#64748b',
            margin: 0
          }}>
            Gestión de exámenes médicos ocupacionales según normativa colombiana
          </p>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
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
            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
          }}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
        >
          <Icon name="Plus" size={18} />
          {showForm ? 'Cancelar' : 'Nuevo Examen'}
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
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              padding: '10px',
              borderRadius: '8px'
            }}>
              <Icon name="Heart" size={20} color="white" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Total</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
                {examenes.length}
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
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Aptos</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
                {examenes.filter(e => e.resultado === 'apto').length}
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
                {examenes.filter(e => isProximoVencer(e.fecha_vencimiento)).length}
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
              background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              padding: '10px',
              borderRadius: '8px'
            }}>
              <Icon name="Clock" size={20} color="white" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Pendientes</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
                {examenes.filter(e => e.resultado === 'pendiente').length}
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
            {editingExamen ? 'Editar Examen Médico' : 'Nuevo Examen Médico'}
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
                  Tipo de Examen *
                </label>
                <select
                  value={formData.tipo_examen}
                  onChange={(e) => setFormData({...formData, tipo_examen: e.target.value})}
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
                  {tiposExamen.map(tipo => (
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
                  Entidad que Realiza
                </label>
                <select
                  value={formData.entidad_realiza}
                  onChange={(e) => setFormData({...formData, entidad_realiza: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Seleccionar entidad</option>
                  {entidadesMedicas.map(entidad => (
                    <option key={entidad} value={entidad}>{entidad}</option>
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
                  Médico Tratante
                </label>
                <input
                  type="text"
                  value={formData.medico_tratante}
                  onChange={(e) => setFormData({...formData, medico_tratante: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  placeholder="Nombre del médico"
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
                  Resultado
                </label>
                <select
                  value={formData.resultado}
                  onChange={(e) => setFormData({...formData, resultado: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  {resultadosPosibles.map(resultado => (
                    <option key={resultado} value={resultado}>
                      {getResultadoLabel(resultado)}
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
                  URL del Archivo
                </label>
                <input
                  type="url"
                  value={formData.archivo_url}
                  onChange={(e) => setFormData({...formData, archivo_url: e.target.value})}
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
                Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
                placeholder="Observaciones sobre el examen médico..."
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
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                {editingExamen ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Exámenes */}
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
            Historial de Exámenes ({examenes.length})
          </h3>
        </div>

        {examenes.length === 0 ? (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <Icon name="Heart" size={48} color="#cbd5e1" />
            <p style={{ marginTop: '16px', fontSize: '16px' }}>
              No hay exámenes médicos registrados
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
              Haga clic en "Nuevo Examen" para comenzar
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Examen
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Área
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Fecha
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Resultado
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Vencimiento
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {examenes.map((examen, index) => {
                  const vencido = isVencido(examen.fecha_vencimiento);
                  const proximoVencer = isProximoVencer(examen.fecha_vencimiento);
                  const resultadoColor = getResultadoColor(examen.resultado);
                  
                  return (
                    <tr 
                      key={examen.id} 
                      style={{
                        borderBottom: index < examenes.length - 1 ? '1px solid #f1f5f9' : 'none',
                        background: vencido ? '#fef2f2' : proximoVencer ? '#fffbeb' : 'white'
                      }}
                    >
                      <td style={{ padding: '16px' }}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#1e293b', marginBottom: '4px' }}>
                            {examen.tipo_examen}
                          </div>
                          {examen.entidad_realiza && (
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              {examen.entidad_realiza}
                            </div>
                          )}
                          {examen.medico_tratante && (
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              Dr. {examen.medico_tratante}
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
                          background: examen.area === 'Centro Industrial' ? '#fef3c7' : '#fee2e2',
                          color: examen.area === 'Centro Industrial' ? '#92400e' : '#991b1b'
                        }}>
                          {examen.area === 'Centro Industrial' ? '🏭 Centro Industrial' : '🔥 Hornos Solera'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#374151', fontSize: '14px' }}>
                        {examen.fecha_realizacion ? 
                          new Date(examen.fecha_realizacion).toLocaleDateString('es-ES') : 
                          '-'
                        }
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: resultadoColor.bg,
                          color: resultadoColor.color
                        }}>
                          {getResultadoLabel(examen.resultado)}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#374151', fontSize: '14px' }}>
                        {examen.fecha_vencimiento ? 
                          new Date(examen.fecha_vencimiento).toLocaleDateString('es-ES') : 
                          'Sin vencimiento'
                        }
                        {vencido && <span style={{ color: '#dc2626', marginLeft: '8px' }}>⚠️</span>}
                        {proximoVencer && <span style={{ color: '#d97706', marginLeft: '8px' }}>⏰</span>}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {examen.archivo_url && (
                            <button
                              onClick={() => window.open(examen.archivo_url, '_blank')}
                              style={{
                                padding: '6px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                background: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Ver archivo"
                            >
                              <Icon name="ExternalLink" size={14} color="#6b7280" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleEdit(examen)}
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
                            onClick={() => handleDelete(examen.id, examen.tipo_examen)}
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

export default ExamenesMedicosMain;