// Áreas disponibles en la empresa
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

// Tipos de severidad
export const SEVERIDAD_TYPES = {
  BAJA: 'baja',
  MEDIA: 'media',
  ALTA: 'alta',
  CRITICA: 'critica'
};

// Estados de reporte
export const ESTADO_TYPES = {
  PENDIENTE: 'pendiente',
  PROCESO: 'proceso',
  RESUELTO: 'resuelto'
};

// Tipos de reporte
export const TIPO_REPORTE = {
  INCIDENCIA: 'incidencia',
  OBSERVACION: 'observacion',
  PERSONAL: 'personal',
  SEGUIMIENTO: 'seguimiento'
};

// Colores por severidad
export const SEVERIDAD_COLORS = {
  [SEVERIDAD_TYPES.BAJA]: "#059669",
  [SEVERIDAD_TYPES.MEDIA]: "#f59e0b",
  [SEVERIDAD_TYPES.ALTA]: "#ef4444",
  [SEVERIDAD_TYPES.CRITICA]: "#dc2626"
};

// Colores por estado
export const ESTADO_COLORS = {
  [ESTADO_TYPES.PENDIENTE]: "#3b82f6",
  [ESTADO_TYPES.PROCESO]: "#8b5cf6",
  [ESTADO_TYPES.RESUELTO]: "#10b981"
};

// Rutas de navegación
export const NAVIGATION_ROUTES = {
  DASHBOARD: '/',
  REPORTES: '/reportes',
  SUPERVISION: '/supervision',
  COLABORADORES: '/colaboradores',
  LOGIN: '/login'
};

// Configuración de subida de archivos
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  COMPRESSION: {
    MAX_WIDTH: 800,
    QUALITY: 0.8
  }
};