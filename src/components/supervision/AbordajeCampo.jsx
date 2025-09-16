import React, { useState, useEffect } from 'react';
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

const areasDisponibles = [
  "Central de mezclas", "Central de cribado", "Laboratorio",
  "Caseta de procesamiento de muestras", "Cárcamo",
  "Almacenamiento de combustible", "Taller de mantenimiento",
  "Patio de almacenamiento 7", "Patio de almacenamiento de la pluma",
  "Centro industrial 2", "Hornos solera", "Almacén centro industrial",
  "Ambiental", "Oficinas administrativas", "Comedor",
  "Estacionamiento", "Acceso principal", "Área de carga y descarga"
];

const AbordajeCampo = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    colaboradorId: '',
    colaboradorNombre: '',
    colaboradorArea: '',
    area: '',
    supervisorReporta: '',
    lugarLabor: '',
    hallazgo: '',
    abordaje: '',
    firma_url: '',
    firmado_por: '',
    fecha_firma: ''
  });

  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [signatureData, setSignatureData] = useState(null);

  // Estados para autocompletado
  const [searchTerm, setSearchTerm] = useState('');
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [colaboradoresFiltrados, setColaboradoresFiltrados] = useState([]);

  // Cargar colaboradores
  useEffect(() => {
    const loadColaboradores = async () => {
      try {
        const data = await dbHelpers.getAll('colaboradores', { orderBy: 'nombre' });
        setColaboradores(data);
      } catch (error) {
        console.error('Error loading colaboradores:', error);
      }
    };
    loadColaboradores();
  }, []);

  // Filtrar colaboradores
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setColaboradoresFiltrados([]);
      setShowSugerencias(false);
    } else {
      const colaboradoresValidos = Array.isArray(colaboradores) ? colaboradores : [];
      const filtrados = colaboradoresValidos
        .filter((col) =>
          col && col.nombre && col.cedula &&
          (col.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          col.cedula.includes(searchTerm))
        )
        .slice(0, 8);
      setColaboradoresFiltrados(filtrados);
      setShowSugerencias(filtrados.length > 0);
    }
  }, [searchTerm, colaboradores]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSignatureChange = (signature) => {
    setSignatureData(signature);
  };

  const handleSelectColaborador = (colaborador) => {
    setForm({
      ...form,
      colaboradorId: colaborador.id,
      colaboradorNombre: colaborador.nombre,
      colaboradorArea: colaborador.area || ''
    });
    setSearchTerm(colaborador.nombre);
    setShowSugerencias(false);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setForm({
      ...form,
      colaboradorNombre: value,
      colaboradorId: '',
      colaboradorArea: ''
    });
  };

  const enviarAbordaje = async (e) => {
    e.preventDefault();

    if (!form.colaboradorNombre.trim() || !form.hallazgo.trim() || !form.abordaje.trim()) {
      setMensaje('Por favor completa todos los campos obligatorios');
      setTimeout(() => setMensaje(''), 5000);
      return;
    }

    setLoading(true);

    try {
      let firmaUrl = null;

      // Subir firma si existe
      if (signatureData) {
        setMensaje('Guardando firma...');
        const blob = await fetch(signatureData).then(r => r.blob());
        const fileName = `firma_abordaje_${Date.now()}.png`;
        const uploadResult = await storageHelpers.upload('firmas', fileName, blob);
        firmaUrl = uploadResult.publicUrl || uploadResult.fullPath;
      }

      setMensaje('Registrando abordaje...');

      const abordajeData = {
        colaborador_id: form.colaboradorId,
        colaborador_nombre: form.colaboradorNombre,
        colaborador_area: form.colaboradorArea,
        supervisor_reporta: form.supervisorReporta,
        lugar_labor: form.lugarLabor,
        hallazgo: form.hallazgo,
        abordaje: form.abordaje,
        firma_url: firmaUrl,
        firmado_por: form.firmado_por,
        fecha_firma: firmaUrl ? new Date().toISOString() : null,
        fecha_creacion: new Date().toISOString(),
        estado: 'completado'
      };

      await dbHelpers.create('abordajes_campo', abordajeData);

      setMensaje('Abordaje registrado exitosamente!');

      // Limpiar formulario
      setTimeout(() => {
        setForm({
          colaboradorId: '',
          colaboradorNombre: '',
          colaboradorArea: '',
          area: '',
          supervisorReporta: '',
          lugarLabor: '',
          hallazgo: '',
          abordaje: '',
          firma_url: '',
          firmado_por: '',
          fecha_firma: ''
        });
        setSearchTerm('');
        setSignatureData(null);
        setMensaje('');
      }, 2000);

    } catch (error) {
      console.error('Error enviando abordaje:', error);
      setMensaje('Error al registrar el abordaje. Intenta nuevamente.');
      setTimeout(() => setMensaje(''), 5000);
    }

    setLoading(false);
  };

  return (
    <FormContainer>
      <FormHeader
        title="Abordaje de Campo"
        subtitle="Registro directo de conversaciones y abordajes con colaboradores"
        onBack={() => navigate('/dashboard')}
        icon=""
      />

      <form onSubmit={enviarAbordaje}>
        <FormMessage
          type={mensaje.includes('exitosamente') ? 'success' : 'error'}
          message={mensaje}
          onClose={() => setMensaje('')}
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

        <FormSection title="Detalles del Abordaje">
          <FormField label="Situación observada" required>
            <FormTextarea
              name="hallazgo"
              placeholder="Describe la situación o comportamiento que motivó el abordaje..."
              value={form.hallazgo}
              onChange={handleChange}
              rows={4}
              required
            />
          </FormField>

          <FormField label="Abordaje realizado" required>
            <FormTextarea
              name="abordaje"
              placeholder="Describe la conversación, orientación o corrección realizada con el colaborador..."
              value={form.abordaje}
              onChange={handleChange}
              rows={4}
              required
            />
          </FormField>
        </FormSection>

        <FormSection title="Firma del Supervisor">
          <FormField label="Firma digital">
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
        </FormSection>

        <FormButtonGroup>
          <FormButton
            variant="primary"
            type="submit"
            loading={loading}
          >
            {loading ? 'Registrando abordaje...' : 'Registrar Abordaje'}
          </FormButton>
        </FormButtonGroup>
      </form>
    </FormContainer>
  );
};

export default AbordajeCampo;