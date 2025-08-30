import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { useReportes } from '../../hooks/useReportes';
import { Icon } from '../common/Icons';
import EnhancedGraficos from '../common/ui/EnhancedGraficos';

const AnalisisSupervision = () => {
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTiempo, setFiltroTiempo] = useState('todos');
  const [vistaActiva, setVistaActiva] = useState('reportes'); // 'reportes' o 'supervision'
  
  // Hook para reportes de seguridad
  const { reportes, loading: reportesLoading } = useReportes();

  useEffect(() => {
    // Cargar recomendaciones
    const recomendacionesRef = collection(db, 'recomendaciones_campo');
    const unsubRecomendaciones = onSnapshot(recomendacionesRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecomendaciones(data);
    });

    // Cargar colaboradores
    const colaboradoresRef = collection(db, 'colaboradores');
    const unsubColaboradores = onSnapshot(colaboradoresRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setColaboradores(data);
      setLoading(false);
    });

    return () => {
      unsubRecomendaciones();
      unsubColaboradores();
    };
  }, []);

  // Filtrar recomendaciones por tiempo
  const recomendacionesFiltradas = () => {
    if (filtroTiempo === 'todos') return recomendaciones;

    const ahora = new Date();
    const fechaLimite = new Date();

    switch (filtroTiempo) {
      case '7dias':
        fechaLimite.setDate(ahora.getDate() - 7);
        break;
      case '30dias':
        fechaLimite.setDate(ahora.getDate() - 30);
        break;
      case '90dias':
        fechaLimite.setDate(ahora.getDate() - 90);
        break;
      case '6meses':
        fechaLimite.setMonth(ahora.getMonth() - 6);
        break;
      default:
        return recomendaciones;
    }

    return recomendaciones.filter(rec => {
      if (!rec.fecha || !rec.fecha.toDate) return false;
      return rec.fecha.toDate() >= fechaLimite;
    });
  };

  // Análisis por colaborador
  const getAnalisisPorColaborador = () => {
    const stats = {};
    const recomendacionesFilt = recomendacionesFiltradas();
    
    // Inicializar todos los colaboradores
    colaboradores.forEach(colaborador => {
      stats[colaborador.id] = {
        id: colaborador.id,
        nombre: colaborador.nombre,
        cedula: colaborador.cedula,
        area: colaborador.area,
        totalRecomendaciones: 0,
        ultimaRecomendacion: null,
        lugares: {},
        tiposHallazgos: []
      };
    });

    // Procesar recomendaciones
    recomendacionesFilt.forEach(rec => {
      const colaboradorId = rec.colaborador?.id;
      if (colaboradorId && stats[colaboradorId]) {
        const stat = stats[colaboradorId];
        stat.totalRecomendaciones++;
        
        // Última recomendación
        if (!stat.ultimaRecomendacion || 
            (rec.fecha?.toDate() > stat.ultimaRecomendacion?.toDate())) {
          stat.ultimaRecomendacion = rec.fecha;
        }
        
        // Lugares de labor
        const lugar = rec.lugarLabor || 'Sin especificar';
        stat.lugares[lugar] = (stat.lugares[lugar] || 0) + 1;
        
        // Tipos de hallazgos (palabras clave)
        if (rec.hallazgo) {
          stat.tiposHallazgos.push(rec.hallazgo.toLowerCase());
        }
      }
    });

    return Object.values(stats).sort((a, b) => b.totalRecomendaciones - a.totalRecomendaciones);
  };

  // Top 10 colaboradores con más recomendaciones
  const getTopColaboradores = () => {
    return getAnalisisPorColaborador()
      .filter(c => c.totalRecomendaciones > 0)
      .slice(0, 10)
      .map(c => ({
        nombre: c.nombre.length > 15 ? c.nombre.substring(0, 15) + '...' : c.nombre,
        nombreCompleto: c.nombre,
        total: c.totalRecomendaciones,
        area: c.area
      }));
  };

  // Distribución por área
  const getDistribucionPorArea = () => {
    const porArea = { 'Centro Industrial': 0, 'Hornos Solera': 0 };
    
    recomendacionesFiltradas().forEach(rec => {
      const area = rec.colaborador?.area || 'Sin especificar';
      if (porArea[area] !== undefined) {
        porArea[area]++;
      }
    });

    return Object.entries(porArea)
      .filter(([area, total]) => total > 0)
      .map(([area, total]) => ({ area, total }));
  };

  // Top lugares problemáticos
  const getTopLugares = () => {
    const lugares = {};
    
    recomendacionesFiltradas().forEach(rec => {
      const lugar = rec.lugarLabor || 'Sin especificar';
      lugares[lugar] = (lugares[lugar] || 0) + 1;
    });

    return Object.entries(lugares)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([lugar, cantidad]) => ({
        lugar: lugar.length > 12 ? lugar.substring(0, 12) + '...' : lugar,
        lugarCompleto: lugar,
        cantidad
      }));
  };

  // Tendencia temporal (últimos 6 meses)
  const getTendenciaTemporal = () => {
    const meses = [];
    const ahora = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      meses.push({
        mes: fecha.toLocaleDateString('es-ES', { month: 'short' }),
        fecha: fecha,
        total: 0,
        ci: 0,
        hs: 0
      });
    }

    recomendaciones.forEach(rec => {
      if (rec.fecha && rec.fecha.toDate) {
        const fechaRec = rec.fecha.toDate();
        const mesIndex = meses.findIndex(m => 
          m.fecha.getMonth() === fechaRec.getMonth() && 
          m.fecha.getFullYear() === fechaRec.getFullYear()
        );
        
        if (mesIndex !== -1) {
          meses[mesIndex].total++;
          
          if (rec.colaborador?.area === 'Centro Industrial') {
            meses[mesIndex].ci++;
          } else if (rec.colaborador?.area === 'Hornos Solera') {
            meses[mesIndex].hs++;
          }
        }
      }
    });

    return meses;
  };

  const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316'];

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Icon name="Analytics" size={64} color="#6b7280" />
        <h2 style={{ marginTop: '20px' }}>Cargando análisis de supervisión...</h2>
      </div>
    );
  }

  const topColaboradores = getTopColaboradores();
  const distribucionArea = getDistribucionPorArea();
  const topLugares = getTopLugares();
  const tendenciaTemporal = getTendenciaTemporal();
  const statsGenerales = getAnalisisPorColaborador();

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
          <Icon name="Analytics" size={40} />
          Análisis Avanzado
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          Dashboard analítico completo para reportes de seguridad y supervisión de campo
        </p>
      </div>

      {/* Navegación entre vistas */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '8px',
        marginBottom: '30px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        display: 'flex',
        gap: '4px'
      }}>
        <button
          onClick={() => setVistaActiva('reportes')}
          style={{
            flex: 1,
            padding: '12px 20px',
            border: 'none',
            borderRadius: '8px',
            background: vistaActiva === 'reportes' ? '#3b82f6' : 'transparent',
            color: vistaActiva === 'reportes' ? 'white' : '#374151',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Icon name="FileText" size={20} />
          Reportes de Seguridad
        </button>
        <button
          onClick={() => setVistaActiva('supervision')}
          style={{
            flex: 1,
            padding: '12px 20px',
            border: 'none',
            borderRadius: '8px',
            background: vistaActiva === 'supervision' ? '#3b82f6' : 'transparent',
            color: vistaActiva === 'supervision' ? 'white' : '#374151',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Icon name="Eye" size={20} />
          Supervisión de Campo
        </button>
      </div>

      {/* Vista de Reportes de Seguridad */}
      {vistaActiva === 'reportes' && (
        <div>
          <div style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
            borderRadius: '12px',
            padding: '30px',
            marginBottom: '30px',
            color: 'white'
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Icon name="TrendingUp" size={32} color="white" />
              Dashboard Analítico de Reportes
            </h2>
            <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
              Análisis profundo de datos de seguridad • Actualizado en tiempo real
            </p>
          </div>
          
          {reportesLoading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <Icon name="Analytics" size={64} color="#6b7280" />
              <h3 style={{ marginTop: '20px' }}>Cargando datos de reportes...</h3>
            </div>
          ) : (
            <EnhancedGraficos reportes={reportes} />
          )}
        </div>
      )}

      {/* Vista de Supervisión de Campo */}
      {vistaActiva === 'supervision' && (
        <div>
          <div style={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            borderRadius: '12px',
            padding: '30px',
            marginBottom: '30px',
            color: 'white'
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Icon name="Eye" size={32} color="white" />
              Análisis de Supervisión en Campo
            </h2>
            <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
              Estadísticas y seguimiento de recomendaciones por colaborador
            </p>
          </div>

          {/* Filtros de tiempo */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '15px',
            marginBottom: '25px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { value: 'todos', label: 'Todo el período' },
                { value: '7dias', label: 'Últimos 7 días' },
                { value: '30dias', label: 'Últimos 30 días' },
                { value: '90dias', label: 'Últimos 90 días' },
                { value: '6meses', label: 'Últimos 6 meses' }
              ].map(filtro => (
                <button
                  key={filtro.value}
                  onClick={() => setFiltroTiempo(filtro.value)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    background: filtroTiempo === filtro.value ? '#3b82f6' : '#f3f4f6',
                    color: filtroTiempo === filtro.value ? 'white' : '#374151',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {filtro.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
              <Icon name="Users" size={40} color="#3b82f6" style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>
                {colaboradores.length}
              </div>
              <div style={{ color: '#374151', fontWeight: '600' }}>Total Colaboradores</div>
            </div>

            <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
              <Icon name="FileText" size={40} color="#10b981" style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
                {recomendacionesFiltradas().length}
              </div>
              <div style={{ color: '#374151', fontWeight: '600' }}>
                Recomendaciones {filtroTiempo !== 'todos' ? 'Filtradas' : 'Totales'}
              </div>
            </div>

            <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
              <Icon name="TrendingUp" size={40} color="#f59e0b" style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
                {statsGenerales.filter(c => c.totalRecomendaciones > 0).length}
              </div>
              <div style={{ color: '#374151', fontWeight: '600' }}>Con Recomendaciones</div>
            </div>

            <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
              <Icon name="Analytics" size={40} color="#ef4444" style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444' }}>
                {Math.round(recomendacionesFiltradas().length / Math.max(statsGenerales.filter(c => c.totalRecomendaciones > 0).length, 1) * 10) / 10}
              </div>
              <div style={{ color: '#374151', fontWeight: '600' }}>Promedio por Persona</div>
            </div>
          </div>

          {/* Gráficos principales */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '25px',
            marginBottom: '30px'
          }}>
            {/* Top 10 Colaboradores */}
            <div className="card" style={{ padding: '25px' }}>
              <h3 style={{ 
                marginBottom: '20px', 
                color: '#1f2937',
                fontSize: '1.3rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Icon name="Users" size={24} color="#1f2937" />
                Top 10 - Más Recomendaciones
              </h3>
              {topColaboradores.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topColaboradores} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <XAxis 
                      dataKey="nombre" 
                      tick={{ fontSize: 10, angle: -45, textAnchor: 'end' }}
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip 
                      formatter={(value) => [value, 'Recomendaciones']}
                      labelFormatter={(label) => {
                        const colaborador = topColaboradores.find(c => c.nombre === label);
                        return colaborador ? colaborador.nombreCompleto : label;
                      }}
                    />
                    <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
                  <Icon name="Analytics" size={48} color="#e5e7eb" />
                  <p style={{ marginTop: '15px' }}>No hay recomendaciones registradas aún</p>
                </div>
              )}
            </div>

            {/* Distribución por Área */}
            <div className="card" style={{ padding: '25px' }}>
              <h3 style={{ 
                marginBottom: '20px', 
                color: '#1f2937',
                fontSize: '1.3rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Icon name="Building" size={24} color="#1f2937" />
                Recomendaciones por Área
              </h3>
              {distribucionArea.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distribucionArea}
                      dataKey="total"
                      nameKey="area"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {distribucionArea.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
                  <Icon name="PieChart" size={48} color="#e5e7eb" />
                  <p style={{ marginTop: '15px' }}>No hay distribución por área disponible</p>
                </div>
              )}
            </div>

            {/* Top Lugares Problemáticos */}
            <div className="card" style={{ padding: '25px' }}>
              <h3 style={{ 
                marginBottom: '20px', 
                color: '#1f2937',
                fontSize: '1.3rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Icon name="MapPin" size={24} color="#1f2937" />
                Lugares con Más Recomendaciones
              </h3>
              {topLugares.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topLugares} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <XAxis 
                      dataKey="lugar"
                      tick={{ fontSize: 10, angle: -45, textAnchor: 'end' }}
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip 
                      formatter={(value) => [value, 'Recomendaciones']}
                      labelFormatter={(label) => {
                        const lugar = topLugares.find(l => l.lugar === label);
                        return lugar ? lugar.lugarCompleto : label;
                      }}
                    />
                    <Bar dataKey="cantidad" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
                  <Icon name="MapPin" size={48} color="#e5e7eb" />
                  <p style={{ marginTop: '15px' }}>No hay datos de lugares disponibles</p>
                </div>
              )}
            </div>

            {/* Tendencia Temporal */}
            <div className="card" style={{ padding: '25px' }}>
              <h3 style={{ 
                marginBottom: '20px', 
                color: '#1f2937',
                fontSize: '1.3rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Icon name="TrendingUp" size={24} color="#1f2937" />
                Tendencia Últimos 6 Meses
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={tendenciaTemporal} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    name="Total Recomendaciones"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lista Detallada por Colaborador */}
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
                <Icon name="FileText" size={24} color="#1f2937" />
                Detalle Individual ({statsGenerales.length})
              </h3>
            </div>
            
            <div style={{ padding: '25px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '15px'
              }}>
                {statsGenerales.slice(0, 20).map((colaborador, index) => (
                  <div key={colaborador.id || index} style={{
                    padding: '15px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    background: colaborador.totalRecomendaciones > 0 ? '#fef7f0' : '#f9fafb'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'start',
                      marginBottom: '8px'
                    }}>
                      <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.9rem' }}>
                        {colaborador.nombre}
                      </div>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        background: colaborador.totalRecomendaciones > 0 ? '#fef3c7' : '#f3f4f6',
                        color: colaborador.totalRecomendaciones > 0 ? '#92400e' : '#6b7280'
                      }}>
                        {colaborador.totalRecomendaciones} recomendaciones
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '8px' }}>
                      📧 {colaborador.cedula} • 🏢 {colaborador.area}
                    </div>
                    
                    {colaborador.totalRecomendaciones > 0 && colaborador.ultimaRecomendacion && (
                      <div style={{ fontSize: '0.75rem', color: '#374151' }}>
                        📅 Última: {colaborador.ultimaRecomendacion.toDate().toLocaleDateString('es-ES')}
                      </div>
                    )}
                    
                    {colaborador.totalRecomendaciones > 0 && Object.keys(colaborador.lugares).length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                        📍 Lugares: {Object.keys(colaborador.lugares).slice(0, 2).join(', ')}
                        {Object.keys(colaborador.lugares).length > 2 && '...'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {statsGenerales.length > 20 && (
                <p style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280' }}>
                  Mostrando 20 de {statsGenerales.length} colaboradores
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
};

export default AnalisisSupervision;