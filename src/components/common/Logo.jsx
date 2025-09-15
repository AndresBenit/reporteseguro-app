import React from 'react';
import { Icon } from './Icons';

// Componente Logo con fallback
const Logo = ({ variant = 'main', size = 'md', className = '' }) => {
  // Configuraciones de tamaño
  const sizes = {
    xs: { width: 24, height: 24, text: 'text-sm' },
    sm: { width: 32, height: 32, text: 'text-base' },
    md: { width: 40, height: 40, text: 'text-lg' },
    lg: { width: 56, height: 56, text: 'text-xl' },
    xl: { width: 72, height: 72, text: 'text-2xl' }
  };

  const currentSize = sizes[size] || sizes.md;

  // Cargar logos reales
  const getLogoSrc = () => {
    try {
      if (variant === 'icon') {
        return require('../../assets/images/Isologo.png');
      }
      return require('../../assets/images/Logotipo.png');
    } catch (error) {
      console.log('Logo no encontrado, usando fallback');
      return null;
    }
  };

  const logoSrc = getLogoSrc();

  // Fallback con gradiente empresarial si no hay logo
  if (!logoSrc) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div
          className={`bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center shadow-enterprise`}
          style={{ width: currentSize.width, height: currentSize.height }}
        >
          <Icon name="Shield" size={currentSize.width * 0.6} color="white" />
        </div>
        {variant !== 'icon' && (
          <div>
            <h1 className={`font-bold text-gray-900 ${currentSize.text} leading-tight`}>
              ReporteSeguro
            </h1>
            <p className="text-xs text-gray-500 -mt-1">SST Enterprise</p>
          </div>
        )}
      </div>
    );
  }

  // Logo real
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <img
        src={logoSrc}
        alt="ReporteSeguro"
        className={`object-contain`}
        style={{
          width: variant === 'icon' ? currentSize.width : 'auto',
          height: currentSize.height,
          maxWidth: variant === 'icon' ? currentSize.width : '200px'
        }}
      />
      {variant !== 'icon' && variant === 'with-text' && (
        <div>
          <h1 className={`font-bold text-gray-900 ${currentSize.text} leading-tight`}>
            ReporteSeguro
          </h1>
          <p className="text-xs text-gray-500 -mt-1">SST Enterprise</p>
        </div>
      )}
    </div>
  );
};

export default Logo;