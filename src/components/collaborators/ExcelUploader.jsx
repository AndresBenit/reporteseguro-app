import React, { useState } from 'react';
import { supabase, dbHelpers } from '../../services/supabase';

const ExcelUploader = ({ onUploadComplete, onClose }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [mensaje, setMensaje] = useState('');

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().includes('.xlsx') && !selectedFile.name.toLowerCase().includes('.xls')) {
      setMensaje('❌ Por favor selecciona un archivo Excel (.xlsx o .xls)');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }

    setFile(selectedFile);
    
    try {
      // Leer y previsualizar el Excel
      const data = await selectedFile.arrayBuffer();
      
      // Usaremos la API del navegador para leer Excel
      const workbook = await import('xlsx').then(XLSX => XLSX.read(data, { type: 'array' }));
      
      const sheetsData = {};
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = import('xlsx').then(XLSX => XLSX.utils.sheet_to_json(worksheet, { header: 1 }));
        sheetsData[sheetName] = jsonData;
      });

      setPreview(sheetsData);
      setMensaje(`✅ Excel cargado: ${workbook.SheetNames.length} hoja(s) encontrada(s)`);
    } catch (error) {
      console.error('Error leyendo Excel:', error);
      setMensaje('❌ Error leyendo el archivo Excel');
    }
  };

  const processExcelAndMigrate = async () => {
    if (!file) return;

    setUploading(true);
    setMensaje('📊 Procesando Excel y migrando datos...');

    try {
      // Leer el archivo Excel usando SheetJS
      const data = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(data, { type: 'array' });
      
      let totalMigrados = 0;
      let yaExisten = 0;
      let errores = 0;
      
      const colaboradoresRef = collection(db, 'colaboradores');

      // Procesar cada hoja del Excel
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Determinar el área basada en el nombre de la hoja
        let area = 'Centro Industrial';
        const sheetLower = sheetName.toLowerCase();
        if (sheetLower.includes('hornos') || 
            sheetLower.includes('solera') ||
            sheetLower.includes('horno') ||
            sheetLower.includes('hs')) {
          area = 'Hornos Solera';
        } else if (sheetLower.includes('centro') || 
                   sheetLower.includes('industrial') ||
                   sheetLower.includes('ci')) {
          area = 'Centro Industrial';
        }
        
        setMensaje(`📋 Procesando hoja: ${sheetName} (${area})...`);
        
        // Buscar las columnas de nombre y cédula
        let nombreCol = -1;
        let cedulaCol = -1;
        let headerRow = -1;
        
        // Buscar la fila de encabezados (más flexible)
        for (let i = 0; i < Math.min(10, jsonData.length); i++) {
          const row = jsonData[i];
          if (Array.isArray(row)) {
            for (let j = 0; j < row.length; j++) {
              const cell = String(row[j] || '').toLowerCase().trim();
              if ((cell.includes('nombre') || cell.includes('empleado') || cell.includes('trabajador')) && nombreCol === -1) {
                nombreCol = j;
                headerRow = i;
              }
              if ((cell.includes('cedula') || cell.includes('cédula') || cell.includes('documento') || cell.includes('cc') || cell.includes('identificacion')) && cedulaCol === -1) {
                cedulaCol = j;
                headerRow = i;
              }
            }
          }
        }
        
        if (nombreCol === -1 || cedulaCol === -1) {
          console.warn(`No se encontraron columnas de nombre/cédula en la hoja: ${sheetName}`);
          continue;
        }
        
        // Procesar datos desde la fila siguiente a los encabezados
        for (let i = headerRow + 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!Array.isArray(row) || row.length === 0) continue;
          
          const nombre = String(row[nombreCol] || '').trim();
          let cedula = String(row[cedulaCol] || '').trim();
          
          // Limpiar formato de cédula (quitar puntos, comas, espacios)
          cedula = cedula.replace(/[^0-9]/g, '');
          
          if (!nombre || !cedula || cedula.length < 6) continue;
          
          try {
            // Verificar si ya existe
            const q = query(colaboradoresRef, where("cedula", "==", cedula));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
              await addDoc(colaboradoresRef, {
                nombre: nombre,
                cedula: cedula,
                area: area,
                departamento: area,
                activo: true,
                fechaCreacion: new Date(),
                fechaActualizacion: new Date(),
                tipoColaborador: 'Operativo',
                fuenteDatos: 'Excel Upload',
                hojaExcel: sheetName,
                procesadoPor: 'Sistema',
                version: '2.0'
              });
              totalMigrados++;
            } else {
              yaExisten++;
            }
          } catch (error) {
            errores++;
            console.error(`Error con ${nombre}:`, error);
          }
        }
      }
      
      const resultado = {
        migrados: totalMigrados,
        yaExisten,
        errores,
        total: totalMigrados + yaExisten
      };
      
      setMensaje(
        `✅ Migración completada:\n` +
        `• ${resultado.migrados} colaboradores migrados\n` +
        `• ${resultado.yaExisten} ya existían\n` +
        `• ${resultado.errores} errores\n` +
        `• Total procesados: ${resultado.total}`
      );
      
      if (onUploadComplete) {
        onUploadComplete(resultado);
      }
      
      setTimeout(() => {
        onClose();
      }, 3000);
      
    } catch (error) {
      console.error('Error en migración:', error);
      setMensaje(`❌ Error procesando Excel: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <h2 style={{ 
          fontSize: '1.8rem',
          marginBottom: '20px',
          color: '#1f2937',
          textAlign: 'center'
        }}>
          📊 Subir Excel de Colaboradores
        </h2>
        
        <p style={{ 
          color: '#6b7280',
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          Sube tu archivo Excel con colaboradores de Centro Industrial y Hornos Solera
        </p>

        {mensaje && (
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: mensaje.includes('✅') ? '#d1fae5' : mensaje.includes('❌') ? '#fef2f2' : '#f0f9ff',
            color: mensaje.includes('✅') ? '#065f46' : mensaje.includes('❌') ? '#991b1b' : '#1e40af',
            border: `1px solid ${mensaje.includes('✅') ? '#a7f3d0' : mensaje.includes('❌') ? '#fecaca' : '#93c5fd'}`,
            marginBottom: '20px',
            whiteSpace: 'pre-line',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            {mensaje}
          </div>
        )}
        
        {!file ? (
          <div style={{
            border: '2px dashed #d1d5db',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            background: '#f9fafb'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px', opacity: 0.5 }}>📋</div>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="excel-upload"
            />
            <label
              htmlFor="excel-upload"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: '#3b82f6',
                color: 'white',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                border: 'none',
                fontSize: '1rem'
              }}
            >
              📋 Seleccionar Excel
            </label>
            <p style={{ marginTop: '15px', color: '#6b7280', fontSize: '0.9rem' }}>
              Formatos soportados: .xlsx, .xls<br/>
              <strong>Estructura esperada:</strong> Columnas "Nombre" y "Cédula"<br/>
              <strong>Hojas:</strong> Una para Centro Industrial, otra para Hornos Solera
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              background: '#f0f9ff',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #93c5fd',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: '#1e40af', marginBottom: '10px' }}>
                📋 {file.name}
              </h3>
              <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                Tamaño: {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={processExcelAndMigrate}
                disabled={uploading}
                style={{
                  padding: '12px 24px',
                  background: uploading ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem'
                }}
              >
                {uploading ? (
                  <>⏳ Procesando...</>
                ) : (
                  <>🚀 Migrar Colaboradores</>
                )}
              </button>
              
              <button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setMensaje('');
                }}
                disabled={uploading}
                style={{
                  padding: '12px 24px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem'
                }}
              >
                🔄 Cambiar Archivo
              </button>
            </div>
          </div>
        )}
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          marginTop: '30px'
        }}>
          <button
            onClick={onClose}
            disabled={uploading}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              cursor: uploading ? 'not-allowed' : 'pointer'
            }}
          >
            ❌ Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelUploader;