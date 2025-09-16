import React from 'react';
import { Icon } from './Icons';

export const FormContainer = ({ children, className = "" }) => (
  <div className={`max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-enterprise border border-gray-100 ${className}`}>
    {children}
  </div>
);

export const FormHeader = ({ title, onBack, icon, subtitle }) => (
  <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
    <div className="flex items-center gap-4">
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          type="button"
        >
          ← Volver
        </button>
      )}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          {icon} {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-2">{subtitle}</p>
        )}
      </div>
    </div>
  </div>
);

export const FormSection = ({ title, children, className = "" }) => (
  <div className={`mb-8 ${className}`}>
    {title && (
      <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-100">
        {title}
      </h3>
    )}
    {children}
  </div>
);

export const FormRow = ({ children, columns = 1 }) => {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
  }[columns];

  return (
    <div className={`grid gap-6 ${gridClass}`}>
      {children}
    </div>
  );
};

export const FormField = ({ label, children, required = false, error, help }) => (
  <div className="mb-6">
    <label className="block text-sm font-semibold text-gray-800 mb-3">
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {error && (
      <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
        <span className="w-4 h-4 text-red-500">⚠</span>
        {error}
      </p>
    )}
    {help && !error && (
      <p className="mt-2 text-sm text-gray-500">{help}</p>
    )}
  </div>
);

export const FormInput = ({ error, ...props }) => (
  <input
    className={`w-full px-4 py-3.5 border rounded-lg text-gray-900 placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
      error
        ? 'border-red-300 bg-red-50'
        : 'border-gray-300 hover:border-gray-400 focus:border-primary-500'
    }`}
    {...props}
  />
);

export const FormSelect = ({ options = [], placeholder = "Seleccionar...", error, ...props }) => (
  <select
    className={`w-full px-4 py-3.5 border rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
      error
        ? 'border-red-300 bg-red-50'
        : 'border-gray-300 hover:border-gray-400 focus:border-primary-500'
    }`}
    {...props}
  >
    <option value="">{placeholder}</option>
    {options.map((opt, index) => (
      <option key={index} value={typeof opt === 'object' ? opt.value : opt}>
        {typeof opt === 'object' ? opt.label : opt}
      </option>
    ))}
  </select>
);

export const FormTextarea = ({ error, rows = 4, ...props }) => (
  <textarea
    className={`w-full px-4 py-3.5 border rounded-lg text-gray-900 placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-vertical min-h-[120px] ${
      error
        ? 'border-red-300 bg-red-50'
        : 'border-gray-300 hover:border-gray-400 focus:border-primary-500'
    }`}
    rows={rows}
    {...props}
  />
);

export const FormButton = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  className = "",
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 shadow-sm",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-800 focus:ring-gray-500 border border-gray-300",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 shadow-sm",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm",
    outline: "border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500"
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-6 py-3.5 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
      )}
      {children}
    </button>
  );
};

export const FormButtonGroup = ({ children, align = 'right', className = "" }) => {
  const alignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between'
  }[align];

  return (
    <div className={`flex flex-wrap gap-4 mt-10 pt-6 border-t border-gray-200 ${alignClass} ${className}`}>
      {children}
    </div>
  );
};

export const FormMessage = ({ type = 'info', message, onClose }) => {
  if (!message) return null;

  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${typeStyles[type]} mb-6`}>
      <div className="flex items-center gap-3">
        <span className="text-lg">{icons[type]}</span>
        <span className="font-semibold">{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-current hover:opacity-70 font-bold text-lg">
          ×
        </button>
      )}
    </div>
  );
};

export const FormCard = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
    {title && (
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">
          {title}
        </h3>
      </div>
    )}
    <div className="p-6">
      {children}
    </div>
  </div>
);

export const SeverityBadge = ({ severity }) => {
  const styles = {
    baja: 'bg-green-100 text-green-800 border-green-200',
    media: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    alta: 'bg-red-100 text-red-800 border-red-200',
    critica: 'bg-red-200 text-red-900 border-red-300'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${styles[severity] || styles.media}`}>
      {severity?.charAt(0).toUpperCase() + severity?.slice(1) || 'Media'}
    </span>
  );
};