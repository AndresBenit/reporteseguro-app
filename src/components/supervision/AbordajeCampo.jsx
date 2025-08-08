import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

const AbordajeCampo = () => {
  const [form, setForm] = useState({
    colaboradorId: '',
    colaboradorNombre: '',
    colaboradorArea: '',
    lugarLabor: '',
    hallazgo: '',
    abordaje: ''
  });
  
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  
  // Estados para autocompletado
  const [searchTerm, setSearchTerm] = useState('');
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [colaboradoresFiltrados, setColaboradoresFiltrados] = useState([]);

  // Cargar colaboradores
  useEffect(() => {
    const colaboradoresRef = collection(db, 'colaboradores');
    const unsubscribe = onSnapshot(colaboradoresRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setColaboradores(data.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    });
    return () => unsubscribe();
  }, []);

  // Filtrar colaboradores para autocompletado
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setColaboradoresFiltrados([]);
      setShowSugerencias(false);
    } else {
      const filtrados = colaboradores
        .filter(col => 
          col.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          col.cedula.includes(searchTerm)
        )
        .slice(0, 8); // Mostrar máximo 8 sugerencias
      setColaboradoresFiltrados(filtrados);
      setShowSugerencias(filtrados.length > 0);
    }
  }, [searchTerm, colaboradores]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Manejar búsqueda de colaborador
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Si borra el texto, limpiar selección
    if (value === '') {
      setForm({
        ...form,
        colaboradorId: '',
        colaboradorNombre: '',
        colaboradorArea: ''
      });
    }
  };

  // Seleccionar colaborador de sugerencias
  const seleccionarColaborador = (colaborador) => {
    setForm({
      ...form,
      colaboradorId: colaborador.id,
      colaboradorNombre: colaborador.nombre,
      colaboradorArea: colaborador.area
    });
    setSearchTerm(colaborador.nombre);
    setShowSugerencias(false);
  };

  // Cerrar sugerencias al hacer click fuera
  const handleBlurColaborador = () => {
    setTimeout(() => setShowSugerencias(false), 200);
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.colaboradorId || !form.lugarLabor.trim() || !form.hallazgo.trim() || !form.abordaje.trim()) {
      setMensaje('❌ Por favor completa todos los campos obligatorios');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }

    setLoading(true);
    try {
      // Guardar abordaje
      const abordajeData = {
        fecha: serverTimestamp(),
        colaborador: {
          id: form.colaboradorId,
          nombre: form.colaboradorNombre,
          area: form.colaboradorArea
        },
        lugarLabor: form.lugarLabor.trim(),
        hallazgo: form.hallazgo.trim(),
        abordaje: form.abordaje.trim()
      };

      await addDoc(collection(db, 'reportes'), {
        ...abordajeData,
        tipo: 'Nuevo Abordaje en Campo',
        tipoReporte: 'abordaje',
        descripcion: form.hallazgo.trim(),
        abordaje: form.abordaje.trim(),
        reportante: form.colaboradorNombre,
        area: form.colaboradorArea,
        estado: 'pendiente'
      });
      
      // Limpiar formulario
      setForm({
        colaboradorId: '',
        colaboradorNombre: '',
        colaboradorArea: '',
        lugarLabor: '',
        hallazgo: '',
        abordaje: ''
      });
      setSearchTerm('');
      setShowSugerencias(false);
      
      setMensaje('✅ ¡Abordaje registrado exitosamente!');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error guardando abordaje:', error);
      setMensaje('❌ Error al guardar el abordaje. Intenta nuevamente.');
      setTimeout(() => setMensaje(''), 3000);
    }
    setLoading(false);
  };

  const lugaresComunes = [
    'Hornos',
    'Oficina administrativa',
    'Patio de almacenamiento',
    'Laboratorio',
    'Taller de mantenimiento',
    'Central de mezclas',
    'Central de cribado',
    'Área de carga y descarga',
    'Comedor',
    'Estacionamiento'
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }} className="mobile-container">
      {/* Botón de volver */}
      <button 
        onClick={() => window.history.back()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 20px',
          background: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '20px',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
        onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
      >
        ← Volver
      </button>
      {/* Header */}
      <div style={{ marginBottom: '30px' }} className="mobile-header">
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700', 
          color: '#1f2937',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          👨‍💼 Abordaje en Campo
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          Registro de abordajes y seguimiento de seguridad
        </p>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: mensaje.includes('✅') ? '#d1fae5' : mensaje.includes('🔄') ? '#f0f9ff' : '#fef2f2',
          color: mensaje.includes('✅') ? '#059669' : mensaje.includes('🔄') ? '#0369a1' : '#dc2626',
          border: `1px solid ${mensaje.includes('✅') ? '#a7f3d0' : mensaje.includes('🔄') ? '#93c5fd' : '#fecaca'}`,
          marginBottom: '20px',
          fontWeight: '600',
          textAlign: 'center'
        }}>
          {mensaje}
        </div>
      )}

      {/* Formulario */}
      <div className="card" style={{ padding: '30px' }}>
        <h2 style={{ marginBottom: '25px', color: '#1f2937' }}>
          📝 Nuevo Abordaje en Campo
        </h2>
        
        <form onSubmit={handleSubmit}>
          {/* Fecha */}
          <div className="form-group">
            <label className="form-label">📅 Fecha</label>
            <input
              type="text"
              value={new Date().toLocaleDateString('es-ES', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
              disabled
              className="form-input"
              style={{ background: '#f3f4f6', color: '#6b7280' }}
            />
          </div>

          {/* Colaborador con Autocompletado */}
          <div className="form-group">
            <label className="form-label">👤 Colaborador *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Escribe el nombre del colaborador..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => searchTerm && setShowSugerencias(colaboradoresFiltrados.length > 0)}
                onBlur={handleBlurColaborador}
                className="form-input"
                required
                style={{
                  width: '100%',
                  borderColor: form.colaboradorId ? '#10b981' : '#d1d5db',
                  backgroundColor: form.colaboradorId ? '#f0fdf4' : 'white'
                }}
              />
              
              {/* Indicador de selección */}
              {form.colaboradorId && (
                <div style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#10b981',
                  fontSize: '1.2rem'
                }}>
                  ✓
                </div>
              )}
              
              {/* Lista de sugerencias */}
              {showSugerencias && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {colaboradoresFiltrados.map(colaborador => (
                    <div
                      key={colaborador.id}
                      onClick={() => seleccionarColaborador(colaborador)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background-color 0.2s ease',
                        ':hover': { backgroundColor: '#f9fafb' }
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      <div>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>
                          {colaborador.nombre}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                          {colaborador.cedula} • {colaborador.area}
                        </div>
                      </div>
                      <div style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        backgroundColor: colaborador.area === 'Centro Industrial' ? '#fef3c7' : '#fee2e2',
                        color: colaborador.area === 'Centro Industrial' ? '#92400e' : '#991b1b'
                      }}>
                        {colaborador.area === 'Centro Industrial' ? 'CI' : 'HS'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Información del colaborador seleccionado */}
            {form.colaboradorId && (
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                fontSize: '0.85rem'
              }}>
                <strong>{form.colaboradorNombre}</strong> - {form.colaboradorArea}
              </div>
            )}
          </div>

          {/* Lugar de Labor */}
          <div className="form-group">
            <label className="form-label">📍 Lugar de Labor *</label>
            <input
              type="text"
              name="lugarLabor"
              placeholder="Ej: Hornos, Oficina, Patio..."
              value={form.lugarLabor}
              onChange={handleChange}
              className="form-input"
              required
              list="lugares-comunes"
            />
            <datalist id="lugares-comunes">
              {lugaresComunes.map(lugar => (
                <option key={lugar} value={lugar} />
              ))}
            </datalist>
          </div>

          {/* Hallazgo */}
          <div className="form-group">
            <label className="form-label">🔍 Hallazgo *</label>
            <textarea
              name="hallazgo"
              placeholder="Describe detalladamente lo observado (condición insegura, acto inseguro, etc.)"
              value={form.hallazgo}
              onChange={handleChange}
              className="form-textarea"
              required
              style={{ minHeight: '100px' }}
            />
          </div>

          {/* Abordaje */}
          <div className="form-group">
            <label className="form-label">💡 Abordaje Realizado *</label>
            <textarea
              name="abordaje"
              placeholder="Describe el abordaje realizado con el colaborador"
              value={form.abordaje}
              onChange={handleChange}
              className="form-textarea"
              required
              style={{ minHeight: '100px' }}
            />
          </div>

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              fontSize: '1rem',
              padding: '14px 24px',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? '#9ca3af' : '#3b82f6'
            }}
          >
            {loading ? (
              <>
                <span className="pulse">⏳</span>
                Guardando abordaje...
              </>
            ) : (
              <>
                💾 Registrar Abordaje
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AbordajeCampo;