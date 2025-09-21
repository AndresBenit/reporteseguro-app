import React, { useEffect, useState } from 'react';
import { Icon } from '../common/Icons';
import { supabase } from '../../services/supabase';

const StatsOverview = ({ reportes = [], colaboradoresStats = {} }) => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [moduleStats, setModuleStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Actualizar timestamp cuando cambien los reportes
  useEffect(() => {
    setLastUpdate(new Date());
  }, [reportes?.length, reportes]);

  // Cargar estadísticas de todos los módulos
  useEffect(() => {
    cargarEstadisticasModulos();
  }, []);

  const cargarEstadisticasModulos = async () => {
    try {
      setLoading(true);

      // Cargar datos de todos los módulos en paralelo
      const [
        riesgosRes,
        controlesRes,
        examenesRes,
        capacitacionesRes,
        inventarioRes,
        inspeccionesRes,
        auditoriasRes,
        emergenciasRes,
        colaboradoresRes
      ] = await Promise.all([
        supabase.from('matriz_riesgos').select('nivel_riesgo, aceptabilidad_riesgo'),
        supabase.from('controles_riesgo').select('estado, eficacia'),
        supabase.from('examenes_medicos_sst').select('resultado, fecha_vencimiento'),
        supabase.from('capacitaciones_sst').select('estado, fecha_vencimiento'),
        supabase.from('inventario_epp').select('stock_actual, stock_minimo, estado'),
        supabase.from('inspecciones').select('estado, resultado'),
        supabase.from('auditorias').select('estado, porcentaje_cumplimiento'),
        supabase.from('planes_emergencia').select('estado, fecha_actualizacion'),
        supabase.from('colaboradores').select('activo, area, cargo')
      ]);

      // Procesar estadísticas
      const stats = {
        riesgos: {
          total: riesgosRes.data?.length || 0,
          criticos: riesgosRes.data?.filter(r => r.nivel_riesgo >= 600).length || 0,
          noAceptables: riesgosRes.data?.filter(r => r.aceptabilidad_riesgo === 'No Aceptable').length || 0
        },
        controles: {
          total: controlesRes.data?.length || 0,
          implementados: controlesRes.data?.filter(c => c.estado === 'Implementado').length || 0,
          eficacesAlta: controlesRes.data?.filter(c => c.eficacia === 'Alta').length || 0
        },
        examenes: {
          total: examenesRes.data?.length || 0,
          vencidos: examenesRes.data?.filter(e => new Date(e.fecha_vencimiento) < new Date()).length || 0,
          pendientes: examenesRes.data?.filter(e => e.resultado === 'pendiente').length || 0
        },
        capacitaciones: {
          total: capacitacionesRes.data?.length || 0,
          vencidas: capacitacionesRes.data?.filter(c => new Date(c.fecha_vencimiento) < new Date()).length || 0,
          completadas: capacitacionesRes.data?.filter(c => c.estado === 'completada').length || 0
        },
        inventario: {
          total: inventarioRes.data?.length || 0,
          critico: inventarioRes.data?.filter(i => i.stock_actual <= i.stock_minimo).length || 0,
          agotado: inventarioRes.data?.filter(i => i.stock_actual === 0).length || 0
        },
        inspecciones: {
          total: inspeccionesRes.data?.length || 0,
          pendientes: inspeccionesRes.data?.filter(i => i.estado === 'pendiente').length || 0,
          noConformes: inspeccionesRes.data?.filter(i => i.resultado === 'no_conforme').length || 0
        },
        auditorias: {
          total: auditoriasRes.data?.length || 0,
          completadas: auditoriasRes.data?.filter(a => a.estado === 'completada').length || 0,
          cumplimientoPromedio: auditoriasRes.data?.reduce((acc, a) => acc + (a.porcentaje_cumplimiento || 0), 0) / (auditoriasRes.data?.length || 1)
        },
        emergencias: {
          total: emergenciasRes.data?.length || 0,
          actualizados: emergenciasRes.data?.filter(e => {
            const fecha = new Date(e.fecha_actualizacion);
            const haceUnAño = new Date();
            haceUnAño.setFullYear(haceUnAño.getFullYear() - 1);
            return fecha > haceUnAño;
          }).length || 0
        },
        colaboradores: {
          total: colaboradoresRes.data?.length || 0,
          activos: colaboradoresRes.data?.filter(c => c.activo).length || 0,
          areas: [...new Set(colaboradoresRes.data?.map(c => c.area))].length || 0
        }
      };

      setModuleStats(stats);

    } catch (error) {
      console.error('Error cargando estadísticas de módulos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validar que reportes sea un array válido
  const reportesValidos = Array.isArray(reportes) ? reportes : [];

  // Calcular estadísticas básicas de reportes
  const totalReportes = reportesValidos.length;
  const reportesCriticos = reportesValidos.filter(r => r.severidad === 'critica' || r.severidad === 'alta').length;
  const reportesResueltos = reportesValidos.filter(r => r.estado === 'completado' || r.estado === 'resuelto').length;
  const reportesPendientes = reportesValidos.filter(r => r.estado === 'pendiente').length;

  // Calcular alertas críticas del sistema
  const alertasCriticas = (moduleStats.riesgos?.criticos || 0) +
                         (moduleStats.examenes?.vencidos || 0) +
                         (moduleStats.inventario?.agotado || 0) +
                         (moduleStats.inspecciones?.noConformes || 0);

  // Calcular cumplimiento general (promedio ponderado)
  const cumplimientoGeneral = Math.round(
    ((moduleStats.auditorias?.cumplimientoPromedio || 0) +
     (moduleStats.controles?.total > 0 ? (moduleStats.controles?.implementados / moduleStats.controles?.total) * 100 : 0) +
     (moduleStats.capacitaciones?.total > 0 ? ((moduleStats.capacitaciones?.total - moduleStats.capacitaciones?.vencidas) / moduleStats.capacitaciones?.total) * 100 : 0)) / 3
  );

  // Estadísticas principales estratégicas
  const statsEstrategicas = [
    {
      id: 'alertas-criticas',
      title: 'Alertas Críticas',
      value: alertasCriticas,
      subtitle: 'Requieren atención inmediata',
      change: alertasCriticas === 0 ? 'Sistema bajo control' : 'Acción requerida',
      changeType: alertasCriticas === 0 ? 'positive' : 'negative',
      icon: 'AlertTriangle',
      color: alertasCriticas === 0 ? 'green' : 'red'
    },
    {
      id: 'cumplimiento',
      title: 'Cumplimiento',
      value: `${cumplimientoGeneral}%`,
      subtitle: 'Indicador general',
      change: cumplimientoGeneral >= 85 ? 'Excelente' : cumplimientoGeneral >= 70 ? 'Bueno' : 'Mejorar',
      changeType: cumplimientoGeneral >= 85 ? 'positive' : cumplimientoGeneral >= 70 ? 'info' : 'negative',
      icon: 'Target',
      color: cumplimientoGeneral >= 85 ? 'green' : cumplimientoGeneral >= 70 ? 'blue' : 'amber'
    },
    {
      id: 'colaboradores-activos',
      title: 'Colaboradores',
      value: moduleStats.colaboradores?.activos || 0,
      subtitle: `${moduleStats.colaboradores?.areas || 0} áreas`,
      change: `${moduleStats.colaboradores?.total || 0} registrados`,
      changeType: 'info',
      icon: 'Users',
      color: 'blue'
    },
    {
      id: 'reportes-pendientes',
      title: 'Reportes Activos',
      value: reportesPendientes,
      subtitle: 'Seguimiento requerido',
      change: `${reportesResueltos} resueltos`,
      changeType: reportesPendientes === 0 ? 'positive' : 'info',
      icon: 'FileText',
      color: reportesPendientes === 0 ? 'green' : 'amber'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Icon name="Refresh" size={24} className="animate-spin text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Cargando Dashboard Estratégico</h2>
            </div>
            <p className="text-gray-600">Obteniendo métricas de todos los módulos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Header Executive */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg">
                  <Icon name="TrendingUp" size={24} color="white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard Ejecutivo SST</h1>
                  <p className="text-sm text-gray-500">Sistema Integral de Gestión • {lastUpdate.toLocaleDateString('es-ES')}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-semibold">ONLINE</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Última actualización</div>
                <div className="text-sm font-medium text-gray-700">{lastUpdate.toLocaleTimeString('es-ES')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Executive */}
        <div className="w-80 bg-white border-r border-gray-200 shadow-sm min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Icon name="BarChart3" size={20} className="text-blue-600" />
              Indicadores Críticos
            </h2>

            <div className="space-y-4">
              {/* Alertas Críticas - Prioridad Alta */}
              <div className={`p-4 rounded-lg border-l-4 ${
                alertasCriticas === 0
                  ? 'bg-green-50 border-green-500 border border-green-200'
                  : 'bg-red-50 border-red-500 border border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon name="AlertTriangle" size={16} className={alertasCriticas === 0 ? "text-green-600" : "text-red-600"} />
                    <span className="text-sm font-semibold text-gray-900">Alertas Críticas</span>
                  </div>
                  <span className={`text-xl font-bold ${alertasCriticas === 0 ? "text-green-600" : "text-red-600"}`}>
                    {alertasCriticas}
                  </span>
                </div>
                <p className={`text-xs ${alertasCriticas === 0 ? "text-green-700" : "text-red-700"}`}>
                  {alertasCriticas === 0 ? 'Sistema bajo control' : 'Requieren atención inmediata'}
                </p>
              </div>

              {/* Cumplimiento General */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon name="Target" size={16} className="text-blue-600" />
                    <span className="text-sm font-semibold text-gray-900">Cumplimiento</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">{cumplimientoGeneral}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${cumplimientoGeneral}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-700">
                  {cumplimientoGeneral >= 85 ? 'Excelente' : cumplimientoGeneral >= 70 ? 'Bueno' : 'Requiere mejora'}
                </p>
              </div>

              {/* KPIs Operacionales */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icon name="Users" size={14} className="text-gray-600" />
                    <span className="text-sm text-gray-700">Colaboradores</span>
                  </div>
                  <span className="font-semibold text-gray-900">{moduleStats.colaboradores?.activos || 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icon name="FileText" size={14} className="text-gray-600" />
                    <span className="text-sm text-gray-700">Reportes Activos</span>
                  </div>
                  <span className="font-semibold text-gray-900">{reportesPendientes}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icon name="Shield" size={14} className="text-gray-600" />
                    <span className="text-sm text-gray-700">EPP Crítico</span>
                  </div>
                  <span className="font-semibold text-red-600">{moduleStats.inventario?.critico || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {/* Command Center Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Icon name="Monitor" size={20} className="text-slate-600" />
                Centro de Control Operacional
              </h3>
              <p className="text-sm text-gray-600">Estado en tiempo real de todos los módulos SST</p>
            </div>

            <div className="p-6">
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Módulo</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Total</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Estado Crítico</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-red-25 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Icon name="AlertTriangle" size={18} className="text-red-600" />
                          <span className="font-medium text-gray-900">Matriz de Riesgos</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-4 font-semibold">{moduleStats.riesgos?.total || 0}</td>
                      <td className="text-center py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {moduleStats.riesgos?.criticos || 0} críticos
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <div className={`w-3 h-3 rounded-full mx-auto ${(moduleStats.riesgos?.criticos || 0) > 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      </td>
                    </tr>

                    <tr className="hover:bg-rose-25 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Icon name="Heart" size={18} className="text-rose-600" />
                          <span className="font-medium text-gray-900">Exámenes Médicos</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-4 font-semibold">{moduleStats.examenes?.total || 0}</td>
                      <td className="text-center py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                          {moduleStats.examenes?.vencidos || 0} vencidos
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <div className={`w-3 h-3 rounded-full mx-auto ${(moduleStats.examenes?.vencidos || 0) > 0 ? 'bg-rose-500' : 'bg-green-500'}`}></div>
                      </td>
                    </tr>

                    <tr className="hover:bg-blue-25 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Icon name="BookOpen" size={18} className="text-blue-600" />
                          <span className="font-medium text-gray-900">Capacitaciones</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-4 font-semibold">{moduleStats.capacitaciones?.total || 0}</td>
                      <td className="text-center py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {moduleStats.capacitaciones?.vencidas || 0} vencidas
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <div className={`w-3 h-3 rounded-full mx-auto ${(moduleStats.capacitaciones?.vencidas || 0) > 0 ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                      </td>
                    </tr>

                    <tr className="hover:bg-green-25 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Icon name="Shield" size={18} className="text-green-600" />
                          <span className="font-medium text-gray-900">Inventario EPP</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-4 font-semibold">{moduleStats.inventario?.total || 0}</td>
                      <td className="text-center py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          {moduleStats.inventario?.critico || 0} stock bajo
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <div className={`w-3 h-3 rounded-full mx-auto ${(moduleStats.inventario?.critico || 0) > 0 ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                      </td>
                    </tr>

                    <tr className="hover:bg-purple-25 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Icon name="Search" size={18} className="text-purple-600" />
                          <span className="font-medium text-gray-900">Inspecciones</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-4 font-semibold">{moduleStats.inspecciones?.total || 0}</td>
                      <td className="text-center py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {moduleStats.inspecciones?.pendientes || 0} pendientes
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <div className={`w-3 h-3 rounded-full mx-auto ${(moduleStats.inspecciones?.pendientes || 0) > 0 ? 'bg-purple-500' : 'bg-green-500'}`}></div>
                      </td>
                    </tr>

                    <tr className="hover:bg-indigo-25 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Icon name="FileCheck" size={18} className="text-indigo-600" />
                          <span className="font-medium text-gray-900">Auditorías</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-4 font-semibold">{moduleStats.auditorias?.total || 0}</td>
                      <td className="text-center py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {Math.round(moduleStats.auditorias?.cumplimientoPromedio || 0)}% cumplimiento
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <div className={`w-3 h-3 rounded-full mx-auto ${(moduleStats.auditorias?.cumplimientoPromedio || 0) >= 85 ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                      </td>
                    </tr>

                    <tr className="hover:bg-emerald-25 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Icon name="ShieldCheck" size={18} className="text-emerald-600" />
                          <span className="font-medium text-gray-900">Controles de Riesgo</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-4 font-semibold">{moduleStats.controles?.total || 0}</td>
                      <td className="text-center py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          {moduleStats.controles?.implementados || 0} implementados
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <div className={`w-3 h-3 rounded-full mx-auto ${(moduleStats.controles?.implementados || 0) > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      </td>
                    </tr>

                    <tr className="hover:bg-orange-25 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Icon name="Siren" size={18} className="text-orange-600" />
                          <span className="font-medium text-gray-900">Planes de Emergencia</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-4 font-semibold">{moduleStats.emergencias?.total || 0}</td>
                      <td className="text-center py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {moduleStats.emergencias?.actualizados || 0} actualizados
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <div className={`w-3 h-3 rounded-full mx-auto ${(moduleStats.emergencias?.actualizados || 0) > 0 ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer Analytics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Icon name="Activity" size={20} className="text-amber-600" />
                Analytics de Reportes
              </h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-700 mb-1">{totalReportes}</div>
                  <div className="text-sm font-medium text-slate-600 uppercase tracking-wide">Total</div>
                  <div className="w-full bg-slate-200 rounded-full h-1 mt-2">
                    <div className="bg-slate-600 h-1 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600 mb-1">{reportesPendientes}</div>
                  <div className="text-sm font-medium text-amber-700 uppercase tracking-wide">Pendientes</div>
                  <div className="w-full bg-amber-200 rounded-full h-1 mt-2">
                    <div className="bg-amber-600 h-1 rounded-full" style={{ width: `${totalReportes > 0 ? (reportesPendientes / totalReportes) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-1">{reportesCriticos}</div>
                  <div className="text-sm font-medium text-red-700 uppercase tracking-wide">Críticos</div>
                  <div className="w-full bg-red-200 rounded-full h-1 mt-2">
                    <div className="bg-red-600 h-1 rounded-full" style={{ width: `${totalReportes > 0 ? (reportesCriticos / totalReportes) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">{reportesResueltos}</div>
                  <div className="text-sm font-medium text-green-700 uppercase tracking-wide">Resueltos</div>
                  <div className="w-full bg-green-200 rounded-full h-1 mt-2">
                    <div className="bg-green-600 h-1 rounded-full" style={{ width: `${totalReportes > 0 ? (reportesResueltos / totalReportes) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;