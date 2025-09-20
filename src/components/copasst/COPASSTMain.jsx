import React, { useState, useEffect } from 'react';
import { dbHelpers } from '../../services/supabase';
import { Icon } from '../common/Icons';

const COPASSTMain = () => {
  const [vistaActiva, setVistaActiva] = useState('dashboard');
  const [miembros, setMiembros] = useState([]);
  const [reuniones, setReuniones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [mensaje, setMensaje] = useState('');

  const vistas = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'BarChart3',
      color: 'from-amber-600 to-amber-700',
      description: 'Vista analítica del COPASST, reuniones y cumplimiento normativo'
    },
    {
      id: 'miembros',
      label: 'Miembros del Comité',
      icon: 'Users',
      color: 'from-yellow-600 to-yellow-700',
      description: 'Gestión de miembros del Comité Paritario de Seguridad y Salud en el Trabajo'
    },
    {
      id: 'reuniones',
      label: 'Reuniones y Actas',
      icon: 'Calendar',
      color: 'from-orange-600 to-orange-700',
      description: 'Registro de reuniones, actas y seguimiento de compromisos del COPASST'
    }
  ];

  const vistaActual = vistas.find(v => v.id === vistaActiva);

  // Estados para formularios
  const [formDataMiembro, setFormDataMiembro] = useState({
    colaborador_nombre: '',
    cedula: '',
    cargo: '',
    area: '',
    tipo_miembro: '',
    es_principal: true,
    fecha_inicio: '',
    fecha_fin: '',
    telefono: '',
    email: '',
    capacitacion_copasst: false,
    fecha_capacitacion: '',
    institucion_capacitacion: ''
  });

  const [formDataReunion, setFormDataReunion] = useState({
    numero_reunion: '',
    fecha_reunion: '',
    hora_inicio: '',
    hora_fin: '',
    lugar: '',
    tipo_reunion: 'Ordinaria',
    presidente: '',
    secretario: '',
    orden_dia: '',
    desarrollo_reunion: '',
    compromisos: '',
    observaciones: '',
    asistentes: [],
    acta_url: '',
    evidencias_urls: [],
    aprobada: false,
    fecha_aprobacion: '',
    aprobada_por: '',
    requiere_seguimiento: false,
    fecha_seguimiento: ''
  });

  const tiposMiembro = [
    'Empleador',
    'Trabajador',
    'Presidente',
    'Secretario'
  ];

  const areas = [
    'Centro Industrial',
    'Hornos Solera'
  ];

  const tiposReunion = [
    'Ordinaria',
    'Extraordinaria',
    'Instalación',
    'Virtual'
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [miembrosData, reunionesData] = await Promise.all([
        dbHelpers.getAll('copasst_miembros', {
          orderBy: 'created_at',
          ascending: false
        }),
        dbHelpers.getAll('copasst_reuniones', {
          orderBy: 'fecha_reunion',
          ascending: false
        })
      ]);

      setMiembros(miembrosData || []);
      setReuniones(reunionesData || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setMensaje('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMiembro = async (e) => {
    e.preventDefault();

    if (!formDataMiembro.colaborador_nombre || !formDataMiembro.cedula ||
        !formDataMiembro.cargo || !formDataMiembro.area ||
        !formDataMiembro.tipo_miembro || !formDataMiembro.fecha_inicio ||
        !formDataMiembro.fecha_fin) {
      setMensaje('Por favor complete los campos obligatorios');
      return;
    }

    // Validar fechas
    const fechaInicio = new Date(formDataMiembro.fecha_inicio);
    const fechaFin = new Date(formDataMiembro.fecha_fin);

    if (fechaFin <= fechaInicio) {
      setMensaje('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    try {
      const dataToSave = {
        ...formDataMiembro,
        fecha_capacitacion: formDataMiembro.fecha_capacitacion || null,
        created_at: editingItem ? undefined : new Date().toISOString()
      };

      if (editingItem) {
        await dbHelpers.update('copasst_miembros', editingItem.id, dataToSave);
        setMensaje('Miembro actualizado exitosamente');
      } else {
        await dbHelpers.create('copasst_miembros', dataToSave);
        setMensaje('Miembro registrado exitosamente');
      }

      resetFormMiembro();
      setShowForm(false);
      setEditingItem(null);
      cargarDatos();

      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error guardando miembro:', error);
      setMensaje('Error al guardar el miembro');
    }
  };

  const handleSubmitReunion = async (e) => {
    e.preventDefault();

    if (!formDataReunion.numero_reunion || !formDataReunion.fecha_reunion ||
        !formDataReunion.hora_inicio || !formDataReunion.lugar ||
        !formDataReunion.presidente || !formDataReunion.secretario ||
        !formDataReunion.orden_dia || !formDataReunion.desarrollo_reunion) {
      setMensaje('Por favor complete los campos obligatorios');
      return;
    }

    // Validar horas si se proporciona hora_fin
    if (formDataReunion.hora_fin && formDataReunion.hora_inicio) {
      if (formDataReunion.hora_fin <= formDataReunion.hora_inicio) {
        setMensaje('La hora de fin debe ser posterior a la hora de inicio');
        return;
      }
    }

    try {
      const dataToSave = {
        ...formDataReunion,
        numero_reunion: parseInt(formDataReunion.numero_reunion),
        hora_fin: formDataReunion.hora_fin || null,
        asistentes: Array.isArray(formDataReunion.asistentes) ? formDataReunion.asistentes : [],
        evidencias_urls: formDataReunion.evidencias_urls || [],
        fecha_aprobacion: formDataReunion.aprobada ? formDataReunion.fecha_aprobacion || new Date().toISOString().split('T')[0] : null,
        fecha_seguimiento: formDataReunion.requiere_seguimiento ? formDataReunion.fecha_seguimiento : null,
        created_at: editingItem ? undefined : new Date().toISOString()
      };

      if (editingItem) {
        await dbHelpers.update('copasst_reuniones', editingItem.id, dataToSave);
        setMensaje('Reunión actualizada exitosamente');
      } else {
        await dbHelpers.create('copasst_reuniones', dataToSave);
        setMensaje('Reunión registrada exitosamente');
      }

      resetFormReunion();
      setShowForm(false);
      setEditingItem(null);
      cargarDatos();

      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error guardando reunión:', error);
      setMensaje('Error al guardar la reunión');
    }
  };

  const editarMiembro = (miembro) => {
    setFormDataMiembro({
      colaborador_nombre: miembro.colaborador_nombre || '',
      cedula: miembro.cedula || '',
      cargo: miembro.cargo || '',
      area: miembro.area || '',
      tipo_miembro: miembro.tipo_miembro || '',
      es_principal: miembro.es_principal !== false,
      fecha_inicio: miembro.fecha_inicio || '',
      fecha_fin: miembro.fecha_fin || '',
      telefono: miembro.telefono || '',
      email: miembro.email || '',
      capacitacion_copasst: miembro.capacitacion_copasst || false,
      fecha_capacitacion: miembro.fecha_capacitacion || '',
      institucion_capacitacion: miembro.institucion_capacitacion || ''
    });
    setEditingItem(miembro);
    setShowForm(true);
  };

  const editarReunion = (reunion) => {
    setFormDataReunion({
      numero_reunion: reunion.numero_reunion?.toString() || '',
      fecha_reunion: reunion.fecha_reunion || '',
      hora_inicio: reunion.hora_inicio || '',
      hora_fin: reunion.hora_fin || '',
      lugar: reunion.lugar || '',
      tipo_reunion: reunion.tipo_reunion || 'Ordinaria',
      presidente: reunion.presidente || '',
      secretario: reunion.secretario || '',
      orden_dia: reunion.orden_dia || '',
      desarrollo_reunion: reunion.desarrollo_reunion || '',
      compromisos: reunion.compromisos || '',
      observaciones: reunion.observaciones || '',
      asistentes: Array.isArray(reunion.asistentes) ? reunion.asistentes : [],
      acta_url: reunion.acta_url || '',
      evidencias_urls: reunion.evidencias_urls || [],
      aprobada: reunion.aprobada || false,
      fecha_aprobacion: reunion.fecha_aprobacion || '',
      aprobada_por: reunion.aprobada_por || '',
      requiere_seguimiento: reunion.requiere_seguimiento || false,
      fecha_seguimiento: reunion.fecha_seguimiento || ''
    });
    setEditingItem(reunion);
    setShowForm(true);
  };

  const eliminar = async (id, tabla, tipo) => {
    if (window.confirm(`¿Está seguro de eliminar este ${tipo}?`)) {
      try {
        await dbHelpers.delete(tabla, id);
        setMensaje(`${tipo} eliminado exitosamente`);
        cargarDatos();
        setTimeout(() => setMensaje(''), 3000);
      } catch (error) {
        console.error(`Error eliminando ${tipo}:`, error);
        setMensaje(`Error al eliminar el ${tipo}`);
      }
    }
  };

  const resetFormMiembro = () => {
    setFormDataMiembro({
      colaborador_nombre: '',
      cedula: '',
      cargo: '',
      area: '',
      tipo_miembro: '',
      es_principal: true,
      fecha_inicio: '',
      fecha_fin: '',
      telefono: '',
      email: '',
      capacitacion_copasst: false,
      fecha_capacitacion: '',
      institucion_capacitacion: ''
    });
  };

  const resetFormReunion = () => {
    setFormDataReunion({
      numero_reunion: '',
      fecha_reunion: '',
      hora_inicio: '',
      hora_fin: '',
      lugar: '',
      tipo_reunion: 'Ordinaria',
      presidente: '',
      secretario: '',
      orden_dia: '',
      desarrollo_reunion: '',
      compromisos: '',
      observaciones: '',
      asistentes: [],
      acta_url: '',
      evidencias_urls: [],
      aprobada: false,
      fecha_aprobacion: '',
      aprobada_por: '',
      requiere_seguimiento: false,
      fecha_seguimiento: ''
    });
  };

  const cancelarForm = () => {
    setShowForm(false);
    setEditingItem(null);
    resetFormMiembro();
    resetFormReunion();
    setMensaje('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-200 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
            <Icon name="Loader" size={24} className="text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Cargando Sistema COPASST</h3>
          <p className="text-slate-600">Obteniendo datos del comité...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (vistaActiva) {
      case 'dashboard':
        return renderDashboard();
      case 'miembros':
        return renderMiembros();
      case 'reuniones':
        return renderReuniones();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50">
      {/* Header Principal */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-amber-700 to-yellow-700 rounded-2xl p-3 shadow-lg">
                <Icon name="Users" size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent">
                  Sistema COPASST
                </h1>
                <p className="text-slate-600 font-medium">
                  Comité Paritario SST • Gestión de Reuniones • Seguimiento de Acuerdos • Cumplimiento Normativo
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Sistema COPASST Activo</span>
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
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {vistas.map(vista => (
              <button
                key={vista.id}
                onClick={() => setVistaActiva(vista.id)}
                className={`
                  flex items-center space-x-3 px-6 py-4 rounded-t-xl font-semibold transition-all duration-300
                  ${vistaActiva === vista.id
                    ? `bg-gradient-to-r ${vista.color} text-white shadow-lg transform scale-105`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                <Icon
                  name={vista.icon}
                  size={20}
                  className={vistaActiva === vista.id ? 'text-white' : 'text-slate-500'}
                />
                <span>{vista.label}</span>
                {vistaActiva === vista.id && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vista Activa Info */}
      <div className="bg-gradient-to-r from-slate-50 to-amber-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <Icon name="Info" size={16} className="text-slate-500" />
            <p className="text-slate-700 font-medium">
              {vistaActual?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      {mensaje && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className={`p-4 rounded-lg border ${
            mensaje.includes('Error')
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            <div className="flex items-center space-x-2">
              <Icon
                name={mensaje.includes('Error') ? 'AlertCircle' : 'CheckCircle'}
                size={20}
                className={mensaje.includes('Error') ? 'text-red-500' : 'text-green-500'}
              />
              <span className="font-medium">{mensaje}</span>
            </div>
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {renderContent()}
      </div>
    </div>
  );

  // Dashboard con estadísticas mejoradas
  function renderDashboard() {
    // Estadísticas mejoradas
    const miembrosActivos = miembros.filter(m => m.activo).length;
    const miembrosPrincipales = miembros.filter(m => m.es_principal && m.activo).length;
    const reunionesEsteAno = reuniones.filter(r => {
      const fechaReunion = new Date(r.fecha_reunion);
      return fechaReunion.getFullYear() === new Date().getFullYear();
    }).length;
    const actasAprobadas = reuniones.filter(r => r.aprobada).length;
    const reunionesPendientes = reuniones.filter(r => r.requiere_seguimiento).length;
    const proximasReuniones = reuniones.filter(r => {
      const fechaReunion = new Date(r.fecha_reunion);
      const hoy = new Date();
      return fechaReunion > hoy;
    }).length;

    return (
      <div className="space-y-8">
        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                <Icon name="Users" size={20} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{miembrosActivos}</p>
                <p className="text-sm text-slate-600">Miembros Activos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                <Icon name="Star" size={20} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{miembrosPrincipales}</p>
                <p className="text-sm text-slate-600">Principales</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                <Icon name="Calendar" size={20} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{reunionesEsteAno}</p>
                <p className="text-sm text-slate-600">Reuniones {new Date().getFullYear()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg">
                <Icon name="CheckSquare" size={20} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{actasAprobadas}</p>
                <p className="text-sm text-slate-600">Actas Aprobadas</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
                <Icon name="Clock" size={20} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{reunionesPendientes}</p>
                <p className="text-sm text-slate-600">Seguimientos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg">
                <Icon name="Calendar" size={20} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{proximasReuniones}</p>
                <p className="text-sm text-slate-600">Próximas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
            <Icon name="Zap" size={20} className="text-amber-600" />
            <span>Acciones Rápidas</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setVistaActiva('miembros');
                setShowForm(true);
                resetFormMiembro();
              }}
              className="flex items-center space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Icon name="UserPlus" size={20} className="text-blue-600" />
              <span className="font-medium text-slate-700">Agregar Miembro</span>
            </button>

            <button
              onClick={() => {
                setVistaActiva('reuniones');
                setShowForm(true);
                resetFormReunion();
              }}
              className="flex items-center space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Icon name="Plus" size={20} className="text-green-600" />
              <span className="font-medium text-slate-700">Nueva Reunión</span>
            </button>

            <button
              onClick={() => setVistaActiva('reuniones')}
              className="flex items-center space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Icon name="FileText" size={20} className="text-purple-600" />
              <span className="font-medium text-slate-700">Ver Actas</span>
            </button>
          </div>
        </div>

        {/* Reuniones recientes */}
        {reuniones.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
              <Icon name="Clock" size={20} className="text-slate-600" />
              <span>Reuniones Recientes</span>
            </h3>
            <div className="space-y-3">
              {reuniones.slice(0, 5).map((reunion) => (
                <div key={reunion.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">#{reunion.numero_reunion}</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{reunion.tipo_reunion}</p>
                      <p className="text-sm text-slate-600">{reunion.fecha_reunion} - {reunion.lugar}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      reunion.aprobada
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {reunion.aprobada ? 'Aprobada' : 'Pendiente'}
                    </span>
                    <button
                      onClick={() => setVistaActiva('reuniones')}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <Icon name="ArrowRight" size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Función para renderizar la sección de miembros
  function renderMiembros() {
    return (
      <div className="space-y-6">
        {/* Header con botón agregar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Miembros del COPASST</h2>
            <p className="text-slate-600">Gestión de miembros del Comité Paritario de Seguridad y Salud en el Trabajo</p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              resetFormMiembro();
              setEditingItem(null);
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
          >
            <Icon name="UserPlus" size={20} />
            <span>Nuevo Miembro</span>
          </button>
        </div>

        {/* Formulario de miembro */}
        {showForm && vistaActiva === 'miembros' && renderFormularioMiembro()}

        {/* Lista de miembros */}
        {miembros.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Users" size={24} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay miembros registrados</h3>
            <p className="text-slate-600 mb-4">Comience agregando el primer miembro del COPASST</p>
            <button
              onClick={() => {
                setShowForm(true);
                resetFormMiembro();
              }}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
            >
              Agregar Primer Miembro
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-slate-900">Miembro</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-900">Cargo</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-900">Tipo</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-900">Período</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-900">Estado</th>
                    <th className="text-center py-4 px-6 font-semibold text-slate-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {miembros.map((miembro) => (
                    <tr key={miembro.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-semibold text-slate-900">{miembro.colaborador_nombre}</p>
                          <p className="text-sm text-slate-600">{miembro.cedula} • {miembro.area}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-700">{miembro.cargo}</td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-slate-900">{miembro.tipo_miembro}</p>
                          <p className="text-sm text-slate-600">{miembro.es_principal ? 'Principal' : 'Suplente'}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-slate-900">{miembro.fecha_inicio}</p>
                          <p className="text-sm text-slate-600">hasta {miembro.fecha_fin}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          miembro.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {miembro.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => editarMiembro(miembro)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar miembro"
                          >
                            <Icon name="Edit" size={16} />
                          </button>
                          <button
                            onClick={() => eliminar(miembro.id, 'copasst_miembros', 'miembro')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar miembro"
                          >
                            <Icon name="Trash2" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Función para renderizar la sección de reuniones
  function renderReuniones() {
    return (
      <div className="space-y-6">
        {/* Header con botón agregar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Reuniones y Actas del COPASST</h2>
            <p className="text-slate-600">Registro de reuniones, actas y seguimiento de compromisos</p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              resetFormReunion();
              setEditingItem(null);
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
          >
            <Icon name="Plus" size={20} />
            <span>Nueva Reunión</span>
          </button>
        </div>

        {/* Formulario de reunión */}
        {showForm && vistaActiva === 'reuniones' && renderFormularioReunion()}

        {/* Lista de reuniones */}
        {reuniones.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Calendar" size={24} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay reuniones registradas</h3>
            <p className="text-slate-600 mb-4">Comience registrando la primera reunión del COPASST</p>
            <button
              onClick={() => {
                setShowForm(true);
                resetFormReunion();
              }}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all"
            >
              Registrar Primera Reunión
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-slate-900">Reunión</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-900">Fecha y Hora</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-900">Lugar</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-900">Presidida por</th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-900">Estado</th>
                    <th className="text-center py-4 px-6 font-semibold text-slate-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reuniones.map((reunion) => (
                    <tr key={reunion.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-semibold text-slate-900">Reunión #{reunion.numero_reunion}</p>
                          <p className="text-sm text-slate-600">{reunion.tipo_reunion}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-slate-900">{reunion.fecha_reunion}</p>
                          <p className="text-sm text-slate-600">
                            {reunion.hora_inicio} {reunion.hora_fin && `- ${reunion.hora_fin}`}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-700">{reunion.lugar}</td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-slate-900">{reunion.presidente}</p>
                          <p className="text-sm text-slate-600">Sec: {reunion.secretario}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            reunion.aprobada
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {reunion.aprobada ? 'Aprobada' : 'Pendiente'}
                          </span>
                          {reunion.requiere_seguimiento && (
                            <span className="block px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                              Seguimiento
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center space-x-2">
                          {reunion.acta_url && (
                            <a
                              href={reunion.acta_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver acta"
                            >
                              <Icon name="ExternalLink" size={16} />
                            </a>
                          )}
                          <button
                            onClick={() => editarReunion(reunion)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Editar reunión"
                          >
                            <Icon name="Edit" size={16} />
                          </button>
                          <button
                            onClick={() => eliminar(reunion.id, 'copasst_reuniones', 'reunión')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar reunión"
                          >
                            <Icon name="Trash2" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Función para renderizar formulario de miembro
  function renderFormularioMiembro() {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900">
            {editingItem ? 'Editar Miembro del COPASST' : 'Nuevo Miembro del COPASST'}
          </h3>
          <button
            onClick={cancelarForm}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmitMiembro} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nombre del Colaborador *
              </label>
              <input
                type="text"
                value={formDataMiembro.colaborador_nombre}
                onChange={(e) => setFormDataMiembro({...formDataMiembro, colaborador_nombre: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Nombre completo del miembro"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Cédula *
              </label>
              <input
                type="text"
                value={formDataMiembro.cedula}
                onChange={(e) => setFormDataMiembro({...formDataMiembro, cedula: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Número de cédula"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Cargo *
              </label>
              <input
                type="text"
                value={formDataMiembro.cargo}
                onChange={(e) => setFormDataMiembro({...formDataMiembro, cargo: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Cargo del colaborador"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Área *
              </label>
              <select
                value={formDataMiembro.area}
                onChange={(e) => setFormDataMiembro({...formDataMiembro, area: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              >
                <option value="">Seleccionar área</option>
                {areas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Tipo de Miembro *
              </label>
              <select
                value={formDataMiembro.tipo_miembro}
                onChange={(e) => setFormDataMiembro({...formDataMiembro, tipo_miembro: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              >
                <option value="">Seleccionar tipo</option>
                {tiposMiembro.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                value={formDataMiembro.fecha_inicio}
                onChange={(e) => setFormDataMiembro({...formDataMiembro, fecha_inicio: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Fecha de Fin *
              </label>
              <input
                type="date"
                value={formDataMiembro.fecha_fin}
                onChange={(e) => setFormDataMiembro({...formDataMiembro, fecha_fin: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Teléfono
              </label>
              <input
                type="text"
                value={formDataMiembro.telefono}
                onChange={(e) => setFormDataMiembro({...formDataMiembro, telefono: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="+57 300 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formDataMiembro.email}
                onChange={(e) => setFormDataMiembro({...formDataMiembro, email: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="email@empresa.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Fecha de Capacitación
              </label>
              <input
                type="date"
                value={formDataMiembro.fecha_capacitacion}
                onChange={(e) => setFormDataMiembro({...formDataMiembro, fecha_capacitacion: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Institución de Capacitación
              </label>
              <input
                type="text"
                value={formDataMiembro.institucion_capacitacion}
                onChange={(e) => setFormDataMiembro({...formDataMiembro, institucion_capacitacion: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Nombre de la institución"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formDataMiembro.es_principal}
                onChange={(e) => setFormDataMiembro({...formDataMiembro, es_principal: e.target.checked})}
                className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">Es miembro principal (no suplente)</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formDataMiembro.capacitacion_copasst}
                onChange={(e) => setFormDataMiembro({...formDataMiembro, capacitacion_copasst: e.target.checked})}
                className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">Ha recibido capacitación específica para COPASST</span>
            </label>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={cancelarForm}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg font-medium"
            >
              {editingItem ? 'Actualizar Miembro' : 'Guardar Miembro'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Función para renderizar formulario de reunión mejorado
  function renderFormularioReunion() {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900">
            {editingItem ? 'Editar Reunión del COPASST' : 'Nueva Reunión del COPASST'}
          </h3>
          <button
            onClick={cancelarForm}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmitReunion} className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Número de Reunión *
              </label>
              <input
                type="number"
                value={formDataReunion.numero_reunion}
                onChange={(e) => setFormDataReunion({...formDataReunion, numero_reunion: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="1"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Fecha de Reunión *
              </label>
              <input
                type="date"
                value={formDataReunion.fecha_reunion}
                onChange={(e) => setFormDataReunion({...formDataReunion, fecha_reunion: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Tipo de Reunión
              </label>
              <select
                value={formDataReunion.tipo_reunion}
                onChange={(e) => setFormDataReunion({...formDataReunion, tipo_reunion: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              >
                {tiposReunion.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Hora de Inicio *
              </label>
              <input
                type="time"
                value={formDataReunion.hora_inicio}
                onChange={(e) => setFormDataReunion({...formDataReunion, hora_inicio: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Hora de Fin
              </label>
              <input
                type="time"
                value={formDataReunion.hora_fin}
                onChange={(e) => setFormDataReunion({...formDataReunion, hora_fin: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Lugar *
              </label>
              <input
                type="text"
                value={formDataReunion.lugar}
                onChange={(e) => setFormDataReunion({...formDataReunion, lugar: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Sala de reuniones, oficina, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Presidente *
              </label>
              <input
                type="text"
                value={formDataReunion.presidente}
                onChange={(e) => setFormDataReunion({...formDataReunion, presidente: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Nombre del presidente"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Secretario *
              </label>
              <input
                type="text"
                value={formDataReunion.secretario}
                onChange={(e) => setFormDataReunion({...formDataReunion, secretario: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Nombre del secretario"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                URL del Acta
              </label>
              <input
                type="url"
                value={formDataReunion.acta_url}
                onChange={(e) => setFormDataReunion({...formDataReunion, acta_url: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="https://drive.google.com/..."
              />
            </div>
          </div>

          {/* Desarrollo de la reunión */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Orden del Día *
              </label>
              <textarea
                value={formDataReunion.orden_dia}
                onChange={(e) => setFormDataReunion({...formDataReunion, orden_dia: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                rows="4"
                placeholder="1. Verificación de quórum&#10;2. Lectura del orden del día&#10;3. ..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Desarrollo de la Reunión *
              </label>
              <textarea
                value={formDataReunion.desarrollo_reunion}
                onChange={(e) => setFormDataReunion({...formDataReunion, desarrollo_reunion: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                rows="4"
                placeholder="Descripción detallada de los temas tratados..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Compromisos
              </label>
              <textarea
                value={formDataReunion.compromisos}
                onChange={(e) => setFormDataReunion({...formDataReunion, compromisos: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                rows="3"
                placeholder="Compromisos y responsables..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Observaciones
              </label>
              <textarea
                value={formDataReunion.observaciones}
                onChange={(e) => setFormDataReunion({...formDataReunion, observaciones: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                rows="3"
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>

          {/* Campos de seguimiento y aprobación */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Asistentes (separados por comas)
              </label>
              <input
                type="text"
                value={Array.isArray(formDataReunion.asistentes) ? formDataReunion.asistentes.join(', ') : ''}
                onChange={(e) => setFormDataReunion({...formDataReunion, asistentes: e.target.value.split(',').map(a => a.trim()).filter(a => a)})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Juan Pérez, Ana García, Luis Rodríguez..."
              />
            </div>

            {formDataReunion.aprobada && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Fecha de Aprobación
                  </label>
                  <input
                    type="date"
                    value={formDataReunion.fecha_aprobacion}
                    onChange={(e) => setFormDataReunion({...formDataReunion, fecha_aprobacion: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Aprobada por
                  </label>
                  <input
                    type="text"
                    value={formDataReunion.aprobada_por}
                    onChange={(e) => setFormDataReunion({...formDataReunion, aprobada_por: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Nombre del aprobador"
                  />
                </div>
              </>
            )}

            {formDataReunion.requiere_seguimiento && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Fecha de Seguimiento
                </label>
                <input
                  type="date"
                  value={formDataReunion.fecha_seguimiento}
                  onChange={(e) => setFormDataReunion({...formDataReunion, fecha_seguimiento: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                />
              </div>
            )}
          </div>

          {/* Checkboxes */}
          <div className="flex flex-col space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formDataReunion.aprobada}
                onChange={(e) => setFormDataReunion({...formDataReunion, aprobada: e.target.checked})}
                className="w-5 h-5 text-green-600 border-slate-300 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-slate-700">Acta aprobada</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formDataReunion.requiere_seguimiento}
                onChange={(e) => setFormDataReunion({...formDataReunion, requiere_seguimiento: e.target.checked})}
                className="w-5 h-5 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-slate-700">Requiere seguimiento</span>
            </label>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={cancelarForm}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg font-medium"
            >
              {editingItem ? 'Actualizar Reunión' : 'Guardar Reunión'}
            </button>
          </div>
        </form>
      </div>
    );
  }
};

export default COPASSTMain;