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
    console.log('[STATS] StatsOverview actualizado - Total reportes:', reportesValidos.length);
  }
  
  // Calcular estadísticas básicas - CORREGIDO para estados reales
  const totalReportes = reportesValidos.length;
  const reportesCriticos = reportesValidos.filter(r => r.severidad === 'critica' || r.severidad === 'alta').length;
  const reportesResueltos = reportesValidos.filter(r => r.estado === 'completado' || r.estado === 'resuelto').length;
  const reportesPendientes = reportesValidos.filter(r => r.estado === 'pendiente').length;
  const reportesEnProceso = reportesValidos.filter(r =>
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
    <div className="space-y-6">
      {/* Header simple */}
      <div className="text-center">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Icon name="Analytics" size={20} color="white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Resumen Ejecutivo
            </h2>
          </div>
          <p className="text-gray-600">Métricas clave del sistema</p>
        </div>
      </div>

      {/* Stats Grid empresarial */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-lg ${
                stat.color === 'blue' ? 'bg-blue-600' :
                stat.color === 'green' ? 'bg-emerald-600' :
                stat.color === 'red' ? 'bg-red-600' : 'bg-gray-600'
              }`}>
                <Icon name={stat.icon} size={20} color="white" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">{stat.title}</div>
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

      {/* Indicadores en tiempo real */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 bg-green-600 rounded-lg">
              <Icon name="TrendingUp" size={20} color="white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              Indicadores de Rendimiento
            </h3>
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              EN VIVO
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="p-2 bg-amber-500 rounded-lg">
              <Icon name="Clock" size={16} color="white" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">
                {reportesPendientes}
                <span className="text-xs font-medium text-gray-500 uppercase ml-2">Pendientes</span>
              </div>
              <div className="text-xs text-gray-500">Requieren atención</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Icon name="Settings" size={16} color="white" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">
                {reportesEnProceso}
                <span className="text-xs font-medium text-gray-500 uppercase ml-2">En Proceso</span>
              </div>
              <div className="text-xs text-gray-500">En seguimiento</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="p-2 bg-red-500 rounded-lg">
              <Icon name="AlertCircle" size={16} color="white" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">
                {reportesCriticos}
                <span className="text-xs font-medium text-gray-500 uppercase ml-2">Críticos</span>
              </div>
              <div className="text-xs text-gray-500">
                {reportesCriticos === 0 ? 'Sin críticos' : 'Atención urgente'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <Icon name="CheckCircle" size={16} color="white" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">
                {reportesResueltos}
                <span className="text-xs font-medium text-gray-500 uppercase ml-2">Resueltos</span>
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