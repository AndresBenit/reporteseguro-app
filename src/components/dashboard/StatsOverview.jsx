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
    <div className="space-y-6">
      {/* Header estratégico */}
      <div className="text-center">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Icon name="TrendingUp" size={24} color="white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Dashboard Estratégico SST
            </h2>
          </div>
          <p className="text-gray-600 font-medium">
            Sistema Integral de Gestión de Seguridad Industrial • {lastUpdate.toLocaleDateString('es-ES')}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600 font-semibold">SISTEMA ACTIVO</span>
          </div>
        </div>
      </div>

      {/* Métricas Estratégicas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statsEstrategicas.map((stat) => (
          <div
            key={stat.id}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-lg ${
                stat.color === 'blue' ? 'bg-blue-600' :
                stat.color === 'green' ? 'bg-emerald-600' :
                stat.color === 'red' ? 'bg-red-600' :
                stat.color === 'amber' ? 'bg-amber-600' : 'bg-gray-600'
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
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                stat.changeType === 'positive' ? 'bg-green-100 text-green-800' :
                stat.changeType === 'negative' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Estado Operacional por Módulos */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 bg-slate-600 rounded-lg">
              <Icon name="Grid" size={20} color="white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Estado Operacional por Módulos</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Monitoreo en tiempo real de todos los sistemas SST
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Matriz de Riesgos */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <div className="flex items-center gap-3 mb-3">
              <Icon name="AlertTriangle" size={20} className="text-red-600" />
              <span className="font-semibold text-red-900">Matriz Riesgos</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-red-700">Total:</span>
                <span className="font-semibold text-red-900">{moduleStats.riesgos?.total || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-700">Críticos:</span>
                <span className="font-semibold text-red-900">{moduleStats.riesgos?.criticos || 0}</span>
              </div>
            </div>
          </div>

          {/* Exámenes Médicos */}
          <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg p-4 border border-rose-200">
            <div className="flex items-center gap-3 mb-3">
              <Icon name="Heart" size={20} className="text-rose-600" />
              <span className="font-semibold text-rose-900">Exámenes</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-rose-700">Total:</span>
                <span className="font-semibold text-rose-900">{moduleStats.examenes?.total || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-rose-700">Vencidos:</span>
                <span className="font-semibold text-rose-900">{moduleStats.examenes?.vencidos || 0}</span>
              </div>
            </div>
          </div>

          {/* Capacitaciones */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <Icon name="BookOpen" size={20} className="text-blue-600" />
              <span className="font-semibold text-blue-900">Capacitaciones</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">Total:</span>
                <span className="font-semibold text-blue-900">{moduleStats.capacitaciones?.total || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">Vencidas:</span>
                <span className="font-semibold text-blue-900">{moduleStats.capacitaciones?.vencidas || 0}</span>
              </div>
            </div>
          </div>

          {/* Inventario EPP */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <Icon name="Shield" size={20} className="text-green-600" />
              <span className="font-semibold text-green-900">Inventario EPP</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Items:</span>
                <span className="font-semibold text-green-900">{moduleStats.inventario?.total || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Crítico:</span>
                <span className="font-semibold text-green-900">{moduleStats.inventario?.critico || 0}</span>
              </div>
            </div>
          </div>

          {/* Inspecciones */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-3 mb-3">
              <Icon name="Search" size={20} className="text-purple-600" />
              <span className="font-semibold text-purple-900">Inspecciones</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-purple-700">Total:</span>
                <span className="font-semibold text-purple-900">{moduleStats.inspecciones?.total || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-purple-700">Pendientes:</span>
                <span className="font-semibold text-purple-900">{moduleStats.inspecciones?.pendientes || 0}</span>
              </div>
            </div>
          </div>

          {/* Auditorías */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
            <div className="flex items-center gap-3 mb-3">
              <Icon name="FileCheck" size={20} className="text-indigo-600" />
              <span className="font-semibold text-indigo-900">Auditorías</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-indigo-700">Total:</span>
                <span className="font-semibold text-indigo-900">{moduleStats.auditorias?.total || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-700">Cumplimiento:</span>
                <span className="font-semibold text-indigo-900">{Math.round(moduleStats.auditorias?.cumplimientoPromedio || 0)}%</span>
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
            <div className="flex items-center gap-3 mb-3">
              <Icon name="ShieldCheck" size={20} className="text-emerald-600" />
              <span className="font-semibold text-emerald-900">Controles</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-700">Total:</span>
                <span className="font-semibold text-emerald-900">{moduleStats.controles?.total || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-700">Implementados:</span>
                <span className="font-semibold text-emerald-900">{moduleStats.controles?.implementados || 0}</span>
              </div>
            </div>
          </div>

          {/* Planes de Emergencia */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center gap-3 mb-3">
              <Icon name="Siren" size={20} className="text-orange-600" />
              <span className="font-semibold text-orange-900">Emergencias</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-orange-700">Planes:</span>
                <span className="font-semibold text-orange-900">{moduleStats.emergencias?.total || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-orange-700">Actualizados:</span>
                <span className="font-semibold text-orange-900">{moduleStats.emergencias?.actualizados || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actividad de Reportes */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 bg-amber-600 rounded-lg">
              <Icon name="Activity" size={20} color="white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Estado de Reportes</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{totalReportes}</div>
            <div className="text-sm text-blue-700 font-medium">Total Reportes</div>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-2xl font-bold text-amber-600">{reportesPendientes}</div>
            <div className="text-sm text-amber-700 font-medium">Pendientes</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">{reportesCriticos}</div>
            <div className="text-sm text-red-700 font-medium">Críticos</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{reportesResueltos}</div>
            <div className="text-sm text-green-700 font-medium">Resueltos</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;