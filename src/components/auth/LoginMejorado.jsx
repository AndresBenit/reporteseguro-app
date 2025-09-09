import React, { useState, useEffect } from "react";
import { authHelpers } from "../../services/supabase";
import { Icon } from "../common/Icons";

const LoginMejorado = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // Limpiar error al escribir
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.email || !form.password) {
      setError("Por favor completa todos los campos");
      setLoading(false);
      return;
    }

    try {
      await authHelpers.signIn(form.email, form.password);
    } catch (error) {
      console.error("Error de autenticación:", error);
      
      // Mensajes de error más amigables
      const errorMessages = {
        "Invalid login credentials": "Credenciales inválidas",
        "Email not confirmed": "Email no confirmado. Revisa tu bandeja de entrada",
        "Invalid email": "El formato del email no es válido",
        "Too many requests": "Demasiados intentos fallidos. Intenta más tarde"
      };
      
      setError(errorMessages[error.message] || "Error de autenticación. Intenta nuevamente.");
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="logo-animation">
            <div className="logo-shield"><Icon name="Shield" size={32} color="white" /></div>
            <div className="logo-glow"></div>
          </div>
          <h1 className="login-title">
            ReporteSeguro
          </h1>
          <p className="login-subtitle">
            {isMobile ? 'Gestión de Seguridad' : 'Sistema Profesional de Gestión de Incidencias'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mobile-alert error login-error">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="email"
              placeholder="usuario@empresa.com"
              value={form.email}
              onChange={handleChange}
              className="form-input"
              required
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className="form-input"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                Iniciando sesión...
              </>
            ) : (
              <>
                Acceder al Sistema
              </>
            )}
          </button>
        </form>

        {/* Info del sistema */}
        <div className="login-features">
          <h4 className="features-title">
            <Icon name="Info" size={16} />
            Características del Sistema
          </h4>
          <ul className="features-list">
            <li>Gestión centralizada de reportes</li>
            <li>Dashboard ejecutivo en tiempo real</li>
            <li>Seguimiento completo de incidencias</li>
            <li>Interfaz optimizada para móviles</li>
            {!isMobile && <li>Cumplimiento de normativas industriales</li>}
          </ul>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p className="footer-security">
            Acceso autorizado únicamente
          </p>
          <p className="footer-contact">
            Sistema privado · Contacta al administrador
          </p>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: ${isMobile ? '16px' : '20px'};
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
          overflow: hidden;
        }

        .login-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><polygon fill="%23ffffff03" points="0,1000 1000,0 1000,1000"/></svg>');
          background-size: cover;
        }

        .login-card {
          background: white;
          border-radius: ${isMobile ? '16px' : '24px'};
          padding: ${isMobile ? '28px 24px' : '48px 40px'};
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.2);
          width: 100%;
          max-width: ${isMobile ? '340px' : '440px'};
          position: relative;
          z-index: 1;
          backdrop-filter: blur(10px);
          animation: slideUp 0.6s ease;
        }

        .login-header {
          text-align: center;
          margin-bottom: ${isMobile ? '28px' : '40px'};
        }

        .logo-animation {
          position: relative;
          display: inline-block;
          margin-bottom: ${isMobile ? '16px' : '24px'};
        }

        .logo-shield {
          font-size: ${isMobile ? '3rem' : '4rem'};
          position: relative;
          z-index: 2;
          animation: float 3s ease-in-out infinite;
        }

        .logo-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${isMobile ? '60px' : '80px'};
          height: ${isMobile ? '60px' : '80px'};
          background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        .login-title {
          font-size: ${isMobile ? '2rem' : '2.5rem'};
          font-weight: 800;
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: ${isMobile ? '8px' : '12px'};
          letter-spacing: -0.02em;
        }

        .login-subtitle {
          color: #6b7280;
          font-size: ${isMobile ? '0.9rem' : '1rem'};
          font-weight: 500;
          margin: 0;
        }

        .login-error {
          margin-bottom: 20px;
          animation: shake 0.5s ease;
        }

        .login-form {
          margin-bottom: ${isMobile ? '24px' : '32px'};
        }

        .form-group {
          margin-bottom: ${isMobile ? '20px' : '24px'};
        }

        .form-label {
          display: block;
          font-weight: 600;
          font-size: ${isMobile ? '0.9rem' : '0.95rem'};
          color: #374151;
          margin-bottom: 8px;
          padding-left: 4px;
        }

        .form-input {
          width: 100%;
          padding: ${isMobile ? '14px 16px' : '16px 18px'};
          font-size: 16px;
          line-height: 1.4;
          color: #1f2937;
          background-color: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          background-color: #ffffff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          transform: translateY(-1px);
        }

        .login-button {
          width: 100%;
          min-height: ${isMobile ? '52px' : '56px'};
          font-size: ${isMobile ? '1rem' : '1.1rem'};
          font-weight: 700;
          border-radius: 12px;
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          border: none;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
          position: relative;
          overflow: hidden;
        }

        .login-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }

        .login-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(59, 130, 246, 0.4);
        }

        .login-button:hover:not(:disabled)::before {
          left: 100%;
        }

        .login-button:active:not(:disabled) {
          transform: translateY(-1px);
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .login-features {
          padding: ${isMobile ? '16px' : '20px'};
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          margin-bottom: ${isMobile ? '20px' : '28px'};
        }

        .features-title {
          color: #374151;
          margin-bottom: ${isMobile ? '12px' : '16px'};
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: ${isMobile ? '0.9rem' : '1rem'};
          font-weight: 600;
        }

        .features-list {
          color: #6b7280;
          font-size: ${isMobile ? '0.8rem' : '0.85rem'};
          line-height: 1.6;
          padding-left: ${isMobile ? '16px' : '20px'};
          margin: 0;
        }

        .features-list li {
          margin-bottom: ${isMobile ? '4px' : '6px'};
        }

        .login-footer {
          text-align: center;
          padding-top: ${isMobile ? '16px' : '20px'};
          border-top: 1px solid #e5e7eb;
        }

        .footer-security {
          color: #6b7280;
          font-size: ${isMobile ? '0.85rem' : '0.9rem'};
          font-weight: 600;
          margin: 0 0 ${isMobile ? '6px' : '8px'} 0;
        }

        .footer-contact {
          color: #9ca3af;
          font-size: ${isMobile ? '0.75rem' : '0.8rem'};
          margin: 0;
        }

        /* Animaciones */
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.2;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        /* Responsive para pantallas muy pequeñas */
        @media (max-width: 480px) {
          .login-container {
            padding: 12px;
          }

          .login-card {
            padding: 24px 20px;
            border-radius: 12px;
            max-width: none;
          }

          .login-title {
            font-size: 1.8rem;
          }

          .login-subtitle {
            font-size: 0.85rem;
          }

          .form-input {
            padding: 12px 14px;
          }

          .login-button {
            min-height: 48px;
            font-size: 0.95rem;
          }
        }

        /* Mejoras para landscape en móviles */
        @media (max-height: 600px) and (orientation: landscape) {
          .login-container {
            padding: 8px;
          }

          .login-card {
            padding: 20px 24px;
          }

          .login-header {
            margin-bottom: 20px;
          }

          .logo-shield {
            font-size: 2.5rem;
          }

          .login-title {
            font-size: 1.8rem;
          }

          .login-features {
            padding: 12px;
          }

          .features-list {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginMejorado;