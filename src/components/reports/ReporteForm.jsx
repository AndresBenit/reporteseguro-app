import React, { useState } from "react";
import { storageHelpers } from "../../services/supabase";
import { useReportes } from "../../hooks/useReportes";

const initialState = {
  tipo: "Condición Insegura",
  descripcion: "",
  severidad: "media",
  estado: "pendiente",
  area: "",
  reportante: "",
  fotoUrl: "",
};

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

const ReporteForm = () => {
  const { crearReporte: crearReporteHook } = useReportes();
  const [form, setForm] = useState(initialState);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Función para comprimir imagen
  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo aspect ratio
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a blob comprimido
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setMensaje("Error: Por favor selecciona solo archivos de imagen");
        setTimeout(() => setMensaje(""), 3000);
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMensaje("Error: La imagen debe ser menor a 5MB");
        setTimeout(() => setMensaje(""), 3000);
        return;
      }

      try {
        // Comprimir imagen
        setMensaje("Optimizando imagen...");
        const compressedBlob = await compressImage(file);
        
        // Crear archivo comprimido
        const compressedFile = new File([compressedBlob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        setSelectedImage(compressedFile);
        
        // Mostrar info de compresión
        const reduction = Math.round((1 - compressedFile.size / file.size) * 100);
        setMensaje(`Imagen optimizada (reducida ${reduction}%)`);
        setTimeout(() => setMensaje(""), 3000);
        
        // Crear preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Error comprimiendo imagen:', error);
        // Si falla la compresión, usar imagen original
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) return null;

    try {
      setUploadingImage(true);
      setUploadProgress(0);
      
      // Crear referencia única para la imagen
      const timestamp = Date.now();
      // Sanitizar nombre de archivo - remover espacios, acentos y caracteres especiales
      const sanitizedName = selectedImage.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Remover caracteres especiales
        .replace(/_{2,}/g, '_'); // Reemplazar múltiples _ consecutivos por uno solo
      const fileName = `reportes/${timestamp}_${sanitizedName}`;
      
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
      
      // Subir imagen
      const uploadResult = await storageHelpers.upload('reportes-firmas', fileName, selectedImage);
      
      // Finalizar progreso
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Obtener URL pública
      const downloadURL = storageHelpers.getPublicUrl('reportes-firmas', uploadResult.path);
      
      // Pequeña pausa para mostrar el 100%
      await new Promise(resolve => setTimeout(resolve, 500));
      
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

  const crearReporte = async (e) => {
    e.preventDefault();
    
    if (!form.descripcion.trim() || !form.area.trim()) {
      setMensaje("Error: Por favor completa todos los campos obligatorios");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }

    setEnviando(true);
    try {
      let fotoUrl = form.fotoUrl;
      
      // Si hay una imagen seleccionada, subirla primero
      if (selectedImage) {
        try {
          fotoUrl = await uploadImage();
        } catch (imageError) {
          setMensaje("Advertencia: Error subiendo la imagen. El reporte se guardará sin foto.");
          setTimeout(() => setMensaje(""), 5000);
          fotoUrl = "";
        }
      }

      await crearReporteHook({
        ...form,
        fotoUrl,
        fecha: new Date().toISOString(),
        reportante: form.reportante || "Anónimo"
      });
      
      // Limpiar formulario
      setForm(initialState);
      setSelectedImage(null);
      setImagePreview(null);
      
      setMensaje("Éxito: Reporte enviado exitosamente");
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      console.error("Error enviando reporte:", error);
      setMensaje("Error: No se pudo enviar el reporte. Intenta nuevamente.");
      setTimeout(() => setMensaje(""), 3000);
    }
    setEnviando(false);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      baja: "#059669",
      media: "#d97706", 
      alta: "#dc2626",
      critica: "#991b1b"
    };
    return colors[severity] || "#6b7280";
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setForm({ ...form, fotoUrl: "" });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-4xl mx-auto">
      {/* Header del formulario */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Nuevo Reporte de Incidencia</h2>
        <p className="text-gray-600">Complete la información del reporte de seguridad</p>
      </div>

      {/* Mensaje de estado */}
      {mensaje && (
        <div className={`mb-6 p-4 rounded-lg border font-medium text-center ${
          mensaje.includes("Éxito") ? "bg-green-50 text-green-800 border-green-200" :
          mensaje.includes("Advertencia") ? "bg-yellow-50 text-yellow-800 border-yellow-200" :
          "bg-red-50 text-red-800 border-red-200"
        }`}>
          {mensaje}
        </div>
      )}

      <form onSubmit={crearReporte} className="space-y-6">
        {/* Tipo de Incidencia */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">Tipo de Incidencia</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              form.tipo === "Condición Insegura"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-white hover:border-blue-300"
            }`}>
              <input
                type="radio"
                name="tipo"
                value="Condición Insegura"
                checked={form.tipo === "Condición Insegura"}
                onChange={handleChange}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                form.tipo === "Condición Insegura" ? "border-blue-500 bg-blue-500" : "border-gray-300"
              }`}>
                {form.tipo === "Condición Insegura" && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              <span className="font-medium text-gray-900">Condición Insegura</span>
            </label>

            <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              form.tipo === "Acto Inseguro"
                ? "border-orange-500 bg-orange-50"
                : "border-gray-300 bg-white hover:border-orange-300"
            }`}>
              <input
                type="radio"
                name="tipo"
                value="Acto Inseguro"
                checked={form.tipo === "Acto Inseguro"}
                onChange={handleChange}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                form.tipo === "Acto Inseguro" ? "border-orange-500 bg-orange-500" : "border-gray-300"
              }`}>
                {form.tipo === "Acto Inseguro" && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
              <span className="font-medium text-gray-900">Acto Inseguro</span>
            </label>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Descripción Detallada *</label>
          <textarea
            name="descripcion"
            placeholder="Describe de manera detallada la condición o acto inseguro observado. Incluye ubicación específica, condiciones presentes y riesgo potencial..."
            value={form.descripcion}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            required
            rows={4}
          />
        </div>

        {/* Severidad */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">Nivel de Severidad</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["baja", "media", "alta", "critica"].map(severity => (
              <label key={severity} className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 text-center ${
                form.severidad === severity
                  ? `border-[${getSeverityColor(severity)}] bg-opacity-10`
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`} style={{
                borderColor: form.severidad === severity ? getSeverityColor(severity) : '#d1d5db',
                backgroundColor: form.severidad === severity ? `${getSeverityColor(severity)}15` : 'white'
              }}>
                <input
                  type="radio"
                  name="severidad"
                  value={severity}
                  checked={form.severidad === severity}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getSeverityColor(severity) }} />
                <span className="font-semibold text-sm capitalize" style={{
                  color: form.severidad === severity ? getSeverityColor(severity) : '#6b7280'
                }}>
                  {severity}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Grid para campos medianos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <option value="">Selecciona un área...</option>
              {areasDisponibles.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          {/* Nombre del Reportante */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Nombre del Reportante</label>
            <input
              type="text"
              name="reportante"
              placeholder="Tu nombre (opcional)"
              value={form.reportante}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              Si se deja vacío será marcado como "Anónimo"
            </p>
          </div>
        </div>

        {/* Subir Foto */}
        <div className="form-group">
          <label className="form-label">📷 Evidencia Fotográfica (Opcional)</label>
          
          {/* Progress Bar */}
          {uploadingImage && (
            <div style={{
              marginBottom: "15px",
              padding: "12px 16px",
              background: "#f0f9ff",
              borderRadius: "8px",
              border: "1px solid #0ea5e9"
            }}>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginBottom: "8px"
              }}>
                <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#0369a1" }}>
                  📄 Subiendo imagen...
                </span>
                <span style={{ fontSize: "0.8rem", color: "#0369a1" }}>
                  {uploadProgress}%
                </span>
              </div>
              <div style={{
                width: "100%",
                height: "6px",
                background: "#e0f2fe",
                borderRadius: "3px",
                overflow: "hidden"
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #0ea5e9, #0284c7)",
                  borderRadius: "3px",
                  transition: "width 0.3s ease"
                }} />
              </div>
            </div>
          )}
          
          <div style={{
            border: "2px dashed #d1d5db",
            borderRadius: "12px",
            padding: "20px",
            textAlign: "center",
            background: "#f9fafb",
            transition: "all 0.3s ease"
          }}>
            {!imagePreview ? (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                  id="photo-upload"
                />
                <div className="text-4xl mb-3 opacity-50">📸</div>
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
                    transition: "all 0.3s ease",
                    fontSize: "0.9rem"
                  }}
                >
                  Seleccionar Foto
                </label>
                <p style={{ 
                  marginTop: "8px", 
                  fontSize: "0.8rem", 
                  color: "#6b7280" 
                }}>
                  JPG, PNG, GIF · Máx. 5MB
                </p>
              </div>
            ) : (
              <div>
                <img 
                  src={imagePreview} 
                  alt="Vista previa" 
                  style={{ 
                    maxWidth: "250px", 
                    maxHeight: "150px", 
                    borderRadius: "8px",
                    border: "2px solid #e5e7eb",
                    marginBottom: "12px"
                  }}
                />
                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
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
                      border: "none"
                    }}
                  >
                    Cambiar
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
                      border: "none"
                    }}
                  >
                    Eliminar
                  </button>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                  id="photo-upload"
                />
              </div>
            )}
          </div>
        </div>

        {/* Botón de Envío */}
        <button
          type="submit"
          disabled={enviando || uploadingImage}
          className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-300 focus:ring-4 focus:outline-none ${
            enviando || uploadingImage
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200"
          }`}
        >
          {enviando ? (
            <>
              {uploadingImage ?
                `Subiendo imagen (${uploadProgress}%)...` :
                "Enviando reporte..."
              }
            </>
          ) : (
            "Enviar Reporte de Incidencia"
          )}
        </button>
      </form>
    </div>
  );
};

export default ReporteForm;
