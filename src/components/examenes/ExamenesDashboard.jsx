import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Icon } from '../common/Icons';
import { supabase } from '../../services/supabase';

const COLORS = ['#059669', '#dc2626', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4'];

const ExamenesDashboard = () => {
  const [examenes, setExamenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    año: new Date().getFullYear(),
    tipo: 'todos',
    resultado: 'todos'
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('examenes_medicos_sst')
        .select('*')
        .gte('fecha_realizacion', `${filtros.año}-01-01`)
        .lte('fecha_realizacion', `${filtros.año}-12-31`)
        .order('fecha_realizacion', { ascending: false });

      if (error) throw error;
      setExamenes(data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const isVencido = (fechaVencimiento) => {
    if (!fechaVencimiento) return false;
    return new Date(fechaVencimiento) < new Date();
  };

  const isProximoVencer = (fechaVencimiento) => {
    if (!fechaVencimiento) return false;
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diasRestantes = (vencimiento - hoy) / (1000 * 60 * 60 * 24);
    return diasRestantes > 0 && diasRestantes <= 30;
  };

  const estadisticas = useMemo(() => {
    if (!examenes.length) return {
      totalExamenes: 0,
      aptos: 0,
      noAptos: 0,
      pendientes: 0,
      proximosVencer: 0,
      vencidos: 0
    };

    const aptos = examenes.filter(e => e.resultado === 'apto').length;
    const noAptos = examenes.filter(e => e.resultado === 'no_apto').length;
    const pendientes = examenes.filter(e => e.resultado === 'pendiente').length;
    const proximosVencer = examenes.filter(e => isProximoVencer(e.fecha_vencimiento)).length;
    const vencidos = examenes.filter(e => isVencido(e.fecha_vencimiento)).length;

    return {
      totalExamenes: examenes.length,
      aptos,
      noAptos,
      pendientes,
      proximosVencer,
      vencidos
    };
  }, [examenes]);

  const datosResultados = useMemo(() => {
    if (!examenes.length) return [];

    const resultados = {
      'apto': { name: 'Apto', value: 0, color: '#059669' },
      'no_apto': { name: 'No Apto', value: 0, color: '#dc2626' },
      'pendiente': { name: 'Pendiente', value: 0, color: '#f59e0b' },
      'apto_con_restricciones': { name: 'Apto con Restricciones', value: 0, color: '#3b82f6' }
    };

    examenes.forEach(examen => {
      if (resultados[examen.resultado]) {
        resultados[examen.resultado].value++;
      }
    });

    return Object.values(resultados).filter(item => item.value > 0);
  }, [examenes]);

  const datosTiposExamen = useMemo(() => {
    if (!examenes.length) return [];

    const tipos = {};
    examenes.forEach(examen => {
      const tipo = examen.tipo_examen || 'Sin clasificar';
      tipos[tipo] = (tipos[tipo] || 0) + 1;
    });

    return Object.entries(tipos)
      .map(([tipo, cantidad]) => ({
        tipo: tipo.length > 15 ? tipo.substring(0, 15) + '...' : tipo,
        cantidad
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 8);
  }, [examenes]);

  const datosExamenesMes = useMemo(() => {
    if (!examenes.length) return [];

    const meses = {};
    examenes.forEach(examen => {
      if (examen.fecha_realizacion) {
        const fecha = new Date(examen.fecha_realizacion);
        const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

        if (!meses[mesKey]) {
          meses[mesKey] = { mes: mesKey, examenes: 0, aptos: 0, no_aptos: 0 };
        }

        meses[mesKey].examenes += 1;
        if (examen.resultado === 'apto') meses[mesKey].aptos += 1;
        if (examen.resultado === 'no_apto') meses[mesKey].no_aptos += 1;
      }
    });

    return Object.values(meses).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [examenes]);

  const examenesProximosVencer = useMemo(() => {
    return examenes
      .filter(e => isProximoVencer(e.fecha_vencimiento))
      .sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento))
      .slice(0, 5);
  }, [examenes]);

  const tarjetasEstadisticas = [
    {
      titulo: 'Total Exámenes',
      valor: estadisticas.totalExamenes,
      icono: 'FileText',
      color: 'from-rose-500 to-rose-600',
      formato: 'numero'
    },
    {
      titulo: 'Aptos',
      valor: estadisticas.aptos,
      icono: 'CheckCircle',
      color: 'from-green-500 to-green-600',
      formato: 'numero'
    },
    {
      titulo: 'Pendientes',
      valor: estadisticas.pendientes,
      icono: 'Clock',
      color: 'from-amber-500 to-amber-600',
      formato: 'numero'
    },
    {
      titulo: 'Próximos a Vencer',
      valor: estadisticas.proximosVencer,
      icono: 'AlertTriangle',
      color: 'from-orange-500 to-orange-600',
      formato: 'numero'
    }
  ];

  const formatearValor = (valor, formato) => {
    switch (formato) {
      case 'numero':
        return new Intl.NumberFormat('es-CO').format(valor);
      case 'porcentaje':
        return `${valor.toFixed(1)}%`;
      default:
        return valor;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2 text-slate-600">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-600"></div>
          <span>Cargando dashboard de exámenes médicos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Icon name="Filter" size={20} className="text-slate-500" />
            <span className="font-medium text-slate-700">Filtros:</span>
          </div>

          <select
            value={filtros.año}
            onChange={(e) => setFiltros(prev => ({ ...prev, año: parseInt(e.target.value) }))}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(año => (
              <option key={año} value={año}>{año}</option>
            ))}
          </select>

          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          >
            <option value="todos">Todos los tipos</option>
            <option value="Ingreso">Ingreso</option>
            <option value="Periódico">Periódico</option>
            <option value="Egreso">Egreso</option>
            <option value="Post-incidente">Post-incidente</option>
            <option value="Reintegro">Reintegro</option>
          </select>

          <select
            value={filtros.resultado}
            onChange={(e) => setFiltros(prev => ({ ...prev, resultado: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          >
            <option value="todos">Todos los resultados</option>
            <option value="apto">Apto</option>
            <option value="no_apto">No Apto</option>
            <option value="pendiente">Pendiente</option>
            <option value="apto_con_restricciones">Apto con Restricciones</option>
          </select>

          <button
            onClick={cargarDatos}
            className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors flex items-center space-x-2"
          >
            <Icon name="RefreshCw" size={16} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tarjetasEstadisticas.map((tarjeta, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{tarjeta.titulo}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {formatearValor(tarjeta.valor, tarjeta.formato)}
                </p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-r ${tarjeta.color} rounded-xl flex items-center justify-center`}>
                <Icon name={tarjeta.icono} size={24} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resultados de Exámenes */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Resultados de Exámenes</h3>
            <Icon name="PieChart" size={20} className="text-slate-500" />
          </div>

          {datosResultados.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosResultados}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {datosResultados.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <Icon name="FileText" size={48} className="mx-auto mb-2 opacity-50" />
                <p>No hay datos de exámenes</p>
              </div>
            </div>
          )}
        </div>

        {/* Tipos de Exámenes */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Tipos de Exámenes</h3>
            <Icon name="BarChart" size={20} className="text-slate-500" />
          </div>

          {datosTiposExamen.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosTiposExamen} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="tipo" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill="#f43f5e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <Icon name="BarChart" size={48} className="mx-auto mb-2 opacity-50" />
                <p>No hay datos por tipo</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tendencia de Exámenes */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Tendencia de Exámenes por Mes</h3>
          <Icon name="TrendingUp" size={20} className="text-slate-500" />
        </div>

        {datosExamenesMes.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datosExamenesMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="examenes"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  name="Total Exámenes"
                />
                <Line
                  type="monotone"
                  dataKey="aptos"
                  stroke="#059669"
                  strokeWidth={2}
                  name="Aptos"
                />
                <Line
                  type="monotone"
                  dataKey="no_aptos"
                  stroke="#dc2626"
                  strokeWidth={2}
                  name="No Aptos"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <Icon name="TrendingUp" size={48} className="mx-auto mb-2 opacity-50" />
              <p>No hay datos de tendencias</p>
            </div>
          </div>
        )}
      </div>

      {/* Alertas de Vencimientos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Exámenes Próximos a Vencer
          </h3>
          <div className="flex items-center space-x-2">
            <Icon name="AlertTriangle" size={20} className="text-amber-500" />
            <span className="text-sm font-medium text-amber-600">
              {examenesProximosVencer.length} exámenes requieren renovación
            </span>
          </div>
        </div>

        {examenesProximosVencer.length > 0 ? (
          <div className="space-y-3">
            {examenesProximosVencer.map((examen) => {
              const diasRestantes = Math.ceil((new Date(examen.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24));

              return (
                <div key={examen.id} className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Icon name="Heart" size={20} className="text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{examen.colaborador_nombre}</h4>
                      <p className="text-sm text-slate-600">{examen.tipo_examen}</p>
                      {examen.entidad_realiza && (
                        <p className="text-xs text-slate-500">{examen.entidad_realiza}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-600">Vence en:</span>
                      <span className="font-bold text-amber-600">{diasRestantes} días</span>
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      {new Date(examen.fecha_vencimiento).toLocaleDateString('es-ES')}
                    </div>
                    <div className={`text-xs mt-1 px-2 py-1 rounded-full ${
                      examen.resultado === 'apto' ? 'bg-green-100 text-green-800' :
                      examen.resultado === 'no_apto' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {examen.resultado === 'apto' ? 'Apto' :
                       examen.resultado === 'no_apto' ? 'No Apto' :
                       examen.resultado === 'apto_con_restricciones' ? 'Apto c/Restricciones' :
                       'Pendiente'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Icon name="CheckCircle" size={48} className="mx-auto mb-2 text-green-500" />
            <p className="font-medium">¡Excelente! Todos los exámenes están vigentes</p>
            <p className="text-sm mt-1">No hay exámenes próximos a vencer en los próximos 30 días</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamenesDashboard;