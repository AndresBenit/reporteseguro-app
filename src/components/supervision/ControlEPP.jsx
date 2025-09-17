import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbHelpers, storageHelpers } from '../../services/supabase';
import SignaturePad from '../common/SignaturePad';
import {
  FormContainer,
  FormHeader,
  FormSection,
  FormRow,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormButton,
  FormButtonGroup,
  FormMessage
} from '../common/FormComponents';

const ControlEPP = () => {
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    titulo: "Registro Nueva Entrega",
    nombre: "",
    area: "",
    observaciones: "",
    foto_url: "",
    firma_url: "",
    firmado_por: "",
    fecha_firma: ""
  });

  // Estado para elementos EPP múltiples
  const [elementosSeleccionados, setElementosSeleccionados] = useState([
    { id: Date.now(), producto: '', cantidad: 1 }
  ]);

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [signatureData, setSignatureData] = useState(null);

  // Estados para autocompletado de colaboradores
  const [colaboradores, setColaboradores] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [colaboradoresFiltrados, setColaboradoresFiltrados] = useState([]);

  // Hook para obtener productos EPP desde la base de datos
  const [productosEPP, setProductosEPP] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  // Áreas disponibles (estándar de la empresa)
  const areasDisponibles = [
    "Central de mezclas",
    "Central de cribado", 
    "Laboratorio",
    "Caseta de procesamiento de muestras",
    "Cárcamo",
    "Almacenamiento de combustible",
    "Taller de mantenimiento",
    "Patio de almacenamiento 7",
    "Patio de almacenamiento de la pluma",
    "Centro industrial 2",
    "Hornos solera",
    "Almacén centro industrial",
    "Ambiental",
    "Oficinas administrativas",
    "Comedor",
    "Estacionamiento",
    "Acceso principal",
    "Área de carga y descarga"
  ];

  // Cargar colaboradores y productos EPP
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Cargando datos...');
        
        // Cargar colaboradores
        const colaboradoresData = await dbHelpers.getAll('colaboradores', {
          orderBy: 'nombre',
          ascending: true
        });
        console.log('Colaboradores cargados:', colaboradoresData.length);
        setColaboradores(colaboradoresData);

        // Cargar productos EPP
        const productosData = await dbHelpers.getAll('epp_productos', {
          filters: { activo: true },
          orderBy: 'nombre',
          ascending: true
        });
        console.log('Productos EPP cargados:', productosData.length);
        setProductosEPP(productosData);
        setCargandoProductos(false);
        
      } catch (error) {
        console.error('Error cargando datos:', error);
        setCargandoProductos(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar colaboradores cuando cambia el término de búsqueda
  useEffect(() => {
    console.log('Filtrando colaboradores:', { searchTerm, colaboradores: colaboradores.length });
    if (searchTerm.length >= 2) {
      const filtrados = colaboradores.filter((colaborador) =>
        colaborador.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        colaborador.area.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('Colaboradores filtrados:', filtrados.length);
      setColaboradoresFiltrados(filtrados);
      setShowSugerencias(filtrados.length > 0);
    } else {
      setColaboradoresFiltrados([]);
      setShowSugerencias(false);
    }
  }, [searchTerm, colaboradores]);

  // Manejar búsqueda de colaborador
  const handleSearchChange = (e) => {
    const value = e.target.value;
    console.log('Search term cambiado:', value);
    setSearchTerm(value);

    // Si borra el texto, limpiar selección
    if (value === "") {
      setForm({
        ...form,
        nombre: ""
      });
    }
  };

  // Seleccionar colaborador de sugerencias
  const seleccionarColaborador = (colaborador) => {
    setForm({
      ...form,
      nombre: colaborador.nombre
    });
    setSearchTerm(colaborador.nombre);
    setShowSugerencias(false);
  };

  // Cerrar sugerencias al hacer click fuera
  const handleBlurColaborador = () => {
    setTimeout(() => setShowSugerencias(false), 200);
  };

  // Funciones para manejar elementos EPP múltiples
  const agregarElemento = () => {
    setElementosSeleccionados([
      ...elementosSeleccionados,
      { id: Date.now(), producto: '', cantidad: 1 }
    ]);
  };

  const eliminarElemento = (id) => {
    if (elementosSeleccionados.length > 1) {
      setElementosSeleccionados(elementosSeleccionados.filter(el => el.id !== id));
    }
  };

  const actualizarElemento = (id, campo, valor) => {
    setElementosSeleccionados(elementosSeleccionados.map(el => 
      el.id === id ? { ...el, [campo]: valor } : el
    ));
  };

  // Crear producto EPP si no existe
  const crearProductoSiNoExiste = async (nombreProducto) => {
    try {
      // Buscar si ya existe
      const producto = productosEPP.find(p => 
        p.nombre.toLowerCase() === nombreProducto.toLowerCase()
      );

      if (!producto) {
        console.log('Creando producto nuevo:', nombreProducto);
        const nuevoProducto = await dbHelpers.create('epp_productos', {
          nombre: nombreProducto,
          stock_actual: 0,
          stock_minimo: 5,
          activo: true
        });
        
        // Agregar a la lista local
        setProductosEPP([...productosEPP, nuevoProducto]);
        console.log('Producto creado:', nuevoProducto);
        return nuevoProducto;
      }
      
      return producto;
    } catch (error) {
      console.error('Error creando producto:', error);
      throw error;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Manejar cambios en la firma
  const handleSignatureChange = (signature) => {
    setSignatureData(signature);
    if (signature && signature.url) {
      setForm(prev => ({
        ...prev,
        firma_url: signature.url,
        fecha_firma: signature.timestamp,
        firmado_por: "Usuario actual" // En producción, usar el usuario autenticado
      }));
    } else {
      setForm(prev => ({
        ...prev,
        firma_url: "",
        fecha_firma: "",
        firmado_por: ""
      }));
    }
  };

  // Manejar selección de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Subir imagen a Supabase Storage
  const uploadImage = async () => {
    if (!selectedImage) return null;

    try {
      setUploadingImage(true);
      setUploadProgress(0);

      const timestamp = Date.now();
      // Sanitizar nombre de archivo - remover espacios, acentos y caracteres especiales
      const sanitizedName = selectedImage.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Remover caracteres especiales
        .replace(/_{2,}/g, '_'); // Reemplazar múltiples _ consecutivos por uno solo
      const fileName = `epp/${timestamp}_${sanitizedName}`;

      // Simular progreso
      const simulateProgress = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 30;
          if (progress > 95) {
            clearInterval(interval);
            setUploadProgress(95);
          } else {
            setUploadProgress(Math.round(progress));
          }
        }, 200);
        return interval;
      };

      const progressInterval = simulateProgress();
      const uploadResult = await storageHelpers.upload('reportes-firmas', fileName, selectedImage);

      clearInterval(progressInterval);
      setUploadProgress(100);

      const downloadURL = storageHelpers.getPublicUrl('reportes-firmas', uploadResult.path);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setUploadingImage(false);
      setUploadProgress(0);
      return downloadURL;
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      setUploadingImage(false);
      setUploadProgress(0);
      throw error;
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!form.nombre.trim()) {
      setMensaje("Error: El nombre del colaborador es obligatorio");
      return;
    }

    // Validar elementos seleccionados
    const elementosValidos = elementosSeleccionados.filter(el => el.producto.trim() && el.cantidad > 0);
    if (elementosValidos.length === 0) {
      setMensaje("Error: Debe seleccionar al menos un elemento EPP con cantidad mayor a 0");
      return;
    }

    if (!form.area) {
      setMensaje("Error: Debe seleccionar un área");
      return;
    }

    if (!signatureData || !form.firma_url) {
      setMensaje("Error: La firma digital es obligatoria para registrar la entrega");
      return;
    }

    setLoading(true);
    try {
      let fotoUrl = "";

      // Subir imagen si existe
      if (selectedImage) {
        try {
          fotoUrl = await uploadImage();
        } catch (imageError) {
          setMensaje("Advertencia: Error subiendo la imagen. Se guardará sin foto.");
          // Continúar sin foto en lugar de fallar
        }
      }

      // Procesar cada elemento EPP
      const productosIds = [];
      const elementosDetalle = [];

      for (const elemento of elementosValidos) {
        // Crear producto si no existe
        const producto = await crearProductoSiNoExiste(elemento.producto);
        productosIds.push(producto.id);
        elementosDetalle.push({
          id: producto.id,
          nombre: producto.nombre,
          cantidad: elemento.cantidad
        });

        // Registrar movimiento de salida en inventario
        await dbHelpers.create('epp_movimientos', {
          producto_id: producto.id,
          tipo: 'salida',
          cantidad: elemento.cantidad,
          colaborador: form.nombre,
          area: form.area,
          observaciones: `Entrega a ${form.nombre} - ${form.observaciones || 'Sin observaciones'}`
        });
      }

      // Crear descripción de la entrega
      const descripcionElementos = elementosDetalle
        .map(el => `${el.cantidad} ${el.nombre}`)
        .join(', ');

      // Guardar registro principal de EPP
      const eppData = {
        tipo: "epp",
        subtipo: "Entrega de EPP",
        descripcion: `Entrega de elementos EPP a ${form.nombre}: ${descripcionElementos}`,
        severidad: "baja",
        area: form.area,
        reportante: "Control EPP",
        foto_url: fotoUrl,
        estado: "completado",
        tipo_reporte: "epp",
        prioridad: "normal",
        colaboradorinvolucrado: form.nombre,
        accionrecomendada: `Entregar elementos EPP: ${descripcionElementos}`,
        observaciones: form.observaciones,
        // Campos de firma digital
        firma_url: form.firma_url,
        firmado_por: form.firmado_por,
        fecha_firma: form.fecha_firma,
        // Referencias a productos EPP
        producto_epp_ids: productosIds,
        elementos_epp: elementosDetalle
      };

      await dbHelpers.create('reportes', eppData);

      // Limpiar formulario
      setForm({
        titulo: "Registro Nueva Entrega",
        nombre: "",
        area: "",
        observaciones: "",
        foto_url: "",
        firma_url: "",
        firmado_por: "",
        fecha_firma: ""
      });
      setElementosSeleccionados([{ id: Date.now(), producto: '', cantidad: 1 }]);
      setSearchTerm("");
      setSelectedImage(null);
      setImagePreview(null);
      setSignatureData(null);

      setMensaje("Éxito: Entrega de EPP registrada exitosamente");
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      console.error("Error guardando entrega de EPP:", error);
      setMensaje("Error: No se pudo registrar la entrega. Intenta nuevamente.");
      setTimeout(() => setMensaje(""), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <FormContainer>
        <FormHeader
          title="Control de EPP"
          subtitle="Registro de entrega de Elementos de Protección Personal"
          onBack={() => window.history.back()}
        />

        <form onSubmit={handleSubmit}>
          <FormSection title="Información de la Entrega">
            <FormRow columns={1}>
              <FormField label="Título del Registro">
                <FormInput
                  type="text"
                  value={form.titulo}
                  readOnly
                  className="bg-gray-50 text-gray-600"
                />
              </FormField>
            </FormRow>

            <FormField label="Colaborador" required>
              <div className="relative">
                <FormInput
                  type="text"
                  placeholder="Escribe el nombre del colaborador..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() =>
                    searchTerm &&
                    setShowSugerencias(colaboradoresFiltrados.length > 0)
                  }
                  onBlur={handleBlurColaborador}
                  required
                  className={form.nombre ? "border-green-300 bg-green-50" : ""}
                />

                {form.nombre && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500 text-lg">
                    ✓
                  </div>
                )}

                {showSugerencias && colaboradoresFiltrados.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 border-t-0 rounded-b-lg shadow-lg max-h-48 overflow-y-auto z-50">
                    {colaboradoresFiltrados.map((colaborador) => (
                      <div
                        key={colaborador.id}
                        onClick={() => seleccionarColaborador(colaborador)}
                        className="p-3 cursor-pointer border-b border-gray-100 hover:bg-gray-50 flex justify-between items-center transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-gray-800">
                            {colaborador.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {colaborador.area}
                          </div>
                        </div>
                        <div className="text-green-500">+</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormField>
          </FormSection>

          <FormSection title="Elementos de Protección Personal">
            {elementosSeleccionados.map((elemento, index) => (
              <div key={elemento.id} className="flex gap-4 items-end mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-2">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Elemento EPP
                  </label>
                  {cargandoProductos ? (
                    <div className="p-3 text-center text-gray-500">
                      Cargando...
                    </div>
                  ) : (
                    <FormSelect
                      value={elemento.producto}
                      onChange={(e) => actualizarElemento(elemento.id, 'producto', e.target.value)}
                      required
                      placeholder="Seleccionar elemento..."
                      options={[
                        ...productosEPP.map(producto => ({
                          value: producto.nombre,
                          label: `${producto.nombre} (Stock: ${producto.stock_actual})`
                        })),
                        { value: "__nuevo__", label: "+ Escribir nuevo elemento..." }
                      ]}
                    />
                  )}

                  {elemento.producto === '__nuevo__' && (
                    <FormInput
                      type="text"
                      placeholder="Escriba el nombre del nuevo elemento EPP..."
                      onChange={(e) => actualizarElemento(elemento.id, 'producto', e.target.value)}
                      autoFocus
                      className="mt-2 border-blue-300"
                    />
                  )}
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Cantidad
                  </label>
                  <FormInput
                    type="number"
                    value={elemento.cantidad}
                    onChange={(e) => actualizarElemento(elemento.id, 'cantidad', parseInt(e.target.value) || 1)}
                    min="1"
                    max="100"
                  />
                </div>

                <div className="flex gap-2">
                  {elementosSeleccionados.length > 1 && (
                    <FormButton
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => eliminarElemento(elemento.id)}
                      title="Eliminar elemento"
                    >
                      Eliminar
                    </FormButton>
                  )}
                </div>
              </div>
            ))}

            <FormButton
              type="button"
              variant="success"
              size="sm"
              onClick={agregarElemento}
              className="mt-2"
            >
              + Agregar otro elemento EPP
            </FormButton>
          </FormSection>

          <FormSection title="Ubicación y Observaciones">
            <FormRow columns={1}>
              <FormField label="Área de Trabajo" required>
                <FormSelect
                  name="area"
                  value={form.area}
                  onChange={handleChange}
                  required
                  placeholder="Selecciona un área"
                  options={areasDisponibles}
                />
              </FormField>

              <FormField label="Observaciones">
                <FormTextarea
                  name="observaciones"
                  value={form.observaciones}
                  onChange={handleChange}
                  placeholder="Observaciones adicionales sobre la entrega (opcional)"
                  rows={3}
                />
              </FormField>
            </FormRow>
          </FormSection>

          <FormSection title="Documentación">
            <FormField label="Foto del Elemento Entregado">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50">
                {!imagePreview ? (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="camera"
                      onChange={handleImageChange}
                      className="hidden"
                      id="photo-upload"
                      disabled={uploadingImage}
                    />
                    <label
                      htmlFor="photo-upload"
                      className={`inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold text-base cursor-pointer hover:bg-blue-700 transition-colors ${uploadingImage ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {uploadingImage ? "Subiendo..." : "Tomar Foto"}
                    </label>
                    <p className="text-gray-500 mt-2 text-sm">
                      Toma una foto del elemento EPP que estás entregando
                    </p>
                  </div>
                ) : (
                  <div>
                    <img
                      src={imagePreview}
                      alt="Elemento EPP"
                      className="max-w-full max-h-48 rounded-lg mx-auto mb-3"
                    />
                    <FormButton
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={removeImage}
                    >
                      Eliminar
                    </FormButton>
                  </div>
                )}

                {uploadingImage && (
                  <div className="mt-4">
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-blue-600 mt-2 text-sm">
                      Subiendo imagen... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            </FormField>

            <FormField label="Firma del Colaborador que Recibe" required>
              <SignaturePad
                onSignatureChange={handleSignatureChange}
                required={true}
                label="Firma del Colaborador que Recibe"
              />
            </FormField>
          </FormSection>

          <FormMessage
            type={mensaje.includes("Error") ? "error" : mensaje.includes("Advertencia") ? "warning" : "success"}
            message={mensaje}
            onClose={() => setMensaje("")}
          />

          <FormButtonGroup>
            <FormButton
              type="submit"
              variant="success"
              size="lg"
              loading={loading}
              className="w-full"
            >
              {loading ? "Registrando entrega..." : "Registrar Entrega de EPP"}
            </FormButton>
          </FormButtonGroup>
        </form>
      </FormContainer>
    </div>
  );
};

export default ControlEPP;