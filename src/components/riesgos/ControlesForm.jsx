import React, { useState, useEffect } from 'react';
import { Icon } from '../common/Icons';
import { supabase } from '../../services/supabase';

const ControlesForm = () => {
  const [controles, setControles] = useState([]);
  const [riesgos, setRiesgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [controlSeleccionado, setControlSeleccionado] = useState(null);
  const [mensaje, setMensaje] = useState('');

  const [formData, setFormData] = useState({
    riesgo_id: '',
    tipo_control: 'Controles de Ingeniería',
    descripcion_control: '',
    responsable: '',
    fecha_implementacion: '',
    fecha_limite: '',
    eficacia: 'Media',
    costo_estimado: 0,
    recursos_necesarios: '',
    estado: 'Planificado',
    observaciones: ''
  });

  const tiposControl = [
    'Eliminación',
    'Sustitución',
    'Controles de Ingeniería',
    'Controles Administrativos',
    'Equipos de Protección Personal'
  ];

  const nivelesEficacia = ['Baja', 'Media', 'Alta'];

  const estadosControl = [
    'Planificado',
    'En Proceso',
    'Implementado',
    'Verificado',
    'Pausado'
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [controlesRes, riesgosRes] = await Promise.all([
        supabase.from('controles_riesgo').select('*').order('created_at', { ascending: false }),
        supabase.from('matriz_riesgos').select('id, codigo_riesgo, proceso, peligro_identificado, nivel_riesgo').order('codigo_riesgo')
      ]);

      if (controlesRes.error) throw controlesRes.error;
      if (riesgosRes.error) throw riesgosRes.error;

      setControles(controlesRes.data || []);
      setRiesgos(riesgosRes.data || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setMensaje('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.tipo_control || !formData.descripcion_control.trim()) {
      setMensaje('Tipo de control y descripción son obligatorios');
      return;
    }

    try {
      setLoading(true);

      const controlToSave = {
        ...formData,
        costo_estimado: Number(formData.costo_estimado) || 0,
        updated_at: new Date().toISOString()
      };

      if (modoEdicion && controlSeleccionado) {
        const { error } = await supabase
          .from('controles_riesgo')
          .update(controlToSave)
          .eq('id', controlSeleccionado.id);

        if (error) throw error;
        setMensaje('Control actualizado exitosamente');
      } else {
        controlToSave.created_at = new Date().toISOString();
        const { error } = await supabase
          .from('controles_riesgo')
          .insert([controlToSave]);

        if (error) throw error;
        setMensaje('Control guardado exitosamente');
      }

      resetForm();
      await cargarDatos();
    } catch (error) {
      console.error('Error al guardar control:', error);
      setMensaje('Error al guardar el control');
    } finally {
      setLoading(false);
    }
  };

  const editarControl = (control) => {
    setFormData(control);
    setControlSeleccionado(control);
    setModoEdicion(true);
  };

  const resetForm = () => {
    setFormData({
      riesgo_id: '',
      tipo_control: 'Controles de Ingeniería',
      descripcion_control: '',
      responsable: '',
      fecha_implementacion: '',
      fecha_limite: '',
      eficacia: 'Media',
      costo_estimado: 0,
      recursos_necesarios: '',
      estado: 'Planificado',
      observaciones: ''
    });
    setModoEdicion(false);
    setControlSeleccionado(null);
    setMensaje('');
  };

  const getRiesgoInfo = (riesgoId) => {
    return riesgos.find(r => r.id === riesgoId);
  };

  const getColorByTipo = (tipo) => {
    switch (tipo) {
      case 'Eliminación': return 'bg-red-100 text-red-800';
      case 'Sustitución': return 'bg-orange-100 text-orange-800';
      case 'Controles de Ingeniería': return 'bg-blue-100 text-blue-800';
      case 'Controles Administrativos': return 'bg-purple-100 text-purple-800';
      case 'Equipos de Protección Personal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getColorByEstado = (estado) => {
    switch (estado) {
      case 'Planificado': return 'bg-gray-100 text-gray-800';
      case 'En Proceso': return 'bg-yellow-100 text-yellow-800';
      case 'Implementado': return 'bg-green-100 text-green-800';
      case 'Verificado': return 'bg-blue-100 text-blue-800';
      case 'Pausado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 flex justify-center">
        <div className="flex items-center space-x-3">
          <Icon name="Refresh" size={24} className="animate-spin text-emerald-600" />
          <span className="text-slate-600">Cargando controles...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {modoEdicion ? 'Editar Control de Riesgo' : 'Nuevo Control de Riesgo'}
          </h2>
          <p className="text-slate-600 mt-1">Gestión de medidas de control según jerarquía de controles SST</p>
        </div>
        {modoEdicion && (
          <button
            onClick={resetForm}
            className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Icon name="Plus" size={16} />
            <span>Nuevo Control</span>
          </button>
        )}
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información del Control */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
            <Icon name="Shield" size={20} className="text-emerald-600" />
            <span>Información del Control</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Riesgo Asociado
              </label>
              <select
                value={formData.riesgo_id}
                onChange={(e) => setFormData({...formData, riesgo_id: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Seleccionar riesgo (opcional)</option>
                {riesgos.map(riesgo => (
                  <option key={riesgo.id} value={riesgo.id}>
                    {riesgo.codigo_riesgo} - {riesgo.proceso}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipo de Control *
              </label>
              <select
                value={formData.tipo_control}
                onChange={(e) => setFormData({...formData, tipo_control: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              >
                {tiposControl.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descripción del Control *
              </label>
              <textarea
                value={formData.descripcion_control}
                onChange={(e) => setFormData({...formData, descripcion_control: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                rows={3}
                placeholder="Describe detalladamente el control a implementar..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Responsable
              </label>
              <input
                type="text"
                value={formData.responsable}
                onChange={(e) => setFormData({...formData, responsable: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Persona responsable de la implementación"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Estado
              </label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({...formData, estado: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {estadosControl.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Fechas y Eficacia */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
            <Icon name="Calendar" size={20} className="text-emerald-600" />
            <span>Programación y Eficacia</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha de Implementación
              </label>
              <input
                type="date"
                value={formData.fecha_implementacion}
                onChange={(e) => setFormData({...formData, fecha_implementacion: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha Límite
              </label>
              <input
                type="date"
                value={formData.fecha_limite}
                onChange={(e) => setFormData({...formData, fecha_limite: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Eficacia del Control
              </label>
              <select
                value={formData.eficacia}
                onChange={(e) => setFormData({...formData, eficacia: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {nivelesEficacia.map(nivel => (
                  <option key={nivel} value={nivel}>{nivel}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Recursos */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
            <Icon name="DollarSign" size={20} className="text-emerald-600" />
            <span>Recursos Necesarios</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Costo Estimado ($)
              </label>
              <input
                type="number"
                value={formData.costo_estimado}
                onChange={(e) => setFormData({...formData, costo_estimado: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Recursos Necesarios
              </label>
              <input
                type="text"
                value={formData.recursos_necesarios}
                onChange={(e) => setFormData({...formData, recursos_necesarios: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Equipos, personal, materiales..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                rows={3}
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 shadow-lg disabled:opacity-50"
          >
            {loading ? 'Guardando...' : modoEdicion ? 'Actualizar Control' : 'Guardar Control'}
          </button>
        </div>
      </form>

      {/* Lista de Controles */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700">
          <h3 className="text-lg font-semibold text-white">Controles Registrados</h3>
        </div>

        {controles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Responsable</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Eficacia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {controles.map((control) => (
                  <tr key={control.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getColorByTipo(control.tipo_control)}`}>
                        {control.tipo_control}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate">
                      {control.descripcion_control}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {control.responsable || 'Sin asignar'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getColorByEstado(control.estado)}`}>
                        {control.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {control.eficacia}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => editarControl(control)}
                        className="text-emerald-600 hover:text-emerald-900 flex items-center space-x-1"
                      >
                        <Icon name="Edit" size={16} />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Icon name="Shield" size={32} className="text-slate-400 mx-auto mb-2" />
            <p className="text-slate-600">No hay controles de riesgo registrados</p>
          </div>
        )}
      </div>

      {/* Mensaje de estado */}
      {mensaje && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
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

export default ControlesForm;