import React, { useState, useEffect } from 'react';
import { supabase, dbHelpers } from '../../services/supabase';
import { Icon } from '../common/Icons';
import ExcelUploader from './ExcelUploader';

const Colaboradores = () => {
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, activos: 0, centroIndustrial: 0, hornosSolera: 0 });
  const [filtroArea, setFiltroArea] = useState('TODOS');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [showExcelUploader, setShowExcelUploader] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Formulario para nuevo colaborador
  const [newColaborador, setNewColaborador] = useState({
    nombre: '',
    cedula: '',
    area: 'Centro Industrial'
  });
  const [addingColaborador, setAddingColaborador] = useState(false);

  useEffect(() => {
    loadColaboradores();
  }, []);

  const loadColaboradores = async () => {
    try {
      const data = await dbHelpers.getAll('colaboradores', {
        orderBy: 'nombre',
        ascending: true
      });
      setColaboradores(data);
      calculateStats(data);
      setLoading(false);
      setError(null);

      // Set up real-time subscription
      const subscription = dbHelpers.subscribe('colaboradores', (payload) => {
        console.log('Colaboradores subscription event:', payload);
        // Reload data when changes occur
        loadColaboradoresData();
      });

      return () => subscription.unsubscribe();
    } catch (err) {
      console.error('Error obteniendo colaboradores:', err);
      setError('Error conectando con la base de datos');
      setLoading(false);
    }
  };

  const loadColaboradoresData = async () => {
    try {
      const data = await dbHelpers.getAll('colaboradores', {
        orderBy: 'nombre',
        ascending: true
      });
      setColaboradores(data);
      calculateStats(data);
    } catch (err) {
      console.error('Error recargando colaboradores:', err);
    }
  };

  const calculateStats = (data) => {
    const stats = {
      total: data.length,
      activos: data.filter(c => c.activo !== false).length,
      centroIndustrial: data.filter(c => c.area === 'Centro Industrial').length,
      hornosSolera: data.filter(c => c.area === 'Hornos Solera').length
    };
    setStats(stats);
  };

  const handleAddColaborador = async (e) => {
    e.preventDefault();

    if (!newColaborador.nombre.trim() || !newColaborador.cedula.trim()) {
      setMensaje('Por favor completa todos los campos');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }

    setAddingColaborador(true);

    try {
      // Verificar si ya existe
      const existing = await supabase
        .from('colaboradores')
        .select('*')
        .eq('cedula', newColaborador.cedula.trim())
        .maybeSingle();

      if (existing.data) {
        setMensaje('Ya existe un colaborador con esta cédula');
        setTimeout(() => setMensaje(''), 3000);
        setAddingColaborador(false);
        return;
      }

      // Agregar nuevo colaborador
      await dbHelpers.create('colaboradores', {
        nombre: newColaborador.nombre.trim(),
        cedula: newColaborador.cedula.trim(),
        area: newColaborador.area,
        departamento: newColaborador.area,
        activo: true,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        tipoColaborador: 'Operativo',
        fuenteDatos: 'Manual'
      });

      setMensaje('Colaborador agregado exitosamente');
      setNewColaborador({ nombre: '', cedula: '', area: 'Centro Industrial' });
      setShowAddForm(false);
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error agregando colaborador:', error);
      setMensaje('Error al agregar colaborador');
      setTimeout(() => setMensaje(''), 3000);
    } finally {
      setAddingColaborador(false);
    }
  };

  const handleToggleActivo = async (colaboradorId, nuevoEstado) => {
    try {
      await dbHelpers.update('colaboradores', colaboradorId, {
        activo: nuevoEstado,
        fechaActualizacion: new Date().toISOString()
      });

      setMensaje(`Colaborador ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`);
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error actualizando colaborador:', error);
      setMensaje(`Error actualizando colaborador`);
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  // Filtrar colaboradores
  const colaboradoresFiltrados = colaboradores.filter(colaborador => {
    const cumpleFiltroArea = filtroArea === 'TODOS' || colaborador.area === filtroArea;
    const cumpleBusqueda =
      colaborador.nombre?.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      colaborador.cedula?.includes(filtroBusqueda);
    return cumpleFiltroArea && cumpleBusqueda;
  });

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center p-8">
          <Icon name="Users" size={48} color="#6b7280" className="mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Cargando Colaboradores</h2>
          <p className="text-gray-500">Conectando con la base de datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-96 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-red-200 max-w-md w-full">
          <Icon name="AlertTriangle" size={48} color="#dc2626" className="mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600 mb-3">Error de Conexión</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <Icon name="RotateCcw" size={16} className="inline mr-2" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Icon name="Users" size={28} color="white" />
              </div>
              <h1 className="text-3xl font-bold">
                Gestión de Colaboradores
              </h1>
            </div>
            <p className="text-blue-100 text-lg">
              Administra la base de datos de colaboradores por área • {stats.total} colaboradores registrados
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-white bg-opacity-20 text-white border border-white border-opacity-30 rounded-lg hover:bg-opacity-30 transition-all font-semibold backdrop-blur-sm"
            >
              <Icon name="UserPlus" size={16} className="inline mr-2" />
              Agregar Individual
            </button>

            <button
              onClick={() => setShowExcelUploader(true)}
              className="px-6 py-3 bg-green-600 bg-opacity-90 text-white border border-white border-opacity-30 rounded-lg hover:bg-green-700 transition-all font-semibold backdrop-blur-sm"
            >
              <Icon name="FileSpreadsheet" size={16} className="inline mr-2" />
              Subir Excel
            </button>
          </div>
        </div>
      </div>

      {/* Mensaje de estado */}
      {mensaje && (
        <div className={`p-4 rounded-lg border font-semibold ${
          mensaje.includes('exitosamente')
            ? 'bg-green-50 text-green-800 border-green-200'
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            <Icon
              name={mensaje.includes('exitosamente') ? 'CheckCircle' : 'XCircle'}
              size={16}
            />
            {mensaje}
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Icon name="Users" size={24} color="#2563eb" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
          <div className="text-gray-700 font-semibold">Total Colaboradores</div>
          <div className="text-xs text-gray-500 mt-1">Registrados en el sistema</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Icon name="CheckCircle" size={24} color="#059669" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">{stats.activos}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
          <div className="text-gray-700 font-semibold">Activos</div>
          <div className="text-xs text-gray-500 mt-1">Colaboradores habilitados</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Icon name="Building" size={24} color="#d97706" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-orange-600">{stats.centroIndustrial}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
          <div className="text-gray-700 font-semibold">Centro Industrial</div>
          <div className="text-xs text-gray-500 mt-1">Área de producción</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <Icon name="Flame" size={24} color="#dc2626" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-red-600">{stats.hornosSolera}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
          <div className="text-gray-700 font-semibold">Hornos Solera</div>
          <div className="text-xs text-gray-500 mt-1">Área especializada</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Filter" size={20} color="#374151" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros de Búsqueda</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Buscar Colaborador
            </label>
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Nombre o cédula..."
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Filtrar por Área
            </label>
            <select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="TODOS">Todas las Áreas</option>
              <option value="Centro Industrial">Centro Industrial</option>
              <option value="Hornos Solera">Hornos Solera</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFiltroBusqueda('');
                setFiltroArea('TODOS');
              }}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              <Icon name="RotateCcw" size={16} className="inline mr-2" />
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Colaboradores */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Icon name="Users" size={20} />
            Lista de Colaboradores ({colaboradoresFiltrados.length})
          </h2>
        </div>

        {colaboradoresFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <Icon name="UserX" size={48} color="#9ca3af" className="mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No se encontraron colaboradores</h3>
            <p className="text-gray-500">Intenta ajustar los filtros o agrega nuevos colaboradores</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Colaborador</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Cédula</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Área</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Estado</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {colaboradoresFiltrados.map((colaborador) => (
                  <tr key={colaborador.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                          {colaborador.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{colaborador.nombre}</div>
                          <div className="text-sm text-gray-500">{colaborador.area}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 font-mono">
                        {colaborador.cedula}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        colaborador.area === 'Centro Industrial'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <Icon
                          name={colaborador.area === 'Centro Industrial' ? 'Building' : 'Flame'}
                          size={12}
                          className="mr-1"
                        />
                        {colaborador.area === 'Centro Industrial' ? 'Centro Industrial' : 'Hornos Solera'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        colaborador.activo !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <Icon
                          name={colaborador.activo !== false ? 'CheckCircle' : 'Pause'}
                          size={12}
                          className="mr-1"
                        />
                        {colaborador.activo !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleActivo(colaborador.id, !(colaborador.activo !== false))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          colaborador.activo !== false
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {colaborador.activo !== false ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para agregar colaborador */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-auto shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Agregar Colaborador
            </h2>

            <form onSubmit={handleAddColaborador} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Icon name="User" size={16} className="inline mr-1" />
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={newColaborador.nombre}
                  onChange={(e) => setNewColaborador({...newColaborador, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Juan Carlos Pérez"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Icon name="FileText" size={16} className="inline mr-1" />
                  Cédula *
                </label>
                <input
                  type="text"
                  value={newColaborador.cedula}
                  onChange={(e) => setNewColaborador({...newColaborador, cedula: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: 12345678"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Icon name="Building" size={16} className="inline mr-1" />
                  Área *
                </label>
                <select
                  value={newColaborador.area}
                  onChange={(e) => setNewColaborador({...newColaborador, area: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Centro Industrial">Centro Industrial</option>
                  <option value="Hornos Solera">Hornos Solera</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={addingColaborador}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                >
                  {addingColaborador ? (
                    <>
                      <Icon name="Loader2" size={16} className="inline mr-2 animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <Icon name="CheckCircle" size={16} className="inline mr-2" />
                      Agregar Colaborador
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewColaborador({ nombre: '', cedula: '', area: 'Centro Industrial' });
                  }}
                  disabled={addingColaborador}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                >
                  <Icon name="X" size={16} className="inline mr-2" />
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Uploader Modal */}
      {showExcelUploader && (
        <ExcelUploader
          onUploadComplete={(resultado) => {
            setMensaje(
              `Excel procesado exitosamente: ${resultado.migrados} colaboradores nuevos, ${resultado.yaExisten} ya existían, Total: ${resultado.total}`
            );
            setTimeout(() => setMensaje(''), 5000);
          }}
          onClose={() => setShowExcelUploader(false)}
        />
      )}
    </div>
  );
};

export default Colaboradores;