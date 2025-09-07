import React, { useState } from "react";
import { dbHelpers, storageHelpers } from "../../services/supabase";

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
        setMensaje("❌ Por favor selecciona solo archivos de imagen");
        setTimeout(() => setMensaje(""), 3000);
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMensaje("❌ La imagen debe ser menor a 5MB");
        setTimeout(() => setMensaje(""), 3000);
        return;
      }

      try {
        // Comprimir imagen
        setMensaje("🔄 Optimizando imagen...");
        const compressedBlob = await compressImage(file);
        
        // Crear archivo comprimido
        const compressedFile = new File([compressedBlob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        setSelectedImage(compressedFile);
        
        // Mostrar info de compresión
        const reduction = Math.round((1 - compressedFile.size / file.size) * 100);
        setMensaje(`✅ Imagen optimizada (reducida ${reduction}%)`);
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
      const fileName = `reportes/${timestamp}_${selectedImage.name.replace(/\s+/g, '_')}`;
      
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
      const uploadResult = await storageHelpers.upload('reportes-adjuntos', fileName, selectedImage);
      
      // Finalizar progreso
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Obtener URL pública
      const downloadURL = storageHelpers.getPublicUrl('reportes-adjuntos', uploadResult.path);
      
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
      setMensaje("❌ Por favor completa todos los campos obligatorios");
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
          setMensaje("❌ Error subiendo la imagen. El reporte se guardará sin foto.");
          setTimeout(() => setMensaje(""), 5000);
          fotoUrl = "";
        }
      }

      await dbHelpers.create('reportes', { 
        ...form,
        fotoUrl,
        fecha: new Date().toISOString(),
        reportante: form.reportante || "Anónimo"
      });
      
      // Limpiar formulario
      setForm(initialState);
      setSelectedImage(null);
      setImagePreview(null);
      
      setMensaje("✅ ¡Reporte enviado exitosamente!");
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      console.error("Error enviando reporte:", error);
      setMensaje("❌ Error al enviar el reporte. Intenta nuevamente.");
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
    <form onSubmit={crearReporte} style={{ position: "relative" }}>
      {mensaje && (
        <div style={{
          position: "absolute",
          top: "-10px",
          left: "0",
          right: "0",
          padding: "10px 16px",
          borderRadius: "10px",
          background: mensaje.includes("✅") ? "#d1fae5" : "#fef2f2",
          color: mensaje.includes("✅") ? "#059669" : "#dc2626",
          border: `1px solid ${mensaje.includes("✅") ? "#a7f3d0" : "#fecaca"}`,
          fontWeight: "600",
          textAlign: "center",
          zIndex: 10,
          fontSize: "0.9rem"
        }}>
          {mensaje}
        </div>
      )}

      <div style={{ marginTop: mensaje ? "45px" : "0" }}>
        {/* Tipo de Incidencia */}
        <div className="form-group">
          <label className="form-label">🔍 Tipo de Incidencia</label>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: "12px" 
          }}>
            <label style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              cursor: "pointer",
              padding: "12px 16px",
              borderRadius: "10px",
              border: form.tipo === "Condición Insegura" ? "2px solid #3b82f6" : "2px solid #e5e7eb",
              background: form.tipo === "Condición Insegura" ? "#eff6ff" : "white",
              transition: "all 0.3s ease"
            }}>
              <input
                type="radio"
                name="tipo"
                value="Condición Insegura"
                checked={form.tipo === "Condición Insegura"}
                onChange={handleChange}
                style={{ display: "none" }}
              />
              <span style={{ fontSize: "1.1rem" }}>💡</span>
              <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>Condición Insegura</span>
            </label>
            
            <label style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              cursor: "pointer",
              padding: "12px 16px",
              borderRadius: "10px",
              border: form.tipo === "Acto Inseguro" ? "2px solid #3b82f6" : "2px solid #e5e7eb",
              background: form.tipo === "Acto Inseguro" ? "#eff6ff" : "white",
              transition: "all 0.3s ease"
            }}>
              <input
                type="radio"
                name="tipo"
                value="Acto Inseguro"
                checked={form.tipo === "Acto Inseguro"}
                onChange={handleChange}
                style={{ display: "none" }}
              />
              <span style={{ fontSize: "1.1rem" }}>⚠️</span>
              <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>Acto Inseguro</span>
            </label>
          </div>
        </div>

        {/* Descripción */}
        <div className="form-group">
          <label className="form-label">📝 Descripción Detallada *</label>
          <textarea
            name="descripcion"
            placeholder="Describe de manera detallada la condición o acto inseguro observado. Incluye ubicación específica, condiciones presentes y riesgo potencial..."
            value={form.descripcion}
            onChange={handleChange}
            className="form-textarea"
            required
            style={{ minHeight: "100px" }}
          />
        </div>

        {/* Severidad */}
        <div className="form-group">
          <label className="form-label">🎯 Nivel de Severidad</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
            {["baja", "media", "alta", "critica"].map(severity => (
              <label key={severity} style={{ 
                display: "flex", 
                flexDirection: "column",
                alignItems: "center",
                gap: "6px", 
                cursor: "pointer",
                padding: "12px 8px",
                borderRadius: "10px",
                border: form.severidad === severity ? `2px solid ${getSeverityColor(severity)}` : "2px solid #e5e7eb",
                background: form.severidad === severity ? `${getSeverityColor(severity)}10` : "white",
                transition: "all 0.3s ease",
                textAlign: "center"
              }}>
                <input
                  type="radio"
                  name="severidad"
                  value={severity}
                  checked={form.severidad === severity}
                  onChange={handleChange}
                  style={{ display: "none" }}
                />
                <div style={{ 
                  width: "10px", 
                  height: "10px", 
                  borderRadius: "50%", 
                  background: getSeverityColor(severity) 
                }} />
                <span style={{ 
                  fontWeight: "600", 
                  textTransform: "capitalize",
                  color: form.severidad === severity ? getSeverityColor(severity) : "#6b7280",
                  fontSize: "0.85rem"
                }}>
                  {severity}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Grid para campos medianos */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr", 
          gap: "16px" 
        }}>
          {/* Área de Trabajo */}
          <div className="form-group">
            <label className="form-label">🏢 Área de Trabajo *</label>
            <select
              name="area"
              value={form.area}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Selecciona un área...</option>
              {areasDisponibles.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          {/* Nombre del Reportante */}
          <div className="form-group">
            <label className="form-label">👤 Nombre del Reportante</label>
            <input
              type="text"
              name="reportante"
              placeholder="Tu nombre (opcional)"
              value={form.reportante}
              onChange={handleChange}
              className="form-input"
              style={{ width: "100%" }}
            />
            <div style={{ 
              fontSize: "0.75rem", 
              color: "#6b7280", 
              marginTop: "4px" 
            }}>
              Si se deja vacío será marcado como "Anónimo"
            </div>
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
                <div style={{ fontSize: "2.5rem", marginBottom: "12px", opacity: 0.5 }}>📸</div>
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
                  📸 Seleccionar Foto
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
                    🔄 Cambiar
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
                    🗑️ Eliminar
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
          className="btn btn-primary"
          disabled={enviando || uploadingImage}
          style={{ 
            width: "100%", 
            fontSize: "1rem",
            padding: "14px 24px",
            opacity: (enviando || uploadingImage) ? 0.7 : 1,
            cursor: (enviando || uploadingImage) ? "not-allowed" : "pointer",
            background: (enviando || uploadingImage) ? "#9ca3af" : "#3b82f6",
            transition: "all 0.3s ease"
          }}
        >
          {enviando ? (
            <>
              <span className="pulse">⏳</span>
              {uploadingImage ? 
                `Subiendo imagen (${uploadProgress}%)...` : 
                "Enviando reporte..."
              }
            </>
          ) : (
            <>
              📤 Enviar Reporte de Incidencia
            </>
          )}
        </button>
      </div>

      {/* Estilos responsive adicionales */}
      <style>
        {`
          @media (max-width: 768px) {
            .form-group > div[style*="grid-template-columns"] {
              grid-template-columns: 1fr !important;
              gap: 12px !important;
            }
          }
        `}
      </style>
    </form>
  );
};

export default ReporteForm;
