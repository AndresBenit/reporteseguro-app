import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el state para mostrar la UI de error
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log del error para debugging
    console.error('🚨 ErrorBoundary capturó un error:', error);
    console.error('📍 Información del error:', errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          background: '#fef2f2',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          margin: '20px',
          fontFamily: 'monospace'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '20px' }}>
            🚨 Error Detectado en el Componente
          </h2>
          
          <div style={{ background: '#fff1f2', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <h3 style={{ color: '#991b1b', margin: '0 0 10px 0' }}>Error:</h3>
            <pre style={{ color: '#7f1d1d', fontSize: '14px', overflowX: 'auto' }}>
              {this.state.error && this.state.error.toString()}
            </pre>
          </div>

          <div style={{ background: '#fff1f2', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <h3 style={{ color: '#991b1b', margin: '0 0 10px 0' }}>Stack Trace:</h3>
            <pre style={{ color: '#7f1d1d', fontSize: '12px', overflowX: 'auto' }}>
              {this.state.errorInfo.componentStack}
            </pre>
          </div>

          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🔄 Recargar Página
          </button>
          
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '10px 20px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginLeft: '10px'
            }}
          >
            ← Volver Atrás
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;