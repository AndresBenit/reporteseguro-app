import React, { useState, useEffect } from 'react';
import { dbHelpers } from '../../services/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const PerfilIndividual = () => {
  const [colaboradores, setColaboradores] = useState([]);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [abordajes, setAbordajes] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [selectedColaborador, setSelectedColaborador] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [colaboradoresFiltrados, setColaboradoresFiltrados] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar colaboradores
        const colaboradoresData = await dbHelpers.getAll('colaboradores', {
          orderBy: 'nombre',
          ascending: true
        });
        setColaboradores(colaboradoresData);

        // Cargar recomendaciones
        const recomendacionesData = await dbHelpers.getAll('recomendaciones_campo');
        setRecomendaciones(recomendacionesData);

        // Cargar abordajes
        const abordajesData = await dbHelpers.getAll('abordajes_campo');
        setAbordajes(abordajesData);

        // Cargar reportes (incluye EPP, incidencias, etc.)
        const reportesData = await dbHelpers.getAll('reportes');
        setReportes(Array.isArray(reportesData) ? reportesData : []);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscriptions
    const colaboradoresSubscription = dbHelpers.subscribe('colaboradores', () => fetchData());
    const recomendacionesSubscription = dbHelpers.subscribe('recomendaciones_campo', () => fetchData());
    const abordajesSubscription = dbHelpers.subscribe('abordajes_campo', () => fetchData());
    const reportesSubscription = dbHelpers.subscribe('reportes', () => fetchData());

    return () => {
      if (colaboradoresSubscription) colaboradoresSubscription.unsubscribe();
      if (recomendacionesSubscription) recomendacionesSubscription.unsubscribe();
      if (abordajesSubscription) abordajesSubscription.unsubscribe();
      if (reportesSubscription) reportesSubscription.unsubscribe();
    };
  }, []);

  // Filtrar colaboradores para búsqueda
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
        .slice(0, 10);
      setColaboradoresFiltrados(filtrados);
      setShowSugerencias(filtrados.length > 0);
    }
  }, [searchTerm, colaboradores]);

  // Manejar búsqueda
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Seleccionar colaborador
  const seleccionarColaborador = (colaborador) => {
    setSelectedColaborador(colaborador);
    setSearchTerm(colaborador.nombre);
    setShowSugerencias(false);
  };

  // Limpiar selección
  const limpiarSeleccion = () => {
    setSelectedColaborador(null);
    setSearchTerm('');
    setShowSugerencias(false);
  };

  // Cerrar sugerencias
  const handleBlur = () => {
    setTimeout(() => setShowSugerencias(false), 200);
  };

  // Obtener todas las intervenciones del colaborador seleccionado (recomendaciones, abordajes y reportes)
  const getIntervencionesColaborador = () => {
    if (!selectedColaborador) return [];
    
    const recsColaborador = recomendaciones
      .filter(rec => rec.colaborador?.id === selectedColaborador.id)
      .map(rec => ({ ...rec, tipo: 'recomendacion' }));
    
    const abordajesColaborador = abordajes
      .filter(abordaje => abordaje.colaborador?.id === selectedColaborador.id)
      .map(abordaje => ({ ...abordaje, tipo: 'abordaje' }));
    
    // Reportes del colaborador (EPP, incidencias, etc.)
    const reportesValidos = Array.isArray(reportes) ? reportes : [];
    const reportesColaborador = reportesValidos
      .filter(reporte => 
        reporte.reportante === selectedColaborador.nombre ||
        reporte.reportante === selectedColaborador.cedula ||
        (reporte.descripcion && 
         reporte.descripcion.toLowerCase().includes(selectedColaborador.nombre.toLowerCase()))
      )
      .map(reporte => ({ 
        ...reporte, 
        tipo: reporte.tipo || 'incidencia',
        hallazgo: reporte.descripcion || reporte.observaciones || 'Sin descripción',
        recomendacion: reporte.accionesTomadas || reporte.medidas || 'Sin acciones específicas',
        lugarLabor: reporte.ubicacion || reporte.lugar || 'No especificado'
      }));
    
    // Combinar y ordenar por fecha
    const todasIntervenciones = [...recsColaborador, ...abordajesColaborador, ...reportesColaborador]
      .sort((a, b) => {
        if (!a.fecha || !b.fecha) return 0;
        return new Date(b.fecha) - new Date(a.fecha);
      });
    
    return todasIntervenciones;
  };

  // Obtener solo recomendaciones del colaborador (para compatibilidad)
  const getRecomendacionesColaborador = () => {
    if (!selectedColaborador) return [];
    
    return recomendaciones
      .filter(rec => rec.colaborador?.id === selectedColaborador.id)
      .sort((a, b) => {
        if (!a.fecha || !b.fecha) return 0;
        return new Date(b.fecha) - new Date(a.fecha);
      });
  };

  // Estadísticas del colaborador
  const getEstadisticasColaborador = () => {
    const todasIntervenciones = getIntervencionesColaborador();
    
    if (todasIntervenciones.length === 0) {
      return {
        totalRecomendaciones: 0,
        totalAbordajes: 0,
        totalReportes: 0,
        totalEPP: 0,
        totalIncidencias: 0,
        totalIntervenciones: 0,
        ultimaIntervencion: null,
        lugares: {},
        tendenciaMensual: [],
        tiposHallazgos: []
      };
    }

    // Contar por tipo
    const recomendacionesCount = todasIntervenciones.filter(i => i.tipo === 'recomendacion').length;
    const abordajesCount = todasIntervenciones.filter(i => i.tipo === 'abordaje').length;
    const eppCount = todasIntervenciones.filter(i => i.tipo === 'epp').length;
    const incidenciasCount = todasIntervenciones.filter(i => i.tipo === 'incidencia' || i.tipo === 'incidente').length;
    const reportesCount = eppCount + incidenciasCount;

    // Contar por lugares
    const lugares = {};
    todasIntervenciones.forEach(intervencion => {
      const lugar = intervencion.lugarLabor || 'Sin especificar';
      lugares[lugar] = (lugares[lugar] || 0) + 1;
    });

    // Tendencia mensual (últimos 6 meses)
    const meses = [];
    const ahora = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      meses.push({
        mes: fecha.toLocaleDateString('es-ES', { month: 'short' }),
        fecha: fecha,
        recomendaciones: 0,
        abordajes: 0,
        epp: 0,
        incidencias: 0,
        total: 0
      });
    }

    todasIntervenciones.forEach(intervencion => {
      if (intervencion.fecha) {
        const fechaInt = new Date(intervencion.fecha);
        const mesIndex = meses.findIndex(m => 
          m.fecha.getMonth() === fechaInt.getMonth() && 
          m.fecha.getFullYear() === fechaInt.getFullYear()
        );
        
        if (mesIndex !== -1) {
          if (intervencion.tipo === 'recomendacion') {
            meses[mesIndex].recomendaciones++;
          } else if (intervencion.tipo === 'abordaje') {
            meses[mesIndex].abordajes++;
          } else if (intervencion.tipo === 'epp') {
            meses[mesIndex].epp = (meses[mesIndex].epp || 0) + 1;
          } else {
            meses[mesIndex].incidencias = (meses[mesIndex].incidencias || 0) + 1;
          }
          meses[mesIndex].total++;
        }
      }
    });

    // Tipos de hallazgos (palabras clave)
    const tiposHallazgos = {};
    todasIntervenciones.forEach(intervencion => {
      if (intervencion.hallazgo) {
        const hallazgo = intervencion.hallazgo.toLowerCase();
        if (hallazgo.includes('epp') || hallazgo.includes('casco') || hallazgo.includes('guantes')) {
          tiposHallazgos['EPP'] = (tiposHallazgos['EPP'] || 0) + 1;
        } else if (hallazgo.includes('procedimiento') || hallazgo.includes('norma')) {
          tiposHallazgos['Procedimientos'] = (tiposHallazgos['Procedimientos'] || 0) + 1;
        } else if (hallazgo.includes('orden') || hallazgo.includes('aseo') || hallazgo.includes('limpieza')) {
          tiposHallazgos['Orden y Aseo'] = (tiposHallazgos['Orden y Aseo'] || 0) + 1;
        } else {
          tiposHallazgos['Otros'] = (tiposHallazgos['Otros'] || 0) + 1;
        }
      }
    });

    return {
      totalRecomendaciones: recomendacionesCount,
      totalAbordajes: abordajesCount,
      totalReportes: reportesCount,
      totalEPP: eppCount,
      totalIncidencias: incidenciasCount,
      totalIntervenciones: todasIntervenciones.length,
      ultimaIntervencion: todasIntervenciones[0]?.fecha,
      lugares,
      tendenciaMensual: meses,
      tiposHallazgos
    };
  };

  // Datos para gráficas
  const stats = getEstadisticasColaborador();
  const recsColaborador = getRecomendacionesColaborador();

  // Top 3 lugares
  const topLugares = Object.entries(stats.lugares)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([lugar, cantidad]) => ({ lugar, cantidad }));

  // Tipos de hallazgos para pie chart
  const tiposHallazgosPie = Object.entries(stats.tiposHallazgos)
    .map(([tipo, cantidad]) => ({ tipo, cantidad }));

  const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'];

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👤</div>
        <h2>Cargando perfiles...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Premium */}
      <div style={{
        background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "24px",
        color: "white",
        boxShadow: "0 4px 20px rgba(124, 58, 237, 0.15)"
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
              👤 Perfil Individual
            </h1>
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "1rem", margin: 0 }}>
              Análisis detallado de seguridad por colaborador • {colaboradores.length} colaboradores disponibles
            </p>
          </div>
          
          {selectedColaborador && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              background: "rgba(255,255,255,0.15)",
              padding: "16px",
              borderRadius: "12px",
              backdropFilter: "blur(10px)"
            }}>
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#7c3aed",
                fontWeight: "800",
                fontSize: "1.5rem",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
              }}>
                {selectedColaborador.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: "700", fontSize: "1.1rem" }}>
                  {selectedColaborador.nombre}
                </div>
                <div style={{ opacity: 0.9, fontSize: "0.9rem" }}>
                  {selectedColaborador.area} • {stats.totalIntervenciones} intervenciones
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buscador Premium */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        border: "1px solid #e5e7eb"
      }}>
        <h3 style={{ 
          marginBottom: "20px", 
          color: "#1f2937",
          fontWeight: "600",
          fontSize: "1.2rem",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          🔍 Buscar Colaborador
        </h3>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '600px' }}>
            <input
              type="text"
              placeholder="Escribe el nombre o cédula del colaborador..."
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => searchTerm && setShowSugerencias(colaboradoresFiltrados.length > 0)}
              onBlur={handleBlur}
              style={{
                width: '100%',
                fontSize: '1rem',
                padding: '16px 20px',
                border: `2px solid ${selectedColaborador ? '#10b981' : '#e5e7eb'}`,
                borderRadius: '12px',
                backgroundColor: selectedColaborador ? '#f0fdf4' : 'white',
                transition: 'all 0.2s ease',
                boxShadow: selectedColaborador ? '0 0 0 3px rgba(16, 185, 129, 0.1)' : 'none'
              }}
            />
            
            {/* Indicador de selección */}
            {selectedColaborador && (
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
            
            {/* Lista de sugerencias Premium */}
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
                borderRadius: '0 0 12px 12px',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {colaboradoresFiltrados.map(colaborador => {
                  const recsColaborador = recomendaciones.filter(r => r.colaborador?.id === colaborador.id);
                  const abordajesColaborador = abordajes.filter(a => a.colaborador?.id === colaborador.id);
                  const reportesValidos = Array.isArray(reportes) ? reportes : [];
                  const reportesColaborador = reportesValidos.filter(reporte => 
                    reporte.reportante === colaborador.nombre ||
                    reporte.reportante === colaborador.cedula ||
                    (reporte.descripcion && 
                     reporte.descripcion.toLowerCase().includes(colaborador.nombre.toLowerCase()))
                  );
                  const totalIntervenciones = recsColaborador.length + abordajesColaborador.length + reportesColaborador.length;
                  return (
                    <div
                      key={colaborador.id}
                      onClick={() => seleccionarColaborador(colaborador)}
                      style={{
                        padding: '16px 20px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.closest('div').style.backgroundColor = '#f8fafc';
                        e.target.closest('div').style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.closest('div').style.backgroundColor = 'white';
                        e.target.closest('div').style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        flexShrink: 0
                      }}>
                        {colaborador.nombre.charAt(0).toUpperCase()}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '2px' }}>
                          {colaborador.nombre}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                          📧 {colaborador.cedula} • 🏢 {colaborador.area}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: totalIntervenciones > 0 ? '#fef3c7' : '#f3f4f6',
                          color: totalIntervenciones > 0 ? '#92400e' : '#6b7280'
                        }}>
                          {totalIntervenciones} intervenciones
                        </span>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: colaborador.area === 'Centro Industrial' ? '#dbeafe' : '#fee2e2',
                          color: colaborador.area === 'Centro Industrial' ? '#1e40af' : '#991b1b'
                        }}>
                          {colaborador.area === 'Centro Industrial' ? '🏭 CI' : '🔥 HS'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Botón limpiar Premium */}
          {selectedColaborador && (
            <button
              onClick={limpiarSeleccion}
              style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.25)';
              }}
            >
              🗑️ Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Dashboard del Colaborador Seleccionado */}
      {selectedColaborador ? (
        <div>
          {/* Estadísticas Premium del Colaborador con EPP */}
          <div style={{
            display: "grid",
            gridTemplateColumns: window.innerWidth <= 768 
              ? "repeat(2, 1fr)" 
              : window.innerWidth <= 1024
                ? "repeat(3, 1fr)"
                : "repeat(5, 1fr)",
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
                {stats.totalRecomendaciones}
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: "600", opacity: 0.9 }}>
                💡 Recomendaciones
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
                {stats.totalAbordajes}
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: "600", opacity: 0.9 }}>
                🔄 Abordajes
              </div>
            </div>
            
            {/* Card EPP */}
            <div style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              borderRadius: "12px",
              padding: "20px",
              color: "white",
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(139, 92, 246, 0.15)",
              border: "1px solid rgba(255,255,255,0.1)"
            }}>
              <div style={{ fontSize: "2.2rem", fontWeight: "800", marginBottom: "4px" }}>
                {stats.totalEPP}
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: "600", opacity: 0.9 }}>
                🛡️ Control EPP
              </div>
            </div>
            
            {/* Card Incidencias */}
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
                {stats.totalIncidencias}
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: "600", opacity: 0.9 }}>
                🚨 Incidencias
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
                {stats.totalIntervenciones}
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: "600", opacity: 0.9 }}>
                📊 Total
              </div>
            </div>
            
            <div style={{
              background: stats.ultimaIntervencion ? 
                "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)" :
                "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
              borderRadius: "12px",
              padding: "20px",
              color: "white",
              textAlign: "center",
              boxShadow: stats.ultimaIntervencion ? 
                "0 4px 12px rgba(124, 58, 237, 0.15)" :
                "0 4px 12px rgba(107, 114, 128, 0.15)",
              border: "1px solid rgba(255,255,255,0.1)"
            }}>
              <div style={{ fontSize: "1.4rem", fontWeight: "800", marginBottom: "4px" }}>
                {stats.ultimaIntervencion ? 
                  (() => {
                    const diasDiferencia = Math.floor((new Date() - new Date(stats.ultimaIntervencion)) / (1000 * 60 * 60 * 24));
                    return diasDiferencia === 0 ? 'Hoy' : `${diasDiferencia}d`;
                  })() : 
                  'N/A'
                }
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: "600", opacity: 0.9 }}>
                🕒 Última Actividad
              </div>
            </div>
          </div>
          
          {/* Info Detallada del Colaborador */}
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '20px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "800",
                fontSize: "2rem",
                boxShadow: "0 8px 20px rgba(124, 58, 237, 0.25)"
              }}>
                {selectedColaborador.nombre.charAt(0).toUpperCase()}
              </div>
              
              <div style={{ flex: 1 }}>
                <h2 style={{ 
                  fontSize: '1.8rem', 
                  fontWeight: '700', 
                  color: '#1f2937',
                  marginBottom: '8px'
                }}>
                  {selectedColaborador.nombre}
                </h2>
                <div style={{ 
                  fontSize: '1rem', 
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  <span>📧 {selectedColaborador.cedula}</span>
                  <span>🏢 {selectedColaborador.area}</span>
                  {selectedColaborador.activo !== false && (
                    <span style={{
                      padding: '4px 8px',
                      background: '#d1fae5',
                      color: '#065f46',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}>
                      ✅ Activo
                    </span>
                  )}
                </div>
              </div>
              
              {stats.ultimaIntervencion && (
                <div style={{ 
                  textAlign: 'right',
                  background: '#f8fafc',
                  padding: '12px',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '4px' }}>
                    Última intervención:
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1f2937' }}>
                    {new Date(stats.ultimaIntervencion).toLocaleDateString('es-ES')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {stats.totalIntervenciones > 0 ? (
            <>
              {/* Gráficas Premium */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '20px',
                marginBottom: '24px'
              }}>
                {/* Tendencia Mensual Premium */}
                <div style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  border: "1px solid #e5e7eb"
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ 
                      margin: 0,
                      color: '#1f2937',
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      📈 Tendencia Mensual
                    </h3>
                    <div style={{
                      background: '#f8fafc',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      color: '#6b7280'
                    }}>
                      Últimos 6 meses
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={stats.tendenciaMensual} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <XAxis 
                        dataKey="mes" 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickLine={{ stroke: '#e5e7eb' }}
                        gridLine={{ stroke: '#f3f4f6' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="recomendaciones" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2, fill: 'white' }}
                        name="Recomendaciones"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="abordajes" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 2, fill: 'white' }}
                        name="Abordajes"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="epp" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2, fill: 'white' }}
                        name="Control EPP"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="incidencias" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: 'white' }}
                        name="Incidencias"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Lugares Premium */}
                <div style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  border: "1px solid #e5e7eb"
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ 
                      margin: 0,
                      color: '#1f2937',
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      📍 Lugares Más Frecuentes
                    </h3>
                    <div style={{
                      background: '#fef3c7',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      color: '#92400e'
                    }}>
                      Top {Math.min(topLugares.length, 3)}
                    </div>
                  </div>
                  {topLugares.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={topLugares} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <XAxis 
                          dataKey="lugar" 
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickLine={{ stroke: '#e5e7eb' }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickLine={{ stroke: '#e5e7eb' }}
                          gridLine={{ stroke: '#f3f4f6' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Bar 
                          dataKey="cantidad" 
                          fill="url(#colorGradient)" 
                          radius={[6, 6, 0, 0]}
                        />
                        <defs>
                          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={1}/>
                            <stop offset="95%" stopColor="#d97706" stopOpacity={1}/>
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#6b7280', padding: '60px' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.3 }}>📍</div>
                      <h4 style={{ marginBottom: '8px' }}>No hay datos de lugares</h4>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>Las intervenciones aparecerán aquí cuando se registren</p>
                    </div>
                  )}
                </div>

                {/* Tipos de Hallazgos Premium */}
                {tiposHallazgosPie.length > 0 && (
                  <div style={{
                    background: "white",
                    borderRadius: "12px",
                    padding: "24px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    border: "1px solid #e5e7eb"
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '20px'
                    }}>
                      <h3 style={{ 
                        margin: 0,
                        color: '#1f2937',
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        🔍 Tipos de Hallazgos
                      </h3>
                      <div style={{
                        background: '#f0f9ff',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        color: '#0369a1'
                      }}>
                        Distribución
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={tiposHallazgosPie}
                          dataKey="cantidad"
                          nameKey="tipo"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          innerRadius={40}
                          label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                          labelLine={false}
                        >
                          {tiposHallazgosPie.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Historial Detallado Premium */}
              <div style={{
                background: "white",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                border: "1px solid #e5e7eb"
              }}>
                <div style={{
                  padding: '24px',
                  borderBottom: '1px solid #e5e7eb',
                  background: '#f8fafc'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <h3 style={{ 
                      margin: 0, 
                      color: '#1f2937',
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      📋 Historial Completo
                    </h3>
                    <div style={{
                      background: '#7c3aed',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}>
                      {stats.totalIntervenciones} registros
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {getIntervencionesColaborador().slice(0, 10).map((intervencion, index) => (
                      <div key={intervencion.id || index} style={{
                        padding: '20px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        background: 'white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                        borderLeft: `4px solid ${intervencion.tipo === 'recomendacion' ? '#f59e0b' : '#10b981'}`,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                        e.target.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
                        e.target.style.transform = 'translateY(0)';
                      }}
                      >
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'start',
                          marginBottom: '16px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              backgroundColor: intervencion.tipo === 'recomendacion' ? '#f59e0b' : '#10b981',
                              color: 'white',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              {intervencion.tipo === 'recomendacion' ? '💡 Recomendación' : '🔄 Abordaje'}
                            </span>
                            <div style={{
                              background: '#f8fafc',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              color: '#6b7280'
                            }}>
                              📅 {new Date(intervencion.fecha).toLocaleDateString('es-ES')}
                            </div>
                            <div style={{
                              background: '#fef3c7',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              color: '#92400e'
                            }}>
                              📍 {intervencion.lugarLabor}
                            </div>
                          </div>
                          {intervencion.fotoFirmada && (
                            <button
                              onClick={() => window.open(intervencion.fotoFirmada, '_blank')}
                              style={{
                                padding: '8px 12px',
                                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                              }}
                            >
                              📸 Ver Evidencia
                            </button>
                          )}
                        </div>
                        
                        <div style={{ 
                          marginBottom: '16px',
                          padding: '16px',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{ 
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            color: '#374151',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            🔍 Hallazgo Identificado
                          </div>
                          <p style={{ 
                            margin: 0, 
                            color: '#1f2937', 
                            fontSize: '0.95rem',
                            lineHeight: '1.5'
                          }}>
                            {intervencion.hallazgo}
                          </p>
                        </div>
                        
                        <div style={{
                          padding: '16px',
                          background: intervencion.tipo === 'recomendacion' ? '#fefcf3' : '#f0fdf4',
                          borderRadius: '8px',
                          border: `1px solid ${intervencion.tipo === 'recomendacion' ? '#fef3c7' : '#d1fae5'}`
                        }}>
                          <div style={{ 
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            color: intervencion.tipo === 'recomendacion' ? '#92400e' : '#065f46',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            {intervencion.tipo === 'recomendacion' ? '💡 Recomendación Aplicada' : '🔄 Abordaje Realizado'}
                          </div>
                          <p style={{ 
                            margin: 0, 
                            color: '#1f2937', 
                            fontSize: '0.95rem',
                            lineHeight: '1.5'
                          }}>
                            {intervencion.tipo === 'recomendacion' ? intervencion.recomendacion : intervencion.abordaje}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {stats.totalIntervenciones > 10 && (
                    <p style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280' }}>
                      Mostrando 10 de {stats.totalIntervenciones} intervenciones
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.3 }}>🎉</div>
              <h3 style={{ color: '#10b981', marginBottom: '10px' }}>
                ¡Excelente Desempeño!
              </h3>
              <p style={{ color: '#6b7280' }}>
                Este colaborador no tiene recomendaciones registradas
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.3 }}>🔍</div>
          <h3 style={{ color: '#6b7280', marginBottom: '10px' }}>
            Selecciona un Colaborador
          </h3>
          <p style={{ color: '#9ca3af' }}>
            Usa el buscador para encontrar y analizar el perfil de un colaborador
          </p>
        </div>
      )}
    </div>
  );
};

export default PerfilIndividual;