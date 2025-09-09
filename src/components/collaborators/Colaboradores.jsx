import React, { useState, useEffect } from 'react';
import { supabase, dbHelpers } from '../../services/supabase';
import ExcelUploader from './ExcelUploader';

const Colaboradores = () => {
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, activos: 0, centroIndustrial: 0, hornosSolera: 0 });
  const [viewMode, setViewMode] = useState('table'); // 'table' o 'cards'
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

  const loadColaboradores = async () => {
    try {
      const data = await dbHelpers.getAll('colaboradores', { 
        orderBy: 'nombre', 
        ascending: true 
      });
      setColaboradores(data);
      calculateStats(data);
      setLoading(false);
      setError(null);
      
      // Set up real-time subscription
      const subscription = dbHelpers.subscribe('colaboradores', (payload) => {
        console.log('Colaboradores subscription event:', payload);
        // Reload data when changes occur
        loadColaboradoresData();
      });
      
      return () => subscription.unsubscribe();
    } catch (err) {
      console.error('Error obteniendo colaboradores:', err);
      setError('Error conectando con la base de datos');
      setLoading(false);
    }
  };
  
  const loadColaboradoresData = async () => {
    try {
      const data = await dbHelpers.getAll('colaboradores', { 
        orderBy: 'nombre', 
        ascending: true 
      });
      setColaboradores(data);
      calculateStats(data);
    } catch (err) {
      console.error('Error recargando colaboradores:', err);
    }
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
      const existing = await supabase
        .from('colaboradores')
        .select('*')
        .eq('cedula', newColaborador.cedula.trim())
        .maybeSingle();
      
      if (existing.data) {
        setMensaje('❌ Ya existe un colaborador con esta cédula');
        setTimeout(() => setMensaje(''), 3000);
        setAddingColaborador(false);
        return;
      }

      // Agregar nuevo colaborador
      await dbHelpers.create('colaboradores', {
        nombre: newColaborador.nombre.trim(),
        cedula: newColaborador.cedula.trim(),
        area: newColaborador.area,
        departamento: newColaborador.area,
        activo: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
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
      await dbHelpers.update('colaboradores', colaboradorId, {
        activo: nuevoEstado,
        fechaActualizacion: new Date().toISOString()
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
          <p style={{ color: "#6b7280" }}>Conectando con Supabase...</p>
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
      {/* Header Mejorado */}
      <div style={{
        background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "24px",
        color: "white",
        boxShadow: "0 4px 20px rgba(37, 99, 235, 0.15)"
      }}>
        <div style={{
          display: "flex",
          flexDirection: window.innerWidth <= 768 ? "column" : "row",
          justifyContent: "space-between",
          alignItems: window.innerWidth <= 768 ? "flex-start" : "center",
          gap: "20px"
        }}>
          <div>
            <h1 style={{ 
              fontSize: window.innerWidth <= 768 ? "1.8rem" : "2.2rem", 
              fontWeight: "700", 
              color: "white",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              👥 Gestión de Colaboradores
            </h1>
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "1rem", margin: 0 }}>
              Administra la base de datos de colaboradores por área • {stats.total} colaboradores registrados
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
              style={{
                padding: "12px 20px",
                fontSize: "0.9rem",
                fontWeight: "600",
                background: "rgba(255,255,255,0.2)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                backdropFilter: "blur(10px)",
                whiteSpace: "nowrap",
                width: window.innerWidth <= 480 ? "100%" : "auto"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(255,255,255,0.25)";
                e.target.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255,255,255,0.2)";
                e.target.style.transform = "translateY(0)";
              }}
            >
              ➕ Agregar Individual
            </button>
            
            <button
              onClick={() => setShowExcelUploader(true)}
              style={{
                padding: "12px 20px",
                fontSize: "0.9rem",
                fontWeight: "600",
                background: "rgba(16, 185, 129, 0.9)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                backdropFilter: "blur(10px)",
                whiteSpace: "nowrap",
                width: window.innerWidth <= 480 ? "100%" : "auto"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(16, 185, 129, 1)";
                e.target.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(16, 185, 129, 0.9)";
                e.target.style.transform = "translateY(0)";
              }}
            >
              📊 Subir Excel
            </button>
          </div>
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

      {/* Estadísticas Mejoradas */}
      <div style={{
        display: "grid",
        gridTemplateColumns: window.innerWidth <= 768 
          ? "repeat(2, 1fr)" 
          : "repeat(4, 1fr)",
        gap: "16px",
        marginBottom: "24px"
      }}>
        <div style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          borderRadius: "12px",
          padding: "20px",
          color: "white",
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          <div style={{ fontSize: "2.2rem", fontWeight: "800", marginBottom: "4px" }}>
            {stats.total}
          </div>
          <div style={{ fontSize: "0.85rem", fontWeight: "600", opacity: 0.9 }}>
            👥 Total Colaboradores
          </div>
        </div>
        
        <div style={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          borderRadius: "12px",
          padding: "20px",
          color: "white",
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          <div style={{ fontSize: "2.2rem", fontWeight: "800", marginBottom: "4px" }}>
            {stats.activos}
          </div>
          <div style={{ fontSize: "0.85rem", fontWeight: "600", opacity: 0.9 }}>
            ✅ Activos
          </div>
        </div>
        
        <div style={{
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          borderRadius: "12px",
          padding: "20px",
          color: "white",
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(245, 158, 11, 0.15)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          <div style={{ fontSize: "2.2rem", fontWeight: "800", marginBottom: "4px" }}>
            {stats.centroIndustrial}
          </div>
          <div style={{ fontSize: "0.85rem", fontWeight: "600", opacity: 0.9 }}>
            🏭 Centro Industrial
          </div>
        </div>
        
        <div style={{
          background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
          borderRadius: "12px",
          padding: "20px",
          color: "white",
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          <div style={{ fontSize: "2.2rem", fontWeight: "800", marginBottom: "4px" }}>
            {stats.hornosSolera}
          </div>
          <div style={{ fontSize: "0.85rem", fontWeight: "600", opacity: 0.9 }}>
            🔥 Hornos Solera
          </div>
        </div>
      </div>

      {/* Filtros y Controles */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        border: "1px solid #e5e7eb"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <h3 style={{ margin: 0, color: "#1f2937", fontWeight: "600", fontSize: "1.1rem" }}>
            🔍 Filtros y Vista
          </h3>
          
          {/* Toggle Vista */}
          <div style={{
            display: "flex",
            background: "#f3f4f6",
            borderRadius: "8px",
            padding: "4px"
          }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                background: viewMode === 'table' ? "#2563eb" : "transparent",
                color: viewMode === 'table' ? "white" : "#6b7280",
                fontWeight: "600",
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              📋 Tabla
            </button>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                background: viewMode === 'cards' ? "#2563eb" : "transparent",
                color: viewMode === 'cards' ? "white" : "#6b7280",
                fontWeight: "600",
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              🃏 Cards
            </button>
          </div>
        </div>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: window.innerWidth <= 768 
            ? "1fr" 
            : "1fr 200px 120px",
          gap: "16px",
          alignItems: "end"
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

      {/* Lista de Colaboradores Mejorada */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        border: "1px solid #e5e7eb"
      }}>
        <div style={{
          padding: "20px",
          borderBottom: "1px solid #e5e7eb",
          background: "#f8fafc"
        }}>
          <h2 style={{ 
            margin: 0, 
            color: "#1f2937", 
            fontSize: "1.3rem",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
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
        ) : viewMode === 'table' && window.innerWidth > 768 ? (
          // Vista Tabla Desktop
          <div style={{ padding: "0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>
                    Colaborador
                  </th>
                  <th style={{ padding: "16px", textAlign: "center", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>
                    Cédula
                  </th>
                  <th style={{ padding: "16px", textAlign: "center", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>
                    Área
                  </th>
                  <th style={{ padding: "16px", textAlign: "center", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>
                    Estado
                  </th>
                  <th style={{ padding: "16px", textAlign: "center", fontWeight: "600", color: "#374151", borderBottom: "1px solid #e5e7eb" }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {colaboradoresFiltrados.map((colaborador) => (
                  <tr key={colaborador.id} style={{ 
                    borderBottom: "1px solid #f3f4f6",
                    transition: "background 0.2s ease",
                    background: "white"
                  }}
                  onMouseEnter={(e) => e.target.parentElement.style.background = "#f8fafc"}
                  onMouseLeave={(e) => e.target.parentElement.style.background = "white"}
                  >
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: "700",
                          fontSize: "0.9rem"
                        }}>
                          {colaborador.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: "600", color: "#1f2937", fontSize: "0.95rem" }}>
                            {colaborador.nombre}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                            {colaborador.area}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <span style={{
                        background: "#f3f4f6",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontFamily: "monospace",
                        fontSize: "0.85rem",
                        color: "#374151"
                      }}>
                        {colaborador.cedula}
                      </span>
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <span style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        background: colaborador.area === 'Centro Industrial' ? '#fef3c7' : '#fee2e2',
                        color: colaborador.area === 'Centro Industrial' ? '#92400e' : '#991b1b'
                      }}>
                        {colaborador.area === 'Centro Industrial' ? '🏭 Centro Industrial' : '🔥 Hornos Solera'}
                      </span>
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <span style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        background: colaborador.activo !== false ? '#d1fae5' : '#f3f4f6',
                        color: colaborador.activo !== false ? '#065f46' : '#374151'
                      }}>
                        {colaborador.activo !== false ? '✅ Activo' : '⏸️ Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <button
                        onClick={() => handleToggleActivo(colaborador.id, !(colaborador.activo !== false))}
                        style={{
                          padding: "8px 16px",
                          background: colaborador.activo !== false ? "#ef4444" : "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "scale(1)";
                        }}
                      >
                        {colaborador.activo !== false ? '🚫 Desactivar' : '✅ Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Vista Cards (Mobile y Cards Mode)
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
                  padding: "20px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  background: "white",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.04)"
                }}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = "0 8px 20px rgba(0,0,0,0.1)";
                  e.target.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.04)";
                  e.target.style.transform = "translateY(0)";
                }}
                >
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "16px"
                  }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "700",
                      fontSize: "1.1rem"
                    }}>
                      {colaborador.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: "600", 
                        color: "#1f2937", 
                        fontSize: "1rem",
                        marginBottom: "4px"
                      }}>
                        {colaborador.nombre}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                        📧 {colaborador.cedula}
                      </div>
                    </div>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "8px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      background: colaborador.activo !== false ? '#d1fae5' : '#f3f4f6',
                      color: colaborador.activo !== false ? '#065f46' : '#374151'
                    }}>
                      {colaborador.activo !== false ? '✅' : '⏸️'}
                    </span>
                  </div>
                  
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px"
                  }}>
                    <span style={{ 
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      background: colaborador.area === 'Centro Industrial' ? '#fef3c7' : '#fee2e2',
                      color: colaborador.area === 'Centro Industrial' ? '#92400e' : '#991b1b'
                    }}>
                      {colaborador.area === 'Centro Industrial' ? '🏭 CI' : '🔥 HS'}
                    </span>
                    
                    <button
                      onClick={() => handleToggleActivo(colaborador.id, !(colaborador.activo !== false))}
                      style={{
                        padding: "8px 16px",
                        background: colaborador.activo !== false ? "#ef4444" : "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "scale(1)";
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