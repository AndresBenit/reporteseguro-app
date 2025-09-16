import React, { useState, useEffect } from "react";
import { dbHelpers, storageHelpers, supabase } from "../../services/supabase";
import SignaturePad from "../common/SignaturePad";

const areasDisponibles = [
  "Central de mezclas", "Central de cribado", "Laboratorio",
  "Caseta de procesamiento de muestras", "Cárcamo", 
  "Almacenamiento de combustible", "Taller de mantenimiento",
  "Patio de almacenamiento 7", "Patio de almacenamiento de la pluma",
  "Centro industrial 2", "Hornos solera", "Almacén centro industrial",
  "Ambiental", "Oficinas administrativas", "Comedor", 
  "Estacionamiento", "Acceso principal", "Área de carga y descarga"
];

const SupervisionCampo = () => {
  const [form, setForm] = useState({
    colaboradorId: "",
    colaboradorNombre: "",
    colaboradorArea: "",
    area: "",
    supervisorReporta: "",
    lugarLabor: "",
    hallazgo: "",
    recomendacion: "",
    firma_url: "",
    firmado_por: "",
    fecha_firma: ""
  });

  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [signatureData, setSignatureData] = useState(null);

  // Estados para autocompletado
  const [searchTerm, setSearchTerm] = useState("");
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [colaboradoresFiltrados, setColaboradoresFiltrados] = useState([]);

  // Cargar colaboradores
  useEffect(() => {
    const fetchColaboradores = async () => {
      try {
        const data = await dbHelpers.getAll('colaboradores', {
          orderBy: 'nombre',
          ascending: true
        });
        setColaboradores(data);
      } catch (error) {
        console.error('Error fetching colaboradores:', error);
      }
    };

    fetchColaboradores();

    // Set up real-time subscription
    const subscription = dbHelpers.subscribe('colaboradores', (payload) => {
      console.log('Colaboradores updated:', payload);
      fetchColaboradores();
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Filtrar colaboradores para autocompletado
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setColaboradoresFiltrados([]);
      setShowSugerencias(false);
    } else {
      // Validar que colaboradores sea un array válido antes de filtrar
      const colaboradoresValidos = Array.isArray(colaboradores) ? colaboradores : [];
      const filtrados = colaboradoresValidos
        .filter(
          (col) =>
            col && col.nombre && col.cedula &&
            (col.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            col.cedula.includes(searchTerm))
        )
        .slice(0, 8); // Mostrar máximo 8 sugerencias
      setColaboradoresFiltrados(filtrados);
      setShowSugerencias(filtrados.length > 0);
    }
  }, [searchTerm, colaboradores]);

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

  // Manejar búsqueda de colaborador
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Si borra el texto, limpiar selección
    if (value === "") {
      setForm({
        ...form,
        colaboradorId: "",
        colaboradorNombre: "",
        colaboradorArea: "",
      });
    }
  };

  // Seleccionar colaborador de sugerencias
  const seleccionarColaborador = (colaborador) => {
    setForm({
      ...form,
      colaboradorId: colaborador.id,
      colaboradorNombre: colaborador.nombre,
      colaboradorArea: colaborador.area,
    });
    setSearchTerm(colaborador.nombre);
    setShowSugerencias(false);
  };

  // Cerrar sugerencias al hacer click fuera
  const handleBlurColaborador = () => {
    setTimeout(() => setShowSugerencias(false), 200);
  };

  // Manejo de imagen
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setMensaje("Error: Por favor selecciona solo archivos de imagen");
        setTimeout(() => setMensaje(""), 3000);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setMensaje("Error: La imagen debe ser menor a 5MB");
        setTimeout(() => setMensaje(""), 3000);
        return;
      }

      try {
        setMensaje("Optimizando imagen...");
        const compressedFile = await compressImage(file);
        setSelectedImage(compressedFile);

        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(compressedFile);

        setMensaje("Imagen lista para subir");
        setTimeout(() => setMensaje(""), 2000);
      } catch (error) {
        console.error("Error procesando imagen:", error);
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
      }
    }
  };

  // Comprimir imagen
  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(resolve, "image/jpeg", quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Subir imagen
  const uploadImage = async () => {
    if (!selectedImage) return null;

    try {
      setUploadingImage(true);
      setUploadProgress(0);

      const timestamp = Date.now();
      // Fix: Verificar que selectedImage.name existe y es string
      const imageName = selectedImage.name || `image_${timestamp}.jpg`;
      // Sanitizar nombre de archivo - remover espacios, acentos y caracteres especiales
      const sanitizedName = imageName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Remover caracteres especiales
        .replace(/_{2,}/g, '_'); // Reemplazar múltiples _ consecutivos por uno solo
      const fileName = `supervision/${timestamp}_${sanitizedName}`;

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
      const uploadResult = await storageHelpers.upload('reportes-adjuntos', fileName, selectedImage);

      clearInterval(progressInterval);
      setUploadProgress(100);

      const downloadURL = storageHelpers.getPublicUrl('reportes-adjuntos', uploadResult.path);
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

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.colaboradorId ||
      !form.area ||
      !form.supervisorReporta.trim() ||
      !form.lugarLabor.trim() ||
      !form.hallazgo.trim() ||
      !form.recomendacion.trim()
    ) {
      setMensaje("Error: Por favor completa todos los campos obligatorios");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }

    // Validación obligatoria de firma
    if (!signatureData || !form.firma_url) {
      setMensaje("Error: La firma digital es obligatoria para enviar el reporte");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }

    setLoading(true);
    try {
      let fotoUrl = "";

      // Subir imagen solo si se seleccionó una
      if (selectedImage) {
        try {
          fotoUrl = await uploadImage();
        } catch (imageError) {
          setMensaje("Advertencia: Error subiendo la imagen. Se guardará sin foto.");
          // Continúar sin foto en lugar de fallar
        }
      }

      // Guardar recomendación
      const recomendacionData = {
        tipo: "recomendacion",
        subtipo: "Supervisión de Campo",
        descripcion: `Colaborador: ${form.colaboradorNombre}\nLugar: ${form.lugarLabor}\nHallazgo: ${form.hallazgo}\nRecomendación: ${form.recomendacion}`,
        severidad: "media",
        area: form.area,
        reportante: form.supervisorReporta.trim(),
        foto_url: fotoUrl,
        estado: "pendiente",
        tipo_reporte: "recomendacion",
        prioridad: "normal",
        colaboradorinvolucrado: form.colaboradorNombre,
        accionrecomendada: form.recomendacion.trim(),
        // Campos de firma digital
        firma_url: form.firma_url,
        firmado_por: form.firmado_por,
        fecha_firma: form.fecha_firma
      };

      await dbHelpers.create('reportes', recomendacionData);

      // Limpiar formulario
      setForm({
        colaboradorId: "",
        colaboradorNombre: "",
        colaboradorArea: "",
        supervisorReporta: "",
        lugarLabor: "",
        hallazgo: "",
        recomendacion: "",
      });
      setSelectedImage(null);
      setImagePreview(null);
      setSearchTerm("");
      setShowSugerencias(false);

      setMensaje("Éxito: Recomendación registrada exitosamente");
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      console.error("Error guardando recomendación:", error);
      setMensaje("Error: No se pudo guardar la recomendación. Intenta nuevamente.");
      setTimeout(() => setMensaje(""), 3000);
    }
    setLoading(false);
  };

  const lugaresComunes = [
    "Hornos",
    "Oficina administrativa",
    "Patio de almacenamiento",
    "Laboratorio",
    "Taller de mantenimiento",
    "Central de mezclas",
    "Central de cribado",
    "Área de carga y descarga",
    "Comedor",
    "Estacionamiento",
  ];

  return (
    <div
      style={{ 
        padding: window.innerWidth <= 768 ? "15px" : "20px", 
        maxWidth: "800px", 
        margin: "0 auto",
        minHeight: "100vh"
      }}
      className="mobile-container"
    >
      {/* Botón de volver */}
      <button
        onClick={() => window.history.back()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 20px",
          background: "#f8fafc",
          border: "2px solid #e2e8f0",
          borderRadius: "12px",
          cursor: "pointer",
          fontSize: "0.9rem",
          fontWeight: "600",
          color: "#475569",
          marginBottom: "24px",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)"
        }}
        onMouseEnter={(e) => {
          e.target.style.background = "#e2e8f0";
          e.target.style.transform = "translateY(-1px)";
          e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
        }}
        onMouseLeave={(e) => {
          e.target.style.background = "#f8fafc";
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)";
        }}
      >
        ← Volver
      </button>
      {/* Header */}
      <div style={{ marginBottom: "30px" }} className="mobile-header">
        <h1
          style={{
            fontSize: window.innerWidth <= 768 ? "1.8rem" : "2.5rem",
            fontWeight: "700",
            color: "#1f2937",
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
            gap: window.innerWidth <= 768 ? "10px" : "15px",
            flexWrap: "wrap",
            textAlign: window.innerWidth <= 480 ? "center" : "left",
            justifyContent: window.innerWidth <= 480 ? "center" : "flex-start"
          }}
        >
          👨‍💼 Supervisión en Campo
        </h1>
        <p style={{ 
          color: "#6b7280", 
          fontSize: window.innerWidth <= 768 ? "1rem" : "1.1rem",
          textAlign: window.innerWidth <= 480 ? "center" : "left"
        }}>
          Registro de recomendaciones y abordajes de seguridad
        </p>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "10px",
            background: mensaje.includes("Éxito")
              ? "#d1fae5"
              : mensaje.includes("Advertencia")
              ? "#fef3cd"
              : "#fef2f2",
            color: mensaje.includes("Éxito")
              ? "#059669"
              : mensaje.includes("Advertencia")
              ? "#92400e"
              : "#dc2626",
            border: `1px solid ${
              mensaje.includes("Éxito")
                ? "#a7f3d0"
                : mensaje.includes("Advertencia")
                ? "#fde68a"
                : "#fecaca"
            }`,
            marginBottom: "20px",
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          {mensaje}
        </div>
      )}

      {/* Formulario */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-4xl mx-auto">
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nueva Recomendación en Campo</h2>
          <p className="text-gray-600">Complete la información de la supervisión en campo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fecha */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Fecha</label>
            <input
              type="text"
              value={new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>

          {/* Colaborador con Autocompletado */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Colaborador *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Escribe el nombre del colaborador..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() =>
                  searchTerm &&
                  setShowSugerencias(colaboradoresFiltrados.length > 0)
                }
                onBlur={handleBlurColaborador}
                className={`w-full px-4 py-3 border rounded-lg outline-none transition-colors ${
                  form.colaboradorId
                    ? "border-green-500 bg-green-50 focus:ring-2 focus:ring-green-200"
                    : "border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                }`}
                required
              />

              {/* Indicador de selección */}
              {form.colaboradorId && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600 text-lg">
                  ✓
                </div>
              )}

              {/* Lista de sugerencias */}
              {showSugerencias && (
                <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 border-t-0 rounded-b-lg shadow-lg max-h-48 overflow-y-auto">
                  {colaboradoresFiltrados.map((colaborador) => (
                    <div
                      key={colaborador.id}
                      onClick={() => seleccionarColaborador(colaborador)}
                      className="flex justify-between items-center p-3 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-gray-900">
                          {colaborador.nombre}
                        </div>
                        <div className="text-sm text-gray-500">
                          {colaborador.cedula} • {colaborador.area}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${
                        colaborador.area === "Centro Industrial"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {colaborador.area === "Centro Industrial" ? "CI" : "HS"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Información del colaborador seleccionado */}
            {form.colaboradorId && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                <strong>{form.colaboradorNombre}</strong> - {form.colaboradorArea}
              </div>
            )}
          </div>

          {/* Supervisor que Reporta */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Supervisor que Reporta *</label>
            <input
              type="text"
              name="supervisorReporta"
              placeholder="Nombre del supervisor que realizó la supervisión"
              value={form.supervisorReporta}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              required
            />
          </div>

          {/* Área de Trabajo */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Área de Trabajo *</label>
            <select
              name="area"
              value={form.area}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
              required
            >
              <option value="">Selecciona un área</option>
              {areasDisponibles.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          {/* Lugar de Labor */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Lugar de Labor *</label>
            <input
              type="text"
              name="lugarLabor"
              placeholder="Ej: Hornos, Oficina, Patio..."
              value={form.lugarLabor}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              required
              list="lugares-comunes"
            />
            <datalist id="lugares-comunes">
              {lugaresComunes.map((lugar) => (
                <option key={lugar} value={lugar} />
              ))}
            </datalist>
          </div>

          {/* Hallazgo */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Hallazgo *</label>
            <textarea
              name="hallazgo"
              placeholder="Describe detalladamente lo observado (condición insegura, acto inseguro, etc.)"
              value={form.hallazgo}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              required
              rows={4}
            />
          </div>

          {/* Recomendación */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Recomendación *</label>
            <textarea
              name="recomendacion"
              placeholder="Describe la recomendación dada al colaborador"
              value={form.recomendacion}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              required
              rows={4}
            />
          </div>

          {/* Foto del Documento Firmado */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Foto del Documento Firmado (Opcional)
            </label>

            {/* Progress Bar */}
            {uploadingImage && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-blue-700">
                    Subiendo evidencia...
                  </span>
                  <span className="text-sm text-blue-600">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50 transition-all duration-300 hover:border-gray-400">
              {!imagePreview ? (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                    id="photo-upload"
                  />
                  <div
                    style={{
                      fontSize: "2.5rem",
                      marginBottom: "12px",
                      opacity: 0.5,
                    }}
                  >
                    📄
                  </div>
                  <label
                    htmlFor="photo-upload"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 20px",
                      background: "#3b82f6",
                      color: "white",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                      border: "none",
                      fontSize: "0.9rem",
                    }}
                  >
                    📸 Tomar Foto del Documento
                  </label>
                  <p
                    style={{
                      marginTop: "8px",
                      fontSize: "0.8rem",
                      color: "#6b7280",
                    }}
                  >
                    Documento físico firmado por el colaborador
                  </p>
                </div>
              ) : (
                <div>
                  <img
                    src={imagePreview}
                    alt="Documento firmado"
                    style={{
                      maxWidth: "300px",
                      maxHeight: "200px",
                      borderRadius: "8px",
                      border: "2px solid #e5e7eb",
                      marginBottom: "12px",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      justifyContent: "center",
                    }}
                  >
                    <label
                      htmlFor="photo-upload"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "6px 12px",
                        background: "#3b82f6",
                        color: "white",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        border: "none",
                      }}
                    >
                      Cambiar Foto
                    </label>
                    <button
                      type="button"
                      onClick={removeImage}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "6px 12px",
                        background: "#dc2626",
                        color: "white",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        border: "none",
                      }}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                    id="photo-upload"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Firma Digital - OBLIGATORIA */}
          <SignaturePad
            onSignatureChange={handleSignatureChange}
            required={true}
            label="Firma Digital del Supervisor"
            onError={(error) => {
              console.error('Error en firma:', error);
              setMensaje("Error: No se pudo procesar la firma. Intente nuevamente.");
              setTimeout(() => setMensaje(""), 3000);
            }}
          />

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="btn btn-primary"
            style={{
              width: "100%",
              fontSize: window.innerWidth <= 768 ? "0.9rem" : "1rem",
              padding: window.innerWidth <= 768 ? "12px 20px" : "14px 24px",
              opacity: loading || uploadingImage ? 0.7 : 1,
              cursor: loading || uploadingImage ? "not-allowed" : "pointer",
              background: loading || uploadingImage ? "#9ca3af" : "#3b82f6",
            }}
          >
            {loading ? (
              <>
                <span className="pulse">⏳</span>
                Guardando recomendación...
              </>
            ) : (
              <>💾 Registrar Recomendación</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SupervisionCampo;
