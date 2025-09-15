import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el state para que se muestre la UI de error
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // También puedes registrar el error en un servicio de reporting
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // UI de error personalizada
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          margin: '20px',
          color: '#dc2626'
        }}>
          <h2 style={{ marginBottom: '16px' }}>⚠️ Algo salió mal</h2>
          <p style={{ marginBottom: '16px', color: '#6b7280' }}>
            Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Recargar página
          </button>

          {/* Mostrar detalles del error en desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <details style={{
              marginTop: '20px',
              textAlign: 'left',
              background: '#f9fafb',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: '600' }}>
                Detalles del error (solo en desarrollo)
              </summary>
              <pre style={{
                whiteSpace: 'pre-wrap',
                fontSize: '12px',
                color: '#374151',
                marginTop: '8px',
                overflow: 'auto'
              }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    // Si no hay error, renderiza los children normalmente
    return this.props.children;
  }
}

export default ErrorBoundary;