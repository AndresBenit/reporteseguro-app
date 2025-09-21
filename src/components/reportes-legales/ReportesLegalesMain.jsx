import React, { useState, useEffect } from 'react';
import { dbHelpers } from '../../services/supabase';
import { Icon } from '../common/Icons';

const ReportesLegalesMain = () => {
  const [reportes, setReportes] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReporte, setEditingReporte] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [activeTab, setActiveTab] = useState('reportes');

  const [formData, setFormData] = useState({
    tipo_reporte: '',
    periodo: '',
    fecha_inicio: '',
    fecha_fin: '',
    area: '',
    datos_reporte: {},
    indicadores: {},
    observaciones: '',
    conclusiones: '',
    recomendaciones: '',
    estado: 'borrador',
    archivo_url: ''
  });

  const tiposReporte = [
    'Mensual Accidentalidad',
    'Trimestral Estadísticas', 
    'Anual Gestión SST',
    'Indicadores Cumplimiento',
    'Reporte ARL',
    'Matriz Legal',
    'Plan Trabajo Anual',
    'Evaluación SG-SST'
  ];

  const areas = [
    'Centro Industrial',
    'Hornos Solera',
    'Ambas',
    'General'
  ];

  const estados = [
    'borrador',
    'revision',
    'aprobado',
    'enviado'
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const [reportesData, plantillasData] = await Promise.all([
        dbHelpers.getAll('reportes_legales_sst', {
          orderBy: 'created_at',
          ascending: false
        }),
        dbHelpers.getAll('plantillas_reportes_sst', {
          orderBy: 'nombre',
          ascending: true,
          filters: { activa: true }
        })
      ]);

      setReportes(reportesData || []);
      setPlantillas(plantillasData || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setMensaje('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.tipo_reporte || !formData.periodo || 
        !formData.fecha_inicio || !formData.fecha_fin) {
      setMensaje('Por favor complete los campos obligatorios');
      return;
    }

    // Validar fechas
    const fechaInicio = new Date(formData.fecha_inicio);
    const fechaFin = new Date(formData.fecha_fin);
    
    if (fechaFin < fechaInicio) {
      setMensaje('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        datos_reporte: typeof formData.datos_reporte === 'string' ? 
          JSON.parse(formData.datos_reporte || '{}') : formData.datos_reporte,
        indicadores: typeof formData.indicadores === 'string' ? 
          JSON.parse(formData.indicadores || '{}') : formData.indicadores,
        created_at: editingReporte ? undefined : new Date().toISOString()
      };

      if (editingReporte) {
        await dbHelpers.update('reportes_legales_sst', editingReporte.id, dataToSave);
        setMensaje('Reporte actualizado exitosamente');
      } else {
        await dbHelpers.create('reportes_legales_sst', dataToSave);
        setMensaje('Reporte creado exitosamente');
      }

      resetForm();
      setShowForm(false);
      setEditingReporte(null);
      cargarDatos();

      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error guardando reporte:', error);
      setMensaje('Error al guardar el reporte');
    }
  };

  const editarReporte = (reporte) => {
    setFormData({
      tipo_reporte: reporte.tipo_reporte || '',
      periodo: reporte.periodo || '',
      fecha_inicio: reporte.fecha_inicio || '',
      fecha_fin: reporte.fecha_fin || '',
      area: reporte.area || '',
      datos_reporte: typeof reporte.datos_reporte === 'object' ? 
        JSON.stringify(reporte.datos_reporte, null, 2) : (reporte.datos_reporte || '{}'),
      indicadores: typeof reporte.indicadores === 'object' ? 
        JSON.stringify(reporte.indicadores, null, 2) : (reporte.indicadores || '{}'),
      observaciones: reporte.observaciones || '',
      conclusiones: reporte.conclusiones || '',
      recomendaciones: reporte.recomendaciones || '',
      estado: reporte.estado || 'borrador',
      archivo_url: reporte.archivo_url || ''
    });
    setEditingReporte(reporte);
    setShowForm(true);
  };

  const eliminarReporte = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este reporte?')) {
      try {
        await dbHelpers.delete('reportes_legales_sst', id);
        setMensaje('Reporte eliminado exitosamente');
        cargarDatos();
        setTimeout(() => setMensaje(''), 3000);
      } catch (error) {
        console.error('Error eliminando reporte:', error);
        setMensaje('Error al eliminar el reporte');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      tipo_reporte: '',
      periodo: '',
      fecha_inicio: '',
      fecha_fin: '',
      area: '',
      datos_reporte: {},
      indicadores: {},
      observaciones: '',
      conclusiones: '',
      recomendaciones: '',
      estado: 'borrador',
      archivo_url: ''
    });
  };

  const cancelarForm = () => {
    setShowForm(false);
    setEditingReporte(null);
    resetForm();
    setMensaje('');
  };

  const generarReporteRapido = (tipo) => {
    const fechaActual = new Date();
    let periodo = '';
    let fechaInicio = '';
    let fechaFin = '';

    switch (tipo) {
      case 'Mensual Accidentalidad':
        const mesActual = fechaActual.getMonth();
        const añoActual = fechaActual.getFullYear();
        periodo = `${añoActual}-${(mesActual + 1).toString().padStart(2, '0')}`;
        fechaInicio = new Date(añoActual, mesActual, 1).toISOString().split('T')[0];
        fechaFin = new Date(añoActual, mesActual + 1, 0).toISOString().split('T')[0];
        break;
      case 'Trimestral Estadísticas':
        const trimestre = Math.ceil((fechaActual.getMonth() + 1) / 3);
        periodo = `${fechaActual.getFullYear()}-Q${trimestre}`;
        const mesInicioTrim = (trimestre - 1) * 3;
        fechaInicio = new Date(fechaActual.getFullYear(), mesInicioTrim, 1).toISOString().split('T')[0];
        fechaFin = new Date(fechaActual.getFullYear(), mesInicioTrim + 3, 0).toISOString().split('T')[0];
        break;
      case 'Anual Gestión SST':
        periodo = `${fechaActual.getFullYear()}`;
        fechaInicio = `${fechaActual.getFullYear()}-01-01`;
        fechaFin = `${fechaActual.getFullYear()}-12-31`;
        break;
      default:
        periodo = fechaActual.toISOString().split('T')[0];
        fechaInicio = fechaActual.toISOString().split('T')[0];
        fechaFin = fechaActual.toISOString().split('T')[0];
    }

    setFormData({
      ...formData,
      tipo_reporte: tipo,
      periodo,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      area: 'General'
    });
    setShowForm(true);
  };

  // Estadísticas
  const reportesBorrador = reportes.filter(r => r.estado === 'borrador').length;
  const reportesAprobados = reportes.filter(r => r.estado === 'aprobado').length;
  const reportesEnviados = reportes.filter(r => r.estado === 'enviado').length;
  const reportesEsteAno = reportes.filter(r => {
    const fechaReporte = new Date(r.fecha_inicio);
    return fechaReporte.getFullYear() === new Date().getFullYear();
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-200 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
            <Icon name="Loader" size={24} className="text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Cargando Reportes Legales SST</h3>
          <p className="text-slate-600">Obteniendo datos de reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Header Principal */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-purple-700 to-violet-700 rounded-2xl p-3 shadow-lg">
                <Icon name="FileText" size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-violet-700 bg-clip-text text-transparent">
                  Reportes Legales SST
                </h1>
                <p className="text-slate-600 font-medium">
                  Cumplimiento Normativo • Estadísticas • Indicadores • Gestión Documental
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Sistema Activo</span>
              </div>
              <div className="w-px h-6 bg-slate-300"></div>
              <span className="font-medium">
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Navegación de pestañas */}
          <div className="flex space-x-1 mt-8 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'reportes', label: 'Reportes', icon: 'FileText', color: 'from-purple-600 to-purple-700' },
              { id: 'plantillas', label: 'Plantillas', icon: 'Layout', color: 'from-violet-600 to-violet-700' },
              { id: 'dashboard', label: 'Dashboard', icon: 'BarChart3', color: 'from-indigo-600 to-indigo-700' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 font-medium ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-105`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon name={tab.icon} size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'reportes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Gestión de Reportes</h2>
                <p className="text-slate-600">Generación y gestión de reportes legales SST</p>
              </div>
              <button
                onClick={() => {
                  setShowForm(true);
                  resetForm();
                }}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg"
              >
                <Icon name="Plus" size={20} />
                <span>Nuevo Reporte</span>
              </button>
            </div>

            {/* Dashboard Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow text-center">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg">
                    <Icon name="FileText" size={20} className="text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-600 mb-1">
                  {reportesEsteAno}
                </div>
                <p className="text-sm font-semibold text-slate-700">Reportes {new Date().getFullYear()}</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow text-center">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <div className="p-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg">
                    <Icon name="Edit" size={20} className="text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-amber-600 mb-1">
                  {reportesBorrador}
                </div>
                <p className="text-sm font-semibold text-slate-700">En Borrador</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow text-center">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg">
                    <Icon name="CheckCircle" size={20} className="text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-emerald-600 mb-1">
                  {reportesAprobados}
                </div>
                <p className="text-sm font-semibold text-slate-700">Aprobados</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow text-center">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                    <Icon name="Send" size={20} className="text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {reportesEnviados}
                </div>
                <p className="text-sm font-semibold text-slate-700">Enviados</p>
              </div>
            </div>

            {/* Botones de Reportes Rápidos */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                <Icon name="Zap" size={20} className="text-purple-600" />
                <span>Generar Reporte Rápido</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => generarReporteRapido('Mensual Accidentalidad')}
                  className="flex items-center space-x-2 px-4 py-3 border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50 hover:border-purple-300 transition-all duration-200 text-sm font-medium"
                >
                  <Icon name="FileText" size={16} />
                  <span>Reporte Mensual</span>
                </button>

                <button
                  onClick={() => generarReporteRapido('Trimestral Estadísticas')}
                  className="flex items-center space-x-2 px-4 py-3 border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50 hover:border-purple-300 transition-all duration-200 text-sm font-medium"
                >
                  <Icon name="BarChart" size={16} />
                  <span>Reporte Trimestral</span>
                </button>

                <button
                  onClick={() => generarReporteRapido('Anual Gestión SST')}
                  className="flex items-center space-x-2 px-4 py-3 border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50 hover:border-purple-300 transition-all duration-200 text-sm font-medium"
                >
                  <Icon name="TrendingUp" size={16} />
                  <span>Reporte Anual</span>
                </button>

                <button
                  onClick={() => generarReporteRapido('Indicadores Cumplimiento')}
                  className="flex items-center space-x-2 px-4 py-3 border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50 hover:border-purple-300 transition-all duration-200 text-sm font-medium"
                >
                  <Icon name="CheckCircle" size={16} />
                  <span>Indicadores</span>
                </button>
              </div>
            </div>

            {/* Mensaje */}
            {mensaje && (
              <div className={`px-4 py-3 rounded-lg mb-6 ${
                mensaje.includes('Error')
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-green-50 border border-green-200 text-green-700'
              }`}>
                <div className="flex items-center space-x-2">
                  <Icon
                    name={mensaje.includes('Error') ? 'AlertCircle' : 'CheckCircle'}
                    size={18}
                  />
                  <span className="font-medium">{mensaje}</span>
                </div>
              </div>
            )}

            {/* Formulario */}
            {showForm && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-slate-900">
                    {editingReporte ? 'Editar Reporte Legal' : 'Nuevo Reporte Legal SST'}
                  </h3>
                  <button
                    onClick={cancelarForm}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    <Icon name="X" size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Tipo de Reporte *
                      </label>
                      <select
                        value={formData.tipo_reporte}
                        onChange={(e) => setFormData({...formData, tipo_reporte: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        required
                      >
                        <option value="">Seleccionar tipo</option>
                        {tiposReporte.map(tipo => (
                          <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Período *
                      </label>
                      <input
                        type="text"
                        value={formData.periodo}
                        onChange={(e) => setFormData({...formData, periodo: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        placeholder="2024-01 / 2024-Q1 / 2024"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Fecha de Inicio *
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_inicio}
                        onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Fecha de Fin *
                      </label>
                      <input
                        type="date"
                        value={formData.fecha_fin}
                        onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      >
                        <option value="">Seleccionar área</option>
                        {areas.map(area => (
                          <option key={area} value={area}>{area}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Estado
                      </label>
                      <select
                        value={formData.estado}
                        onChange={(e) => setFormData({...formData, estado: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      >
                        {estados.map(estado => (
                          <option key={estado} value={estado}>{estado}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Datos del Reporte (JSON)
                      </label>
                      <textarea
                        value={typeof formData.datos_reporte === 'string' ? formData.datos_reporte : JSON.stringify(formData.datos_reporte, null, 2)}
                        onChange={(e) => setFormData({...formData, datos_reporte: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors min-h-[120px] resize-y font-mono text-sm"
                        placeholder='{"total_trabajadores": 100, "horas_trabajadas": 176000}'
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Indicadores (JSON)
                      </label>
                      <textarea
                        value={typeof formData.indicadores === 'string' ? formData.indicadores : JSON.stringify(formData.indicadores, null, 2)}
                        onChange={(e) => setFormData({...formData, indicadores: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors min-h-[120px] resize-y font-mono text-sm"
                        placeholder='{"indice_frecuencia": 2.5, "indice_severidad": 45.2}'
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Observaciones
                      </label>
                      <textarea
                        value={formData.observaciones}
                        onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors min-h-[80px] resize-y"
                        placeholder="Observaciones relevantes del período..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Conclusiones
                      </label>
                      <textarea
                        value={formData.conclusiones}
                        onChange={(e) => setFormData({...formData, conclusiones: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors min-h-[80px] resize-y"
                        placeholder="Conclusiones del análisis..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Recomendaciones
                      </label>
                      <textarea
                        value={formData.recomendaciones}
                        onChange={(e) => setFormData({...formData, recomendaciones: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors min-h-[80px] resize-y"
                        placeholder="Recomendaciones y plan de acción..."
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      URL del Archivo
                    </label>
                    <input
                      type="url"
                      value={formData.archivo_url}
                      onChange={(e) => setFormData({...formData, archivo_url: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={cancelarForm}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg font-medium"
                    >
                      {editingReporte ? 'Actualizar' : 'Guardar'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Lista de Reportes */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                  <Icon name="FileText" size={20} className="text-purple-600" />
                  <span>Reportes Legales Registrados</span>
                </h3>
              </div>

              {reportes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="FileText" size={32} className="text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-600 mb-2">No hay reportes registrados</h3>
                  <p className="text-slate-500 text-sm">
                    Comience creando su primer reporte legal SST
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Reporte
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Período
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Área
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wide">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {reportes.map((reporte) => (
                        <tr key={reporte.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4">
                            <div>
                              <div className="font-medium text-slate-900">
                                {reporte.tipo_reporte}
                              </div>
                              <div className="text-xs text-slate-500">
                                {reporte.fecha_inicio} - {reporte.fecha_fin}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">
                            {reporte.periodo}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">
                            {reporte.area || 'No especificada'}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              reporte.estado === 'enviado'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : reporte.estado === 'aprobado'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : reporte.estado === 'revision'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}>
                              {reporte.estado}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              {reporte.archivo_url && (
                                <a
                                  href={reporte.archivo_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Ver archivo"
                                >
                                  <Icon name="ExternalLink" size={14} />
                                </a>
                              )}
                              <button
                                onClick={() => editarReporte(reporte)}
                                className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Editar reporte"
                              >
                                <Icon name="Edit" size={14} />
                              </button>
                              <button
                                onClick={() => eliminarReporte(reporte.id)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar reporte"
                              >
                                <Icon name="Trash2" size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'plantillas' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="Layout" size={32} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Plantillas de Reportes</h3>
              <p className="text-slate-600 mb-4">
                Gestione las plantillas predefinidas para diferentes tipos de reportes legales SST
              </p>
              <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg font-medium">
                Gestionar Plantillas
              </button>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="BarChart3" size={32} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Dashboard Analítico</h3>
              <p className="text-slate-600 mb-4">
                Visualice estadísticas avanzadas, métricas de cumplimiento y tendencias de reportes SST
              </p>
              <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg font-medium">
                Ver Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportesLegalesMain;