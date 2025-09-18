import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { Icon } from '../common/Icons';
import {
  FormContainer,
  FormHeader,
  FormSection,
  FormRow,
  FormField,
  FormInput,
  FormSelect,
  FormButton,
  FormButtonGroup,
  FormMessage,
  FormCard,
  SeverityBadge
} from '../common/FormComponents';

const SeguimientoForm = () => {
  const [examenes, setExamenes] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [filtros, setFiltros] = useState({
    colaborador: '',
    tipo_examen: '',
    estado: '',
    dias_vencimiento: '30',
    busqueda: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [examenesVencidos, setExamenesVencidos] = useState([]);
  const [alertas, setAlertas] = useState([]);

  const tiposExamen = [
    'ingreso', 'periódico', 'egreso', 'post-incidente', 'reintegro'
  ];

  const estadosExamen = [
    'programado', 'realizado', 'aprobado', 'no-aprobado', 'pendiente'
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      const [examenesResult, colaboradoresResult] = await Promise.all([
        supabase
          .from('examenes_medicos_sst')
          .select('*')
          .order('fecha_programada', { ascending: true }),
        supabase
          .from('colaboradores')
          .select('id, nombre, documento, cargo, area')
          .eq('activo', true)
          .order('nombre')
      ]);

      if (examenesResult.error) throw examenesResult.error;
      if (colaboradoresResult.error) throw colaboradoresResult.error;

      setExamenes(examenesResult.data || []);
      setColaboradores(colaboradoresResult.data || []);

      procesarAlertas(examenesResult.data || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos del seguimiento');
    } finally {
      setLoading(false);
    }
  };

  const procesarAlertas = (examenesData) => {
    const hoy = new Date();
    const diasLimite = parseInt(filtros.dias_vencimiento) || 30;
    const fechaLimite = new Date(hoy.getTime() + (diasLimite * 24 * 60 * 60 * 1000));

    const vencidos = [];
    const alertasGeneradas = [];

    examenesData.forEach(examen => {
      if (!examen.fecha_vencimiento) return;

      const fechaVencimiento = new Date(examen.fecha_vencimiento);
      const diasParaVencer = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));

      if (diasParaVencer < 0) {
        vencidos.push({
          ...examen,
          diasVencido: Math.abs(diasParaVencer),
          severidad: 'critica'
        });
      } else if (diasParaVencer <= diasLimite) {
        alertasGeneradas.push({
          ...examen,
          diasRestantes: diasParaVencer,
          severidad: diasParaVencer <= 7 ? 'alta' : diasParaVencer <= 15 ? 'media' : 'baja'
        });
      }
    });

    setExamenesVencidos(vencidos);
    setAlertas(alertasGeneradas);
  };

  const examenesFiltrados = useMemo(() => {
    let resultado = examenes;

    if (filtros.colaborador) {
      resultado = resultado.filter(ex =>
        ex.colaborador_id === filtros.colaborador
      );
    }

    if (filtros.tipo_examen) {
      resultado = resultado.filter(ex =>
        ex.tipo_examen === filtros.tipo_examen
      );
    }

    if (filtros.estado) {
      resultado = resultado.filter(ex =>
        ex.estado === filtros.estado
      );
    }

    if (filtros.busqueda) {
      const termino = filtros.busqueda.toLowerCase();
      resultado = resultado.filter(ex =>
        ex.nombre_colaborador?.toLowerCase().includes(termino) ||
        ex.documento_colaborador?.includes(termino) ||
        ex.tipo_examen?.toLowerCase().includes(termino) ||
        ex.entidad_realiza?.toLowerCase().includes(termino)
      );
    }

    return resultado.sort((a, b) => {
      if (!a.fecha_vencimiento) return 1;
      if (!b.fecha_vencimiento) return -1;
      return new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento);
    });
  }, [examenes, filtros]);

  const programarExamen = async (colaboradorId, tipoExamen) => {
    try {
      const colaborador = colaboradores.find(c => c.id === colaboradorId);
      if (!colaborador) {
        setError('Colaborador no encontrado');
        return;
      }

      const fechaProgramada = new Date();
      fechaProgramada.setDate(fechaProgramada.getDate() + 7);

      let fechaVencimiento = new Date();
      switch (tipoExamen) {
        case 'periódico':
          fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);
          break;
        case 'ingreso':
        case 'reintegro':
          fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 6);
          break;
        case 'post-incidente':
          fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 3);
          break;
        default:
          fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 6);
      }

      const nuevoExamen = {
        colaborador_id: colaboradorId,
        nombre_colaborador: colaborador.nombre,
        documento_colaborador: colaborador.documento,
        cargo_colaborador: colaborador.cargo,
        area_colaborador: colaborador.area,
        tipo_examen: tipoExamen,
        estado: 'programado',
        fecha_programada: fechaProgramada.toISOString().split('T')[0],
        fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
        observaciones: `Examen ${tipoExamen} programado automáticamente`
      };

      const { error: insertError } = await supabase
        .from('examenes_medicos_sst')
        .insert([nuevoExamen]);

      if (insertError) throw insertError;

      await cargarDatos();
      setError('');
    } catch (err) {
      console.error('Error programando examen:', err);
      setError('Error al programar el examen');
    }
  };

  const actualizarEstado = async (examenId, nuevoEstado) => {
    try {
      const updates = { estado: nuevoEstado };

      if (nuevoEstado === 'realizado') {
        updates.fecha_realizacion = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('examenes_medicos_sst')
        .update(updates)
        .eq('id', examenId);

      if (error) throw error;

      await cargarDatos();
      setError('');
    } catch (err) {
      console.error('Error actualizando estado:', err);
      setError('Error al actualizar el estado del examen');
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No definida';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const calcularDiasRestantes = (fechaVencimiento) => {
    if (!fechaVencimiento) return null;
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diferencia = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
    return diferencia;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-slate-50 to-indigo-50 min-h-screen">
      <FormContainer>
        <FormHeader
          title="Seguimiento y Control de Exámenes Médicos"
          subtitle="Control de vencimientos, alertas médicas y programación de exámenes"
          icon={<Icon name="Calendar" size={28} className="text-indigo-600" />}
        />

        {error && (
          <FormMessage type="error" message={error} onClose={() => setError('')} />
        )}

        {/* Resumen de Alertas */}
        <FormSection title="Panel de Alertas Médicas">
          <FormRow columns={3}>
            <FormCard title="Exámenes Vencidos" className="border-l-4 border-red-500">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {examenesVencidos.length}
                </div>
                <p className="text-sm text-gray-600">Requieren atención inmediata</p>
              </div>
            </FormCard>

            <FormCard title="Próximos a Vencer" className="border-l-4 border-yellow-500">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {alertas.length}
                </div>
                <p className="text-sm text-gray-600">En los próximos {filtros.dias_vencimiento} días</p>
              </div>
            </FormCard>

            <FormCard title="Total Seguimiento" className="border-l-4 border-indigo-500">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">
                  {examenes.length}
                </div>
                <p className="text-sm text-gray-600">Exámenes en el sistema</p>
              </div>
            </FormCard>
          </FormRow>
        </FormSection>

        {/* Filtros de Búsqueda */}
        <FormSection title="Filtros de Seguimiento">
          <FormRow columns={2}>
            <FormField label="Colaborador">
              <FormSelect
                value={filtros.colaborador}
                onChange={(e) => setFiltros(prev => ({ ...prev, colaborador: e.target.value }))}
                options={colaboradores.map(col => ({
                  value: col.id,
                  label: `${col.nombre} - ${col.documento}`
                }))}
                placeholder="Todos los colaboradores"
              />
            </FormField>

            <FormField label="Tipo de Examen">
              <FormSelect
                value={filtros.tipo_examen}
                onChange={(e) => setFiltros(prev => ({ ...prev, tipo_examen: e.target.value }))}
                options={tiposExamen}
                placeholder="Todos los tipos"
              />
            </FormField>

            <FormField label="Estado">
              <FormSelect
                value={filtros.estado}
                onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                options={estadosExamen}
                placeholder="Todos los estados"
              />
            </FormField>

            <FormField label="Días para Alerta">
              <FormSelect
                value={filtros.dias_vencimiento}
                onChange={(e) => {
                  setFiltros(prev => ({ ...prev, dias_vencimiento: e.target.value }));
                  procesarAlertas(examenes);
                }}
                options={[
                  { value: '7', label: '7 días' },
                  { value: '15', label: '15 días' },
                  { value: '30', label: '30 días' },
                  { value: '60', label: '60 días' },
                  { value: '90', label: '90 días' }
                ]}
              />
            </FormField>
          </FormRow>

          <FormField label="Búsqueda General">
            <FormInput
              type="text"
              value={filtros.busqueda}
              onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
              placeholder="Buscar por nombre, documento, tipo de examen o entidad..."
            />
          </FormField>
        </FormSection>

        {/* Lista de Exámenes con Seguimiento */}
        <FormSection title="Exámenes en Seguimiento">
          <div className="space-y-4">
            {examenesFiltrados.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Icon name="Calendar" size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No se encontraron exámenes con los filtros aplicados</p>
              </div>
            ) : (
              examenesFiltrados.map(examen => {
                const diasRestantes = calcularDiasRestantes(examen.fecha_vencimiento);
                const esVencido = diasRestantes !== null && diasRestantes < 0;
                const esProximoAVencer = diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= parseInt(filtros.dias_vencimiento);

                return (
                  <FormCard
                    key={examen.id}
                    className={`transition-all duration-200 ${
                      esVencido
                        ? 'border-red-300 bg-red-50'
                        : esProximoAVencer
                          ? 'border-yellow-300 bg-yellow-50'
                          : 'hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {examen.nombre_colaborador}
                          </h4>
                          <span className="text-sm text-gray-600">
                            {examen.documento_colaborador}
                          </span>
                          <SeverityBadge
                            severity={
                              esVencido ? 'critica' :
                              diasRestantes <= 7 ? 'alta' :
                              diasRestantes <= 15 ? 'media' : 'baja'
                            }
                          />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Tipo:</span>
                            <p className="text-gray-900 capitalize">{examen.tipo_examen}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Estado:</span>
                            <p className="text-gray-900 capitalize">{examen.estado}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Programado:</span>
                            <p className="text-gray-900">{formatearFecha(examen.fecha_programada)}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Vencimiento:</span>
                            <p className={`font-semibold ${
                              esVencido ? 'text-red-600' : esProximoAVencer ? 'text-yellow-600' : 'text-gray-900'
                            }`}>
                              {formatearFecha(examen.fecha_vencimiento)}
                              {diasRestantes !== null && (
                                <span className="block text-xs">
                                  {esVencido
                                    ? `Vencido hace ${Math.abs(diasRestantes)} días`
                                    : `${diasRestantes} días restantes`
                                  }
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {examen.observaciones && (
                          <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                            <span className="font-medium text-gray-700">Observaciones:</span>
                            <p className="text-gray-900 text-sm mt-1">{examen.observaciones}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-6">
                        {examen.estado === 'programado' && (
                          <FormButton
                            variant="success"
                            size="sm"
                            onClick={() => actualizarEstado(examen.id, 'realizado')}
                          >
                            Marcar Realizado
                          </FormButton>
                        )}

                        {examen.estado === 'realizado' && (
                          <>
                            <FormButton
                              variant="success"
                              size="sm"
                              onClick={() => actualizarEstado(examen.id, 'aprobado')}
                            >
                              Aprobar
                            </FormButton>
                            <FormButton
                              variant="danger"
                              size="sm"
                              onClick={() => actualizarEstado(examen.id, 'no-aprobado')}
                            >
                              No Aprobar
                            </FormButton>
                          </>
                        )}

                        {esVencido && (
                          <FormButton
                            variant="primary"
                            size="sm"
                            onClick={() => programarExamen(examen.colaborador_id, examen.tipo_examen)}
                          >
                            Reprogramar
                          </FormButton>
                        )}
                      </div>
                    </div>
                  </FormCard>
                );
              })
            )}
          </div>
        </FormSection>

        {/* Programación Rápida */}
        <FormSection title="Programación Rápida de Exámenes">
          <FormCard>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Colaborador">
                <FormSelect
                  options={colaboradores.map(col => ({
                    value: col.id,
                    label: `${col.nombre} - ${col.documento}`
                  }))}
                  placeholder="Seleccionar colaborador"
                  id="nuevo-colaborador"
                />
              </FormField>

              <FormField label="Tipo de Examen">
                <FormSelect
                  options={tiposExamen}
                  placeholder="Seleccionar tipo"
                  id="nuevo-tipo"
                />
              </FormField>

              <FormField label="Acción">
                <FormButton
                  variant="primary"
                  onClick={() => {
                    const colaboradorSelect = document.getElementById('nuevo-colaborador');
                    const tipoSelect = document.getElementById('nuevo-tipo');

                    if (colaboradorSelect.value && tipoSelect.value) {
                      programarExamen(colaboradorSelect.value, tipoSelect.value);
                      colaboradorSelect.value = '';
                      tipoSelect.value = '';
                    } else {
                      setError('Debe seleccionar colaborador y tipo de examen');
                    }
                  }}
                  className="w-full"
                >
                  <Icon name="Plus" size={16} />
                  Programar Examen
                </FormButton>
              </FormField>
            </div>
          </FormCard>
        </FormSection>

        <FormButtonGroup align="right">
          <FormButton
            variant="secondary"
            onClick={cargarDatos}
          >
            <Icon name="RefreshCw" size={16} />
            Actualizar Datos
          </FormButton>
        </FormButtonGroup>
      </FormContainer>
    </div>
  );
};

export default SeguimientoForm;