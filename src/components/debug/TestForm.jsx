import React from 'react';
import { useNavigate } from 'react-router-dom';

const TestForm = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      background: 'white',
      minHeight: '100vh'
    }}>
      <h1>🧪 Formulario de Prueba</h1>
      <p>Si puedes ver esto, la navegación funciona correctamente.</p>
      
      <div style={{ marginTop: '30px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          ← Volver Atrás
        </button>
      </div>
      
      <div style={{ marginTop: '20px', color: '#666' }}>
        <p>Prueba simple para verificar que la navegación y el renderizado funcionen</p>
      </div>
    </div>
  );
};

export default TestForm;