import React from 'react';

const BannerMejoras = () => {
  return (
    <div className="banner-mejoras" style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
      maxWidth: '350px',
      zIndex: 1001,
      animation: 'slideInUp 0.5s ease',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <div style={{ fontSize: '1.5rem' }}>🎉</div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>
            ¡Sistema Mejorado!
          </h4>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', opacity: 0.9 }}>
            Ahora puedes cambiar estados de reportes directamente desde el historial
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => window.location.href = '/reportes/historial-mejorado'}
              style={{
                padding: '6px 12px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}
            >
              ✨ Ver Ahora
            </button>
            <button
              onClick={(e) => e.target.closest('.banner-mejoras')?.remove()}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
        <button
          onClick={(e) => e.target.closest('.banner-mejoras')?.remove()}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '1.2rem',
            lineHeight: 1
          }}
        >
          ×
        </button>
      </div>
      
      <style>{`
        @keyframes slideInUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .banner-mejoras:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
};

export default BannerMejoras;