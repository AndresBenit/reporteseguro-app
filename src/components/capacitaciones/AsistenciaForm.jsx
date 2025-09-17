import React, { useState, useEffect } from 'react';
import { Icon } from '../common/Icons';
import { FormComponents } from '../common/FormComponents';
import { supabase } from '../../lib/supabase';

const AsistenciaForm = () => {
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [capacitacionSeleccionada, setCapacitacionSeleccionada] = useState('');
  const [filtros, setFiltros] = useState({
    capacitacion: '',
    estado: 'todos',
    fecha_inicio: '',
    fecha_fin: ''
  });

  const [formData, setFormData] = useState({
    capacitacion_id: '',
    colaborador_id: '',
    asistio: true,
    calificacion: 0,
    observaciones: '',
    fecha_asistencia: new Date().toISOString().split('T')[0],
    certificado_generado: false,
    horas_asistidas: 0
  });

  const [errores, setErrores] = useState({});

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [capacitacionesRes, colaboradoresRes, asistenciasRes] = await Promise.all([
        supabase.from('capacitaciones_sst').select('*')
          .eq('estado_capacitacion', 'completada')
          .order('fecha_realizacion', { ascending: false }),
        supabase.from('colaboradores').select('id, nombre_completo, documento, cargo, area')
          .eq('activo', true).order('nombre_completo'),
        supabase.from('asistencia_capacitaciones').select(`
          *,
          capacitaciones_sst(titulo, fecha_realizacion, duracion_horas),
          colaboradores(nombre_completo, documento, cargo)
        `).order('fecha_asistencia', { ascending: false })
      ]);

      if (capacitacionesRes.error) throw capacitacionesRes.error;
      if (colaboradoresRes.error) throw colaboradoresRes.error;
      if (asistenciasRes.error) throw asistenciasRes.error;

      setCapacitaciones(capacitacionesRes.data || []);
      setColaboradores(colaboradoresRes.data || []);
      setAsistencias(asistenciasRes.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.capacitacion_id) {
      nuevosErrores.capacitacion_id = 'Debe seleccionar una capacitación';
    }

    if (!formData.colaborador_id) {
      nuevosErrores.colaborador_id = 'Debe seleccionar un colaborador';
    }

    if (formData.calificacion < 0 || formData.calificacion > 100) {
      nuevosErrores.calificacion = 'La calificación debe estar entre 0 y 100';
    }

    if (formData.horas_asistidas < 0) {
      nuevosErrores.horas_asistidas = 'Las horas asistidas no pueden ser negativas';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      setLoading(true);

      // Verificar si ya existe registro de asistencia
      const { data: existeAsistencia } = await supabase
        .from('asistencia_capacitaciones')
        .select('id')
        .eq('capacitacion_id', formData.capacitacion_id)
        .eq('colaborador_id', formData.colaborador_id)
        .single();

      if (existeAsistencia) {
        setErrores({ submit: 'Ya existe un registro de asistencia para este colaborador en esta capacitación' });
        return;
      }

      const datosAsistencia = {
        ...formData,
        calificacion: parseFloat(formData.calificacion) || 0,
        horas_asistidas: parseFloat(formData.horas_asistidas) || 0
      };

      const { error } = await supabase
        .from('asistencia_capacitaciones')
        .insert([datosAsistencia]);

      if (error) throw error;

      await cargarDatos();
      resetearFormulario();

    } catch (error) {
      console.error('Error guardando asistencia:', error);
      setErrores({ submit: 'Error al guardar el registro de asistencia. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const registrarAsistenciaMasiva = async () => {
    if (!capacitacionSeleccionada) {
      alert('Debe seleccionar una capacitación');
      return;
    }

    if (!confirm('¿Está seguro de registrar asistencia para todos los colaboradores seleccionados?')) {
      return;
    }

    try {
      setLoading(true);

      const capacitacion = capacitaciones.find(c => c.id === capacitacionSeleccionada);
      if (!capacitacion) return;

      const colaboradoresSeleccionados = colaboradores.filter(col =>
        document.getElementById(`col_${col.id}`)?.checked
      );

      if (colaboradoresSeleccionados.length === 0) {
        alert('Debe seleccionar al menos un colaborador');
        return;
      }

      const registrosAsistencia = colaboradoresSeleccionados.map(colaborador => ({
        capacitacion_id: capacitacionSeleccionada,
        colaborador_id: colaborador.id,
        asistio: true,
        calificacion: 0,
        observaciones: 'Registro masivo',
        fecha_asistencia: capacitacion.fecha_realizacion,
        certificado_generado: false,
        horas_asistidas: capacitacion.duracion_horas || 0
      }));

      const { error } = await supabase
        .from('asistencia_capacitaciones')
        .insert(registrosAsistencia);

      if (error) throw error;

      await cargarDatos();
      setCapacitacionSeleccionada('');

      // Desmarcar todos los checkboxes
      colaboradores.forEach(col => {
        const checkbox = document.getElementById(`col_${col.id}`);
        if (checkbox) checkbox.checked = false;
      });

    } catch (error) {
      console.error('Error en registro masivo:', error);
      alert('Error al registrar asistencia masiva');
    } finally {
      setLoading(false);
    }
  };

  const eliminarAsistencia = async (id) => {
    if (!confirm('¿Está seguro de eliminar este registro de asistencia?')) return;

    try {
      const { error } = await supabase
        .from('asistencia_capacitaciones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await cargarDatos();
    } catch (error) {
      console.error('Error eliminando asistencia:', error);
    }
  };

  const resetearFormulario = () => {
    setFormData({
      capacitacion_id: '',
      colaborador_id: '',
      asistio: true,
      calificacion: 0,
      observaciones: '',
      fecha_asistencia: new Date().toISOString().split('T')[0],
      certificado_generado: false,
      horas_asistidas: 0
    });
    setErrores({});
  };

  const asistenciasFiltradas = asistencias.filter(asistencia => {
    const cumpleCapacitacion = !filtros.capacitacion || asistencia.capacitacion_id === filtros.capacitacion;

    const cumpleEstado = filtros.estado === 'todos' ||
      (filtros.estado === 'asistio' && asistencia.asistio) ||
      (filtros.estado === 'no_asistio' && !asistencia.asistio) ||
      (filtros.estado === 'certificado' && asistencia.certificado_generado);

    const cumpleFecha = (!filtros.fecha_inicio || asistencia.fecha_asistencia >= filtros.fecha_inicio) &&
                       (!filtros.fecha_fin || asistencia.fecha_asistencia <= filtros.fecha_fin);

    return cumpleCapacitacion && cumpleEstado && cumpleFecha;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2 text-slate-600">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600"></div>
          <span>Cargando registro de asistencia...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Registro Individual */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Registro Individual de Asistencia</h3>
          <Icon name="User" size={20} className="text-slate-500" />
        </div>

        <form onSubmit={manejarSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormComponents.Select
              label="Capacitación"
              value={formData.capacitacion_id}
              onChange={(e) => {
                const capacitacionId = e.target.value;
                const capacitacion = capacitaciones.find(c => c.id === capacitacionId);
                setFormData(prev => ({
                  ...prev,
                  capacitacion_id: capacitacionId,
                  fecha_asistencia: capacitacion?.fecha_realizacion || prev.fecha_asistencia,
                  horas_asistidas: capacitacion?.duracion_horas || 0
                }));
              }}
              error={errores.capacitacion_id}
              required
              options={capacitaciones.map(cap => ({
                value: cap.id,
                label: `${cap.titulo} - ${cap.fecha_realizacion ? new Date(cap.fecha_realizacion).toLocaleDateString('es-ES') : 'Sin fecha'}`
              }))}
              placeholder="Seleccionar capacitación"
            />

            <FormComponents.Select
              label="Colaborador"
              value={formData.colaborador_id}
              onChange={(e) => setFormData(prev => ({ ...prev, colaborador_id: e.target.value }))}
              error={errores.colaborador_id}
              required
              options={colaboradores.map(col => ({
                value: col.id,
                label: `${col.nombre_completo} - ${col.cargo}`
              }))}
              placeholder="Seleccionar colaborador"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormComponents.Input
              label="Fecha de Asistencia"
              type="date"
              value={formData.fecha_asistencia}
              onChange={(e) => setFormData(prev => ({ ...prev, fecha_asistencia: e.target.value }))}
              required
            />

            <FormComponents.Input
              label="Calificación (0-100)"
              type="number"
              value={formData.calificacion}
              onChange={(e) => setFormData(prev => ({ ...prev, calificacion: e.target.value }))}
              error={errores.calificacion}
              min="0"
              max="100"
            />

            <FormComponents.Input
              label="Horas Asistidas"
              type="number"
              value={formData.horas_asistidas}
              onChange={(e) => setFormData(prev => ({ ...prev, horas_asistidas: e.target.value }))}
              error={errores.horas_asistidas}
              min="0"
              step="0.5"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={formData.asistio === true}
                  onChange={() => setFormData(prev => ({ ...prev, asistio: true }))}
                  className="w-4 h-4 text-green-600 bg-slate-100 border-slate-300 focus:ring-green-500"
                />
                <span className="text-sm text-slate-700 flex items-center space-x-1">
                  <Icon name="CheckCircle" size={16} className="text-green-600" />
                  <span>Asistió</span>
                </span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={formData.asistio === false}
                  onChange={() => setFormData(prev => ({ ...prev, asistio: false }))}
                  className="w-4 h-4 text-red-600 bg-slate-100 border-slate-300 focus:ring-red-500"
                />
                <span className="text-sm text-slate-700 flex items-center space-x-1">
                  <Icon name="XCircle" size={16} className="text-red-600" />
                  <span>No asistió</span>
                </span>
              </label>
            </div>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.certificado_generado}
                onChange={(e) => setFormData(prev => ({ ...prev, certificado_generado: e.target.checked }))}
                className="w-4 h-4 text-violet-600 bg-slate-100 border-slate-300 rounded focus:ring-violet-500"
              />
              <span className="text-sm text-slate-700">Certificado generado</span>
            </label>
          </div>

          <FormComponents.Textarea
            label="Observaciones"
            value={formData.observaciones}
            onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
            placeholder="Observaciones adicionales sobre la asistencia..."
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
              className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center space-x-2"
            >
              <Icon name="UserCheck" size={16} />
              <span>Registrar Asistencia</span>
            </button>
          </div>
        </form>
      </div>

      {/* Registro Masivo */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Registro Masivo de Asistencia</h3>
          <Icon name="Users" size={20} className="text-slate-500" />
        </div>

        <div className="space-y-4">
          <FormComponents.Select
            label="Seleccionar Capacitación para Registro Masivo"
            value={capacitacionSeleccionada}
            onChange={(e) => setCapacitacionSeleccionada(e.target.value)}
            options={capacitaciones.map(cap => ({
              value: cap.id,
              label: `${cap.titulo} - ${cap.fecha_realizacion ? new Date(cap.fecha_realizacion).toLocaleDateString('es-ES') : 'Sin fecha'}`
            }))}
            placeholder="Seleccionar capacitación"
          />

          {capacitacionSeleccionada && (
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-slate-900">Seleccionar Colaboradores</h4>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      colaboradores.forEach(col => {
                        const checkbox = document.getElementById(`col_${col.id}`);
                        if (checkbox) checkbox.checked = true;
                      });
                    }}
                    className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                  >
                    Seleccionar todos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      colaboradores.forEach(col => {
                        const checkbox = document.getElementById(`col_${col.id}`);
                        if (checkbox) checkbox.checked = false;
                      });
                    }}
                    className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                  >
                    Deseleccionar todos
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {colaboradores.map(colaborador => (
                  <label key={colaborador.id} className="flex items-center space-x-2 p-2 border border-slate-200 rounded hover:bg-slate-50">
                    <input
                      type="checkbox"
                      id={`col_${colaborador.id}`}
                      className="w-4 h-4 text-violet-600 bg-slate-100 border-slate-300 rounded focus:ring-violet-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {colaborador.nombre_completo}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {colaborador.cargo} - {colaborador.area}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={registrarAsistenciaMasiva}
                  className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center space-x-2"
                >
                  <Icon name="Users" size={16} />
                  <span>Registrar Asistencia Masiva</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Historial de Asistencias */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Historial de Asistencias</h3>
          <div className="text-sm text-slate-600">
            {asistenciasFiltradas.length} registros
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <FormComponents.Select
            label=""
            value={filtros.capacitacion}
            onChange={(e) => setFiltros(prev => ({ ...prev, capacitacion: e.target.value }))}
            options={[
              { value: '', label: 'Todas las capacitaciones' },
              ...capacitaciones.map(cap => ({
                value: cap.id,
                label: cap.titulo
              }))
            ]}
          />

          <FormComponents.Select
            label=""
            value={filtros.estado}
            onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
            options={[
              { value: 'todos', label: 'Todos los estados' },
              { value: 'asistio', label: 'Solo asistieron' },
              { value: 'no_asistio', label: 'No asistieron' },
              { value: 'certificado', label: 'Con certificado' }
            ]}
          />

          <FormComponents.Input
            label=""
            type="date"
            value={filtros.fecha_inicio}
            onChange={(e) => setFiltros(prev => ({ ...prev, fecha_inicio: e.target.value }))}
            placeholder="Fecha inicio"
          />

          <FormComponents.Input
            label=""
            type="date"
            value={filtros.fecha_fin}
            onChange={(e) => setFiltros(prev => ({ ...prev, fecha_fin: e.target.value }))}
            placeholder="Fecha fin"
          />
        </div>

        {/* Tabla de Asistencias */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-600">Colaborador</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Capacitación</th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">Fecha</th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">Asistencia</th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">Calificación</th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">Estado</th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {asistenciasFiltradas.map((asistencia) => (
                <tr key={asistencia.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-slate-900">
                        {asistencia.colaboradores?.nombre_completo || 'N/A'}
                      </div>
                      <div className="text-sm text-slate-500">
                        {asistencia.colaboradores?.documento} - {asistencia.colaboradores?.cargo}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900">
                      {asistencia.capacitaciones_sst?.titulo || 'N/A'}
                    </div>
                    <div className="text-sm text-slate-500">
                      {asistencia.horas_asistidas} hrs asistidas
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="text-sm text-slate-900">
                      {asistencia.fecha_asistencia ?
                        new Date(asistencia.fecha_asistencia).toLocaleDateString('es-ES') :
                        '-'
                      }
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${
                      asistencia.asistio
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <Icon
                        name={asistencia.asistio ? 'CheckCircle' : 'XCircle'}
                        size={12}
                      />
                      <span>{asistencia.asistio ? 'Asistió' : 'No asistió'}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-medium text-slate-900">
                      {asistencia.calificacion || 0}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {asistencia.certificado_generado ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full bg-violet-100 text-violet-800">
                        <Icon name="Award" size={12} />
                        <span>Certificado</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Sin certificado</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => eliminarAsistencia(asistencia.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar registro"
                      >
                        <Icon name="Trash2" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {asistenciasFiltradas.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Icon name="Users" size={48} className="mx-auto mb-2 opacity-50" />
              <p>No se encontraron registros de asistencia</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AsistenciaForm;