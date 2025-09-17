import React, { useState, useEffect } from 'react';
import { Icon } from '../common/Icons';
import { FormComponents } from '../common/FormComponents';
import { supabase } from '../../lib/supabase';

const ProductoForm = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    soloActivos: true,
    stockBajo: false
  });

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    stock_actual: 0,
    stock_minimo: 5,
    precio_unitario: 0,
    categoria: '',
    unidad_medida: '',
    codigo_producto: '',
    proveedor: '',
    ubicacion_almacen: '',
    fecha_vencimiento: '',
    notas: '',
    activo: true
  });

  const [errores, setErrores] = useState({});

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('epp_productos')
        .select('*')
        .order('nombre');

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.nombre?.trim()) {
      nuevosErrores.nombre = 'El nombre del producto es obligatorio';
    }

    if (!formData.descripcion?.trim()) {
      nuevosErrores.descripcion = 'La descripción es obligatoria';
    }

    if (formData.stock_actual < 0) {
      nuevosErrores.stock_actual = 'El stock actual no puede ser negativo';
    }

    if (formData.stock_minimo < 0) {
      nuevosErrores.stock_minimo = 'El stock mínimo no puede ser negativo';
    }

    if (formData.precio_unitario < 0) {
      nuevosErrores.precio_unitario = 'El precio unitario no puede ser negativo';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      setLoading(true);

      const datosProducto = {
        ...formData,
        stock_actual: parseInt(formData.stock_actual) || 0,
        stock_minimo: parseInt(formData.stock_minimo) || 5,
        precio_unitario: parseFloat(formData.precio_unitario) || 0
      };

      let result;
      if (modoEdicion && productoSeleccionado) {
        result = await supabase
          .from('epp_productos')
          .update(datosProducto)
          .eq('id', productoSeleccionado.id);
      } else {
        result = await supabase
          .from('epp_productos')
          .insert([datosProducto]);
      }

      if (result.error) throw result.error;

      await cargarProductos();
      resetearFormulario();

    } catch (error) {
      console.error('Error guardando producto:', error);
      setErrores({ submit: 'Error al guardar el producto. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const editarProducto = (producto) => {
    setProductoSeleccionado(producto);
    setFormData({
      ...producto,
      fecha_vencimiento: producto.fecha_vencimiento || '',
      notas: producto.notas || '',
      categoria: producto.categoria || '',
      unidad_medida: producto.unidad_medida || '',
      codigo_producto: producto.codigo_producto || '',
      proveedor: producto.proveedor || '',
      ubicacion_almacen: producto.ubicacion_almacen || ''
    });
    setModoEdicion(true);
    setErrores({});
  };

  const eliminarProducto = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;

    try {
      const { error } = await supabase
        .from('epp_productos')
        .update({ activo: false })
        .eq('id', id);

      if (error) throw error;
      await cargarProductos();
    } catch (error) {
      console.error('Error eliminando producto:', error);
    }
  };

  const resetearFormulario = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      stock_actual: 0,
      stock_minimo: 5,
      precio_unitario: 0,
      categoria: '',
      unidad_medida: '',
      codigo_producto: '',
      proveedor: '',
      ubicacion_almacen: '',
      fecha_vencimiento: '',
      notas: '',
      activo: true
    });
    setModoEdicion(false);
    setProductoSeleccionado(null);
    setErrores({});
  };

  const productosFiltrados = productos.filter(producto => {
    const cumpleBusqueda = !filtros.busqueda ||
      producto.nombre?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      producto.descripcion?.toLowerCase().includes(filtros.busqueda.toLowerCase());

    const cumpleActivos = !filtros.soloActivos || producto.activo;

    const cumpleStockBajo = !filtros.stockBajo ||
      (producto.stock_actual || 0) <= (producto.stock_minimo || 0);

    return cumpleBusqueda && cumpleActivos && cumpleStockBajo;
  });

  const categorias = [
    'Protección Respiratoria',
    'Protección Auditiva',
    'Protección Visual',
    'Protección de Cabeza',
    'Protección de Manos',
    'Protección de Pies',
    'Protección Corporal',
    'Protección contra Caídas',
    'Señalización',
    'Emergencias',
    'Otro'
  ];

  const unidadesMedida = [
    'Unidad',
    'Par',
    'Caja',
    'Paquete',
    'Metro',
    'Kilogramo',
    'Litro'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2 text-slate-600">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Cargando productos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Formulario de Producto */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            {modoEdicion ? 'Editar Producto EPP' : 'Registrar Nuevo Producto EPP'}
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
              label="Nombre del Producto"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              error={errores.nombre}
              required
              placeholder="Ej: Casco de Seguridad Blanco"
            />

            <FormComponents.Input
              label="Código del Producto"
              value={formData.codigo_producto}
              onChange={(e) => setFormData(prev => ({ ...prev, codigo_producto: e.target.value }))}
              placeholder="Ej: CASC-001"
            />

            <FormComponents.Select
              label="Categoría"
              value={formData.categoria}
              onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
              options={categorias.map(cat => ({ value: cat, label: cat }))}
              placeholder="Seleccionar categoría"
            />

            <FormComponents.Select
              label="Unidad de Medida"
              value={formData.unidad_medida}
              onChange={(e) => setFormData(prev => ({ ...prev, unidad_medida: e.target.value }))}
              options={unidadesMedida.map(unidad => ({ value: unidad, label: unidad }))}
              placeholder="Seleccionar unidad"
            />
          </div>

          <FormComponents.Textarea
            label="Descripción"
            value={formData.descripcion}
            onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
            error={errores.descripcion}
            required
            placeholder="Descripción detallada del producto EPP..."
            rows={3}
          />

          {/* Stock y Precios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormComponents.Input
              label="Stock Actual"
              type="number"
              value={formData.stock_actual}
              onChange={(e) => setFormData(prev => ({ ...prev, stock_actual: e.target.value }))}
              error={errores.stock_actual}
              min="0"
            />

            <FormComponents.Input
              label="Stock Mínimo"
              type="number"
              value={formData.stock_minimo}
              onChange={(e) => setFormData(prev => ({ ...prev, stock_minimo: e.target.value }))}
              error={errores.stock_minimo}
              min="0"
            />

            <FormComponents.Input
              label="Precio Unitario (COP)"
              type="number"
              value={formData.precio_unitario}
              onChange={(e) => setFormData(prev => ({ ...prev, precio_unitario: e.target.value }))}
              error={errores.precio_unitario}
              min="0"
              step="0.01"
            />
          </div>

          {/* Información Adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormComponents.Input
              label="Proveedor"
              value={formData.proveedor}
              onChange={(e) => setFormData(prev => ({ ...prev, proveedor: e.target.value }))}
              placeholder="Nombre del proveedor"
            />

            <FormComponents.Input
              label="Ubicación en Almacén"
              value={formData.ubicacion_almacen}
              onChange={(e) => setFormData(prev => ({ ...prev, ubicacion_almacen: e.target.value }))}
              placeholder="Ej: Estante A-3, Nivel 2"
            />

            <FormComponents.Input
              label="Fecha de Vencimiento"
              type="date"
              value={formData.fecha_vencimiento}
              onChange={(e) => setFormData(prev => ({ ...prev, fecha_vencimiento: e.target.value }))}
            />

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="activo"
                checked={formData.activo}
                onChange={(e) => setFormData(prev => ({ ...prev, activo: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="activo" className="text-sm font-medium text-slate-700">
                Producto activo
              </label>
            </div>
          </div>

          <FormComponents.Textarea
            label="Notas Adicionales"
            value={formData.notas}
            onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
            placeholder="Notas, especificaciones técnicas, etc..."
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Icon name={modoEdicion ? "Save" : "Plus"} size={16} />
              <span>{modoEdicion ? 'Actualizar' : 'Registrar'} Producto</span>
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Productos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Productos EPP Registrados</h3>
          <div className="text-sm text-slate-600">
            {productosFiltrados.length} productos
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Icon name="Search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filtros.soloActivos}
              onChange={(e) => setFiltros(prev => ({ ...prev, soloActivos: e.target.checked }))}
              className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">Solo activos</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filtros.stockBajo}
              onChange={(e) => setFiltros(prev => ({ ...prev, stockBajo: e.target.checked }))}
              className="w-4 h-4 text-amber-600 bg-slate-100 border-slate-300 rounded focus:ring-amber-500"
            />
            <span className="text-sm text-slate-700">Stock bajo</span>
          </label>
        </div>

        {/* Tabla de Productos */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-600">Producto</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Categoría</th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">Stock</th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">Precio</th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">Estado</th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {productosFiltrados.map((producto) => {
                const stockBajo = (producto.stock_actual || 0) <= (producto.stock_minimo || 0);

                return (
                  <tr key={producto.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-slate-900">{producto.nombre}</div>
                        <div className="text-sm text-slate-500">{producto.descripcion}</div>
                        {producto.codigo_producto && (
                          <div className="text-xs text-slate-400">Código: {producto.codigo_producto}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-600">{producto.categoria || 'Sin categoría'}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className={`font-medium ${stockBajo ? 'text-amber-600' : 'text-slate-900'}`}>
                        {producto.stock_actual || 0}
                      </div>
                      <div className="text-xs text-slate-500">
                        Min: {producto.stock_minimo || 0}
                      </div>
                      {stockBajo && (
                        <div className="text-xs text-amber-600 font-medium">¡Stock bajo!</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-slate-900">
                        {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          minimumFractionDigits: 0
                        }).format(producto.precio_unitario || 0)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        producto.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => editarProducto(producto)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar producto"
                        >
                          <Icon name="Edit" size={16} />
                        </button>
                        <button
                          onClick={() => eliminarProducto(producto.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar producto"
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

          {productosFiltrados.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Icon name="Package" size={48} className="mx-auto mb-2 opacity-50" />
              <p>No se encontraron productos que coincidan con los filtros</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductoForm;