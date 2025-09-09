import React, { useState, useEffect } from 'react';
import { dbHelpers } from '../../services/supabase';
import { Icon } from '../common/Icons';

const ReportesLegalesMain = () => {
  const [reportes, setReportes] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReporte, setEditingReporte] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [activeTab, setActiveTab] = useState('reportes');

  const [formData, setFormData] = useState({
    tipo_reporte: '',
    periodo: '',
    fecha_inicio: '',
    fecha_fin: '',
    area: '',
    datos_reporte: {},
    indicadores: {},
    observaciones: '',
    conclusiones: '',
    recomendaciones: '',
    estado: 'borrador',
    archivo_url: ''
  });

  const tiposReporte = [
    'Mensual Accidentalidad',
    'Trimestral Estadísticas', 
    'Anual Gestión SST',
    'Indicadores Cumplimiento',
    'Reporte ARL',
    'Matriz Legal',
    'Plan Trabajo Anual',
    'Evaluación SG-SST'
  ];

  const areas = [
    'Centro Industrial',
    'Hornos Solera',
    'Ambas',
    'General'
  ];

  const estados = [
    'borrador',
    'revision',
    'aprobado',
    'enviado'
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const [reportesData, plantillasData] = await Promise.all([
        dbHelpers.getAll('reportes_legales_sst', {
          orderBy: 'created_at',
          ascending: false
        }),
        dbHelpers.getAll('plantillas_reportes_sst', {
          orderBy: 'nombre',
          ascending: true,
          filters: { activa: true }
        })
      ]);

      setReportes(reportesData || []);
      setPlantillas(plantillasData || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setMensaje('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.tipo_reporte || !formData.periodo || 
        !formData.fecha_inicio || !formData.fecha_fin) {
      setMensaje('Por favor complete los campos obligatorios');
      return;
    }

    // Validar fechas
    const fechaInicio = new Date(formData.fecha_inicio);
    const fechaFin = new Date(formData.fecha_fin);
    
    if (fechaFin < fechaInicio) {
      setMensaje('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        datos_reporte: typeof formData.datos_reporte === 'string' ? 
          JSON.parse(formData.datos_reporte || '{}') : formData.datos_reporte,
        indicadores: typeof formData.indicadores === 'string' ? 
          JSON.parse(formData.indicadores || '{}') : formData.indicadores,
        created_at: editingReporte ? undefined : new Date().toISOString()
      };

      if (editingReporte) {
        await dbHelpers.update('reportes_legales_sst', editingReporte.id, dataToSave);
        setMensaje('Reporte actualizado exitosamente');
      } else {
        await dbHelpers.create('reportes_legales_sst', dataToSave);
        setMensaje('Reporte creado exitosamente');
      }

      resetForm();
      setShowForm(false);
      setEditingReporte(null);
      cargarDatos();

      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error guardando reporte:', error);
      setMensaje('Error al guardar el reporte');
    }
  };

  const editarReporte = (reporte) => {
    setFormData({
      tipo_reporte: reporte.tipo_reporte || '',
      periodo: reporte.periodo || '',
      fecha_inicio: reporte.fecha_inicio || '',
      fecha_fin: reporte.fecha_fin || '',
      area: reporte.area || '',
      datos_reporte: typeof reporte.datos_reporte === 'object' ? 
        JSON.stringify(reporte.datos_reporte, null, 2) : (reporte.datos_reporte || '{}'),
      indicadores: typeof reporte.indicadores === 'object' ? 
        JSON.stringify(reporte.indicadores, null, 2) : (reporte.indicadores || '{}'),
      observaciones: reporte.observaciones || '',
      conclusiones: reporte.conclusiones || '',
      recomendaciones: reporte.recomendaciones || '',
      estado: reporte.estado || 'borrador',
      archivo_url: reporte.archivo_url || ''
    });
    setEditingReporte(reporte);
    setShowForm(true);
  };

  const eliminarReporte = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este reporte?')) {
      try {
        await dbHelpers.delete('reportes_legales_sst', id);
        setMensaje('Reporte eliminado exitosamente');
        cargarDatos();
        setTimeout(() => setMensaje(''), 3000);
      } catch (error) {
        console.error('Error eliminando reporte:', error);
        setMensaje('Error al eliminar el reporte');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      tipo_reporte: '',
      periodo: '',
      fecha_inicio: '',
      fecha_fin: '',
      area: '',
      datos_reporte: {},
      indicadores: {},
      observaciones: '',
      conclusiones: '',
      recomendaciones: '',
      estado: 'borrador',
      archivo_url: ''
    });
  };

  const cancelarForm = () => {
    setShowForm(false);
    setEditingReporte(null);
    resetForm();
    setMensaje('');
  };

  const generarReporteRapido = (tipo) => {
    const fechaActual = new Date();
    let periodo = '';
    let fechaInicio = '';
    let fechaFin = '';

    switch (tipo) {
      case 'Mensual Accidentalidad':
        const mesActual = fechaActual.getMonth();
        const añoActual = fechaActual.getFullYear();
        periodo = `${añoActual}-${(mesActual + 1).toString().padStart(2, '0')}`;
        fechaInicio = new Date(añoActual, mesActual, 1).toISOString().split('T')[0];
        fechaFin = new Date(añoActual, mesActual + 1, 0).toISOString().split('T')[0];
        break;
      case 'Trimestral Estadísticas':
        const trimestre = Math.ceil((fechaActual.getMonth() + 1) / 3);
        periodo = `${fechaActual.getFullYear()}-Q${trimestre}`;
        const mesInicioTrim = (trimestre - 1) * 3;
        fechaInicio = new Date(fechaActual.getFullYear(), mesInicioTrim, 1).toISOString().split('T')[0];
        fechaFin = new Date(fechaActual.getFullYear(), mesInicioTrim + 3, 0).toISOString().split('T')[0];
        break;
      case 'Anual Gestión SST':
        periodo = `${fechaActual.getFullYear()}`;
        fechaInicio = `${fechaActual.getFullYear()}-01-01`;
        fechaFin = `${fechaActual.getFullYear()}-12-31`;
        break;
      default:
        periodo = fechaActual.toISOString().split('T')[0];
        fechaInicio = fechaActual.toISOString().split('T')[0];
        fechaFin = fechaActual.toISOString().split('T')[0];
    }

    setFormData({
      ...formData,
      tipo_reporte: tipo,
      periodo,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      area: 'General'
    });
    setShowForm(true);
  };

  // Estadísticas
  const reportesBorrador = reportes.filter(r => r.estado === 'borrador').length;
  const reportesAprobados = reportes.filter(r => r.estado === 'aprobado').length;
  const reportesEnviados = reportes.filter(r => r.estado === 'enviado').length;
  const reportesEsteAno = reportes.filter(r => {
    const fechaReporte = new Date(r.fecha_inicio);
    return fechaReporte.getFullYear() === new Date().getFullYear();
  }).length;

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
            Reportes Legales SST
          </h1>
          <p style={{ 
            color: '#64748b', 
            margin: 0,
            fontSize: '1rem'
          }}>
            Generación y gestión de reportes para cumplimiento normativo SST
          </p>
        </div>
        
        <button
          onClick={() => {
            setShowForm(true);
            resetForm();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#7c3aed',
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
          Nuevo Reporte
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
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#6b7280' }}>
            {reportesEsteAno}
          </div>
          <div style={{ color: '#374151', fontWeight: '600' }}>Reportes {new Date().getFullYear()}</div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
            {reportesBorrador}
          </div>
          <div style={{ color: '#374151', fontWeight: '600' }}>En Borrador</div>
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
            {reportesAprobados}
          </div>
          <div style={{ color: '#374151', fontWeight: '600' }}>Aprobados</div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>
            {reportesEnviados}
          </div>
          <div style={{ color: '#374151', fontWeight: '600' }}>Enviados</div>
        </div>
      </div>

      {/* Botones de Reportes Rápidos */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        marginBottom: '30px'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#1e293b',
          marginBottom: '16px'
        }}>
          Generar Reporte Rápido
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          <button
            onClick={() => generarReporteRapido('Mensual Accidentalidad')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              background: 'white',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '14px'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#f8fafc';
              e.target.style.borderColor = '#3b82f6';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e2e8f0';
            }}
          >
            <Icon name="FileText" size={16} />
            Reporte Mensual
          </button>

          <button
            onClick={() => generarReporteRapido('Trimestral Estadísticas')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              background: 'white',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '14px'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#f8fafc';
              e.target.style.borderColor = '#3b82f6';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e2e8f0';
            }}
          >
            <Icon name="BarChart" size={16} />
            Reporte Trimestral
          </button>

          <button
            onClick={() => generarReporteRapido('Anual Gestión SST')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              background: 'white',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '14px'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#f8fafc';
              e.target.style.borderColor = '#3b82f6';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e2e8f0';
            }}
          >
            <Icon name="TrendingUp" size={16} />
            Reporte Anual
          </button>

          <button
            onClick={() => generarReporteRapido('Indicadores Cumplimiento')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              background: 'white',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '14px'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#f8fafc';
              e.target.style.borderColor = '#3b82f6';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e2e8f0';
            }}
          >
            <Icon name="CheckCircle" size={16} />
            Indicadores
          </button>
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
            {editingReporte ? 'Editar Reporte Legal' : 'Nuevo Reporte Legal SST'}
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
                  Tipo de Reporte *
                </label>
                <select
                  value={formData.tipo_reporte}
                  onChange={(e) => setFormData({...formData, tipo_reporte: e.target.value})}
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
                  {tiposReporte.map(tipo => (
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
                  Período *
                </label>
                <input
                  type="text"
                  value={formData.periodo}
                  onChange={(e) => setFormData({...formData, periodo: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  placeholder="2024-01 / 2024-Q1 / 2024"
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
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
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
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
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
                  Área
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
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({...formData, estado: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  {estados.map(estado => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
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
                  Datos del Reporte (JSON)
                </label>
                <textarea
                  value={typeof formData.datos_reporte === 'string' ? formData.datos_reporte : JSON.stringify(formData.datos_reporte, null, 2)}
                  onChange={(e) => setFormData({...formData, datos_reporte: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '120px',
                    resize: 'vertical',
                    fontFamily: 'monospace'
                  }}
                  placeholder='{"total_trabajadores": 100, "horas_trabajadas": 176000}'
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
                  Indicadores (JSON)
                </label>
                <textarea
                  value={typeof formData.indicadores === 'string' ? formData.indicadores : JSON.stringify(formData.indicadores, null, 2)}
                  onChange={(e) => setFormData({...formData, indicadores: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '120px',
                    resize: 'vertical',
                    fontFamily: 'monospace'
                  }}
                  placeholder='{"indice_frecuencia": 2.5, "indice_severidad": 45.2}'
                />
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
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
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Observaciones relevantes del período..."
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
                  Conclusiones
                </label>
                <textarea
                  value={formData.conclusiones}
                  onChange={(e) => setFormData({...formData, conclusiones: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Conclusiones del análisis..."
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
                  Recomendaciones
                </label>
                <textarea
                  value={formData.recomendaciones}
                  onChange={(e) => setFormData({...formData, recomendaciones: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Recomendaciones y plan de acción..."
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
                placeholder="https://drive.google.com/..."
              />
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
                  background: '#7c3aed',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {editingReporte ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Reportes */}
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
            Reportes Legales Registrados
          </h3>
        </div>

        {reportes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.3 }}>📊</div>
            <h3 style={{ color: '#6b7280', marginBottom: '8px' }}>No hay reportes registrados</h3>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>
              Comience creando su primer reporte legal SST
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px', borderBottom: '1px solid #e2e8f0' }}>
                    Reporte
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px', borderBottom: '1px solid #e2e8f0' }}>
                    Período
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px', borderBottom: '1px solid #e2e8f0' }}>
                    Área
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
                {reportes.map((reporte) => (
                  <tr key={reporte.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px', color: '#374151', fontSize: '14px' }}>
                      <div>
                        <div style={{ fontWeight: '500', color: '#1e293b' }}>
                          {reporte.tipo_reporte}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {reporte.fecha_inicio} - {reporte.fecha_fin}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: '#374151', fontSize: '14px' }}>
                      {reporte.periodo}
                    </td>
                    <td style={{ padding: '16px', color: '#374151', fontSize: '14px' }}>
                      {reporte.area || 'No especificada'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: reporte.estado === 'enviado' ? '#f0fdf4' : 
                                   reporte.estado === 'aprobado' ? '#eff6ff' :
                                   reporte.estado === 'revision' ? '#fef3c7' : '#f3f4f6',
                        color: reporte.estado === 'enviado' ? '#166534' : 
                               reporte.estado === 'aprobado' ? '#2563eb' :
                               reporte.estado === 'revision' ? '#92400e' : '#374151',
                        border: `1px solid ${reporte.estado === 'enviado' ? '#bbf7d0' : 
                                            reporte.estado === 'aprobado' ? '#c7d2fe' :
                                            reporte.estado === 'revision' ? '#fcd34d' : '#d1d5db'}`
                      }}>
                        {reporte.estado}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {reporte.archivo_url && (
                          <a
                            href={reporte.archivo_url}
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
                            title="Ver archivo"
                          >
                            <Icon name="ExternalLink" size={14} />
                          </a>
                        )}
                        <button
                          onClick={() => editarReporte(reporte)}
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
                          title="Editar reporte"
                        >
                          <Icon name="Edit" size={14} />
                        </button>
                        <button
                          onClick={() => eliminarReporte(reporte.id)}
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
                          title="Eliminar reporte"
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
    </div>
  );
};

export default ReportesLegalesMain;