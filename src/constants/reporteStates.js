// =====================================================================================
// ESTADOS DE REPORTES ESTANDARIZADOS
// =====================================================================================
// Este archivo centraliza todos los estados y configuraciones relacionadas con reportes

// Estados principales de reportes
export const REPORTE_ESTADOS = {
  PENDIENTE: 'pendiente',
  PROCESO: 'proceso', 
  RESUELTO: 'resuelto',
  ASIGNADO: 'asignado',
  EN_PROCESO: 'en_proceso',
  CERRADO: 'cerrado',
  CANCELADO: 'cancelado'
};

// Mapeo de estados para compatibilidad (estado_interno -> estado_mostrado)
export const ESTADO_DISPLAY_MAP = {
  [REPORTE_ESTADOS.PENDIENTE]: 'Pendiente',
  [REPORTE_ESTADOS.PROCESO]: 'En Proceso',
  [REPORTE_ESTADOS.RESUELTO]: 'Resuelto',
  [REPORTE_ESTADOS.ASIGNADO]: 'Asignado',
  [REPORTE_ESTADOS.EN_PROCESO]: 'En Proceso',
  [REPORTE_ESTADOS.CERRADO]: 'Cerrado',
  [REPORTE_ESTADOS.CANCELADO]: 'Cancelado'
};

// Estados equivalentes (para normalización)
export const ESTADO_EQUIVALENCIAS = {
  'proceso': REPORTE_ESTADOS.EN_PROCESO,
  'en_proceso': REPORTE_ESTADOS.EN_PROCESO,
  'pendiente': REPORTE_ESTADOS.PENDIENTE,
  'resuelto': REPORTE_ESTADOS.RESUELTO,
  'asignado': REPORTE_ESTADOS.ASIGNADO,
  'cerrado': REPORTE_ESTADOS.CERRADO,
  'cancelado': REPORTE_ESTADOS.CANCELADO
};

// Iconos para cada estado
export const ESTADO_ICONS = {
  [REPORTE_ESTADOS.PENDIENTE]: '⏳',
  [REPORTE_ESTADOS.PROCESO]: '🔄',
  [REPORTE_ESTADOS.RESUELTO]: '✅',
  [REPORTE_ESTADOS.ASIGNADO]: '👤',
  [REPORTE_ESTADOS.EN_PROCESO]: '🔄',
  [REPORTE_ESTADOS.CERRADO]: '🔒',
  [REPORTE_ESTADOS.CANCELADO]: '❌'
};

// Colores para cada estado
export const ESTADO_COLORS = {
  [REPORTE_ESTADOS.PENDIENTE]: '#f59e0b',
  [REPORTE_ESTADOS.PROCESO]: '#3b82f6',
  [REPORTE_ESTADOS.RESUELTO]: '#10b981',
  [REPORTE_ESTADOS.ASIGNADO]: '#8b5cf6',
  [REPORTE_ESTADOS.EN_PROCESO]: '#3b82f6',
  [REPORTE_ESTADOS.CERRADO]: '#6b7280',
  [REPORTE_ESTADOS.CANCELADO]: '#ef4444'
};

// Severidades de reportes
export const REPORTE_SEVERIDADES = {
  BAJA: 'baja',
  MEDIA: 'media',
  ALTA: 'alta',
  CRITICA: 'critica'
};

// Display names para severidades
export const SEVERIDAD_DISPLAY_MAP = {
  [REPORTE_SEVERIDADES.BAJA]: 'Baja',
  [REPORTE_SEVERIDADES.MEDIA]: 'Media',
  [REPORTE_SEVERIDADES.ALTA]: 'Alta',
  [REPORTE_SEVERIDADES.CRITICA]: 'Crítica'
};

// Iconos para severidades
export const SEVERIDAD_ICONS = {
  [REPORTE_SEVERIDADES.BAJA]: '🟢',
  [REPORTE_SEVERIDADES.MEDIA]: '🟡',
  [REPORTE_SEVERIDADES.ALTA]: '🟠',
  [REPORTE_SEVERIDADES.CRITICA]: '🔴'
};

// Colores para severidades
export const SEVERIDAD_COLORS = {
  [REPORTE_SEVERIDADES.BAJA]: '#10b981',
  [REPORTE_SEVERIDADES.MEDIA]: '#f59e0b',
  [REPORTE_SEVERIDADES.ALTA]: '#f97316',
  [REPORTE_SEVERIDADES.CRITICA]: '#ef4444'
};

// Prioridades de reportes
export const REPORTE_PRIORIDADES = {
  BAJA: 'baja',
  NORMAL: 'normal',
  ALTA: 'alta',
  URGENTE: 'urgente'
};

