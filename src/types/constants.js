// Tipos de reportes disponibles
export const REPORT_TYPES = {
  INCIDENT: 'incident',
  OBSERVATION: 'observation', 
  PERSONNEL: 'personnel',
  FOLLOWUP: 'followup'
};

// Tipos de incidentes
export const INCIDENT_SUBTYPES = [
  "Accidente con lesión",
  "Accidente sin lesión", 
  "Casi-accidente",
  "Derrame químico",
  "Incendio/Explosión",
  "Falla de equipo",
  "Exposición a sustancias",
  "Caída de altura",
  "Otro incidente"
];

// Tipos de observaciones
export const OBSERVATION_TYPES = [
  "Condición insegura",
  "Acto inseguro observado", 
  "Oportunidad de mejora",
  "Riesgo potencial",
  "Práctica no estándar",
  "Sugerencia de seguridad"
];

// Tipos de reportes de personal
export const PERSONNEL_TYPES = [
  "Comportamiento riesgoso",
  "Necesidad de capacitación", 
  "Reconocimiento positivo",
  "Incumplimiento de procedimiento",
  "Falta de EPP",
  "Actitud positiva hacia seguridad"
];

// Áreas de trabajo disponibles
export const AREAS_DISPONIBLES = [
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

// Estados de reportes
export const REPORT_STATES = {
  PENDIENTE: 'pendiente',
  PROCESO: 'proceso',
  RESUELTO: 'resuelto'
};

// Niveles de severidad
export const SEVERITY_LEVELS = {
  BAJA: 'baja',
  MEDIA: 'media', 
  ALTA: 'alta',
  CRITICA: 'critica'
};

// Colores por severidad
export const SEVERITY_COLORS = {
  baja: "#059669",
  media: "#f59e0b", 
  alta: "#ef4444",
  critica: "#dc2626"
};

// Colores por estado
export const STATE_COLORS = {
  pendiente: "#3b82f6",
  proceso: "#8b5cf6",
  resuelto: "#10b981"
};