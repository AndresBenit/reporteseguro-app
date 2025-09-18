import React, { useState, useEffect } from 'react';
import { Icon } from '../common/Icons';
import { FormComponents } from '../common/FormComponents';
import { supabase } from '../../services/supabase';

const ExamenForm = () => {
  const [examenes, setExamenes] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [examenSeleccionado, setExamenSeleccionado] = useState(null);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    tipo: 'todos',
    resultado: 'todos',
    vencimiento: 'todos'
  });

  const [formData, setFormData] = useState({
    tipo_examen: 'Ingreso',
    colaborador_nombre: '',
    fecha_realizacion: '',
    fecha_vencimiento: '',
    entidad_realiza: '',
    medico_tratante: '',
    resultado: 'pendiente',
    observaciones: '',
    archivo_url: '',
    cumple_normativa: true
  });

  const [errores, setErrores] = useState({});

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [examenesRes, colaboradoresRes] = await Promise.all([
        supabase.from('examenes_medicos_sst').select('*').order('fecha_realizacion', { ascending: false }),
        supabase.from('colaboradores').select('id, nombre_completo, documento, cargo, area').eq('activo', true).order('nombre_completo')
      ]);

      if (examenesRes.error) throw examenesRes.error;
      if (colaboradoresRes.error) throw colaboradoresRes.error;

      setExamenes(examenesRes.data || []);
      setColaboradores(colaboradoresRes.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.tipo_examen) {
      nuevosErrores.tipo_examen = 'El tipo de examen es obligatorio';
    }

    if (!formData.colaborador_nombre?.trim()) {
      nuevosErrores.colaborador_nombre = 'El nombre del colaborador es obligatorio';
    }

    if (!formData.fecha_realizacion) {
      nuevosErrores.fecha_realizacion = 'La fecha de realización es obligatoria';
    }

    if (formData.fecha_vencimiento && formData.fecha_realizacion) {
      if (new Date(formData.fecha_vencimiento) <= new Date(formData.fecha_realizacion)) {
        nuevosErrores.fecha_vencimiento = 'La fecha de vencimiento debe ser posterior a la fecha de realización';
      }
    }

    // Validar que el colaborador existe en la lista
    if (formData.colaborador_nombre) {
      const colaboradorExiste = colaboradores.some(c =>
        c.nombre_completo.toLowerCase() === formData.colaborador_nombre.toLowerCase()
      );
      if (!colaboradorExiste) {
        nuevosErrores.colaborador_nombre = 'El colaborador debe seleccionarse de la lista';
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      setLoading(true);

      const datosExamen = {
        ...formData,
        fecha_vencimiento: formData.fecha_vencimiento || null
      };

      let result;
      if (modoEdicion && examenSeleccionado) {
        result = await supabase
          .from('examenes_medicos_sst')
          .update(datosExamen)
          .eq('id', examenSeleccionado.id);
      } else {
        result = await supabase
          .from('examenes_medicos_sst')
          .insert([datosExamen]);
      }

      if (result.error) throw result.error;

      await cargarDatos();
      resetearFormulario();

    } catch (error) {
      console.error('Error guardando examen:', error);
      setErrores({ submit: 'Error al guardar el examen médico. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const editarExamen = (examen) => {
    setExamenSeleccionado(examen);
    setFormData({
      tipo_examen: examen.tipo_examen || 'Ingreso',
      colaborador_nombre: examen.colaborador_nombre || '',
      fecha_realizacion: examen.fecha_realizacion || '',
      fecha_vencimiento: examen.fecha_vencimiento || '',
      entidad_realiza: examen.entidad_realiza || '',
      medico_tratante: examen.medico_tratante || '',
      resultado: examen.resultado || 'pendiente',
      observaciones: examen.observaciones || '',
      archivo_url: examen.archivo_url || '',
      cumple_normativa: examen.cumple_normativa !== false
    });
    setModoEdicion(true);
    setErrores({});
  };

  const eliminarExamen = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este examen médico?')) return;

    try {
      const { error } = await supabase
        .from('examenes_medicos_sst')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await cargarDatos();
    } catch (error) {
      console.error('Error eliminando examen:', error);
    }
  };

  const resetearFormulario = () => {
    setFormData({
      tipo_examen: 'Ingreso',
      colaborador_nombre: '',
      fecha_realizacion: '',
      fecha_vencimiento: '',
      entidad_realiza: '',
      medico_tratante: '',
      resultado: 'pendiente',
      observaciones: '',
      archivo_url: '',
      cumple_normativa: true
    });
    setModoEdicion(false);
    setExamenSeleccionado(null);
    setErrores({});
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

  const examenesFiltrados = examenes.filter(examen => {
    const cumpleBusqueda = !filtros.busqueda ||
      examen.colaborador_nombre?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      examen.tipo_examen?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      examen.medico_tratante?.toLowerCase().includes(filtros.busqueda.toLowerCase());

    const cumpleTipo = filtros.tipo === 'todos' || examen.tipo_examen === filtros.tipo;

    const cumpleResultado = filtros.resultado === 'todos' || examen.resultado === filtros.resultado;

    const cumpleVencimiento = filtros.vencimiento === 'todos' ||
      (filtros.vencimiento === 'vigente' && !isVencido(examen.fecha_vencimiento)) ||
      (filtros.vencimiento === 'vencido' && isVencido(examen.fecha_vencimiento)) ||
      (filtros.vencimiento === 'proximo_vencer' && isProximoVencer(examen.fecha_vencimiento));

    return cumpleBusqueda && cumpleTipo && cumpleResultado && cumpleVencimiento;
  });

  const tiposExamen = [
    'Ingreso',
    'Periódico',
    'Egreso',
    'Post-incidente',
    'Reintegro',
    'Optométrico',
    'Audiométrico',
    'Espirometría',
    'Visiometría',
    'Rayos X Tórax',
    'Laboratorio Clínico',
    'Electrocardiograma',
    'Otro'
  ];

  const entidadesMedicas = [
    'EPS',
    'ARL',
    'IPS Privada',
    'Clínica Ocupacional',
    'Hospital',
    'Centro Médico',
    'Otro'
  ];

  const resultadosPosibles = [
    'pendiente',
    'apto',
    'no_apto',
    'apto_con_restricciones'
  ];

  const obtenerEtiquetaResultado = (resultado) => {
    const etiquetas = {
      'pendiente': 'Pendiente',
      'apto': 'Apto',
      'no_apto': 'No Apto',
      'apto_con_restricciones': 'Apto con Restricciones'
    };
    return etiquetas[resultado] || resultado;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2 text-slate-600">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
          <span>Cargando exámenes médicos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Formulario de Examen */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            {modoEdicion ? 'Editar Examen Médico' : 'Registrar Nuevo Examen Médico'}
          </h3>
          {modoEdicion && (
            <button
              onClick={resetearFormulario}
              className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center space-x-2"
            >
              <Icon name="X" size={16} />
              <span>Cancelar</span>
            </button>
          )}
        </div>

        <form onSubmit={manejarSubmit} className="space-y-6">
          {/* Información del Examen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormComponents.Select
              label="Tipo de Examen"
              value={formData.tipo_examen}
              onChange={(e) => setFormData(prev => ({ ...prev, tipo_examen: e.target.value }))}
              error={errores.tipo_examen}
              required
              options={tiposExamen.map(tipo => ({ value: tipo, label: tipo }))}
            />

            <div>
              <FormComponents.Input
                label="Colaborador"
                value={formData.colaborador_nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, colaborador_nombre: e.target.value }))}
                error={errores.colaborador_nombre}
                required
                placeholder="Seleccione el colaborador"
                list="colaboradores-list"
              />
              <datalist id="colaboradores-list">
                {colaboradores.map(colaborador => (
                  <option key={colaborador.id} value={colaborador.nombre_completo}>
                    {colaborador.cargo} - {colaborador.area}
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormComponents.Input
              label="Fecha de Realización"
              type="date"
              value={formData.fecha_realizacion}
              onChange={(e) => setFormData(prev => ({ ...prev, fecha_realizacion: e.target.value }))}
              error={errores.fecha_realizacion}
              required
            />

            <FormComponents.Input
              label="Fecha de Vencimiento"
              type="date"
              value={formData.fecha_vencimiento}
              onChange={(e) => setFormData(prev => ({ ...prev, fecha_vencimiento: e.target.value }))}
              error={errores.fecha_vencimiento}
            />
          </div>

          {/* Información Médica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormComponents.Select
              label="Entidad que Realiza"
              value={formData.entidad_realiza}
              onChange={(e) => setFormData(prev => ({ ...prev, entidad_realiza: e.target.value }))}
              options={entidadesMedicas.map(entidad => ({ value: entidad, label: entidad }))}
              placeholder="Seleccionar entidad"
            />

            <FormComponents.Input
              label="Médico Tratante"
              value={formData.medico_tratante}
              onChange={(e) => setFormData(prev => ({ ...prev, medico_tratante: e.target.value }))}
              placeholder="Nombre del médico"
            />
          </div>

          {/* Resultado y Cumplimiento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormComponents.Select
              label="Resultado"
              value={formData.resultado}
              onChange={(e) => setFormData(prev => ({ ...prev, resultado: e.target.value }))}
              options={resultadosPosibles.map(resultado => ({
                value: resultado,
                label: obtenerEtiquetaResultado(resultado)
              }))}
              required
            />

            <div className="flex items-center space-x-3 mt-6">
              <input
                type="checkbox"
                id="cumple_normativa"
                checked={formData.cumple_normativa}
                onChange={(e) => setFormData(prev => ({ ...prev, cumple_normativa: e.target.checked }))}
                className="w-4 h-4 text-teal-600 bg-slate-100 border-slate-300 rounded focus:ring-teal-500"
              />
              <label htmlFor="cumple_normativa" className="text-sm font-medium text-slate-700">
                Cumple con la normativa
              </label>
            </div>
          </div>

          {/* Archivo */}
          <FormComponents.Input
            label="URL del Archivo o Documento"
            type="url"
            value={formData.archivo_url}
            onChange={(e) => setFormData(prev => ({ ...prev, archivo_url: e.target.value }))}
            placeholder="https://..."
          />

          {/* Observaciones */}
          <FormComponents.Textarea
            label="Observaciones"
            value={formData.observaciones}
            onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
            placeholder="Observaciones adicionales sobre el examen médico..."
            rows={3}
          />

          {errores.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errores.submit}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={resetearFormulario}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Limpiar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center space-x-2"
            >
              <Icon name={modoEdicion ? "Save" : "FileText"} size={16} />
              <span>{modoEdicion ? 'Actualizar' : 'Registrar'} Examen</span>
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Exámenes */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Exámenes Médicos Registrados</h3>
          <div className="text-sm text-slate-600">
            {examenesFiltrados.length} exámenes
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Icon name="Search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar exámenes..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="todos">Todos los tipos</option>
            {tiposExamen.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>

          <select
            value={filtros.resultado}
            onChange={(e) => setFiltros(prev => ({ ...prev, resultado: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="todos">Todos los resultados</option>
            {resultadosPosibles.map(resultado => (
              <option key={resultado} value={resultado}>{obtenerEtiquetaResultado(resultado)}</option>
            ))}
          </select>

          <select
            value={filtros.vencimiento}
            onChange={(e) => setFiltros(prev => ({ ...prev, vencimiento: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="todos">Todos los estados</option>
            <option value="vigente">Vigentes</option>
            <option value="proximo_vencer">Próximos a vencer</option>
            <option value="vencido">Vencidos</option>
          </select>
        </div>

        {/* Tabla de Exámenes */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-600">Colaborador</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Examen</th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">Fecha</th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">Resultado</th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">Estado</th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {examenesFiltrados.map((examen) => {
                const vencido = isVencido(examen.fecha_vencimiento);
                const proximoVencer = isProximoVencer(examen.fecha_vencimiento);

                return (
                  <tr key={examen.id} className={`hover:bg-slate-50 ${vencido ? 'bg-red-50' : proximoVencer ? 'bg-amber-50' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">
                        {examen.colaborador_nombre}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-slate-900">{examen.tipo_examen}</div>
                        {examen.entidad_realiza && (
                          <div className="text-sm text-slate-500">{examen.entidad_realiza}</div>
                        )}
                        {examen.medico_tratante && (
                          <div className="text-xs text-slate-400">Dr. {examen.medico_tratante}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="text-sm text-slate-900">
                        {examen.fecha_realizacion ?
                          new Date(examen.fecha_realizacion).toLocaleDateString('es-ES') :
                          '-'
                        }
                      </div>
                      {examen.fecha_vencimiento && (
                        <div className="text-xs text-slate-500">
                          Vence: {new Date(examen.fecha_vencimiento).toLocaleDateString('es-ES')}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        examen.resultado === 'apto' ? 'bg-green-100 text-green-800' :
                        examen.resultado === 'no_apto' ? 'bg-red-100 text-red-800' :
                        examen.resultado === 'apto_con_restricciones' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {obtenerEtiquetaResultado(examen.resultado)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          vencido ? 'bg-red-100 text-red-800' :
                          proximoVencer ? 'bg-amber-100 text-amber-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {vencido ? 'Vencido' : proximoVencer ? 'Por vencer' : 'Vigente'}
                        </span>
                        {!examen.cumple_normativa && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                            No normativo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        {examen.archivo_url && (
                          <button
                            onClick={() => window.open(examen.archivo_url, '_blank')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver archivo"
                          >
                            <Icon name="ExternalLink" size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => editarExamen(examen)}
                          className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Editar examen"
                        >
                          <Icon name="Edit" size={16} />
                        </button>
                        <button
                          onClick={() => eliminarExamen(examen.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar examen"
                        >
                          <Icon name="Trash2" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {examenesFiltrados.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Icon name="FileText" size={48} className="mx-auto mb-2 opacity-50" />
              <p>No se encontraron exámenes que coincidan con los filtros</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamenForm;