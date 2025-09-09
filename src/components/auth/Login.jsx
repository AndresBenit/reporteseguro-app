import React, { useState } from "react";
import { authHelpers } from "../../services/supabase";
import { Icon } from "../common/Icons";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      background: "#f8fafc"
    }}>
      <div style={{
        background: "white",
        borderRadius: "20px",
        padding: "40px 35px",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb",
        width: "100%",
        maxWidth: "420px"
      }}>
        {/* Header Enterprise */}
        <div style={{ textAlign: "center", marginBottom: "35px" }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "center", 
            marginBottom: "20px" 
          }}>
            <div style={{
              width: "64px",
              height: "64px",
              background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(30, 64, 175, 0.25)"
            }}>
              <Icon name="Shield" size={32} color="white" />
            </div>
          </div>
          <h1 style={{
            fontSize: "2.2rem",
            fontWeight: "700",
            background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "10px"
          }}>
            ReporteSeguro
          </h1>
          <p style={{ color: "#6b7280", fontSize: "1rem", fontWeight: "500" }}>
            Sistema Profesional de Gestión de Incidencias
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            padding: "12px 18px",
            borderRadius: "10px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: "600",
            fontSize: "0.9rem"
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
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
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: "100%",
              fontSize: "1rem",
              marginTop: "10px",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }}
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
        <div style={{
          marginTop: "30px",
          padding: "18px",
          background: "#f8fafc",
          borderRadius: "12px",
          border: "1px solid #e2e8f0"
        }}>
          <h4 style={{ 
            color: "#374151", 
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.95rem"
          }}>
            <Icon name="Info" size={16} />
            Características del Sistema
          </h4>
          <ul style={{ 
            color: "#6b7280", 
            fontSize: "0.85rem",
            lineHeight: "1.5",
            paddingLeft: "18px"
          }}>
            <li>Gestión centralizada de reportes de seguridad</li>
            <li>Dashboard ejecutivo con métricas en tiempo real</li>
            <li>Seguimiento completo del ciclo de vida de incidencias</li>
            <li>Interfaz optimizada para dispositivos móviles</li>
            <li>Cumplimiento de normativas de seguridad industrial</li>
          </ul>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: "center",
          marginTop: "25px",
          padding: "15px",
          borderTop: "1px solid #e5e7eb"
        }}>
          <p style={{ 
            color: "#9ca3af", 
            fontSize: "0.8rem",
            fontWeight: "500"
          }}>
            Acceso autorizado únicamente
          </p>
          <p style={{ 
            color: "#9ca3af", 
            fontSize: "0.75rem",
            marginTop: "5px"
          }}>
            Sistema privado · Contacta al administrador para credenciales
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
