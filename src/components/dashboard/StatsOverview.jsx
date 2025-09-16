import React, { useEffect, useState } from 'react';
import { Icon } from '../common/Icons';

const StatsOverview = ({ reportes = [], colaboradoresStats = {} }) => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Actualizar timestamp cuando cambien los reportes
  useEffect(() => {
    setLastUpdate(new Date());
  }, [reportes?.length, reportes]);
  
  // Validar que reportes sea un array válido
  const reportesValidos = Array.isArray(reportes) ? reportes : [];
  
  // Debug: verificar los datos que llegan (solo cuando hay cambios)
  if (reportesValidos.length > 0) {
    console.log('📊 StatsOverview actualizado - Total reportes:', reportesValidos.length);
  }
  
  // Calcular estadísticas básicas - CORREGIDO para estados reales
  const totalReportes = reportesValidos.length;
  const reportesCriticos = reportesValidos.filter(r => r.severidad === 'critica' || r.severidad === 'crítica').length;
  const reportesResueltos = reportesValidos.filter(r => r.estado === 'resuelto' || r.estado === 'cerrado').length;
  const reportesPendientes = reportesValidos.filter(r => r.estado === 'pendiente').length;
  const reportesEnProceso = reportesValidos.filter(r => 
    r.estado === 'proceso' || 
    r.estado === 'en_proceso' || 
    r.estado === 'asignado' ||
    r.estado === 'en_revision'
  ).length;
  
  // Colaboradores - PROTECCIÓN CONTRA NULL
  const colaboradoresData = colaboradoresStats || {};
  const totalColaboradores = colaboradoresData.total || 0;
  const colaboradoresActivos = colaboradoresData.activos || 0;

  // Calcular porcentaje de crecimiento (simulado para demo)
  const crecimientoMensual = totalReportes > 0 ? '+12%' : '0%';
  const eficienciaTasa = totalReportes > 0 ? Math.round((reportesResueltos / totalReportes) * 100) : 0;

  const stats = [
    {
      id: 'total',
      title: 'Total Reportes',
      value: totalReportes,
      subtitle: 'Este mes',
      change: crecimientoMensual,
      changeType: 'positive',
      icon: 'FileText',
      color: 'blue',
      bgColor: '#eff6ff'
    },
    {
      id: 'colaboradores',
      title: 'Colaboradores',
      value: colaboradoresActivos,
      subtitle: 'En sistema',
      change: `${totalColaboradores} activos`,
      changeType: 'info',
      icon: 'Users',
      color: 'green',
      bgColor: '#f0fdf4'
    },
    {
      id: 'criticos',
      title: 'Críticos',
      value: reportesCriticos,
      subtitle: 'Requieren atención',
      change: reportesCriticos > 0 ? '100%' : '0%',
      changeType: reportesCriticos > 0 ? 'negative' : 'positive',
      icon: 'AlertCircle',
      color: 'red',
      bgColor: '#fef2f2'
    },
    {
      id: 'resueltos',
      title: 'Resueltos',
      value: reportesResueltos,
      subtitle: 'Completados',
      change: `${eficienciaTasa}%`,
      changeType: 'positive',
      icon: 'CheckCircle',
      color: 'green',
      bgColor: '#f0fdf4'
    }
  ];

  const getChangeColor = (type) => {
    switch (type) {
      case 'positive': return '#059669';
      case 'negative': return '#dc2626';
      default: return '#6b7280';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header mejorado */}
      <div className="text-center">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
              <Icon name="Analytics" size={24} color="white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-blue-800 bg-clip-text text-transparent">
              Resumen Ejecutivo
            </h2>
          </div>
          <p className="text-slate-600 font-medium">Métricas clave del sistema</p>
        </div>
      </div>

      {/* Stats Grid con diseño empresarial */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className={`bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
              stat.color === 'blue' ? 'hover:border-blue-200' :
              stat.color === 'green' ? 'hover:border-green-200' :
              stat.color === 'red' ? 'hover:border-red-200' : 'hover:border-gray-200'
            }`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl shadow-lg ${
                stat.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                stat.color === 'green' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                stat.color === 'red' ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-gray-500 to-gray-600'
              }`}>
                <Icon name={stat.icon} size={20} color="white" />
              </div>
              <div className="flex-1">
                <div className="text-3xl font-black text-gray-900 leading-none">{stat.value}</div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.title}</div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{stat.subtitle}</span>
              <span className={`text-sm font-semibold ${
                stat.changeType === 'positive' ? 'text-emerald-600' :
                stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Indicadores de rendimiento en tiempo real modernizados */}
      <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/20">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3 flex-wrap">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
              <Icon name="TrendingUp" size={20} color="white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Indicadores de Rendimiento en Tiempo Real
            </h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded-full text-xs font-bold uppercase tracking-wide">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              EN VIVO
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            Estado actual del sistema de reportes • Última actualización: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 bg-white/60 rounded-xl border border-white/30">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
              <Icon name="Clock" size={16} color="white" />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">
                {reportesPendientes}
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-2">Pendientes</span>
              </div>
              <div className="text-xs text-gray-500">Requieren atención</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white/60 rounded-xl border border-white/30">
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
              <Icon name="Settings" size={16} color="white" />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">
                {reportesEnProceso}
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-2">En Proceso</span>
              </div>
              <div className="text-xs text-gray-500">En seguimiento</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white/60 rounded-xl border border-white/30">
            <div className="p-3 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg">
              <Icon name="AlertCircle" size={16} color="white" />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">
                {reportesCriticos}
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-2">Críticos</span>
              </div>
              <div className="text-xs text-gray-500">
                {reportesCriticos === 0 ? 'Sin críticos' : 'Atención urgente'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white/60 rounded-xl border border-white/30">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg">
              <Icon name="CheckCircle" size={16} color="white" />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">
                {reportesResueltos}
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-2">Resueltos</span>
              </div>
              <div className="text-xs text-gray-500">Completados exitosamente</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;