// Tipos de reporte
export const REPORTE_TIPOS = {
  CONDICION_INSEGURA: 'Condición Insegura',
  ACTO_INSEGURO: 'Acto Inseguro',
  CASI_ACCIDENTE: 'Casi Accidente',
  ACCIDENTE: 'Accidente',
  INCIDENTE: 'Incidente',
  OBSERVACION: 'Observación',
  MEJORA: 'Mejora'
};

// Funciones de utilidad
export const reporteUtils = {
  // Normalizar estado (convertir variaciones al estándar)
  normalizeEstado: (estado) => {
    if (!estado) return REPORTE_ESTADOS.PENDIENTE;
    const normalized = estado.toLowerCase().trim();
    return ESTADO_EQUIVALENCIAS[normalized] || estado;
  },

  // Obtener display name de estado
  getEstadoDisplay: (estado) => {
    const normalizado = reporteUtils.normalizeEstado(estado);
    return ESTADO_DISPLAY_MAP[normalizado] || estado;
  },

  // Obtener icono de estado
  getEstadoIcon: (estado) => {
    const normalizado = reporteUtils.normalizeEstado(estado);
    return ESTADO_ICONS[normalizado] || '❓';
  },

  // Obtener color de estado
  getEstadoColor: (estado) => {
    const normalizado = reporteUtils.normalizeEstado(estado);
    return ESTADO_COLORS[normalizado] || '#6b7280';
  },

  // Verificar si un estado es válido
  isValidEstado: (estado) => {
    return Object.values(REPORTE_ESTADOS).includes(estado) ||
           Object.keys(ESTADO_EQUIVALENCIAS).includes(estado);
  },

  // Obtener estados disponibles para select
  getEstadosForSelect: () => {
    return [
      { value: REPORTE_ESTADOS.PENDIENTE, label: `${ESTADO_ICONS[REPORTE_ESTADOS.PENDIENTE]} ${ESTADO_DISPLAY_MAP[REPORTE_ESTADOS.PENDIENTE]}` },
      { value: REPORTE_ESTADOS.EN_PROCESO, label: `${ESTADO_ICONS[REPORTE_ESTADOS.EN_PROCESO]} ${ESTADO_DISPLAY_MAP[REPORTE_ESTADOS.EN_PROCESO]}` },
      { value: REPORTE_ESTADOS.RESUELTO, label: `${ESTADO_ICONS[REPORTE_ESTADOS.RESUELTO]} ${ESTADO_DISPLAY_MAP[REPORTE_ESTADOS.RESUELTO]}` }
    ];
  },

  // Utilidades para severidad
  getSeveridadIcon: (severidad) => {
    return SEVERIDAD_ICONS[severidad] || '⚪';
  },

  getSeveridadColor: (severidad) => {
    return SEVERIDAD_COLORS[severidad] || '#6b7280';
  },

  getSeveridadDisplay: (severidad) => {
    return SEVERIDAD_DISPLAY_MAP[severidad] || severidad;
  },

  // Verificar transiciones de estado válidas
  canTransitionToEstado: (estadoActual, nuevoEstado) => {
    const transicionesValidas = {
      [REPORTE_ESTADOS.PENDIENTE]: [REPORTE_ESTADOS.ASIGNADO, REPORTE_ESTADOS.EN_PROCESO, REPORTE_ESTADOS.CANCELADO],
      [REPORTE_ESTADOS.ASIGNADO]: [REPORTE_ESTADOS.EN_PROCESO, REPORTE_ESTADOS.PENDIENTE, REPORTE_ESTADOS.CANCELADO],
      [REPORTE_ESTADOS.EN_PROCESO]: [REPORTE_ESTADOS.RESUELTO, REPORTE_ESTADOS.PENDIENTE, REPORTE_ESTADOS.CANCELADO],
      [REPORTE_ESTADOS.RESUELTO]: [REPORTE_ESTADOS.CERRADO, REPORTE_ESTADOS.EN_PROCESO],
      [REPORTE_ESTADOS.CERRADO]: [], // Estado final
      [REPORTE_ESTADOS.CANCELADO]: [] // Estado final
    };

    const normalizedActual = reporteUtils.normalizeEstado(estadoActual);
    const normalizedNuevo = reporteUtils.normalizeEstado(nuevoEstado);

    return transicionesValidas[normalizedActual]?.includes(normalizedNuevo) || false;
  }
};

// Exportar por defecto las constantes principales
export default {
  ESTADOS: REPORTE_ESTADOS,
  SEVERIDADES: REPORTE_SEVERIDADES,
  PRIORIDADES: REPORTE_PRIORIDADES,
  TIPOS: REPORTE_TIPOS,
  utils: reporteUtils
};