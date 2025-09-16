import React, { createContext, useContext, useState, useCallback } from 'react';
import { Icon } from './Icons';

// Context para el sistema de notificaciones
const NotificationContext = createContext();

// Hook para usar las notificaciones
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe ser usado dentro de NotificationProvider');
  }
  return context;
};

// Componente individual de notificación
const NotificationItem = ({ notification, onRemove }) => {
  const getNotificationConfig = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: 'CheckCircle',
          iconColor: 'text-green-500'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: 'AlertCircle',
          iconColor: 'text-red-500'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: 'AlertTriangle',
          iconColor: 'text-yellow-500'
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'Info',
          iconColor: 'text-blue-500'
        };
    }
  };

  const config = getNotificationConfig(notification.type);

  return (
    <div className={`
      ${config.bg} ${config.border} ${config.text}
      border rounded-lg p-4 shadow-lg max-w-md w-full
      transform transition-all duration-300 ease-in-out
      animate-slide-in-right
    `}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          <Icon name={config.icon} size={20} />
        </div>

        <div className="flex-1 min-w-0">
          {notification.title && (
            <h4 className="font-semibold text-sm mb-1 leading-tight">
              {notification.title}
            </h4>
          )}
          <p className="text-sm leading-relaxed">
            {notification.message}
          </p>

          {notification.details && (
            <div className="mt-2 text-xs opacity-75">
              {notification.details}
            </div>
          )}
        </div>

        <button
          onClick={() => onRemove(notification.id)}
          className={`
            flex-shrink-0 p-1 rounded-md transition-colors
            hover:bg-white hover:bg-opacity-50
            ${config.iconColor} hover:${config.iconColor}
          `}
        >
          <Icon name="X" size={16} />
        </button>
      </div>

      {/* Barra de progreso para auto-dismiss */}
      {notification.autoRemove && (
        <div className="mt-3 w-full bg-white bg-opacity-30 rounded-full h-1">
          <div
            className={`h-1 rounded-full transition-all duration-300 ${
              notification.type === 'success' ? 'bg-green-500' :
              notification.type === 'error' ? 'bg-red-500' :
              notification.type === 'warning' ? 'bg-yellow-500' :
              'bg-blue-500'
            }`}
            style={{
              width: '100%',
              animation: `shrink ${notification.duration || 5000}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
};

// Contenedor de notificaciones
const NotificationContainer = ({ notifications, removeNotification }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-h-screen overflow-y-auto">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
};

// Provider del sistema de notificaciones
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info',
      autoRemove: true,
      duration: 5000,
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove si está habilitado
    if (newNotification.autoRemove) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Funciones de conveniencia
  const success = useCallback((message, options = {}) => {
    return addNotification({
      type: 'success',
      message,
      title: 'Operación exitosa',
      ...options
    });
  }, [addNotification]);

  const error = useCallback((message, options = {}) => {
    return addNotification({
      type: 'error',
      message,
      title: 'Error',
      autoRemove: false, // Los errores no se auto-remueven
      ...options
    });
  }, [addNotification]);

  const warning = useCallback((message, options = {}) => {
    return addNotification({
      type: 'warning',
      message,
      title: 'Advertencia',
      ...options
    });
  }, [addNotification]);

  const info = useCallback((message, options = {}) => {
    return addNotification({
      type: 'info',
      message,
      title: 'Información',
      ...options
    });
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />
    </NotificationContext.Provider>
  );
};

// CSS personalizado para las animaciones (debe agregarse al CSS global)
const notificationStyles = `
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out forwards;
}
`;

export { notificationStyles };