import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { storageHelpers } from '../../services/supabase';

const SignaturePad = ({ 
  onSignatureChange, 
  required = true, 
  label = "Firma Digital", 
  disabled = false,
  initialSignature = null,
  onError = null 
}) => {
  const sigCanvas = useRef({});
  const [isEmpty, setIsEmpty] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState(initialSignature);
  const [error, setError] = useState('');

  // Detectar si es un dispositivo móvil
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  useEffect(() => {
    if (initialSignature) {
      setSignatureUrl(initialSignature);
      setIsEmpty(false);
    }
  }, [initialSignature]);

  // Función para limpiar la firma
  const clearSignature = () => {
    sigCanvas.current.clear();
    setIsEmpty(true);
    setSignatureUrl(null);
    setError('');
    onSignatureChange && onSignatureChange(null);
  };

  // Función para subir firma a Supabase
  const uploadSignature = async (dataURL) => {
    try {
      setIsUploading(true);
      setError('');

      // Convertir dataURL a blob
      const response = await fetch(dataURL);
      const blob = await response.blob();
      
      // Crear nombre único para el archivo
      const timestamp = new Date().getTime();
      const filename = `firma_${timestamp}.png`;
      
      // Crear archivo
      const file = new File([blob], filename, { type: 'image/png' });
      
      // Subir a Supabase Storage
      const uploadResult = await storageHelpers.upload('reportes-firmas', filename, file);
      
      // Obtener URL pública
      const publicUrl = storageHelpers.getPublicUrl('reportes-firmas', filename);
      
      console.log('✅ Firma subida exitosamente:', publicUrl);
      setSignatureUrl(publicUrl);
      
      return publicUrl;
    } catch (error) {
      console.error('❌ Error subiendo firma:', error);
      setError('Error al guardar la firma. Intente nuevamente.');
      onError && onError(error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Función cuando termina de firmar
  const handleEnd = async () => {
    if (sigCanvas.current.isEmpty()) {
      setIsEmpty(true);
      setSignatureUrl(null);
      onSignatureChange && onSignatureChange(null);
      return;
    }

    setIsEmpty(false);
    
    try {
      // Obtener datos de la firma
      const dataURL = sigCanvas.current.toDataURL('image/png');
      
      // Subir automáticamente a Supabase
      const uploadedUrl = await uploadSignature(dataURL);
      
      // Notificar al componente padre
      onSignatureChange && onSignatureChange({
        dataURL: dataURL,
        url: uploadedUrl,
        timestamp: new Date().toISOString(),
        isEmpty: false
      });
      
    } catch (error) {
      console.error('Error procesando firma:', error);
    }
  };

  return (
    <div className="signature-pad-container">
      {/* Label */}
      <div className="signature-label">
        <label className="signature-title">
          {label}
          {required && <span className="required-indicator"> *</span>}
        </label>
        <p className="signature-subtitle">
          {isMobile ? 
            'Firme con su dedo en el área gris de abajo' : 
            'Firme con el mouse o use un dispositivo táctil'
          }
        </p>
      </div>

      {/* Canvas de Firma */}
      <div className="signature-canvas-wrapper">
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{
            width: isMobile ? 350 : 500,
            height: isMobile ? 150 : 200,
            className: 'signature-canvas'
          }}
          backgroundColor="rgba(255,255,255,0.1)"
          onEnd={handleEnd}
          disabled={disabled}
        />
        
        {/* Overlay de estado */}
        {isUploading && (
          <div className="signature-overlay">
            <div className="signature-loading">
              <span>🔄</span>
              <span>Guardando firma...</span>
            </div>
          </div>
        )}
        
        {isEmpty && !isUploading && (
          <div className="signature-placeholder">
            <span className="signature-placeholder-icon">✍️</span>
            <span className="signature-placeholder-text">
              {required ? 'Firma requerida' : 'Toque aquí para firmar'}
            </span>
          </div>
        )}
      </div>

      {/* Botones de control */}
      <div className="signature-controls">
        <button
          type="button"
          onClick={clearSignature}
          className="signature-clear-btn"
          disabled={isEmpty || disabled || isUploading}
        >
          🗑️ Limpiar Firma
        </button>
        
        {!isEmpty && signatureUrl && (
          <div className="signature-status">
            <span className="signature-success">✅ Firma guardada</span>
          </div>
        )}
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="signature-error">
          ⚠️ {error}
        </div>
      )}

      {/* Validación requerida */}
      {required && isEmpty && (
        <div className="signature-validation">
          ⚠️ La firma es obligatoria para enviar el formulario
        </div>
      )}

      <style jsx>{`
        .signature-pad-container {
          margin: 20px 0;
          padding: 20px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: #f8fafc;
          position: relative;
        }

        .signature-label {
          margin-bottom: 15px;
        }

        .signature-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          display: block;
          margin-bottom: 5px;
        }

        .required-indicator {
          color: #ef4444;
          font-weight: bold;
        }

        .signature-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
          font-style: italic;
        }

        .signature-canvas-wrapper {
          position: relative;
          border: 2px dashed #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: ${isMobile ? '150px' : '200px'};
        }

        .signature-canvas {
          cursor: crosshair;
          touch-action: none;
        }

        .signature-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10;
        }

        .signature-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: #3b82f6;
        }

        .signature-placeholder {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #9ca3af;
          pointer-events: none;
        }

        .signature-placeholder-icon {
          font-size: 24px;
        }

        .signature-placeholder-text {
          font-size: 14px;
          text-align: center;
        }

        .signature-controls {
          margin-top: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .signature-clear-btn {
          background: #ef4444;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.2s;
        }

        .signature-clear-btn:hover:not(:disabled) {
          background: #dc2626;
          transform: translateY(-1px);
        }

        .signature-clear-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        .signature-status {
          display: flex;
          align-items: center;
        }

        .signature-success {
          color: #059669;
          font-size: 14px;
          font-weight: 500;
        }

        .signature-error {
          margin-top: 10px;
          padding: 8px 12px;
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          border-radius: 6px;
          font-size: 14px;
        }

        .signature-validation {
          margin-top: 10px;
          padding: 8px 12px;
          background: #fffbeb;
          color: #d97706;
          border: 1px solid #fed7aa;
          border-radius: 6px;
          font-size: 14px;
        }

        /* Estilos móviles */
        @media (max-width: 768px) {
          .signature-pad-container {
            margin: 15px 0;
            padding: 15px;
          }
          
          .signature-canvas-wrapper {
            min-height: 150px;
          }
          
          .signature-controls {
            flex-direction: column;
            align-items: stretch;
          }
          
          .signature-clear-btn {
            justify-content: center;
            padding: 12px;
          }
        }

        /* Estados especiales */
        .signature-pad-container.required.empty {
          border-color: #f97316;
          background: #fffbeb;
        }

        .signature-pad-container.success {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .signature-pad-container.error {
          border-color: #ef4444;
          background: #fef2f2;
        }
      `}</style>
    </div>
  );
};

export default SignaturePad;