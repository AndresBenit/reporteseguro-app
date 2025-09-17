import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dbHelpers, storageHelpers, supabase } from "../../services/supabase";
import SignaturePad from "../common/SignaturePad";
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
} from "../common/FormComponents";

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
  const navigate = useNavigate();
  const [form, setForm] = useState({
    colaboradorId: "",
    colaboradorNombre: "",
    colaboradorArea: "",
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
  };

  // Manejar selección de colaborador del autocompletado
  const handleSelectColaborador = (colaborador) => {
    setForm({
      ...form,
      colaboradorId: colaborador.id,
      colaboradorNombre: colaborador.nombre,
      colaboradorArea: colaborador.area || ""
    });
    setSearchTerm(colaborador.nombre);
    setShowSugerencias(false);
  };

  // Manejar cambios en el campo de búsqueda de colaboradores
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setForm({
      ...form,
      colaboradorNombre: value,
      colaboradorId: "",
      colaboradorArea: ""
    });
  };

  // Función para comprimir imagen
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
      setUploadingImage(false);

      return uploadResult.publicUrl || uploadResult.fullPath;
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadingImage(false);
      setUploadProgress(0);
      throw error;
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMensaje("Por favor selecciona solo archivos de imagen");
        setTimeout(() => setMensaje(""), 3000);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setMensaje("La imagen debe ser menor a 5MB");
        setTimeout(() => setMensaje(""), 3000);
        return;
      }

      try {
        setMensaje("Procesando imagen...");
        const compressedBlob = await compressImage(file);
        const compressedFile = new File([compressedBlob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });

        setSelectedImage(compressedFile);

        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(compressedFile);

        setMensaje("");
      } catch (error) {
        console.error('Error procesando imagen:', error);
        setMensaje("Error al procesar la imagen");
        setTimeout(() => setMensaje(""), 3000);
      }
    }
  };

  const enviarSupervision = async (e) => {
    e.preventDefault();

    if (!form.colaboradorNombre.trim() || !form.hallazgo.trim() || !form.recomendacion.trim()) {
      setMensaje("Por favor completa todos los campos obligatorios");
      setTimeout(() => setMensaje(""), 5000);
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;
      let firmaUrl = null;

      // Subir imagen si existe
      if (selectedImage) {
        setMensaje("Subiendo evidencia...");
        imageUrl = await uploadImage();
      }

      // Subir firma si existe
      if (signatureData) {
        setMensaje("Guardando firma...");
        const blob = await fetch(signatureData).then(r => r.blob());
        const fileName = `firma_supervision_${Date.now()}.png`;
        const uploadResult = await storageHelpers.upload('reportes-firmas', fileName, blob);
        firmaUrl = uploadResult.publicUrl || uploadResult.fullPath;
      }

      setMensaje("Registrando supervisión...");

      const supervisionData = {
        colaborador_id: form.colaboradorId,
        colaborador_nombre: form.colaboradorNombre,
        colaborador_area: form.colaboradorArea,
        supervisor_reporta: form.supervisorReporta,
        lugar_labor: form.lugarLabor,
        hallazgo: form.hallazgo,
        recomendacion: form.recomendacion,
        evidencia_url: imageUrl,
        firma_url: firmaUrl,
        firmado_por: form.firmado_por,
        fecha_firma: firmaUrl ? new Date().toISOString() : null,
        fecha_creacion: new Date().toISOString(),
        estado: 'pendiente'
      };

      await dbHelpers.create('supervision_campo', supervisionData);

      setMensaje("¡Supervisión registrada exitosamente!");

      // Limpiar formulario
      setTimeout(() => {
        setForm({
          colaboradorId: "",
          colaboradorNombre: "",
          colaboradorArea: "",
          supervisorReporta: "",
          lugarLabor: "",
          hallazgo: "",
          recomendacion: "",
          firma_url: "",
          firmado_por: "",
          fecha_firma: ""
        });
        setSearchTerm("");
        setSelectedImage(null);
        setImagePreview(null);
        setSignatureData(null);
        setMensaje("");
      }, 2000);

    } catch (error) {
      console.error('Error enviando supervisión:', error);
      setMensaje("Error al registrar la supervisión. Intenta nuevamente.");
      setTimeout(() => setMensaje(""), 5000);
    }

    setLoading(false);
  };

  return (
    <FormContainer>
      <FormHeader
        title="Supervisión de Campo"
        subtitle="Registro de observaciones y recomendaciones para colaboradores"
        onBack={() => navigate('/dashboard')}
        icon=""
      />

      <form onSubmit={enviarSupervision}>
        <FormMessage
          type={mensaje.includes("exitosamente") ? "success" : "error"}
          message={mensaje}
          onClose={() => setMensaje("")}
        />

        <FormSection title="Información del Colaborador">
          <FormField label="Buscar colaborador" required>
            <div className="relative">
              <FormInput
                type="text"
                placeholder="Nombre o cédula del colaborador..."
                value={searchTerm}
                onChange={handleSearchChange}
                required
              />
              {showSugerencias && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {colaboradoresFiltrados.map((colaborador) => (
                    <div
                      key={colaborador.id}
                      className="px-4 py-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100"
                      onClick={() => handleSelectColaborador(colaborador)}
                    >
                      <div className="font-medium text-gray-900">{colaborador.nombre}</div>
                      <div className="text-sm text-gray-600">
                        Cédula: {colaborador.cedula} | Área: {colaborador.area || 'No especificada'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          <FormRow columns={2}>
            <FormField label="Área del colaborador">
              <FormInput
                type="text"
                name="colaboradorArea"
                placeholder="Área automática"
                value={form.colaboradorArea}
                onChange={handleChange}
                readOnly
                className="bg-gray-50"
              />
            </FormField>

            <FormField label="Lugar de labor" required>
              <FormSelect
                name="lugarLabor"
                value={form.lugarLabor}
                onChange={handleChange}
                options={areasDisponibles}
                placeholder="Selecciona el lugar..."
                required
              />
            </FormField>
          </FormRow>

          <FormField label="Supervisor que reporta" required>
            <FormInput
              type="text"
              name="supervisorReporta"
              placeholder="Nombre del supervisor"
              value={form.supervisorReporta}
              onChange={handleChange}
              required
            />
          </FormField>
        </FormSection>

        <FormSection title="Hallazgos y Recomendaciones">
          <FormField label="Hallazgos observados" required>
            <FormTextarea
              name="hallazgo"
              placeholder="Describe detalladamente los hallazgos observados durante la supervisión..."
              value={form.hallazgo}
              onChange={handleChange}
              rows={4}
              required
            />
          </FormField>

          <FormField label="Recomendaciones" required>
            <FormTextarea
              name="recomendacion"
              placeholder="Proporciona recomendaciones específicas y acciones a seguir..."
              value={form.recomendacion}
              onChange={handleChange}
              rows={4}
              required
            />
          </FormField>
        </FormSection>

        <FormSection title="Evidencias y Firma">
          <FormRow columns={2}>
            <FormField label="Evidencia fotográfica">
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {uploadingImage && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
                {imagePreview && (
                  <div className="mt-4">
                    <img
                      src={imagePreview}
                      alt="Vista previa"
                      className="max-w-full h-48 object-contain border border-gray-200 rounded-lg"
                    />
                  </div>
                )}
              </div>
            </FormField>

            <FormField label="Firma del supervisor">
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <SignaturePad onSignatureChange={handleSignatureChange} />
                {signatureData && (
                  <div className="mt-4">
                    <FormField label="Nombre del firmante">
                      <FormInput
                        type="text"
                        name="firmado_por"
                        placeholder="Nombre completo del supervisor"
                        value={form.firmado_por}
                        onChange={handleChange}
                      />
                    </FormField>
                  </div>
                )}
              </div>
            </FormField>
          </FormRow>
        </FormSection>

        <FormButtonGroup>
          <FormButton
            variant="primary"
            type="submit"
            loading={loading || uploadingImage}
          >
            {loading ? "Registrando supervisión..." : "Registrar Supervisión"}
          </FormButton>
        </FormButtonGroup>
      </form>
    </FormContainer>
  );
};

export default SupervisionCampo;