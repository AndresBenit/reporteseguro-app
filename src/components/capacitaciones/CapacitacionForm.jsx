import React, { useState, useEffect } from 'react';
import { Icon } from '../common/Icons';
import { FormComponents } from '../common/FormComponents';
import { supabase } from '../../lib/supabase';

const CapacitacionForm = () => {
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [capacitacionSeleccionada, setCapacitacionSeleccionada] = useState(null);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    tipo: 'todos',
    estado: 'todos'
  });

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo_capacitacion: 'Seguridad Industrial',
    instructor: '',
    duracion_horas: 0,
    fecha_realizacion: '',
    fecha_vencimiento: '',
    certificado_url: '',
    modalidad: 'presencial',
    lugar_capacitacion: '',
    participantes_objetivo: [],
    objetivos_aprendizaje: '',
    recursos_necesarios: '',
    criterios_evaluacion: '',
    estado_capacitacion: 'programada',
    costo_capacitacion: 0,
    proveedor_externo: ''
  });

  const [errores, setErrores] = useState({});

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [capacitacionesRes, colaboradoresRes] = await Promise.all([
        supabase.from('capacitaciones_sst').select('*').order('fecha_realizacion', { ascending: false }),
        supabase.from('colaboradores').select('id, nombre_completo, cargo, area').eq('activo', true).order('nombre_completo')
      ]);

      if (capacitacionesRes.error) throw capacitacionesRes.error;
      if (colaboradoresRes.error) throw colaboradoresRes.error;

      setCapacitaciones(capacitacionesRes.data || []);
      setColaboradores(colaboradoresRes.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.titulo?.trim()) {
      nuevosErrores.titulo = 'El título es obligatorio';
    }

    if (!formData.descripcion?.trim()) {
      nuevosErrores.descripcion = 'La descripción es obligatoria';
    }

    if (!formData.fecha_realizacion) {
      nuevosErrores.fecha_realizacion = 'La fecha de realización es obligatoria';
    }

    if (!formData.instructor?.trim()) {
      nuevosErrores.instructor = 'El instructor es obligatorio';
    }

    if (formData.duracion_horas <= 0) {
      nuevosErrores.duracion_horas = 'La duración debe ser mayor a 0';
    }

    if (formData.fecha_vencimiento && formData.fecha_realizacion) {
      if (new Date(formData.fecha_vencimiento) <= new Date(formData.fecha_realizacion)) {
        nuevosErrores.fecha_vencimiento = 'La fecha de vencimiento debe ser posterior a la fecha de realización';
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

      const datosCapacitacion = {
        ...formData,
        duracion_horas: parseFloat(formData.duracion_horas) || 0,
        costo_capacitacion: parseFloat(formData.costo_capacitacion) || 0,
        participantes_objetivo: Array.isArray(formData.participantes_objetivo)
          ? formData.participantes_objetivo
          : formData.participantes_objetivo.split(',').map(p => p.trim()).filter(p => p)
      };

      let result;
      if (modoEdicion && capacitacionSeleccionada) {
        result = await supabase
          .from('capacitaciones_sst')
          .update(datosCapacitacion)
          .eq('id', capacitacionSeleccionada.id);
      } else {
        result = await supabase
          .from('capacitaciones_sst')
          .insert([datosCapacitacion]);
      }

      if (result.error) throw result.error;

      await cargarDatos();
      resetearFormulario();

    } catch (error) {
      console.error('Error guardando capacitación:', error);
      setErrores({ submit: 'Error al guardar la capacitación. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const editarCapacitacion = (capacitacion) => {
    setCapacitacionSeleccionada(capacitacion);
    setFormData({
      titulo: capacitacion.titulo || '',
      descripcion: capacitacion.descripcion || '',
      tipo_capacitacion: capacitacion.tipo_capacitacion || 'Seguridad Industrial',
      instructor: capacitacion.instructor || '',
      duracion_horas: capacitacion.duracion_horas || 0,
      fecha_realizacion: capacitacion.fecha_realizacion || '',
      fecha_vencimiento: capacitacion.fecha_vencimiento || '',
      certificado_url: capacitacion.certificado_url || '',
      modalidad: capacitacion.modalidad || 'presencial',
      lugar_capacitacion: capacitacion.lugar_capacitacion || '',
      participantes_objetivo: capacitacion.participantes_objetivo || [],
      objetivos_aprendizaje: capacitacion.objetivos_aprendizaje || '',
      recursos_necesarios: capacitacion.recursos_necesarios || '',
      criterios_evaluacion: capacitacion.criterios_evaluacion || '',
      estado_capacitacion: capacitacion.estado_capacitacion || 'programada',
      costo_capacitacion: capacitacion.costo_capacitacion || 0,
      proveedor_externo: capacitacion.proveedor_externo || ''
    });
    setModoEdicion(true);
    setErrores({});
  };

  const eliminarCapacitacion = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta capacitación?')) return;

    try {
      const { error } = await supabase
        .from('capacitaciones_sst')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await cargarDatos();
    } catch (error) {
      console.error('Error eliminando capacitación:', error);
    }
  };

  const resetearFormulario = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      tipo_capacitacion: 'Seguridad Industrial',
      instructor: '',
      duracion_horas: 0,
      fecha_realizacion: '',
      fecha_vencimiento: '',
      certificado_url: '',
      modalidad: 'presencial',
      lugar_capacitacion: '',
      participantes_objetivo: [],
      objetivos_aprendizaje: '',
      recursos_necesarios: '',
      criterios_evaluacion: '',
      estado_capacitacion: 'programada',
      costo_capacitacion: 0,
      proveedor_externo: ''
    });
    setModoEdicion(false);
    setCapacitacionSeleccionada(null);
    setErrores({});
  };

  const isVencida = (fechaVencimiento) => {
    if (!fechaVencimiento) return false;
    return new Date(fechaVencimiento) < new Date();
  };

  const isProximaVencer = (fechaVencimiento) => {
    if (!fechaVencimiento) return false;
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diasRestantes = (vencimiento - hoy) / (1000 * 60 * 60 * 24);
    return diasRestantes > 0 && diasRestantes <= 30;
  };

  const capacitacionesFiltradas = capacitaciones.filter(capacitacion => {
    const cumpleBusqueda = !filtros.busqueda ||
      capacitacion.titulo?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      capacitacion.instructor?.toLowerCase().includes(filtros.busqueda.toLowerCase());

    const cumpleTipo = filtros.tipo === 'todos' || capacitacion.tipo_capacitacion === filtros.tipo;

    const cumpleEstado = filtros.estado === 'todos' ||
      (filtros.estado === 'vigente' && !isVencida(capacitacion.fecha_vencimiento)) ||
      (filtros.estado === 'vencida' && isVencida(capacitacion.fecha_vencimiento)) ||
      (filtros.estado === 'proxima_vencer' && isProximaVencer(capacitacion.fecha_vencimiento));

    return cumpleBusqueda && cumpleTipo && cumpleEstado;
  });

  const tiposCapacitacion = [
    'Seguridad Industrial',
    'Uso de EPP',
    'Primeros Auxilios',
    'Prevención de Riesgos',
    'Trabajo en Alturas',
    'Espacios Confinados',
    'Manejo de Químicos',
    'Emergencias y Evacuación',
    'Higiene Industrial',
    'Ergonomía',
    'Liderazgo en SST',
    'Investigación de Accidentes',
    'Otro'
  ];

  const modalidades = [
    'presencial',
    'virtual',
    'mixta'
  ];

  const estadosCapacitacion = [
    'programada',
    'en_progreso',
    'completada',
    'cancelada'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2 text-slate-600">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
          <span>Cargando capacitaciones...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Formulario de Capacitación */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            {modoEdicion ? 'Editar Capacitación' : 'Programar Nueva Capacitación'}
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
          {/* Información Básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormComponents.Input
              label="Título de la Capacitación"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              error={errores.titulo}
              required
              placeholder="Ej: Curso de Trabajo en Alturas"
            />

            <FormComponents.Select
              label="Tipo de Capacitación"
              value={formData.tipo_capacitacion}
              onChange={(e) => setFormData(prev => ({ ...prev, tipo_capacitacion: e.target.value }))}
              options={tiposCapacitacion.map(tipo => ({ value: tipo, label: tipo }))}
              required
            />

            <FormComponents.Input
              label="Instructor"
              value={formData.instructor}
              onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
              error={errores.instructor}
              required
              placeholder="Nombre del instructor"
            />

            <FormComponents.Input
              label="Duración (horas)"
              type="number"
              value={formData.duracion_horas}
              onChange={(e) => setFormData(prev => ({ ...prev, duracion_horas: e.target.value }))}
              error={errores.duracion_horas}
              required
              min="0.5"
              step="0.5"
            />
          </div>

          <FormComponents.Textarea
            label="Descripción"
            value={formData.descripcion}
            onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
            error={errores.descripcion}
            required
            placeholder="Descripción detallada del contenido de la capacitación..."
            rows={3}
          />

          {/* Fechas y Modalidad */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            <FormComponents.Select
              label="Modalidad"
              value={formData.modalidad}
              onChange={(e) => setFormData(prev => ({ ...prev, modalidad: e.target.value }))}
              options={modalidades.map(mod => ({
                value: mod,
                label: mod.charAt(0).toUpperCase() + mod.slice(1)
              }))}
            />
          </div>

          {/* Ubicación y Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormComponents.Input
              label="Lugar de Capacitación"
              value={formData.lugar_capacitacion}
              onChange={(e) => setFormData(prev => ({ ...prev, lugar_capacitacion: e.target.value }))}
              placeholder="Ej: Aula de capacitación, Planta 1"
            />

            <FormComponents.Select
              label="Estado"
              value={formData.estado_capacitacion}
              onChange={(e) => setFormData(prev => ({ ...prev, estado_capacitacion: e.target.value }))}
              options={estadosCapacitacion.map(estado => ({
                value: estado,
                label: estado.replace('_', ' ').charAt(0).toUpperCase() + estado.replace('_', ' ').slice(1)
              }))}
            />
          </div>

          {/* Objetivos y Recursos */}
          <FormComponents.Textarea
            label="Objetivos de Aprendizaje"
            value={formData.objetivos_aprendizaje}
            onChange={(e) => setFormData(prev => ({ ...prev, objetivos_aprendizaje: e.target.value }))}
            placeholder="Objetivos que se esperan alcanzar con esta capacitación..."
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormComponents.Textarea
              label="Recursos Necesarios"
              value={formData.recursos_necesarios}
              onChange={(e) => setFormData(prev => ({ ...prev, recursos_necesarios: e.target.value }))}
              placeholder="Equipos, materiales, software necesarios..."
              rows={3}
            />

            <FormComponents.Textarea
              label="Criterios de Evaluación"
              value={formData.criterios_evaluacion}
              onChange={(e) => setFormData(prev => ({ ...prev, criterios_evaluacion: e.target.value }))}
              placeholder="Cómo se evaluará el aprendizaje..."
              rows={3}
            />
          </div>

          {/* Información Adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormComponents.Input
              label="Costo de la Capacitación (COP)"
              type="number"
              value={formData.costo_capacitacion}
              onChange={(e) => setFormData(prev => ({ ...prev, costo_capacitacion: e.target.value }))}
              min="0"
              step="1000"
            />

            <FormComponents.Input
              label="Proveedor Externo"
              value={formData.proveedor_externo}
              onChange={(e) => setFormData(prev => ({ ...prev, proveedor_externo: e.target.value }))}
              placeholder="Nombre del proveedor (si aplica)"
            />
          </div>

          <FormComponents.Input
            label="URL del Certificado"
            type="url"
            value={formData.certificado_url}
            onChange={(e) => setFormData(prev => ({ ...prev, certificado_url: e.target.value }))}
            placeholder="https://..."
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
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
            >
              <Icon name={modoEdicion ? "Save" : "Calendar"} size={16} />
              <span>{modoEdicion ? 'Actualizar' : 'Programar'} Capacitación</span>
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Capacitaciones */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Capacitaciones Programadas</h3>
          <div className="text-sm text-slate-600">
            {capacitacionesFiltradas.length} capacitaciones
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Icon name="Search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar capacitaciones..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="todos">Todos los tipos</option>
            {tiposCapacitacion.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>

          <select
            value={filtros.estado}
            onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="todos">Todos los estados</option>
            <option value="vigente">Vigentes</option>
            <option value="proxima_vencer">Próximas a vencer</option>
            <option value="vencida">Vencidas</option>
          </select>
        </div>

        {/* Tabla de Capacitaciones */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-600">Capacitación</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Tipo</th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">Fecha</th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">Duración</th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">Estado</th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {capacitacionesFiltradas.map((capacitacion) => {
                const vencida = isVencida(capacitacion.fecha_vencimiento);
                const proximaVencer = isProximaVencer(capacitacion.fecha_vencimiento);

                return (
                  <tr key={capacitacion.id} className={`hover:bg-slate-50 ${vencida ? 'bg-red-50' : proximaVencer ? 'bg-amber-50' : ''}`}>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-slate-900">{capacitacion.titulo}</div>
                        <div className="text-sm text-slate-500">{capacitacion.instructor}</div>
                        {capacitacion.lugar_capacitacion && (
                          <div className="text-xs text-slate-400">📍 {capacitacion.lugar_capacitacion}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">
                        {capacitacion.tipo_capacitacion}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="text-sm text-slate-900">
                        {capacitacion.fecha_realizacion ?
                          new Date(capacitacion.fecha_realizacion).toLocaleDateString('es-ES') :
                          '-'
                        }
                      </div>
                      {capacitacion.fecha_vencimiento && (
                        <div className="text-xs text-slate-500">
                          Vence: {new Date(capacitacion.fecha_vencimiento).toLocaleDateString('es-ES')}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-slate-900">
                        {capacitacion.duracion_horas} hrs
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        vencida
                          ? 'bg-red-100 text-red-800'
                          : proximaVencer
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {vencida ? 'Vencida' : proximaVencer ? 'Por vencer' : 'Vigente'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        {capacitacion.certificado_url && (
                          <button
                            onClick={() => window.open(capacitacion.certificado_url, '_blank')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver certificado"
                          >
                            <Icon name="ExternalLink" size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => editarCapacitacion(capacitacion)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Editar capacitación"
                        >
                          <Icon name="Edit" size={16} />
                        </button>
                        <button
                          onClick={() => eliminarCapacitacion(capacitacion.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar capacitación"
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

          {capacitacionesFiltradas.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Icon name="Calendar" size={48} className="mx-auto mb-2 opacity-50" />
              <p>No se encontraron capacitaciones que coincidan con los filtros</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CapacitacionForm;