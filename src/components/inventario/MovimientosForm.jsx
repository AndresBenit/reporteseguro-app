import React, { useState, useEffect } from 'react';
import { Icon } from '../common/Icons';
import { FormComponents } from '../common/FormComponents';
import { supabase } from '../../lib/supabase';

const MovimientosForm = () => {
  const [productos, setProductos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    fechaInicio: '',
    fechaFin: '',
    producto: ''
  });

  const [formData, setFormData] = useState({
    tipo_movimiento: 'entrada',
    producto_id: '',
    cantidad: 1,
    motivo: '',
    responsable: '',
    colaborador_destino: '',
    observaciones: '',
    costo_unitario: 0,
    numero_factura: '',
    proveedor: '',
    fecha_movimiento: new Date().toISOString().split('T')[0]
  });

  const [errores, setErrores] = useState({});

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [productosRes, colaboradoresRes, movimientosRes] = await Promise.all([
        supabase.from('epp_productos').select('*').eq('activo', true).order('nombre'),
        supabase.from('colaboradores').select('id, nombre_completo').eq('activo', true).order('nombre_completo'),
        supabase.from('movimientos_inventario').select(`
          *,
          epp_productos(nombre),
          colaboradores(nombre_completo)
        `).order('created_at', { ascending: false }).limit(50)
      ]);

      if (productosRes.error) throw productosRes.error;
      if (colaboradoresRes.error) throw colaboradoresRes.error;
      if (movimientosRes.error) throw movimientosRes.error;

      setProductos(productosRes.data || []);
      setColaboradores(colaboradoresRes.data || []);
      setMovimientos(movimientosRes.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.producto_id) {
      nuevosErrores.producto_id = 'Debe seleccionar un producto';
    }

    if (!formData.cantidad || formData.cantidad <= 0) {
      nuevosErrores.cantidad = 'La cantidad debe ser mayor a 0';
    }

    if (!formData.motivo?.trim()) {
      nuevosErrores.motivo = 'El motivo es obligatorio';
    }

    if (!formData.responsable?.trim()) {
      nuevosErrores.responsable = 'El responsable es obligatorio';
    }

    if (formData.tipo_movimiento === 'salida' && !formData.colaborador_destino) {
      nuevosErrores.colaborador_destino = 'Debe seleccionar el colaborador destino para salidas';
    }

    if (formData.tipo_movimiento === 'entrada') {
      if (!formData.costo_unitario || formData.costo_unitario < 0) {
        nuevosErrores.costo_unitario = 'El costo unitario es obligatorio para entradas';
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

      const productoSeleccionado = productos.find(p => p.id == formData.producto_id);
      if (!productoSeleccionado) {
        throw new Error('Producto no encontrado');
      }

      // Verificar stock disponible para salidas
      if (formData.tipo_movimiento === 'salida') {
        if (productoSeleccionado.stock_actual < parseInt(formData.cantidad)) {
          setErrores({ cantidad: 'No hay stock suficiente para esta salida' });
          return;
        }
      }

      // Registrar el movimiento
      const datosMovimiento = {
        tipo_movimiento: formData.tipo_movimiento,
        producto_id: parseInt(formData.producto_id),
        cantidad: parseInt(formData.cantidad),
        motivo: formData.motivo,
        responsable: formData.responsable,
        colaborador_destino: formData.colaborador_destino || null,
        observaciones: formData.observaciones || null,
        costo_unitario: parseFloat(formData.costo_unitario) || 0,
        numero_factura: formData.numero_factura || null,
        proveedor: formData.proveedor || null,
        fecha_movimiento: formData.fecha_movimiento
      };

      const { error: movimientoError } = await supabase
        .from('movimientos_inventario')
        .insert([datosMovimiento]);

      if (movimientoError) throw movimientoError;

      // Actualizar stock del producto
      const nuevoStock = formData.tipo_movimiento === 'entrada'
        ? productoSeleccionado.stock_actual + parseInt(formData.cantidad)
        : productoSeleccionado.stock_actual - parseInt(formData.cantidad);

      const { error: stockError } = await supabase
        .from('epp_productos')
        .update({ stock_actual: nuevoStock })
        .eq('id', formData.producto_id);

      if (stockError) throw stockError;

      await cargarDatos();
      resetearFormulario();

    } catch (error) {
      console.error('Error guardando movimiento:', error);
      setErrores({ submit: 'Error al guardar el movimiento. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const resetearFormulario = () => {
    setFormData({
      tipo_movimiento: 'entrada',
      producto_id: '',
      cantidad: 1,
      motivo: '',
      responsable: '',
      colaborador_destino: '',
      observaciones: '',
      costo_unitario: 0,
      numero_factura: '',
      proveedor: '',
      fecha_movimiento: new Date().toISOString().split('T')[0]
    });
    setErrores({});
  };

  const movimientosFiltrados = movimientos.filter(movimiento => {
    const cumpleTipo = filtros.tipo === 'todos' || movimiento.tipo_movimiento === filtros.tipo;

    const cumpleFecha = (!filtros.fechaInicio || movimiento.fecha_movimiento >= filtros.fechaInicio) &&
                       (!filtros.fechaFin || movimiento.fecha_movimiento <= filtros.fechaFin);

    const cumpleProducto = !filtros.producto || movimiento.producto_id == filtros.producto;

    return cumpleTipo && cumpleFecha && cumpleProducto;
  });

  const motivosComunes = {
    entrada: [
      'Compra nuevos productos',
      'Devolución de colaborador',
      'Reposición por garantía',
      'Donación',
      'Transferencia de almacén',
      'Ajuste de inventario'
    ],
    salida: [
      'Asignación a colaborador',
      'Reemplazo por daño',
      'Pérdida',
      'Vencimiento',
      'Transferencia a otro almacén',
      'Baja por deterioro'
    ]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2 text-slate-600">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Cargando movimientos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Formulario de Movimiento */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Registrar Movimiento de Inventario</h3>
          <div className="flex items-center space-x-2">
            <Icon name="ArrowUpDown" size={20} className="text-slate-500" />
            <span className="text-sm text-slate-600">Entrada / Salida</span>
          </div>
        </div>

        <form onSubmit={manejarSubmit} className="space-y-6">
          {/* Tipo de Movimiento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipo de Movimiento
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="entrada"
                    checked={formData.tipo_movimiento === 'entrada'}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipo_movimiento: e.target.value }))}
                    className="w-4 h-4 text-green-600 bg-slate-100 border-slate-300 focus:ring-green-500"
                  />
                  <span className="text-sm text-slate-700 flex items-center space-x-1">
                    <Icon name="ArrowDown" size={16} className="text-green-600" />
                    <span>Entrada</span>
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="salida"
                    checked={formData.tipo_movimiento === 'salida'}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipo_movimiento: e.target.value }))}
                    className="w-4 h-4 text-red-600 bg-slate-100 border-slate-300 focus:ring-red-500"
                  />
                  <span className="text-sm text-slate-700 flex items-center space-x-1">
                    <Icon name="ArrowUp" size={16} className="text-red-600" />
                    <span>Salida</span>
                  </span>
                </label>
              </div>
            </div>

            <FormComponents.Input
              label="Fecha del Movimiento"
              type="date"
              value={formData.fecha_movimiento}
              onChange={(e) => setFormData(prev => ({ ...prev, fecha_movimiento: e.target.value }))}
              required
            />
          </div>

          {/* Producto y Cantidad */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormComponents.Select
              label="Producto EPP"
              value={formData.producto_id}
              onChange={(e) => setFormData(prev => ({ ...prev, producto_id: e.target.value }))}
              error={errores.producto_id}
              required
              options={productos.map(producto => ({
                value: producto.id,
                label: `${producto.nombre} (Stock: ${producto.stock_actual})`
              }))}
              placeholder="Seleccionar producto"
            />

            <FormComponents.Input
              label="Cantidad"
              type="number"
              value={formData.cantidad}
              onChange={(e) => setFormData(prev => ({ ...prev, cantidad: e.target.value }))}
              error={errores.cantidad}
              required
              min="1"
            />

            {formData.tipo_movimiento === 'entrada' && (
              <FormComponents.Input
                label="Costo Unitario (COP)"
                type="number"
                value={formData.costo_unitario}
                onChange={(e) => setFormData(prev => ({ ...prev, costo_unitario: e.target.value }))}
                error={errores.costo_unitario}
                required
                min="0"
                step="0.01"
              />
            )}
          </div>

          {/* Motivo y Responsable */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormComponents.Select
              label="Motivo del Movimiento"
              value={formData.motivo}
              onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
              error={errores.motivo}
              required
              options={motivosComunes[formData.tipo_movimiento].map(motivo => ({
                value: motivo,
                label: motivo
              }))}
              placeholder="Seleccionar motivo"
            />

            <FormComponents.Input
              label="Responsable del Movimiento"
              value={formData.responsable}
              onChange={(e) => setFormData(prev => ({ ...prev, responsable: e.target.value }))}
              error={errores.responsable}
              required
              placeholder="Nombre del responsable"
            />
          </div>

          {/* Campos específicos por tipo */}
          {formData.tipo_movimiento === 'salida' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormComponents.Select
                label="Colaborador Destino"
                value={formData.colaborador_destino}
                onChange={(e) => setFormData(prev => ({ ...prev, colaborador_destino: e.target.value }))}
                error={errores.colaborador_destino}
                required
                options={colaboradores.map(colaborador => ({
                  value: colaborador.id,
                  label: colaborador.nombre_completo
                }))}
                placeholder="Seleccionar colaborador"
              />
            </div>
          )}

          {formData.tipo_movimiento === 'entrada' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormComponents.Input
                label="Número de Factura"
                value={formData.numero_factura}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_factura: e.target.value }))}
                placeholder="Número de factura o documento"
              />

              <FormComponents.Input
                label="Proveedor"
                value={formData.proveedor}
                onChange={(e) => setFormData(prev => ({ ...prev, proveedor: e.target.value }))}
                placeholder="Nombre del proveedor"
              />
            </div>
          )}

          <FormComponents.Textarea
            label="Observaciones"
            value={formData.observaciones}
            onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
            placeholder="Observaciones adicionales sobre el movimiento..."
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
              className={`px-6 py-2 text-white rounded-lg transition-colors flex items-center space-x-2 ${
                formData.tipo_movimiento === 'entrada'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <Icon name={formData.tipo_movimiento === 'entrada' ? 'ArrowDown' : 'ArrowUp'} size={16} />
              <span>Registrar {formData.tipo_movimiento === 'entrada' ? 'Entrada' : 'Salida'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Historial de Movimientos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Historial de Movimientos</h3>
          <div className="text-sm text-slate-600">
            {movimientosFiltrados.length} movimientos
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <FormComponents.Select
            label=""
            value={filtros.tipo}
            onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
            options={[
              { value: 'todos', label: 'Todos los movimientos' },
              { value: 'entrada', label: 'Solo entradas' },
              { value: 'salida', label: 'Solo salidas' }
            ]}
          />

          <FormComponents.Select
            label=""
            value={filtros.producto}
            onChange={(e) => setFiltros(prev => ({ ...prev, producto: e.target.value }))}
            options={[
              { value: '', label: 'Todos los productos' },
              ...productos.map(producto => ({
                value: producto.id,
                label: producto.nombre
              }))
            ]}
          />

          <FormComponents.Input
            label=""
            type="date"
            value={filtros.fechaInicio}
            onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
            placeholder="Fecha inicio"
          />

          <FormComponents.Input
            label=""
            type="date"
            value={filtros.fechaFin}
            onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
            placeholder="Fecha fin"
          />
        </div>

        {/* Tabla de Movimientos */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-600">Fecha</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Tipo</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Producto</th>
                <th className="text-center py-3 px-4 font-medium text-slate-600">Cantidad</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Motivo</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {movimientosFiltrados.map((movimiento) => (
                <tr key={movimiento.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="text-sm text-slate-900">
                      {new Date(movimiento.fecha_movimiento).toLocaleDateString('es-ES')}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(movimiento.created_at).toLocaleTimeString('es-ES')}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${
                      movimiento.tipo_movimiento === 'entrada'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <Icon
                        name={movimiento.tipo_movimiento === 'entrada' ? 'ArrowDown' : 'ArrowUp'}
                        size={12}
                      />
                      <span>{movimiento.tipo_movimiento === 'entrada' ? 'Entrada' : 'Salida'}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900">
                      {movimiento.epp_productos?.nombre || 'Producto eliminado'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-medium text-slate-900">
                      {movimiento.cantidad}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-slate-900">{movimiento.motivo}</div>
                    {movimiento.observaciones && (
                      <div className="text-xs text-slate-500 mt-1">{movimiento.observaciones}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-slate-900">{movimiento.responsable}</div>
                    {movimiento.colaboradores?.nombre_completo && (
                      <div className="text-xs text-slate-500">
                        → {movimiento.colaboradores.nombre_completo}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {movimientosFiltrados.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Icon name="ArrowUpDown" size={48} className="mx-auto mb-2 opacity-50" />
              <p>No se encontraron movimientos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovimientosForm;