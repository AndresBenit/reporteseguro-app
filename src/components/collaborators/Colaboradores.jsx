import React, { useState, useEffect } from 'react';
import { useColaboradores } from '../../hooks/useColaboradores';
import ExcelUploader from './ExcelUploader';

const Colaboradores = () => {
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, activos: 0, centroIndustrial: 0, hornosSolera: 0 });
  const [filtroArea, setFiltroArea] = useState('TODOS');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [showExcelUploader, setShowExcelUploader] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Formulario para nuevo colaborador
  const [newColaborador, setNewColaborador] = useState({
    nombre: '',
    cedula: '',
    area: 'Centro Industrial'
  });
  const [addingColaborador, setAddingColaborador] = useState(false);

  useEffect(() => {
    loadColaboradores();
  }, []);

  const loadColaboradores = () => {
    const colaboradoresRef = collection(db, 'colaboradores');
    const q = query(colaboradoresRef, orderBy('nombre', 'asc'));
    
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        try {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
          setColaboradores(data);
          calculateStats(data);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error('Error procesando colaboradores:', err);
          setError('Error al procesar los datos de colaboradores');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error obteniendo colaboradores:', err);
        setError('Error conectando con la base de datos');
        setLoading(false);
      }
    );
    
    return () => unsub();
  };

  const calculateStats = (data) => {
    const stats = {
      total: data.length,
      activos: data.filter(c => c.activo !== false).length,
      centroIndustrial: data.filter(c => c.area === 'Centro Industrial').length,
      hornosSolera: data.filter(c => c.area === 'Hornos Solera').length
    };
    setStats(stats);
  };

  const handleAddColaborador = async (e) => {
    e.preventDefault();
    
    if (!newColaborador.nombre.trim() || !newColaborador.cedula.trim()) {
      setMensaje('❌ Por favor completa todos los campos');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }

    setAddingColaborador(true);
    
    try {
      // Verificar si ya existe
      const colaboradoresRef = collection(db, 'colaboradores');
      const q = query(colaboradoresRef, where("cedula", "==", newColaborador.cedula.trim()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setMensaje('❌ Ya existe un colaborador con esta cédula');
        setTimeout(() => setMensaje(''), 3000);
        setAddingColaborador(false);
        return;
      }

      // Agregar nuevo colaborador
      await addDoc(colaboradoresRef, {
        nombre: newColaborador.nombre.trim(),
        cedula: newColaborador.cedula.trim(),
        area: newColaborador.area,
        departamento: newColaborador.area,
        activo: true,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
        tipoColaborador: 'Operativo',
        fuenteDatos: 'Manual'
      });

      setMensaje('✅ Colaborador agregado exitosamente');
      setNewColaborador({ nombre: '', cedula: '', area: 'Centro Industrial' });
      setShowAddForm(false);
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error agregando colaborador:', error);
      setMensaje('❌ Error al agregar colaborador');
      setTimeout(() => setMensaje(''), 3000);
    } finally {
      setAddingColaborador(false);
    }
  };

  const handleToggleActivo = async (colaboradorId, nuevoEstado) => {
    try {
      const colaboradorRef = doc(db, 'colaboradores', colaboradorId);
      await updateDoc(colaboradorRef, {
        activo: nuevoEstado,
        fechaActualizacion: serverTimestamp()
      });
      
      setMensaje(`✅ Colaborador ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`);
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error actualizando colaborador:', error);
      setMensaje(`❌ Error actualizando colaborador`);
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  // Filtrar colaboradores
  const colaboradoresFiltrados = colaboradores.filter(colaborador => {
    const cumpleFiltroArea = filtroArea === 'TODOS' || colaborador.area === filtroArea;
    const cumpleBusqueda = 
      colaborador.nombre?.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      colaborador.cedula?.includes(filtroBusqueda);
    return cumpleFiltroArea && cumpleBusqueda;
  });

  if (loading) {
    return (
      <div style={{
        minHeight: "50vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          textAlign: "center",
          padding: "40px"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "20px" }} className="pulse">👥</div>
          <h2 style={{ color: "#374151", marginBottom: "10px" }}>Cargando Colaboradores</h2>
          <p style={{ color: "#6b7280" }}>Conectando con Firebase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: "50vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}>
        <div style={{
          textAlign: "center",
          padding: "40px",
          background: "white",
          borderRadius: "20px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
          border: "1px solid #fecaca",
          maxWidth: "450px",
          width: "100%"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "20px" }}>⚠️</div>
          <h2 style={{ color: "#dc2626", marginBottom: "15px" }}>Error de Conexión</h2>
          <p style={{ color: "#6b7280", marginBottom: "20px" }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        flexDirection: window.innerWidth <= 768 ? "column" : "row",
        justifyContent: "space-between",
        alignItems: window.innerWidth <= 768 ? "flex-start" : "center",
        marginBottom: "30px",
        gap: "20px"
      }}>
        <div>
          <h1 style={{ 
            fontSize: window.innerWidth <= 768 ? "2rem" : "2.5rem", 
            fontWeight: "700", 
            color: "#1f2937",
            marginBottom: "8px"
          }}>
            👥 Gestión de Colaboradores
          </h1>
          <p style={{ color: "#6b7280", fontSize: "1rem" }}>
            Administra la base de datos de colaboradores por área
          </p>
        </div>
        
        <div style={{
          display: "flex",
          flexDirection: window.innerWidth <= 480 ? "column" : "row",
          gap: "12px",
          width: window.innerWidth <= 768 ? "100%" : "auto"
        }}>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary"
            style={{
              padding: "12px 20px",
              fontSize: "0.9rem",
              fontWeight: "600",
              whiteSpace: "nowrap",
              width: window.innerWidth <= 480 ? "100%" : "auto"
            }}
          >
            ➕ Agregar Individual
          </button>
          
          <button
            onClick={() => setShowExcelUploader(true)}
            className="btn"
            style={{
              padding: "12px 20px",
              fontSize: "0.9rem",
              fontWeight: "600",
              background: "#10b981",
              color: "white",
              border: "none",
              whiteSpace: "nowrap",
              width: window.innerWidth <= 480 ? "100%" : "auto"
            }}
          >
            📊 Subir Excel
          </button>
        </div>
      </div>

      {/* Mensaje de estado */}
      {mensaje && (
        <div style={{
          padding: "16px 20px",
          borderRadius: "12px",
          background: mensaje.includes('✅') ? "#d1fae5" : "#fef2f2",
          color: mensaje.includes('✅') ? "#065f46" : "#991b1b",
          border: `1px solid ${mensaje.includes('✅') ? "#a7f3d0" : "#fecaca"}`,
          marginBottom: "20px",
          whiteSpace: "pre-line",
          fontWeight: "600"
        }}>
          {mensaje}
        </div>
      )}

      {/* Estadísticas */}
      <div style={{
        display: "grid",
        gridTemplateColumns: window.innerWidth <= 768 
          ? "repeat(2, 1fr)" 
          : "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        marginBottom: "30px"
      }}>
        <div className="card" style={{ 
          padding: "20px", 
          textAlign: "center",
          borderLeft: "4px solid #3b82f6"
        }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "700", color: "#3b82f6" }}>
            {stats.total}
          </div>
          <div style={{ color: "#374151", fontWeight: "600", fontSize: "0.9rem" }}>Total Colaboradores</div>
        </div>
        
        <div className="card" style={{ 
          padding: "20px", 
          textAlign: "center",
          borderLeft: "4px solid #10b981"
        }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "700", color: "#10b981" }}>
            {stats.activos}
          </div>
          <div style={{ color: "#374151", fontWeight: "600", fontSize: "0.9rem" }}>Activos</div>
        </div>
        
        <div className="card" style={{ 
          padding: "20px", 
          textAlign: "center",
          borderLeft: "4px solid #f59e0b"
        }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "700", color: "#f59e0b" }}>
            {stats.centroIndustrial}
          </div>
          <div style={{ color: "#374151", fontWeight: "600", fontSize: "0.9rem" }}>Centro Industrial</div>
        </div>
        
        <div className="card" style={{ 
          padding: "20px", 
          textAlign: "center",
          borderLeft: "4px solid #ef4444"
        }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "700", color: "#ef4444" }}>
            {stats.hornosSolera}
          </div>
          <div style={{ color: "#374151", fontWeight: "600", fontSize: "0.9rem" }}>Hornos Solera</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: window.innerWidth <= 768 
            ? "1fr" 
            : "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "16px"
        }}>
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontWeight: "600",
              color: "#374151"
            }}>
              🔍 Buscar Colaborador
            </label>
            <input
              type="text"
              placeholder="Nombre o cédula..."
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
              className="form-input"
              style={{ width: "100%" }}
            />
          </div>
          
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontWeight: "600",
              color: "#374151"
            }}>
              🏢 Filtrar por Área
            </label>
            <select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              className="form-select"
              style={{ width: "100%" }}
            >
              <option value="TODOS">Todas las Áreas</option>
              <option value="Centro Industrial">Centro Industrial</option>
              <option value="Hornos Solera">Hornos Solera</option>
            </select>
          </div>
          
          {window.innerWidth > 768 && (
            <div style={{ display: "flex", alignItems: "end" }}>
              <button
                onClick={() => {
                  setFiltroBusqueda('');
                  setFiltroArea('TODOS');
                }}
                className="btn"
                style={{
                  background: "#6b7280",
                  color: "white",
                  width: "100%",
                  padding: "10px"
                }}
              >
                🔄 Limpiar Filtros
              </button>
            </div>
          )}
        </div>
        
        {window.innerWidth <= 768 && (
          <button
            onClick={() => {
              setFiltroBusqueda('');
              setFiltroArea('TODOS');
            }}
            className="btn"
            style={{
              background: "#6b7280",
              color: "white",
              width: "100%",
              padding: "10px",
              marginTop: "16px"
            }}
          >
            🔄 Limpiar Filtros
          </button>
        )}
      </div>

      {/* Lista de colaboradores */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{
          padding: "20px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <h2 style={{ margin: 0, color: "#1f2937", fontSize: window.innerWidth <= 768 ? "1.3rem" : "1.5rem" }}>
            📋 Lista de Colaboradores ({colaboradoresFiltrados.length})
          </h2>
        </div>
        
        {colaboradoresFiltrados.length === 0 ? (
          <div style={{
            padding: "60px 20px",
            textAlign: "center",
            color: "#6b7280"
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "20px", opacity: 0.5 }}>👤</div>
            <h3 style={{ marginBottom: "10px" }}>No se encontraron colaboradores</h3>
            <p>Intenta ajustar los filtros o agrega nuevos colaboradores</p>
          </div>
        ) : (
          <div style={{ padding: "20px" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: window.innerWidth <= 480 
                ? "1fr" 
                : window.innerWidth <= 768
                  ? "repeat(2, 1fr)"
                  : "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "16px"
            }}>
              {colaboradoresFiltrados.map((colaborador) => (
                <div key={colaborador.id} style={{
                  padding: "16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  background: "#f9fafb",
                  transition: "all 0.3s ease"
                }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "start",
                    marginBottom: "8px"
                  }}>
                    <div style={{ 
                      fontWeight: "600", 
                      color: "#1f2937", 
                      fontSize: "0.95rem",
                      flex: 1,
                      marginRight: "8px"
                    }}>
                      {colaborador.nombre}
                    </div>
                    <span style={{
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "0.7rem",
                      fontWeight: "600",
                      background: colaborador.activo !== false ? '#d1fae5' : '#f3f4f6',
                      color: colaborador.activo !== false ? '#065f46' : '#374151',
                      flexShrink: 0
                    }}>
                      {colaborador.activo !== false ? '✅' : '⏸️'}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "8px" }}>
                    📧 {colaborador.cedula}
                  </div>
                  
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px"
                  }}>
                    <span style={{ 
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      background: colaborador.area === 'Centro Industrial' ? '#fef3c7' : '#fee2e2',
                      color: colaborador.area === 'Centro Industrial' ? '#92400e' : '#991b1b'
                    }}>
                      {colaborador.area === 'Centro Industrial' ? '🏭 CI' : '🔥 HS'}
                    </span>
                    
                    <button
                      onClick={() => handleToggleActivo(colaborador.id, !(colaborador.activo !== false))}
                      style={{
                        padding: "4px 8px",
                        background: colaborador.activo !== false ? "#ef4444" : "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.7rem",
                        fontWeight: "600"
                      }}
                    >
                      {colaborador.activo !== false ? '🚫' : '✅'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal para agregar colaborador */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ 
              fontSize: '1.8rem',
              marginBottom: '20px',
              color: '#1f2937',
              textAlign: 'center'
            }}>
              ➕ Agregar Colaborador
            </h2>
            
            <form onSubmit={handleAddColaborador}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  👤 Nombre Completo *
                </label>
                <input
                  type="text"
                  value={newColaborador.nombre}
                  onChange={(e) => setNewColaborador({...newColaborador, nombre: e.target.value})}
                  className="form-input"
                  style={{ width: '100%' }}
                  placeholder="Ej: Juan Carlos Pérez"
                  required
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  📄 Cédula *
                </label>
                <input
                  type="text"
                  value={newColaborador.cedula}
                  onChange={(e) => setNewColaborador({...newColaborador, cedula: e.target.value})}
                  className="form-input"
                  style={{ width: '100%' }}
                  placeholder="Ej: 12345678"
                  required
                />
              </div>
              
              <div style={{ marginBottom: '30px' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  🏢 Área *
                </label>
                <select
                  value={newColaborador.area}
                  onChange={(e) => setNewColaborador({...newColaborador, area: e.target.value})}
                  className="form-select"
                  style={{ width: '100%' }}
                  required
                >
                  <option value="Centro Industrial">Centro Industrial</option>
                  <option value="Hornos Solera">Hornos Solera</option>
                </select>
              </div>
              
              <div style={{ 
                display: 'flex', 
                gap: '12px',
                flexDirection: window.innerWidth <= 480 ? 'column' : 'row'
              }}>
                <button
                  type="submit"
                  disabled={addingColaborador}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: addingColaborador ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: addingColaborador ? 'not-allowed' : 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  {addingColaborador ? '⏳ Agregando...' : '✅ Agregar Colaborador'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewColaborador({ nombre: '', cedula: '', area: 'Centro Industrial' });
                  }}
                  disabled={addingColaborador}
                  style={{
                    flex: window.innerWidth <= 480 ? 1 : 'auto',
                    padding: '12px 20px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: addingColaborador ? 'not-allowed' : 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  ❌ Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Uploader Modal */}
      {showExcelUploader && (
        <ExcelUploader 
          onUploadComplete={(resultado) => {
            setMensaje(
              `✅ Excel procesado exitosamente:\n` +
              `• ${resultado.migrados} colaboradores nuevos\n` +
              `• ${resultado.yaExisten} ya existían\n` +
              `• Total: ${resultado.total}`
            );
            setTimeout(() => setMensaje(''), 5000);
          }}
          onClose={() => setShowExcelUploader(false)}
        />
      )}
    </div>
  );
};

export default Colaboradores;