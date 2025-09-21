import React, { useState, useEffect } from 'react';
import { Icon } from '../common/Icons';
import { supabase } from '../../services/supabase';

const EvaluacionForm = () => {
  const [riesgos, setRiesgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [riesgoSeleccionado, setRiesgoSeleccionado] = useState(null);
  const [mensaje, setMensaje] = useState('');

  const [formData, setFormData] = useState({
    codigo_riesgo: '',
    version: '1.0',
    fecha_evaluacion: new Date().toISOString().split('T')[0],
    proceso: '',
    actividad: '',
    tarea: '',
    area: 'Centro Industrial',
    puesto_trabajo: '',
    peligro_identificado: '',
    clasificacion_peligro: 'Físico',
    descripcion_riesgo: '',
    efectos_salud: '',
    personas_expuestas: 1,
    tiempo_exposicion_horas: 8,
    rutinario: true,
    nivel_deficiencia: 10,
    nivel_exposicion: 4,
    nivel_consecuencia: 25,
    responsable_implementacion: '',
    fecha_implementacion: '',
    observaciones: ''
  });

  const clasificacionesPeligro = [
    'Biológico', 'Físico', 'Químico', 'Psicosocial', 'Biomecánico',
    'Condiciones de Seguridad', 'Fenómenos Naturales'
  ];

  const areas = [
    'Centro Industrial', 'Hornos Solera', 'Administrativa', 'Logística',
    'Mantenimiento', 'Calidad', 'Laboratorio', 'Bodega'
  ];

  const nivelesDeficiencia = [
    { valor: 10, texto: 'Muy Alto (MA): Se han detectado factores de riesgo significativos' },
    { valor: 6, texto: 'Alto (A): Se han detectado algunos factores de riesgo importantes' },
    { valor: 2, texto: 'Medio (M): Se han detectado factores de riesgo de menor importancia' },
    { valor: 0, texto: 'Bajo (B): No se han detectado anomalías destacables' }
  ];

  const nivelesExposicion = [
    { valor: 4, texto: 'Continua (EC): Continuamente. Varias veces en su jornada laboral con tiempo prolongado' },
    { valor: 3, texto: 'Frecuente (EF): Varias veces en su jornada laboral aunque sea con tiempos cortos' },
    { valor: 2, texto: 'Ocasional (EO): Alguna vez en su jornada laboral y por un período de tiempo corto' },
    { valor: 1, texto: 'Esporádica (EE): Irregularmente' }
  ];

  const nivelesConsecuencia = [
    { valor: 100, texto: 'Mortal o Catastrófico (M)' },
    { valor: 60, texto: 'Muy Grave (MG)' },
    { valor: 25, texto: 'Grave (G)' },
    { valor: 10, texto: 'Leve (L)' }
  ];

  useEffect(() => {
    cargarRiesgos();
  }, []);

  useEffect(() => {
    if (!modoEdicion) {
      generarCodigoRiesgo();
    }
  }, [modoEdicion, riesgos.length]);

  const cargarRiesgos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('matriz_riesgos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRiesgos(data || []);
    } catch (error) {
      console.error('Error al cargar riesgos:', error);
      setMensaje('Error al cargar los riesgos');
    } finally {
      setLoading(false);
    }
  };

  const generarCodigoRiesgo = () => {
    const año = new Date().getFullYear();
    const numero = String(riesgos.length + 1).padStart(3, '0');
    setFormData(prev => ({ ...prev, codigo_riesgo: `RG-${año}-${numero}` }));
  };

  const calcularNivelProbabilidad = (nd, ne) => nd * ne;

  const interpretarProbabilidad = (np) => {
    if (np >= 20) return 'Muy Alto (MA)';
    if (np >= 8) return 'Alto (A)';
    if (np >= 2) return 'Medio (M)';
    return 'Bajo (B)';
  };

  const calcularNivelRiesgo = (np, nc) => np * nc;

  const interpretarRiesgo = (nr) => {
    if (nr >= 600) return 'I - No Aceptable';
    if (nr >= 150) return 'II - No Aceptable o Aceptable con Control';
    if (nr >= 40) return 'III - Mejorable';
    return 'IV - Aceptable';
  };

  const getAceptabilidadRiesgo = (interpretacion) => {
    if (interpretacion.includes('No Aceptable')) return 'No Aceptable';
    if (interpretacion.includes('Control')) return 'Aceptable con Control';
    if (interpretacion.includes('Mejorable')) return 'Mejorable';
    return 'Aceptable';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.codigo_riesgo.trim() || !formData.proceso.trim() || !formData.actividad.trim() || !formData.descripcion_riesgo.trim()) {
      setMensaje('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      setLoading(true);

      const nivelProbabilidad = calcularNivelProbabilidad(formData.nivel_deficiencia, formData.nivel_exposicion);
      const interpretacionProbabilidad = interpretarProbabilidad(nivelProbabilidad);
      const nivelRiesgo = calcularNivelRiesgo(nivelProbabilidad, formData.nivel_consecuencia);
      const interpretacionRiesgo = interpretarRiesgo(nivelRiesgo);
      const aceptabilidadRiesgo = getAceptabilidadRiesgo(interpretacionRiesgo);

      const riesgoToSave = {
        ...formData,
        nivel_probabilidad: nivelProbabilidad,
        interpretacion_probabilidad: interpretacionProbabilidad,
        nivel_riesgo: nivelRiesgo,
        interpretacion_riesgo: interpretacionRiesgo,
        aceptabilidad_riesgo: aceptabilidadRiesgo,
        updated_at: new Date().toISOString()
      };

      if (modoEdicion && riesgoSeleccionado) {
        const { error } = await supabase
          .from('matriz_riesgos')
          .update(riesgoToSave)
          .eq('id', riesgoSeleccionado.id);

        if (error) throw error;
        setMensaje('Riesgo actualizado exitosamente');
      } else {
        riesgoToSave.created_at = new Date().toISOString();
        const { error } = await supabase
          .from('matriz_riesgos')
          .insert([riesgoToSave]);

        if (error) throw error;
        setMensaje('Riesgo guardado exitosamente');
      }

      resetForm();
      await cargarRiesgos();
    } catch (error) {
      console.error('Error al guardar riesgo:', error);
      setMensaje('Error al guardar el riesgo');
    } finally {
      setLoading(false);
    }
  };

  const editarRiesgo = (riesgo) => {
    setFormData(riesgo);
    setRiesgoSeleccionado(riesgo);
    setModoEdicion(true);
  };

  const resetForm = () => {
    setFormData({
      codigo_riesgo: '',
      version: '1.0',
      fecha_evaluacion: new Date().toISOString().split('T')[0],
      proceso: '',
      actividad: '',
      tarea: '',
      area: 'Centro Industrial',
      puesto_trabajo: '',
      peligro_identificado: '',
      clasificacion_peligro: 'Físico',
      descripcion_riesgo: '',
      efectos_salud: '',
      personas_expuestas: 1,
      tiempo_exposicion_horas: 8,
      rutinario: true,
      nivel_deficiencia: 10,
      nivel_exposicion: 4,
      nivel_consecuencia: 25,
      responsable_implementacion: '',
      fecha_implementacion: '',
      observaciones: ''
    });
    setModoEdicion(false);
    setRiesgoSeleccionado(null);
    setMensaje('');
    generarCodigoRiesgo();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 flex justify-center">
        <div className="flex items-center space-x-3">
          <Icon name="Refresh" size={24} className="animate-spin text-amber-600" />
          <span className="text-slate-600">Cargando formulario...</span>
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
            {modoEdicion ? 'Editar Evaluación de Riesgo' : 'Nueva Evaluación de Riesgo'}
          </h2>
          <p className="text-slate-600 mt-1">Metodología GTC-45 - Identificación y evaluación de peligros</p>
        </div>
        {modoEdicion && (
          <button
            onClick={resetForm}
            className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Icon name="Plus" size={16} />
            <span>Nueva Evaluación</span>
          </button>
        )}
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información Básica */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
            <Icon name="FileText" size={20} className="text-amber-600" />
            <span>Información Básica</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Código del Riesgo *
              </label>
              <input
                type="text"
                value={formData.codigo_riesgo}
                onChange={(e) => setFormData({...formData, codigo_riesgo: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="RG-2024-001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha de Evaluación
              </label>
              <input
                type="date"
                value={formData.fecha_evaluacion}
                onChange={(e) => setFormData({...formData, fecha_evaluacion: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Proceso *
              </label>
              <input
                type="text"
                value={formData.proceso}
                onChange={(e) => setFormData({...formData, proceso: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Ej: Producción, Mantenimiento..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Actividad *
              </label>
              <input
                type="text"
                value={formData.actividad}
                onChange={(e) => setFormData({...formData, actividad: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Actividad específica..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Área
              </label>
              <select
                value={formData.area}
                onChange={(e) => setFormData({...formData, area: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                {areas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Puesto de Trabajo
              </label>
              <input
                type="text"
                value={formData.puesto_trabajo}
                onChange={(e) => setFormData({...formData, puesto_trabajo: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Cargo o puesto específico..."
              />
            </div>
          </div>
        </div>

        {/* Identificación del Peligro */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
            <Icon name="AlertTriangle" size={20} className="text-amber-600" />
            <span>Identificación del Peligro</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Peligro Identificado *
              </label>
              <input
                type="text"
                value={formData.peligro_identificado}
                onChange={(e) => setFormData({...formData, peligro_identificado: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Descripción del peligro..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Clasificación del Peligro
              </label>
              <select
                value={formData.clasificacion_peligro}
                onChange={(e) => setFormData({...formData, clasificacion_peligro: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                {clasificacionesPeligro.map(clasificacion => (
                  <option key={clasificacion} value={clasificacion}>{clasificacion}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descripción del Riesgo *
              </label>
              <textarea
                value={formData.descripcion_riesgo}
                onChange={(e) => setFormData({...formData, descripcion_riesgo: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                rows={3}
                placeholder="Describe detalladamente el riesgo..."
                required
              />
            </div>
          </div>
        </div>

        {/* Evaluación GTC-45 */}
        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
            <Icon name="BarChart3" size={20} className="text-blue-600" />
            <span>Evaluación GTC-45</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nivel de Deficiencia
              </label>
              <select
                value={formData.nivel_deficiencia}
                onChange={(e) => setFormData({...formData, nivel_deficiencia: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {nivelesDeficiencia.map(nivel => (
                  <option key={nivel.valor} value={nivel.valor}>{nivel.texto}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nivel de Exposición
              </label>
              <select
                value={formData.nivel_exposicion}
                onChange={(e) => setFormData({...formData, nivel_exposicion: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {nivelesExposicion.map(nivel => (
                  <option key={nivel.valor} value={nivel.valor}>{nivel.texto}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nivel de Consecuencia
              </label>
              <select
                value={formData.nivel_consecuencia}
                onChange={(e) => setFormData({...formData, nivel_consecuencia: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {nivelesConsecuencia.map(nivel => (
                  <option key={nivel.valor} value={nivel.valor}>{nivel.texto}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cálculos automáticos */}
          <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Cálculos Automáticos</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {calcularNivelProbabilidad(formData.nivel_deficiencia, formData.nivel_exposicion)}
                </div>
                <div className="text-xs text-slate-600">Nivel Probabilidad</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {interpretarProbabilidad(calcularNivelProbabilidad(formData.nivel_deficiencia, formData.nivel_exposicion))}
                </div>
                <div className="text-xs text-slate-600">Interpretación</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {calcularNivelRiesgo(calcularNivelProbabilidad(formData.nivel_deficiencia, formData.nivel_exposicion), formData.nivel_consecuencia)}
                </div>
                <div className="text-xs text-slate-600">Nivel Riesgo</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {interpretarRiesgo(calcularNivelRiesgo(calcularNivelProbabilidad(formData.nivel_deficiencia, formData.nivel_exposicion), formData.nivel_consecuencia))}
                </div>
                <div className="text-xs text-slate-600">Aceptabilidad</div>
              </div>
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
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl font-semibold hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-lg disabled:opacity-50"
          >
            {loading ? 'Guardando...' : modoEdicion ? 'Actualizar Riesgo' : 'Guardar Riesgo'}
          </button>
        </div>
      </form>

      {/* Lista de Riesgos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700">
          <h3 className="text-lg font-semibold text-white">Riesgos Registrados</h3>
        </div>

        {riesgos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Proceso</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Peligro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nivel Riesgo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {riesgos.map((riesgo) => (
                  <tr key={riesgo.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {riesgo.codigo_riesgo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {riesgo.proceso}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate">
                      {riesgo.peligro_identificado}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="font-bold text-red-600">
                        {riesgo.nivel_riesgo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => editarRiesgo(riesgo)}
                        className="text-amber-600 hover:text-amber-900 flex items-center space-x-1"
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
            <Icon name="AlertTriangle" size={32} className="text-slate-400 mx-auto mb-2" />
            <p className="text-slate-600">No hay evaluaciones de riesgo registradas</p>
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

export default EvaluacionForm;