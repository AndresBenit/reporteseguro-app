import { SEVERIDAD_COLORS, ESTADO_COLORS } from './constants';

/**
 * Formatea una fecha a texto relativo (ej: "Hace 2 horas")
 */
export const formatTimeAgo = (date) => {
  if (!date) return 'Fecha no disponible';
  
  const now = new Date();
  const reportDate = date.toDate ? date.toDate() : new Date(date);
  const diffInMs = now - reportDate;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} min`;
  } else if (diffInHours < 24) {
    return `Hace ${diffInHours} h`;
  } else {
    return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  }
};

/**
 * Formatea una fecha a formato legible
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'Sin fecha';
  
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Intl.DateTimeFormat('es-ES', { ...defaultOptions, ...options }).format(dateObj);
};

/**
 * Obtiene el color para un nivel de severidad
 */
export const getSeverityColor = (severity) => {
  return SEVERIDAD_COLORS[severity] || "#6b7280";
};

/**
 * Obtiene el color para un estado
 */
export const getStatusColor = (status) => {
  return ESTADO_COLORS[status] || "#6b7280";
};

/**
 * Trunca texto a una longitud específica
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

/**
 * Capitaliza la primera letra de una cadena
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Genera un ID único simple
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Valida si un archivo es una imagen válida
 */
export const validateImageFile = (file, maxSize = 5 * 1024 * 1024) => {
  const errors = [];
  
  if (!file.type.startsWith('image/')) {
    errors.push('El archivo debe ser una imagen');
  }
  
  if (file.size > maxSize) {
    errors.push(`El archivo debe ser menor a ${Math.round(maxSize / (1024 * 1024))}MB`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Convierte bytes a formato legible
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Debounce function para optimizar búsquedas
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Calcula estadísticas básicas de un array de reportes
 */
export const calculateReportStats = (reportes) => {
  // Validar que reportes sea un array válido
  const reportesValidos = Array.isArray(reportes) ? reportes : [];
  const total = reportesValidos.length;
  
  if (total === 0) {
    return {
      total: 0,
      pendientes: 0,
      criticos: 0,
      resueltos: 0,
      porcentajePendientes: 0,
      porcentajeCriticos: 0,
      porcentajeResueltos: 0
    };
  }
  
  const pendientes = reportesValidos.filter(r => r?.estado === "pendiente").length;
  const criticos = reportesValidos.filter(r => r?.severidad === "critica").length;
  const resueltos = reportesValidos.filter(r => r?.estado === "resuelto").length;
  
  return {
    total,
    pendientes,
    criticos,
    resueltos,
    porcentajePendientes: Math.round((pendientes / total) * 100),
    porcentajeCriticos: Math.round((criticos / total) * 100),
    porcentajeResueltos: Math.round((resueltos / total) * 100)
  };
};