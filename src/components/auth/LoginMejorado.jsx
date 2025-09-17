import React, { useState, useEffect } from "react";
import { authHelpers } from "../../services/supabase";
import { Icon } from "../common/Icons";
import logotipo from "../../assets/images/Logotipo.png";

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
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white backdrop-blur-lg bg-opacity-95 rounded-2xl shadow-2xl border border-white/20 p-8 space-y-6 animate-fade-in">

          {/* Header with Logo */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src={logotipo}
                  alt="AuditSafe"
                  className="h-16 w-auto object-contain animate-float"
                />
                <div className="absolute inset-0 bg-blue-600/20 rounded-lg blur-xl animate-pulse"></div>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent">
                AuditSafe
              </h1>
              <p className="text-gray-600 font-medium">
                {isMobile ? 'Plataforma de Auditoría' : 'Sistema Profesional de Gestión y Auditoría'}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 animate-shake">
              <Icon name="AlertCircle" size={20} className="text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    placeholder="usuario@empresa.com"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                    required
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Icon name="Mail" size={20} className="text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                    required
                    autoComplete="current-password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Icon name="Lock" size={20} className="text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-slate-700 to-blue-700 hover:from-slate-800 hover:to-blue-800 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <Icon name="LogIn" size={20} />
                  <span>Acceder al Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Features Section */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-4 border border-slate-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <Icon name="Shield" size={16} className="text-blue-600" />
              <span>Características de la Plataforma</span>
            </h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                <span>Gestión centralizada de auditorías</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                <span>Dashboard ejecutivo en tiempo real</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                <span>Seguimiento completo de hallazgos</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                <span>Interfaz optimizada para móviles</span>
              </li>
              {!isMobile && (
                <li className="flex items-center space-x-2">
                  <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                  <span>Cumplimiento de estándares corporativos</span>
                </li>
              )}
            </ul>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200 space-y-2">
            <p className="text-sm font-semibold text-gray-600 flex items-center justify-center space-x-2">
              <Icon name="Lock" size={14} className="text-gray-500" />
              <span>Acceso autorizado únicamente</span>
            </p>
            <p className="text-xs text-gray-500">
              Sistema privado • Contacta al administrador
            </p>
          </div>
        </div>

        {/* Version info */}
        <div className="text-center mt-6">
          <p className="text-white/70 text-xs">
            AuditSafe Enterprise v2.0 • Powered by Supabase
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
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
            transform: translateY(-8px);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LoginMejorado;