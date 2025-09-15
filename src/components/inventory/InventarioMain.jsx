import React, { useState, useEffect } from 'react';
import { dbHelpers } from '../../services/supabase';
import { Icon } from '../common/Icons';

const InventarioMain = () => {
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vistaActiva, setVistaActiva] = useState('productos');
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    descripcion: '',
    marca: '',
    stock_minimo: 5,
    precio_unitario: 0
  });
  const [showFormulario, setShowFormulario] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Cargar datos
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        console.log('Cargando inventario...');
        
        // Cargar productos
        const productosData = await dbHelpers.getAll('epp_productos', {
          filters: { activo: true },
          orderBy: 'nombre',
          ascending: true
        });
        
        // Cargar movimientos recientes
        const movimientosData = await dbHelpers.getAll('epp_movimientos', {
          orderBy: 'created_at',
          ascending: false,
          limit: 50
        });
        
        setProductos(productosData || []);
        setMovimientos(movimientosData || []);
        console.log('Inventario cargado:', { 
          productos: productosData?.length || 0,
          movimientos: movimientosData?.length || 0 
        });
        
      } catch (error) {
        console.error('Error cargando inventario:', error);
        setMensaje('Error cargando datos del inventario');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Crear nuevo producto
  const crearProducto = async (e) => {
    e.preventDefault();
    
    if (!nuevoProducto.nombre.trim()) {
      setMensaje('El nombre del producto es obligatorio');
      return;
    }

    try {
      await dbHelpers.create('epp_productos', {
        ...nuevoProducto,
        activo: true
      });
      
      // Recargar productos en lugar de intentar usar el valor devuelto
      const productosActualizados = await dbHelpers.getAll('epp_productos', {
        filters: { activo: true },
        orderBy: 'nombre',
        ascending: true
      });
      setProductos(productosActualizados || []);
      
      setNuevoProducto({ nombre: '', descripcion: '', marca: '', stock_minimo: 5, precio_unitario: 0 });
      setShowFormulario(false);
      setMensaje('Producto creado exitosamente');
      setTimeout(() => setMensaje(''), 3000);
      
    } catch (error) {
      console.error('Error creando producto:', error);
      setMensaje('Error creando el producto');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  // Eliminar producto (soft delete)
  const eliminarProducto = async (productoId, nombreProducto) => {
    // Confirmación doble para evitar eliminaciones accidentales
    const confirmacion1 = window.confirm(`¿Estás seguro de que deseas eliminar "${nombreProducto}"?`);
    if (!confirmacion1) return;
    
    const confirmacion2 = window.confirm(`Esta acción no se puede deshacer. ¿Confirmas la eliminación de "${nombreProducto}"?`);
    if (!confirmacion2) return;

    try {
      // 1. Registrar movimiento de eliminación ANTES de marcar como inactivo
      await dbHelpers.create('epp_movimientos', {
        producto_id: productoId,
        tipo: 'eliminacion',
        cantidad: 0, // No afecta stock, es solo registro
        observaciones: `Producto eliminado: ${nombreProducto}`,
        usuario: 'Sistema', // o puedes usar el usuario logueado
        fecha: new Date().toISOString()
      });

      // 2. Soft delete: marcar como inactivo en lugar de eliminar físicamente
      await dbHelpers.update('epp_productos', productoId, {
        activo: false
      });
      
      // 3. Recargar lista de productos (solo activos)
      const productosActualizados = await dbHelpers.getAll('epp_productos', {
        filters: { activo: true },
        orderBy: 'nombre',
        ascending: true
      });
      setProductos(productosActualizados || []);

      // 4. Recargar movimientos para mostrar la eliminación
      const movimientosData = await dbHelpers.getAll('epp_movimientos', {
        orderBy: 'created_at',
        ascending: false,
        limit: 50
      });
      setMovimientos(movimientosData || []);
      
      setMensaje(`Producto "${nombreProducto}" eliminado exitosamente`);
      setTimeout(() => setMensaje(''), 3000);
      
    } catch (error) {
      console.error('Error eliminando producto:', error);
      setMensaje('Error al eliminar el producto');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  // Ajustar stock
  const ajustarStock = async (productoId, tipoMovimiento, cantidad, observaciones) => {
    try {
      // Registrar movimiento
      await dbHelpers.create('epp_movimientos', {
        producto_id: productoId,
        tipo: tipoMovimiento,
        cantidad: cantidad,
        observaciones: observaciones || `Ajuste de stock: ${tipoMovimiento}`
      });

      // Recargar productos para mostrar stock actualizado
      const productosActualizados = await dbHelpers.getAll('epp_productos', {
        filters: { activo: true },
        orderBy: 'nombre',
        ascending: true
      });
      setProductos(productosActualizados);
      
      setMensaje(`Stock ${tipoMovimiento === 'entrada' ? 'aumentado' : 'reducido'} correctamente`);
      setTimeout(() => setMensaje(''), 3000);
      
    } catch (error) {
      console.error('Error ajustando stock:', error);
      setMensaje('Error ajustando el stock');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Icon name="Package" size={64} color="#6b7280" />
        <h3 style={{ marginTop: '20px', color: '#6b7280' }}>Cargando inventario...</h3>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700', 
          color: '#1f2937',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <Icon name="Package" size={40} color="#f97316" />
          Inventario EPP
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          Gestión de elementos de protección personal • Control de stock y movimientos
        </p>
      </div>

      {/* Navegación de vistas */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '30px',
        borderBottom: '2px solid #f3f4f6'
      }}>
        {[
          { id: 'productos', label: 'Productos EPP', icon: 'Package', desc: 'Lista de productos y stock' },
          { id: 'movimientos', label: 'Movimientos', icon: 'Activity', desc: 'Historial de entradas y salidas' }
        ].map(vista => (
          <button
            key={vista.id}
            onClick={() => setVistaActiva(vista.id)}
            style={{
              padding: '15px 25px',
              background: vistaActiva === vista.id ? '#f97316' : 'transparent',
              color: vistaActiva === vista.id ? 'white' : '#374151',
              border: 'none',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              borderBottom: vistaActiva === vista.id ? '2px solid #f97316' : '2px solid transparent'
            }}
            onMouseEnter={(e) => {
              if (vistaActiva !== vista.id) {
                e.target.style.background = '#fef3c7';
              }
            }}
            onMouseLeave={(e) => {
              if (vistaActiva !== vista.id) {
                e.target.style.background = 'transparent';
              }
            }}
            title={vista.desc}
          >
            <Icon name={vista.icon} size={20} />
            {vista.label}
          </button>
        ))}
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '20px',
          borderRadius: '8px',
          backgroundColor: mensaje.includes('Error') ? '#fef2f2' : '#f0fdf4',
          borderLeft: `4px solid ${mensaje.includes('Error') ? '#ef4444' : '#10b981'}`,
          color: mensaje.includes('Error') ? '#dc2626' : '#059669',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {mensaje}
        </div>
      )}

      {/* Vista de Productos */}
      {vistaActiva === 'productos' && (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px' 
          }}>
            <h2 style={{ margin: 0, color: '#1f2937' }}>Productos EPP</h2>
            <button
              onClick={() => setShowFormulario(!showFormulario)}
              style={{
                padding: '12px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Icon name="Plus" size={18} />
              Nuevo Producto
            </button>
          </div>

          {/* Formulario Nuevo Producto */}
          {showFormulario && (
            <form onSubmit={crearProducto} style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginTop: 0 }}>Agregar Nuevo Producto EPP</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1fr', gap: '15px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={nuevoProducto.nombre}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})}
                    placeholder="Ej: Casco con lámpara"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={nuevoProducto.descripcion}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, descripcion: e.target.value})}
                    placeholder="Descripción del producto"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>
                    Marca
                  </label>
                  <input
                    type="text"
                    value={nuevoProducto.marca}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, marca: e.target.value})}
                    placeholder="Ej: 3M, MSA, Honeywell"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '5px' }}>
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    value={nuevoProducto.stock_minimo}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, stock_minimo: parseInt(e.target.value)})}
                    min="0"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" style={{
                    padding: '10px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}>
                    Crear
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowFormulario(false)}
                    style={{
                      padding: '10px 16px',
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Lista de Productos */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                    Producto
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                    Marca
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                    Stock Actual
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                    Stock Mínimo
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                    Estado
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto) => (
                  <tr key={producto.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>
                          {producto.nombre}
                        </div>
                        {producto.descripcion && (
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {producto.descripcion}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '500', color: '#374151' }}>
                        {producto.marca || 'Sin especificar'}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: producto.stock_actual > producto.stock_minimo ? '#059669' : '#dc2626'
                      }}>
                        {producto.stock_actual}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>
                      {producto.stock_minimo}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {producto.stock_actual <= producto.stock_minimo ? (
                        <span style={{
                          background: '#fef2f2',
                          color: '#dc2626',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          BAJO
                        </span>
                      ) : (
                        <span style={{
                          background: '#f0fdf4',
                          color: '#059669',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          OK
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          onClick={() => {
                            const cantidad = prompt('¿Cuántas unidades desea agregar?');
                            if (cantidad && parseInt(cantidad) > 0) {
                              ajustarStock(producto.id, 'entrada', parseInt(cantidad), `Entrada manual: +${cantidad}`);
                            }
                          }}
                          style={{
                            padding: '6px 10px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                          title="Agregar stock"
                        >
                          +
                        </button>
                        <button
                          onClick={() => {
                            const cantidad = prompt('¿Cuántas unidades desea quitar?');
                            if (cantidad && parseInt(cantidad) > 0) {
                              ajustarStock(producto.id, 'salida', parseInt(cantidad), `Salida manual: -${cantidad}`);
                            }
                          }}
                          style={{
                            padding: '6px 10px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                          title="Quitar stock"
                        >
                          -
                        </button>
                        <button
                          onClick={() => eliminarProducto(producto.id, producto.nombre)}
                          style={{
                            padding: '6px 8px',
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Eliminar producto"
                        >
                          <Icon name="Trash" size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {productos.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                <Icon name="Package" size={48} color="#d1d5db" />
                <h3>No hay productos registrados</h3>
                <p>Agrega tu primer producto EPP para comenzar</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vista de Movimientos */}
      {vistaActiva === 'movimientos' && (
        <div>
          <h2 style={{ marginBottom: '20px', color: '#1f2937' }}>Historial de Movimientos</h2>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                    Fecha
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                    Producto
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                    Tipo
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                    Cantidad
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                    Colaborador/Observaciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((movimiento) => {
                  const producto = productos.find(p => p.id === movimiento.producto_id);
                  return (
                    <tr key={movimiento.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px', fontSize: '12px', color: '#6b7280' }}>
                        {new Date(movimiento.created_at).toLocaleString('es-ES')}
                      </td>
                      <td style={{ padding: '12px', fontWeight: '500' }}>
                        {producto?.nombre || 'Producto eliminado'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          background: 
                            movimiento.tipo === 'entrada' ? '#f0fdf4' : 
                            movimiento.tipo === 'eliminacion' ? '#fef3c7' : '#fef2f2',
                          color: 
                            movimiento.tipo === 'entrada' ? '#059669' : 
                            movimiento.tipo === 'eliminacion' ? '#d97706' : '#dc2626',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {movimiento.tipo === 'entrada' ? 'ENTRADA' : 
                           movimiento.tipo === 'eliminacion' ? 'ELIMINACIÓN' : 'SALIDA'}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'center',
                        fontWeight: '600',
                        color: movimiento.tipo === 'entrada' ? '#059669' : 
                               movimiento.tipo === 'eliminacion' ? '#d97706' : '#dc2626'
                      }}>
                        {movimiento.tipo === 'eliminacion' ? 
                          'N/A' : 
                          `${movimiento.tipo === 'entrada' ? '+' : '-'}${movimiento.cantidad}`
                        }
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                        {movimiento.colaborador && (
                          <div style={{ fontWeight: '500', color: '#374151' }}>
                            {movimiento.colaborador}
                          </div>
                        )}
                        {movimiento.observaciones && (
                          <div style={{ fontSize: '12px' }}>
                            {movimiento.observaciones}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {movimientos.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                <Icon name="Activity" size={48} color="#d1d5db" />
                <h3>No hay movimientos registrados</h3>
                <p>Los movimientos de inventario aparecerán aquí</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InventarioMain;