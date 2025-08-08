import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const PerfilIndividual = () => {
  const [colaboradores, setColaboradores] = useState([]);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [abordajes, setAbordajes] = useState([]);
  const [selectedColaborador, setSelectedColaborador] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [colaboradoresFiltrados, setColaboradoresFiltrados] = useState([]);

  useEffect(() => {
    // Cargar colaboradores
    const colaboradoresRef = collection(db, 'colaboradores');
    const unsubColaboradores = onSnapshot(colaboradoresRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setColaboradores(data.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    });

    // Cargar recomendaciones
    const recomendacionesRef = collection(db, 'recomendaciones_campo');
    const unsubRecomendaciones = onSnapshot(recomendacionesRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecomendaciones(data);
    });

    // Cargar abordajes
    const abordajesRef = collection(db, 'abordajes_campo');
    const unsubAbordajes = onSnapshot(abordajesRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAbordajes(data);
      setLoading(false);
    });

    return () => {
      unsubColaboradores();
      unsubRecomendaciones();
      unsubAbordajes();
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

  // Obtener recomendaciones y abordajes del colaborador seleccionado
  const getIntervencionesColaborador = () => {
    if (!selectedColaborador) return [];
    
    const recsColaborador = recomendaciones
      .filter(rec => rec.colaborador?.id === selectedColaborador.id)
      .map(rec => ({ ...rec, tipo: 'recomendacion' }));
    
    const abordajesColaborador = abordajes
      .filter(abordaje => abordaje.colaborador?.id === selectedColaborador.id)
      .map(abordaje => ({ ...abordaje, tipo: 'abordaje' }));
    
    // Combinar y ordenar por fecha
    const todasIntervenciones = [...recsColaborador, ...abordajesColaborador]
      .sort((a, b) => {
        if (!a.fecha || !b.fecha) return 0;
        return b.fecha.toDate() - a.fecha.toDate();
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
        return b.fecha.toDate() - a.fecha.toDate();
      });
  };

  // Estadísticas del colaborador
  const getEstadisticasColaborador = () => {
    const todasIntervenciones = getIntervencionesColaborador();
    
    if (todasIntervenciones.length === 0) {
      return {
        totalRecomendaciones: 0,
        totalAbordajes: 0,
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
        total: 0
      });
    }

    todasIntervenciones.forEach(intervencion => {
      if (intervencion.fecha && intervencion.fecha.toDate) {
        const fechaInt = intervencion.fecha.toDate();
        const mesIndex = meses.findIndex(m => 
          m.fecha.getMonth() === fechaInt.getMonth() && 
          m.fecha.getFullYear() === fechaInt.getFullYear()
        );
        
        if (mesIndex !== -1) {
          if (intervencion.tipo === 'recomendacion') {
            meses[mesIndex].recomendaciones++;
          } else {
            meses[mesIndex].abordajes++;
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
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700', 
          color: '#1f2937',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          👤 Perfil Individual
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          Análisis detallado de recomendaciones por colaborador
        </p>
      </div>

      {/* Buscador */}
      <div className="card" style={{ padding: '25px', marginBottom: '25px' }}>
        <h3 style={{ marginBottom: '20px', color: '#1f2937' }}>
          🔍 Buscar Colaborador
        </h3>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
            <input
              type="text"
              placeholder="Escribe el nombre o cédula del colaborador..."
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => searchTerm && setShowSugerencias(colaboradoresFiltrados.length > 0)}
              onBlur={handleBlur}
              className="form-input"
              style={{
                width: '100%',
                fontSize: '1rem',
                padding: '12px 16px',
                borderColor: selectedColaborador ? '#10b981' : '#d1d5db',
                backgroundColor: selectedColaborador ? '#f0fdf4' : 'white'
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
                maxHeight: '250px',
                overflowY: 'auto'
              }}>
                {colaboradoresFiltrados.map(colaborador => {
                  const recsColaborador = recomendaciones.filter(r => r.colaborador?.id === colaborador.id);
                  const abordajesColaborador = abordajes.filter(a => a.colaborador?.id === colaborador.id);
                  const totalIntervenciones = recsColaborador.length + abordajesColaborador.length;
                  return (
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
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.closest('div').style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.target.closest('div').style.backgroundColor = 'white'}
                    >
                      <div>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>
                          {colaborador.nombre}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                          {colaborador.cedula} • {colaborador.area}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          backgroundColor: totalIntervenciones > 0 ? '#fef3c7' : '#f3f4f6',
                          color: totalIntervenciones > 0 ? '#92400e' : '#6b7280'
                        }}>
                          {recsColaborador.length}R + {abordajesColaborador.length}A
                        </span>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          backgroundColor: colaborador.area === 'Centro Industrial' ? '#dbeafe' : '#fee2e2',
                          color: colaborador.area === 'Centro Industrial' ? '#1e40af' : '#991b1b'
                        }}>
                          {colaborador.area === 'Centro Industrial' ? 'CI' : 'HS'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Botón limpiar */}
          {selectedColaborador && (
            <button
              onClick={limpiarSeleccion}
              style={{
                padding: '12px 16px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#dc2626'}
              onMouseLeave={(e) => e.target.style.background = '#ef4444'}
            >
              🗑️ Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Perfil del colaborador seleccionado */}
      {selectedColaborador ? (
        <div>
          {/* Info del colaborador */}
          <div className="card" style={{ padding: '25px', marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h2 style={{ 
                  fontSize: '2rem', 
                  fontWeight: '700', 
                  color: '#1f2937',
                  marginBottom: '10px'
                }}>
                  {selectedColaborador.nombre}
                </h2>
                <div style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '15px' }}>
                  📧 {selectedColaborador.cedula} • 🏢 {selectedColaborador.area}
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
                      {stats.totalRecomendaciones}
                    </div>
                    <div style={{ color: '#6b7280', fontWeight: '600', fontSize: '0.8rem' }}>Recomendaciones</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                      {stats.totalAbordajes}
                    </div>
                    <div style={{ color: '#6b7280', fontWeight: '600', fontSize: '0.8rem' }}>Abordajes</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#f59e0b' }}>
                      {stats.totalIntervenciones}
                    </div>
                    <div style={{ color: '#6b7280', fontWeight: '600', fontSize: '0.8rem' }}>Total</div>
                  </div>
                </div>
                {stats.ultimaIntervencion && (
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '10px' }}>
                    Última: {stats.ultimaIntervencion.toDate().toLocaleDateString('es-ES')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {stats.totalIntervenciones > 0 ? (
            <>
              {/* Gráficas */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '25px',
                marginBottom: '30px'
              }}>
                {/* Tendencia Mensual */}
                <div className="card" style={{ padding: '25px' }}>
                  <h3 style={{ 
                    marginBottom: '20px', 
                    color: '#1f2937',
                    fontSize: '1.3rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    📈 Tendencia Mensual
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={stats.tendenciaMensual}>
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="recomendaciones" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        name="Recomendaciones"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="abordajes" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        name="Abordajes"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Lugares */}
                <div className="card" style={{ padding: '25px' }}>
                  <h3 style={{ 
                    marginBottom: '20px', 
                    color: '#1f2937',
                    fontSize: '1.3rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    📍 Lugares Más Frecuentes
                  </h3>
                  {topLugares.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={topLugares}>
                        <XAxis dataKey="lugar" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="cantidad" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#6b7280', padding: '60px' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.5 }}>📍</div>
                      <p>No hay datos de lugares</p>
                    </div>
                  )}
                </div>

                {/* Tipos de Hallazgos */}
                {tiposHallazgosPie.length > 0 && (
                  <div className="card" style={{ padding: '25px' }}>
                    <h3 style={{ 
                      marginBottom: '20px', 
                      color: '#1f2937',
                      fontSize: '1.3rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      🔍 Tipos de Hallazgos
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={tiposHallazgosPie}
                          dataKey="cantidad"
                          nameKey="tipo"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        >
                          {tiposHallazgosPie.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Historial Detallado */}
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{
                  padding: '25px 25px 0 25px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <h3 style={{ 
                    margin: '0 0 20px 0', 
                    color: '#1f2937',
                    fontSize: '1.3rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    📋 Historial Completo ({stats.totalIntervenciones})
                  </h3>
                </div>
                
                <div style={{ padding: '25px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {getIntervencionesColaborador().slice(0, 10).map((intervencion, index) => (
                      <div key={intervencion.id || index} style={{
                        padding: '20px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        background: intervencion.tipo === 'recomendacion' ? '#fefcf3' : '#f0fdf4',
                        borderLeft: `4px solid ${intervencion.tipo === 'recomendacion' ? '#f59e0b' : '#10b981'}`
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'start',
                          marginBottom: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              backgroundColor: intervencion.tipo === 'recomendacion' ? '#f59e0b' : '#10b981',
                              color: 'white'
                            }}>
                              {intervencion.tipo === 'recomendacion' ? 'RECOMENDACIÓN' : 'ABORDAJE'}
                            </span>
                            <div style={{ 
                              fontSize: '0.9rem', 
                              fontWeight: '600', 
                              color: intervencion.tipo === 'recomendacion' ? '#92400e' : '#065f46'
                            }}>
                              📅 {intervencion.fecha?.toDate().toLocaleDateString('es-ES')} • 📍 {intervencion.lugarLabor}
                            </div>
                          </div>
                          {intervencion.fotoFirmada && (
                            <button
                              onClick={() => window.open(intervencion.fotoFirmada, '_blank')}
                              style={{
                                padding: '4px 8px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                cursor: 'pointer'
                              }}
                            >
                              📸 Ver Evidencia
                            </button>
                          )}
                        </div>
                        
                        <div style={{ marginBottom: '8px' }}>
                          <strong style={{ color: '#1f2937' }}>🔍 Hallazgo:</strong>
                          <p style={{ margin: '4px 0', color: '#374151', fontSize: '0.9rem' }}>
                            {intervencion.hallazgo}
                          </p>
                        </div>
                        
                        <div>
                          <strong style={{ color: '#1f2937' }}>
                            {intervencion.tipo === 'recomendacion' ? '💡 Recomendación:' : '🔄 Abordaje:'}
                          </strong>
                          <p style={{ margin: '4px 0', color: '#374151', fontSize: '0.9rem' }}>
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