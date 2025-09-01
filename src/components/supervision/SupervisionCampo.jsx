import React, { useState, useEffect } from "react";
import { dbHelpers, storageHelpers, supabase } from "../../services/supabase";

const SupervisionCampo = () => {
  const [form, setForm] = useState({
    colaboradorId: "",
    colaboradorNombre: "",
    colaboradorArea: "",
    supervisorReporta: "",
    lugarLabor: "",
    hallazgo: "",
    recomendacion: "",
  });

  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
        const compressedFile = await compressImage(file);
        setSelectedImage(compressedFile);

        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(compressedFile);

        setMensaje("✅ Imagen lista para subir");
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
      const fileName = `supervision/${timestamp}_${imageName.replace(
        /\s+/g,
        "_"
      )}`;

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
      const uploadResult = await storageHelpers.upload('images', fileName, selectedImage);

      clearInterval(progressInterval);
      setUploadProgress(100);

      const downloadURL = storageHelpers.getPublicUrl('images', uploadResult.path);
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
      !form.supervisorReporta.trim() ||
      !form.lugarLabor.trim() ||
      !form.hallazgo.trim() ||
      !form.recomendacion.trim()
    ) {
      setMensaje("❌ Por favor completa todos los campos obligatorios");
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
          setMensaje("❌ Error subiendo la imagen. Se guardará sin foto.");
          // Continúar sin foto en lugar de fallar
        }
      }

      // Guardar recomendación
      const recomendacionData = {
        tipo: "Nueva Recomendación",
        subtipo: "Supervisión de Campo",
        descripcion: `Colaborador: ${form.colaboradorNombre}\nLugar: ${form.lugarLabor}\nHallazgo: ${form.hallazgo}\nRecomendación: ${form.recomendacion}`,
        severidad: "media",
        area: form.colaboradorArea,
        reportante: form.supervisorReporta.trim(),
        foto_url: fotoUrl,
        estado: "pendiente",
        tipo_reporte: "recomendacion",
        prioridad: "normal",
        colaboradorinvolucrado: form.colaboradorNombre,
        accionrecomendada: form.recomendacion.trim()
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

      setMensaje("✅ ¡Recomendación registrada exitosamente!");
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      console.error("Error guardando recomendación:", error);
      setMensaje("❌ Error al guardar la recomendación. Intenta nuevamente.");
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
          padding: window.innerWidth <= 768 ? "10px 16px" : "12px 20px",
          background: "#f3f4f6",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "0.9rem",
          fontWeight: "600",
          color: "#374151",
          marginBottom: "20px",
          transition: "all 0.2s ease",
          width: window.innerWidth <= 480 ? "100%" : "auto",
          justifyContent: window.innerWidth <= 480 ? "center" : "flex-start"
        }}
        onMouseEnter={(e) => (e.target.style.background = "#e5e7eb")}
        onMouseLeave={(e) => (e.target.style.background = "#f3f4f6")}
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
            background: mensaje.includes("✅")
              ? "#d1fae5"
              : mensaje.includes("🔄")
              ? "#f0f9ff"
              : "#fef2f2",
            color: mensaje.includes("✅")
              ? "#059669"
              : mensaje.includes("🔄")
              ? "#0369a1"
              : "#dc2626",
            border: `1px solid ${
              mensaje.includes("✅")
                ? "#a7f3d0"
                : mensaje.includes("🔄")
                ? "#93c5fd"
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
      <div className="card" style={{ padding: window.innerWidth <= 768 ? "20px" : "30px" }}>
        <h2 style={{ marginBottom: "25px", color: "#1f2937" }}>
          📝 Nueva Recomendación en Campo
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Fecha */}
          <div className="form-group">
            <label className="form-label">📅 Fecha</label>
            <input
              type="text"
              value={new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              disabled
              className="form-input"
              style={{ background: "#f3f4f6", color: "#6b7280" }}
            />
          </div>

          {/* Colaborador con Autocompletado */}
          <div className="form-group">
            <label className="form-label">👤 Colaborador *</label>
            <div style={{ position: "relative" }}>
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
                className="form-input"
                required
                style={{
                  width: "100%",
                  borderColor: form.colaboradorId ? "#10b981" : "#d1d5db",
                  backgroundColor: form.colaboradorId ? "#f0fdf4" : "white",
                }}
              />

              {/* Indicador de selección */}
              {form.colaboradorId && (
                <div
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#10b981",
                    fontSize: "1.2rem",
                  }}
                >
                  ✓
                </div>
              )}

              {/* Lista de sugerencias */}
              {showSugerencias && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderTop: "none",
                    borderRadius: "0 0 8px 8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {colaboradoresFiltrados.map((colaborador) => (
                    <div
                      key={colaborador.id}
                      onClick={() => seleccionarColaborador(colaborador)}
                      style={{
                        padding: "12px 16px",
                        cursor: "pointer",
                        borderBottom: "1px solid #f3f4f6",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "background-color 0.2s ease",
                        ":hover": { backgroundColor: "#f9fafb" },
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.backgroundColor = "#f9fafb")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.backgroundColor = "white")
                      }
                    >
                      <div>
                        <div style={{ fontWeight: "600", color: "#1f2937" }}>
                          {colaborador.nombre}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                          {colaborador.cedula} • {colaborador.area}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "0.7rem",
                          fontWeight: "600",
                          backgroundColor:
                            colaborador.area === "Centro Industrial"
                              ? "#fef3c7"
                              : "#fee2e2",
                          color:
                            colaborador.area === "Centro Industrial"
                              ? "#92400e"
                              : "#991b1b",
                        }}
                      >
                        {colaborador.area === "Centro Industrial" ? "CI" : "HS"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Información del colaborador seleccionado */}
            {form.colaboradorId && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "8px 12px",
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                }}
              >
                <strong>{form.colaboradorNombre}</strong> -{" "}
                {form.colaboradorArea}
              </div>
            )}
          </div>

          {/* Supervisor que Reporta */}
          <div className="form-group">
            <label className="form-label">👨‍💼 Supervisor que Reporta *</label>
            <input
              type="text"
              name="supervisorReporta"
              placeholder="Nombre del supervisor que realizó la supervisión"
              value={form.supervisorReporta}
              onChange={handleChange}
              className="form-input"
              required
              style={{ width: "100%" }}
            />
          </div>

          {/* Lugar de Labor */}
          <div className="form-group">
            <label className="form-label">📍 Lugar de Labor *</label>
            <input
              type="text"
              name="lugarLabor"
              placeholder="Ej: Hornos, Oficina, Patio..."
              value={form.lugarLabor}
              onChange={handleChange}
              className="form-input"
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
          <div className="form-group">
            <label className="form-label">🔍 Hallazgo *</label>
            <textarea
              name="hallazgo"
              placeholder="Describe detalladamente lo observado (condición insegura, acto inseguro, etc.)"
              value={form.hallazgo}
              onChange={handleChange}
              className="form-textarea"
              required
              style={{ minHeight: "100px" }}
            />
          </div>

          {/* Recomendación */}
          <div className="form-group">
            <label className="form-label">💡 Recomendación *</label>
            <textarea
              name="recomendacion"
              placeholder="Describe la recomendación dada al colaborador"
              value={form.recomendacion}
              onChange={handleChange}
              className="form-textarea"
              required
              style={{ minHeight: "100px" }}
            />
          </div>

          {/* Foto del Documento Firmado */}
          <div className="form-group">
            <label className="form-label">
              📸 Foto del Documento Firmado (Opcional)
            </label>

            {/* Progress Bar */}
            {uploadingImage && (
              <div
                style={{
                  marginBottom: "15px",
                  padding: "12px 16px",
                  background: "#f0f9ff",
                  borderRadius: "8px",
                  border: "1px solid #0ea5e9",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "#0369a1",
                    }}
                  >
                    📄 Subiendo evidencia...
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "#0369a1" }}>
                    {uploadProgress}%
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "6px",
                    background: "#e0f2fe",
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${uploadProgress}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #0ea5e9, #0284c7)",
                      borderRadius: "3px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            )}

            <div
              style={{
                border: "2px dashed #d1d5db",
                borderRadius: "12px",
                padding: "20px",
                textAlign: "center",
                background: "#f9fafb",
              }}
            >
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
                      🔄 Cambiar Foto
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
