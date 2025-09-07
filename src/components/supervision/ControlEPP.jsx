import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbHelpers, storageHelpers } from '../../services/supabase';
import SignaturePad from '../common/SignaturePad';

const ControlEPP = () => {
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    titulo: "Registro Nueva Entrega",
    nombre: "",
    elemento_epp: "",
    cantidad: 1,
    area: "",
    observaciones: "",
    foto_url: "",
    firma_url: "",
    firmado_por: "",
    fecha_firma: ""
  });

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

  // Lista de elementos EPP
  const elementosEPP = [
    "Casco de seguridad",
    "Guantes de cuero", 
    "Gafas de protección",
    "Chaleco reflectante",
    "Botas de seguridad"
  ];

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

  // Cargar colaboradores
  useEffect(() => {
    const fetchColaboradores = async () => {
      try {
        console.log('🔄 Cargando colaboradores...');
        const data = await dbHelpers.getAll('colaboradores', {
          orderBy: 'nombre',
          ascending: true
        });
        console.log('✅ Colaboradores cargados:', data.length);
        setColaboradores(data);
      } catch (error) {
        console.error('❌ Error fetching colaboradores:', error);
      }
    };

    fetchColaboradores();
  }, []);

  // Filtrar colaboradores cuando cambia el término de búsqueda
  useEffect(() => {
    console.log('🔍 Filtrando colaboradores:', { searchTerm, colaboradores: colaboradores.length });
    if (searchTerm.length >= 2) {
      const filtrados = colaboradores.filter((colaborador) =>
        colaborador.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        colaborador.area.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('✅ Colaboradores filtrados:', filtrados.length);
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
    console.log('📝 Search term cambiado:', value);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!form.nombre.trim()) {
      setMensaje("❌ El nombre del colaborador es obligatorio");
      return;
    }

    if (!form.elemento_epp) {
      setMensaje("❌ Debe seleccionar un elemento de protección personal");
      return;
    }

    if (!form.cantidad || form.cantidad < 1) {
      setMensaje("❌ La cantidad debe ser mayor a 0");
      return;
    }

    if (!form.area) {
      setMensaje("❌ Debe seleccionar un área");
      return;
    }

    if (!signatureData || !form.firma_url) {
      setMensaje("❌ La firma digital es obligatoria para registrar la entrega");
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
          setMensaje("❌ Error subiendo la imagen. Se guardará sin foto.");
          // Continúar sin foto en lugar de fallar
        }
      }

      // Guardar registro de EPP
      const eppData = {
        tipo: "epp",
        subtipo: "Entrega de EPP",
        descripcion: `Entrega de ${form.cantidad} ${form.elemento_epp} a ${form.nombre}`,
        severidad: "baja", // Las entregas de EPP son informativas
        area: form.area,
        reportante: "Control EPP", // Sistema de control
        foto_url: fotoUrl,
        estado: "completado", // Las entregas se completan automáticamente
        tipo_reporte: "epp",
        prioridad: "normal",
        colaboradorinvolucrado: form.nombre,
        accionrecomendada: `Entregar ${form.cantidad} ${form.elemento_epp}`,
        // Campos específicos de EPP
        elemento_epp: form.elemento_epp,
        cantidad: form.cantidad,
        observaciones: form.observaciones,
        // Campos de firma digital
        firma_url: form.firma_url,
        firmado_por: form.firmado_por,
        fecha_firma: form.fecha_firma
      };

      await dbHelpers.create('reportes', eppData);

      // Limpiar formulario
      setForm({
        titulo: "Registro Nueva Entrega",
        nombre: "",
        elemento_epp: "",
        cantidad: 1,
        area: "",
        observaciones: "",
        foto_url: "",
        firma_url: "",
        firmado_por: "",
        fecha_firma: ""
      });
      setSelectedImage(null);
      setImagePreview(null);
      setSignatureData(null);

      setMensaje("✅ ¡Entrega de EPP registrada exitosamente!");
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      console.error("Error guardando entrega de EPP:", error);
      setMensaje("❌ Error al registrar la entrega. Intenta nuevamente.");
      setTimeout(() => setMensaje(""), 3000);
    }
    setLoading(false);
  };

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
          background: "none",
          border: "none",
          color: "#3b82f6",
          fontSize: "16px",
          cursor: "pointer",
          marginBottom: "20px",
          padding: "8px 0"
        }}
      >
        ← Volver
      </button>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1 style={{
          fontSize: "1.8rem",
          fontWeight: "700",
          color: "#1f2937",
          marginBottom: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px"
        }}>
          🦺 Control de EPP
        </h1>
        <p style={{ color: "#6b7280", fontSize: "1rem" }}>
          Registro de entrega de Elementos de Protección Personal
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} style={{
        background: "white",
        padding: "30px",
        borderRadius: "16px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)"
      }}>
        
        {/* Título (fijo) */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ 
            display: "block", 
            fontWeight: "600", 
            color: "#374151", 
            marginBottom: "8px",
            fontSize: "14px"
          }}>
            Título del Registro
          </label>
          <input
            type="text"
            value={form.titulo}
            readOnly
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor: "#f9fafb",
              color: "#6b7280"
            }}
          />
        </div>

        {/* Colaborador con Autocompletado */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ 
            display: "block", 
            fontWeight: "600", 
            color: "#374151", 
            marginBottom: "8px",
            fontSize: "14px"
          }}>
            👤 Colaborador *
          </label>
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
              required
              style={{
                width: "100%",
                padding: "12px",
                border: form.nombre ? "2px solid #10b981" : "2px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "16px",
                backgroundColor: form.nombre ? "#f0fdf4" : "white",
                transition: "all 0.2s ease",
              }}
            />

            {/* Indicador de selección */}
            {form.nombre && (
              <div style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#10b981",
                fontSize: "18px",
              }}>
                ✓
              </div>
            )}

            {/* Sugerencias */}
            {showSugerencias && colaboradoresFiltrados.length > 0 && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                backgroundColor: "white",
                border: "2px solid #e5e7eb",
                borderTop: "none",
                borderRadius: "0 0 8px 8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                maxHeight: "200px",
                overflowY: "auto",
                zIndex: 1000,
              }}>
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
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#f9fafb"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "white"}
                  >
                    <div>
                      <div style={{ fontWeight: "600", color: "#374151" }}>
                        {colaborador.nombre}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>
                        {colaborador.area}
                      </div>
                    </div>
                    <div style={{ color: "#10b981" }}>+</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Elemento de Protección Personal */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ 
            display: "block", 
            fontWeight: "600", 
            color: "#374151", 
            marginBottom: "8px",
            fontSize: "14px"
          }}>
            Elemento de Protección Personal *
          </label>
          <select
            name="elemento_epp"
            value={form.elemento_epp}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor: "white",
              cursor: "pointer"
            }}
          >
            <option value="">Selecciona un elemento EPP</option>
            {elementosEPP.map((elemento) => (
              <option key={elemento} value={elemento}>
                {elemento}
              </option>
            ))}
          </select>
        </div>

        {/* Cantidad */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ 
            display: "block", 
            fontWeight: "600", 
            color: "#374151", 
            marginBottom: "8px",
            fontSize: "14px"
          }}>
            Cantidad *
          </label>
          <input
            type="number"
            name="cantidad"
            value={form.cantidad}
            onChange={handleChange}
            min="1"
            max="100"
            required
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "16px"
            }}
          />
        </div>

        {/* Área */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ 
            display: "block", 
            fontWeight: "600", 
            color: "#374151", 
            marginBottom: "8px",
            fontSize: "14px"
          }}>
            Área de Trabajo *
          </label>
          <select
            name="area"
            value={form.area}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor: "white",
              cursor: "pointer"
            }}
          >
            <option value="">Selecciona un área</option>
            {areasDisponibles.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        {/* Observaciones */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ 
            display: "block", 
            fontWeight: "600", 
            color: "#374151", 
            marginBottom: "8px",
            fontSize: "14px"
          }}>
            Observaciones
          </label>
          <textarea
            name="observaciones"
            value={form.observaciones}
            onChange={handleChange}
            placeholder="Observaciones adicionales sobre la entrega (opcional)"
            rows="3"
            style={{
              width: "100%",
              padding: "12px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "16px",
              resize: "vertical",
              minHeight: "80px"
            }}
          />
        </div>

        {/* Subida de foto */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ 
            display: "block", 
            fontWeight: "600", 
            color: "#374151", 
            marginBottom: "8px",
            fontSize: "14px"
          }}>
            Foto del Elemento Entregado
          </label>
          <div style={{
            border: "2px dashed #d1d5db",
            borderRadius: "12px",
            padding: "20px",
            textAlign: "center",
            backgroundColor: "#f9fafb"
          }}>
            {!imagePreview ? (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  capture="camera"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                  id="photo-upload"
                  disabled={uploadingImage}
                />
                <label 
                  htmlFor="photo-upload" 
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#3b82f6",
                    color: "white",
                    padding: "12px 24px",
                    borderRadius: "8px",
                    cursor: uploadingImage ? "not-allowed" : "pointer",
                    fontSize: "16px",
                    fontWeight: "600",
                    opacity: uploadingImage ? 0.7 : 1
                  }}
                >
                  📸 {uploadingImage ? "Subiendo..." : "Tomar Foto"}
                </label>
                <p style={{ color: "#6b7280", marginTop: "8px", fontSize: "14px" }}>
                  Toma una foto del elemento EPP que estás entregando
                </p>
              </div>
            ) : (
              <div>
                <img
                  src={imagePreview}
                  alt="Elemento EPP"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "200px",
                    borderRadius: "8px",
                    marginBottom: "12px"
                  }}
                />
                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                  <button
                    type="button"
                    onClick={removeImage}
                    style={{
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600"
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            )}

            {/* Barra de progreso */}
            {uploadingImage && (
              <div style={{ marginTop: "16px" }}>
                <div style={{
                  background: "#e5e7eb",
                  borderRadius: "10px",
                  overflow: "hidden",
                  height: "8px"
                }}>
                  <div style={{
                    background: "#3b82f6",
                    height: "100%",
                    width: `${uploadProgress}%`,
                    transition: "width 0.3s ease"
                  }} />
                </div>
                <p style={{ color: "#3b82f6", marginTop: "8px", fontSize: "14px" }}>
                  Subiendo imagen... {uploadProgress}%
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Firma Digital */}
        <SignaturePad 
          onSignatureChange={handleSignatureChange}
          required={true}
          label="Firma del Colaborador que Recibe"
        />

        {/* Mensaje */}
        {mensaje && (
          <div style={{
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "8px",
            backgroundColor: mensaje.includes("❌") ? "#fef2f2" : "#f0fdf4",
            borderLeft: `4px solid ${mensaje.includes("❌") ? "#ef4444" : "#10b981"}`,
            color: mensaje.includes("❌") ? "#dc2626" : "#059669",
            fontSize: "14px",
            fontWeight: "500"
          }}>
            {mensaje}
          </div>
        )}

        {/* Botón de envío */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            background: loading ? "#9ca3af" : "#10b981",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "18px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px"
          }}
        >
          {loading ? (
            <>
              <span style={{ 
                width: "20px", 
                height: "20px", 
                border: "2px solid #ffffff40", 
                borderTop: "2px solid #ffffff", 
                borderRadius: "50%", 
                animation: "spin 1s linear infinite" 
              }}></span>
              Registrando entrega...
            </>
          ) : (
            <>
              🦺 Registrar Entrega de EPP
            </>
          )}
        </button>
      </form>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ControlEPP;