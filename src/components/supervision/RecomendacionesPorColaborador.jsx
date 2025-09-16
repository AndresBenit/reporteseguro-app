import React, { useState, useEffect } from 'react';
import { dbHelpers } from '../../services/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

const RecomendacionesPorColaborador = () => {
  const [reportes, setReportes] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedColaborador, setSelectedColaborador] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar reportes
        const reportesData = await dbHelpers.getAll('reportes');
        setReportes(reportesData);

        // Cargar colaboradores
        const colaboradoresData = await dbHelpers.getAll('colaboradores');
        setColaboradores(colaboradoresData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscriptions
    const reportesSubscription = dbHelpers.subscribe('reportes', () => {
      fetchData();
    });

    const colaboradoresSubscription = dbHelpers.subscribe('colaboradores', () => {
      fetchData();
    });

    return () => {
      if (reportesSubscription) reportesSubscription.unsubscribe();
      if (colaboradoresSubscription) colaboradoresSubscription.unsubscribe();
    };
  }, []);

  // Analizar recomendaciones por colaborador
  const getRecomendacionesPorColaborador = () => {
    const stats = {};
    
    colaboradores.forEach(colaborador => {
      const reportesColaborador = reportes.filter(r => 
        r.reportante === colaborador.nombre || 
        r.descripcion?.toLowerCase().includes(colaborador.nombre.toLowerCase())
      );
      
      stats[colaborador.nombre] = {
        id: colaborador.id,
        nombre: colaborador.nombre,
        cedula: colaborador.cedula,
        area: colaborador.area,
        totalReportes: reportesColaborador.length,
        criticos: reportesColaborador.filter(r => r.severidad === 'critica').length,
        altos: reportesColaborador.filter(r => r.severidad === 'alta').length,
        medios: reportesColaborador.filter(r => r.severidad === 'media').length,
        bajos: reportesColaborador.filter(r => r.severidad === 'baja').length,
        ultimoReporte: reportesColaborador.length > 0 ? 
          reportesColaborador.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0] : null
      };
    });

    return Object.values(stats).sort((a, b) => b.totalReportes - a.totalReportes);
  };

  // Top 10 colaboradores con más recomendaciones
  const getTopColaboradores = () => {
    return getRecomendacionesPorColaborador()
      .filter(c => c.totalReportes > 0)
      .slice(0, 10)
      .map(c => ({
        nombre: c.nombre.length > 15 ? c.nombre.substring(0, 15) + '...' : c.nombre,
        nombreCompleto: c.nombre,
        total: c.totalReportes,
        criticos: c.criticos,
        area: c.area
      }));
  };

  // Distribución por área
  const getDistribucionPorArea = () => {
    const porArea = {};
    getRecomendacionesPorColaborador().forEach(c => {
      const area = c.area || 'Sin especificar';
      porArea[area] = (porArea[area] || 0) + c.totalReportes;
    });

    return Object.entries(porArea).map(([area, total]) => ({ area, total }));
  };

  const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316'];

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📊</div>
        <h2>Cargando análisis de recomendaciones...</h2>
      </div>
    );
  }

  const topColaboradores = getTopColaboradores();
  const distribucionArea = getDistribucionPorArea();
  const statsGenerales = getRecomendacionesPorColaborador();

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
          📊 Recomendaciones por Colaborador
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          Análisis detallado de recomendaciones de seguridad por trabajador
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>👥</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>
            {colaboradores.length}
          </div>
          <div style={{ color: '#374151', fontWeight: '600' }}>Total Colaboradores</div>
        </div>

        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📋</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
            {reportes.length}
          </div>
          <div style={{ color: '#374151', fontWeight: '600' }}>Total Recomendaciones</div>
        </div>

        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>⚡</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
            {statsGenerales.filter(c => c.totalReportes > 0).length}
          </div>
          <div style={{ color: '#374151', fontWeight: '600' }}>Con Recomendaciones</div>
        </div>

        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📈</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444' }}>
            {reportes.filter(r => r.severidad === 'critica').length}
          </div>
          <div style={{ color: '#374151', fontWeight: '600' }}>Críticas</div>
        </div>
      </div>

      {/* Gráficos */}
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
            🏆 Top 10 - Más Recomendaciones
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
                  formatter={(value, name) => [value, 'Recomendaciones']}
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
              <div style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }}>📊</div>
              <p>No hay datos de recomendaciones aún</p>
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
            🏢 Recomendaciones por Área
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
                  label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
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
              <div style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }}>📈</div>
              <p>No hay distribución por área disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* Lista Detallada */}
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
            📋 Detalle por Colaborador ({statsGenerales.length})
          </h3>
        </div>
        
        <div style={{ padding: '25px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '15px'
          }}>
            {statsGenerales.slice(0, 20).map((colaborador, index) => (
              <div key={colaborador.id || index} style={{
                padding: '15px',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                background: colaborador.totalReportes > 0 ? '#fef7f0' : '#f9fafb'
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
                    background: colaborador.totalReportes > 0 ? '#fef3c7' : '#f3f4f6',
                    color: colaborador.totalReportes > 0 ? '#92400e' : '#6b7280'
                  }}>
                    {colaborador.totalReportes} recomendaciones
                  </span>
                </div>
                
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '8px' }}>
                  Cédula: {colaborador.cedula} • Área: {colaborador.area}
                </div>
                
                {colaborador.totalReportes > 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#374151' }}>
                    {colaborador.criticos} críticas • {colaborador.altos} altas •
                    {colaborador.medios} medias • {colaborador.bajos} bajas
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
  );
};

export default RecomendacionesPorColaborador;