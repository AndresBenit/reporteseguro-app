import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, dbHelpers, storageHelpers } from "../../../services/supabase";

const areasDisponibles = [
  "Central de mezclas", "Central de cribado", "Laboratorio",
  "Caseta de procesamiento de muestras", "Cárcamo", 
  "Almacenamiento de combustible", "Taller de mantenimiento",
  "Patio de almacenamiento 7", "Patio de almacenamiento de la pluma",
  "Centro industrial 2", "Hornos solera", "Almacén centro industrial",
  "Ambiental", "Oficinas administrativas", "Comedor", 
  "Estacionamiento", "Acceso principal", "Área de carga y descarga"
];

const IncidentReportForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    tipo: "Condición Insegura",
    descripcion: "",
    severidad: "media",
    area: "",
    reportante: "",
    foto_url: ""
  });
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTipoChange = (tipo) => {
    setForm({ ...form, tipo });
  };

  // Función para comprimir imagen
  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
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
        
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMensaje("❌ Por favor selecciona solo archivos de imagen");
        setTimeout(() => setMensaje(""), 3000);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setMensaje("❌ La imagen debe ser menor a 5MB");
        setTimeout(() => setMensaje(""), 3000);
        return;
      }

      try {
        setMensaje("🔄 Optimizando imagen...");
        const compressedBlob = await compressImage(file);
        const compressedFile = new File([compressedBlob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        setSelectedImage(compressedFile);
        
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(compressedFile);
        
        setMensaje("✅ Imagen cargada correctamente");
        setTimeout(() => setMensaje(""), 3000);
      } catch (error) {
        console.error('Error procesando imagen:', error);
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
      }
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) return null;

    try {
      setUploadingImage(true);
      
      const timestamp = Date.now();
      const fileName = `incidentes/${timestamp}_${selectedImage.name.replace(/\s+/g, '_')}`;
      
      // Use Supabase storage instead of Firebase
      const uploadResult = await storageHelpers.upload('reportes-adjuntos', fileName, selectedImage);
      const publicUrl = storageHelpers.getPublicUrl('reportes-adjuntos', fileName);
      
      setUploadingImage(false);
      return publicUrl;
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      setUploadingImage(false);
      throw error;
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.descripcion.trim() || !form.area) {
      setMensaje("❌ Por favor completa todos los campos obligatorios");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }

    setEnviando(true);
    try {
      let fotoUrl = "";
      
      if (selectedImage) {
        try {
          fotoUrl = await uploadImage();
        } catch (imageError) {
          setMensaje("❌ Error subiendo imagen. El reporte se guardará sin foto.");
          setTimeout(() => setMensaje(""), 5000);
        }
      }

      console.log('🔄 Enviando datos:', {
        ...form,
        foto_url: fotoUrl,
        estado: "pendiente",
        tipo_reporte: "incidencia"
      });

      await dbHelpers.create("reportes", {
        ...form,
        foto_url: fotoUrl,
        estado: "pendiente",
        tipo_reporte: "incidencia"
      });
      
      console.log('✅ Reporte creado exitosamente');
      
      setMensaje("✅ ¡Reporte enviado exitosamente!");
      setForm({
        tipo: "Condición Insegura",
        descripcion: "",
        severidad: "media", 
        area: "",
        reportante: "",
        foto_url: ""
      });
      setSelectedImage(null);
      setImagePreview(null);
      
      setTimeout(() => {
        navigate('/reportes/nuevo');
      }, 2000);
      
    } catch (error) {
      console.error("❌ Error completo:", error);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error details:", error.details);
      
      let mensajeError = "❌ Error al enviar el reporte";
      if (error.message) {
        mensajeError += `: ${error.message}`;
      }
      
      setMensaje(mensajeError);
      setTimeout(() => setMensaje(""), 5000);
    }
    setEnviando(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={() => navigate('/reportes/nuevo')}
          style={{
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem'
          }}
        >
          ← Volver al Centro de Reportes
        </button>
        
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '700', 
          color: '#1f2937',
          marginBottom: '8px'
        }}>
          Reportar Incidencia
        </h1>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontWeight: '600',
          textAlign: 'center',
          background: mensaje.includes('✅') ? '#d1fae5' : '#fef2f2',
          color: mensaje.includes('✅') ? '#065f46' : '#dc2626',
          border: `1px solid ${mensaje.includes('✅') ? '#a7f3d0' : '#fecaca'}`
        }}>
          {mensaje}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} style={{
        background: 'white',
        padding: '30px',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb'
      }}>
        {/* Tipo de Incidencia */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#374151'
          }}>
            Tipo de Incidencia:
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => handleTipoChange("Condición Insegura")}
              style={{
                padding: '12px 24px',
                borderRadius: '25px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                background: form.tipo === "Condición Insegura" ? '#3b82f6' : '#f3f4f6',
                color: form.tipo === "Condición Insegura" ? 'white' : '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              💡 Condición Insegura
            </button>
            <button
              type="button"
              onClick={() => handleTipoChange("Acto Inseguro")}
              style={{
                padding: '12px 24px',
                borderRadius: '25px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                background: form.tipo === "Acto Inseguro" ? '#3b82f6' : '#f3f4f6',
                color: form.tipo === "Acto Inseguro" ? 'white' : '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ⚠️ Acto Inseguro
            </button>
          </div>
        </div>

        {/* Descripción */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            fontWeight: '600', 
            marginBottom: '8px',
            color: '#374151'
          }}>
            Descripción:
          </label>
          <textarea
            name="descripcion"
            placeholder="Describe la condición o acto inseguro..."
            value={form.descripcion}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '1rem',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Severidad */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#374151'
          }}>
            Severidad:
          </label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { value: 'baja', label: 'Baja', color: '#10b981' },
              { value: 'media', label: 'Media', color: '#f59e0b' },
              { value: 'alta', label: 'Alta', color: '#ef4444' },
              { value: 'critica', label: 'Crítica', color: '#dc2626' }
            ].map(sev => (
              <button
                key={sev.value}
                type="button"
                onClick={() => setForm({ ...form, severidad: sev.value })}
                style={{
                  padding: '10px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  background: form.severidad === sev.value ? sev.color : '#f3f4f6',
                  color: form.severidad === sev.value ? 'white' : '#374151'
                }}
              >
                {sev.label}
              </button>
            ))}
          </div>
        </div>

        {/* Área de Trabajo */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            fontWeight: '600', 
            marginBottom: '8px',
            color: '#374151'
          }}>
            Área de Trabajo:
          </label>
          <select
            name="area"
            value={form.area}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '1rem',
              background: 'white'
            }}
          >
            <option value="">Selecciona un área</option>
            {areasDisponibles.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        {/* Nombre del Reportante */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            fontWeight: '600', 
            marginBottom: '8px',
            color: '#374151'
          }}>
            Nombre del Reportante:
          </label>
          <input
            type="text"
            name="reportante"
            placeholder="Tu nombre"
            value={form.reportante}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '1rem'
            }}
          />
        </div>

        {/* Upload de Imagen */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ 
            display: 'block', 
            fontWeight: '600', 
            marginBottom: '8px',
            color: '#374151'
          }}>
            URL de la Foto (opcional):
          </label>
          
          <div style={{
            border: '2px dashed #d1d5db',
            borderRadius: '12px',
            overflow: 'hidden',
            transition: 'all 0.3s ease'
          }}>
            {!imagePreview ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                background: '#f9fafb'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '16px', opacity: '0.5' }}>📸</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    border: 'none',
                    fontSize: '0.95rem'
                  }}
                >
                  📸 Subir Imagen
                </label>
                <p style={{
                  marginTop: '12px',
                  fontSize: '0.8rem',
                  color: '#6b7280'
                }}>
                  JPG, PNG, GIF · Máx. 5MB
                </p>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <img 
                  src={imagePreview} 
                  alt="Vista previa" 
                  style={{
                    width: '100%',
                    maxHeight: '300px',
                    objectFit: 'contain'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <label
                    htmlFor="image-upload"
                    style={{
                      padding: '6px 12px',
                      background: '#3b82f6',
                      color: 'white',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}
                  >
                    🔄 Cambiar
                  </label>
                  <button
                    type="button"
                    onClick={removeImage}
                    style={{
                      padding: '6px 12px',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  id="image-upload"
                />
              </div>
            )}
          </div>
        </div>

        {/* Botón Enviar */}
        <button
          type="submit"
          disabled={enviando || uploadingImage}
          style={{
            width: '100%',
            padding: '16px',
            background: (enviando || uploadingImage) ? '#9ca3af' : '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1.1rem',
            fontWeight: '700',
            cursor: (enviando || uploadingImage) ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            opacity: (enviando || uploadingImage) ? 0.7 : 1
          }}
        >
          {uploadingImage ? '📤 Subiendo imagen...' : 
           enviando ? '⏳ Enviando...' : 
           '+ Enviar Reporte'}
        </button>
      </form>
    </div>
  );
};

export default IncidentReportForm;
