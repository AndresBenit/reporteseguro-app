import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, dbHelpers, storageHelpers } from "../../../services/supabase";
import SignaturePad from "../../common/SignaturePad";
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
} from "../../common/FormComponents";

const areasDisponibles = [
  "Central de mezclas", "Central de cribado", "Laboratorio",
  "Caseta de procesamiento de muestras", "Cárcamo",
  "Almacenamiento de combustible", "Taller de mantenimiento",
  "Patio de almacenamiento 7", "Patio de almacenamiento de la pluma",
  "Centro industrial 2", "Hornos solera", "Almacén centro industrial",
  "Ambiental", "Oficinas administrativas", "Comedor",
  "Estacionamiento", "Acceso principal", "Área de carga y descarga"
];

const tiposIncidencia = [
  "Condición insegura",
  "Acto inseguro",
  "Casi accidente",
  "Incidente ambiental",
  "Falla de equipo",
  "Procedimiento inadecuado"
];

const nivelesSeveridad = [
  { value: "baja", label: "Baja - Sin riesgo inmediato" },
  { value: "media", label: "Media - Riesgo moderado" },
  { value: "alta", label: "Alta - Riesgo significativo" },
  { value: "critica", label: "Crítica - Riesgo inminente" }
];

const IncidentReportForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    tipo: "incidencia",
    subtipo: "condicion_insegura",
    descripcion: "",
    severidad: "media",
    area: "",
    reportante: "",
    colaboradorId: "",
    colaboradorNombre: "",
    colaboradorArea: "",
    foto_url: "",
    firma_url: "",
    firmado_por: "",
    fecha_firma: ""
  });
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [signatureData, setSignatureData] = useState(null);

  // Estados para colaboradores y autocompletado
  const [colaboradores, setColaboradores] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [colaboradoresFiltrados, setColaboradoresFiltrados] = useState([]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
  }, []);

  // Filtrar colaboradores para autocompletado
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setColaboradoresFiltrados([]);
      setShowSugerencias(false);
    } else {
      const colaboradoresValidos = Array.isArray(colaboradores) ? colaboradores : [];
      const filtrados = colaboradoresValidos
        .filter(
          (col) =>
            col && col.nombre && col.cedula &&
            (col.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            col.cedula.includes(searchTerm))
        )
        .slice(0, 8);
      setColaboradoresFiltrados(filtrados);
      setShowSugerencias(filtrados.length > 0);
    }
  }, [searchTerm, colaboradores]);

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

  const handleSubtipoChange = (subtipo) => {
    setForm({ ...form, subtipo });
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
        setMensaje("Optimizando imagen...");
        const compressedBlob = await compressImage(file);
        const compressedFile = new File([compressedBlob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });

        setSelectedImage(compressedFile);

        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(compressedFile);

        setMensaje("Imagen cargada correctamente");
        setTimeout(() => setMensaje(""), 3000);
      } catch (error) {
        console.error('Error procesando imagen:', error);
        setMensaje("Error al procesar la imagen");
        setTimeout(() => setMensaje(""), 3000);
      }
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) return null;

    setUploadingImage(true);
    try {
      const fileName = `incident-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
      // 🔧 FIX: Usar reportes-firmas que ya existe (en lugar de reportes-fotos que no existe)
      const uploadResult = await storageHelpers.upload('reportes-firmas', fileName, selectedImage);
      const imageUrl = storageHelpers.getPublicUrl('reportes-firmas', uploadResult.path);
      setUploadingImage(false);
      console.log('✅ Imagen de incidente subida correctamente:', imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('❌ Error subiendo imagen de incidente:', error);
      setUploadingImage(false);
      throw error;
    }
  };

  const crearReporte = async (e) => {
    e.preventDefault();

    if (!form.descripcion.trim() || !form.area.trim()) {
      setMensaje("Por favor completa todos los campos obligatorios");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }

    setEnviando(true);

    try {
      let foto_url = "";
      let firma_url = "";

      // Subir imagen si existe
      if (selectedImage) {
        setMensaje("Subiendo imagen...");
        foto_url = await uploadImage();
      }

      // Subir firma si existe
      if (signatureData) {
        setMensaje("Guardando firma...");
        const blob = await fetch(signatureData).then(r => r.blob());
        const fileName = `signature-${Date.now()}.png`;
        const uploadResult = await storageHelpers.upload('reportes-firmas', fileName, blob);
        firma_url = storageHelpers.getPublicUrl('reportes-firmas', uploadResult.path);
      }

      setMensaje("Creando reporte...");

      await dbHelpers.create('reportes', {
        tipo: form.tipo,
        subtipo: form.subtipo,
        descripcion: form.descripcion,
        severidad: form.severidad,
        area: form.area,
        reportante: form.reportante || "Anónimo",
        colaborador_id: form.colaboradorId,
        colaborador_nombre: form.colaboradorNombre,
        colaborador_area: form.colaboradorArea,
        estado: "pendiente",
        tipo_reporte: "incidencia",
        prioridad: form.severidad === "critica" ? "urgente" : form.severidad === "alta" ? "alta" : "normal",
        foto_url: foto_url,
        firma_url: firma_url,
        firmado_por: form.firmado_por,
        fecha_firma: firma_url ? new Date().toISOString() : null
      });

      setMensaje("¡Reporte de incidencia creado exitosamente!");

      // Limpiar el searchTerm
      setSearchTerm("");

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error("Error creando reporte:", error);
      setMensaje("Error al crear el reporte. Intenta nuevamente.");
      setTimeout(() => setMensaje(""), 3000);
    }

    setEnviando(false);
  };

  return (
    <FormContainer>
      <FormHeader
        title="Reporte de Incidencia"
        subtitle="Documenta condiciones inseguras, actos inseguros y casi accidentes"
        onBack={() => navigate('/reports')}
        icon=""
      />

      <form onSubmit={crearReporte}>
        <FormMessage
          type={mensaje.includes("exitosamente") ? "success" : "error"}
          message={mensaje}
          onClose={() => setMensaje("")}
        />

        <FormSection title="Información General">
          <FormRow columns={2}>
            <FormField label="Tipo de incidencia" required>
              <FormSelect
                name="subtipo"
                value={form.subtipo}
                onChange={handleChange}
                options={tiposIncidencia}
                placeholder="Selecciona el tipo..."
                required
              />
            </FormField>

            <FormField label="Nivel de severidad" required>
              <FormSelect
                name="severidad"
                value={form.severidad}
                onChange={handleChange}
                options={nivelesSeveridad}
                required
              />
            </FormField>
          </FormRow>

          <FormRow columns={2}>
            <FormField label="Área" required>
              <FormSelect
                name="area"
                value={form.area}
                onChange={handleChange}
                options={areasDisponibles}
                placeholder="Selecciona un área..."
                required
              />
            </FormField>

            <FormField label="Reportado por">
              <FormInput
                type="text"
                name="reportante"
                placeholder="Tu nombre (opcional)"
                value={form.reportante}
                onChange={handleChange}
              />
            </FormField>
          </FormRow>
        </FormSection>

        <FormSection title="Colaborador Involucrado">
          <FormField label="Buscar colaborador involucrado (opcional)">
            <div className="relative">
              <FormInput
                type="text"
                placeholder="Nombre o cédula del colaborador..."
                value={searchTerm}
                onChange={handleSearchChange}
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

          {form.colaboradorNombre && (
            <FormRow columns={2}>
              <FormField label="Colaborador seleccionado">
                <FormInput
                  type="text"
                  value={form.colaboradorNombre}
                  readOnly
                  className="bg-gray-50"
                />
              </FormField>
              <FormField label="Área del colaborador">
                <FormInput
                  type="text"
                  value={form.colaboradorArea}
                  readOnly
                  className="bg-gray-50"
                />
              </FormField>
            </FormRow>
          )}
        </FormSection>

        <FormSection title="Descripción de la Incidencia">
          <FormField label="Describe lo ocurrido" required>
            <FormTextarea
              name="descripcion"
              placeholder="Describe detalladamente qué ocurrió, cuándo, dónde y las circunstancias..."
              value={form.descripcion}
              onChange={handleChange}
              rows={6}
              required
            />
          </FormField>
        </FormSection>

        <FormSection title="Evidencias (Opcional)">
          <FormRow columns={2}>
            <FormField label="Fotografía de evidencia">
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
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

            <FormField label="Firma digital">
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <SignaturePad
                  onSignatureChange={setSignatureData}
                />
                {signatureData && (
                  <div className="mt-4">
                    <FormField label="Nombre del firmante">
                      <FormInput
                        type="text"
                        name="firmado_por"
                        placeholder="Nombre completo"
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
            variant="secondary"
            type="button"
            onClick={() => navigate('/reports')}
          >
            Cancelar
          </FormButton>
          <FormButton
            variant="primary"
            type="submit"
            loading={enviando || uploadingImage}
          >
            {enviando ? "Creando reporte..." : "Crear Reporte de Incidencia"}
          </FormButton>
        </FormButtonGroup>
      </form>
    </FormContainer>
  );
};

export default IncidentReportForm;