import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Icon } from '../common/Icons';

const RiesgosDashboard = () => {
  const [riesgos, setRiesgos] = useState([]);
  const [controles, setControles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [riesgosRes, controlesRes] = await Promise.all([
        supabase.from('matriz_riesgos').select('*').order('nivel_riesgo', { ascending: false }),
        supabase.from('controles_riesgo').select('*').order('created_at', { ascending: false })
      ]);

      if (riesgosRes.error) throw riesgosRes.error;
      if (controlesRes.error) throw controlesRes.error;

      setRiesgos(riesgosRes.data || []);
      setControles(controlesRes.data || []);

    } catch (error) {
      console.error('Error al cargar datos:', error);
      setMensaje('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const getEstadisticas = () => {
    const totalRiesgos = riesgos.length;
    const riesgosCriticos = riesgos.filter(r => r.nivel_riesgo >= 600).length;
    const riesgosAltos = riesgos.filter(r => r.nivel_riesgo >= 150 && r.nivel_riesgo < 600).length;
    const riesgosMedios = riesgos.filter(r => r.nivel_riesgo >= 40 && r.nivel_riesgo < 150).length;
    const riesgosBajos = riesgos.filter(r => r.nivel_riesgo < 40).length;

    return {
      totalRiesgos,
      riesgosCriticos,
      riesgosAltos,
      riesgosMedios,
      riesgosBajos
    };
  };

  const estadisticas = getEstadisticas();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 flex justify-center">
        <div className="flex items-center space-x-3">
          <Icon name="Refresh" size={24} className="animate-spin text-red-600" />
          <span className="text-slate-600">Cargando datos de riesgos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Estadísticas Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Riesgos</p>
              <p className="text-3xl font-bold text-blue-600">{estadisticas.totalRiesgos}</p>
              <p className="text-xs text-slate-500 mt-1">registrados</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3">
              <Icon name="FileText" size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Riesgos Críticos</p>
              <p className="text-3xl font-bold text-red-600">{estadisticas.riesgosCriticos}</p>
              <p className="text-xs text-slate-500 mt-1">requieren acción inmediata</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-3">
              <Icon name="AlertTriangle" size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Riesgos Altos</p>
              <p className="text-3xl font-bold text-orange-600">{estadisticas.riesgosAltos}</p>
              <p className="text-xs text-slate-500 mt-1">necesitan control</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-3">
              <Icon name="AlertCircle" size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Controles Activos</p>
              <p className="text-3xl font-bold text-green-600">{controles.length}</p>
              <p className="text-xs text-slate-500 mt-1">implementados</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3">
              <Icon name="Shield" size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Título y descripción */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Matriz de Riesgos - Metodología GTC 45</h2>
        <p className="text-slate-600 mt-1">Identificación, evaluación y control de riesgos laborales</p>
      </div>

      {/* Tabla de riesgos */}
      {riesgos.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Código</th>
                  <th className="px-6 py-4 text-left font-semibold">Proceso</th>
                  <th className="px-6 py-4 text-left font-semibold">Peligro</th>
                  <th className="px-6 py-4 text-left font-semibold">Clasificación</th>
                  <th className="px-6 py-4 text-left font-semibold">Nivel Riesgo</th>
                  <th className="px-6 py-4 text-left font-semibold">Aceptabilidad</th>
                </tr>
              </thead>
              <tbody>
                {riesgos.map((riesgo, index) => (
                  <tr key={riesgo.id || index} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {riesgo.codigo_riesgo}
                    </td>
                    <td className="px-6 py-4 text-slate-700 max-w-xs truncate">
                      {riesgo.proceso}
                    </td>
                    <td className="px-6 py-4 text-slate-700 max-w-xs truncate">
                      {riesgo.peligro_identificado}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {riesgo.clasificacion_peligro}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-lg text-red-600">
                          {riesgo.nivel_riesgo || 'N/A'}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({riesgo.interpretacion_riesgo})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        riesgo.aceptabilidad_riesgo === 'Aceptable' ? 'bg-green-100 text-green-800' :
                        riesgo.aceptabilidad_riesgo === 'Aceptable con controles' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {riesgo.aceptabilidad_riesgo || 'Sin evaluar'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 py-16">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Icon name="AlertTriangle" size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay riesgos registrados</h3>
            <p className="text-slate-600 mb-6">Comienza creando tu primera evaluación de riesgo siguiendo la metodología GTC-45</p>
            <p className="text-sm text-slate-500">
              Usa la pestaña "Evaluación de Riesgos" para crear nuevos registros
            </p>
          </div>
        </div>
      )}

      {/* Mensaje de estado */}
      {mensaje && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {mensaje}
          <button
            onClick={() => setMensaje('')}
            className="ml-2 text-white/80 hover:text-white"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default RiesgosDashboard;