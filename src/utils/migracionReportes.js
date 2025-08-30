import { dbHelpers, supabase } from '../services/supabase';

/**
 * Script para migrar reportes existentes al nuevo formato con historial de estados
 */
export const migrarReportesANuevoFormato = async () => {
  console.log('🔄 Iniciando migración de reportes...');
  
  try {
    // Obtener todos los reportes
    const reportes = await dbHelpers.getAll('reportes');
    
    console.log(`📊 Encontrados ${reportes.length} reportes para migrar`);
    
    let migrados = 0;
    let errores = 0;
    
    for (const reporte of reportes) {
      try {
        // Verificar si ya tiene historial
        if (reporte.historialEstados) {
          console.log(`⏭️ Reporte ${reporte.id} ya tiene historial, saltando...`);
          continue;
        }
        
        // Crear historial inicial basado en el estado actual
        const ahora = new Date().toISOString();
        const estadoActual = reporte.estado || 'pendiente';
        
        const historialInicial = {
          [Date.now().toString()]: {
            estado: estadoActual,
            fecha: reporte.fecha || ahora,
            comentario: 'Estado inicial (migración automática)',
            usuario: 'Sistema',
            asignadoA: reporte.asignadoA || null,
            prioridad: reporte.prioridad || null
          }
        };
        
        // Actualizar reporte con nueva estructura
        const updateData = {
          historialEstados: historialInicial,
          fechaUltimaActualizacion: ahora
        };
        
        // Solo agregar campos si no existen
        if (!reporte.asignadoA) updateData.asignadoA = null;
        if (!reporte.prioridad) updateData.prioridad = null;
        if (!reporte.fechaEstimada) updateData.fechaEstimada = null;
        
        await dbHelpers.update('reportes', reporte.id, updateData);
        
        migrados++;
        console.log(`✅ Reporte ${reporte.id} migrado exitosamente`);
        
      } catch (error) {
        errores++;
        console.error(`❌ Error migrando reporte ${reporte.id}:`, error);
      }
    }
    
    console.log(`\n🎉 Migración completada:`);
    console.log(`✅ Migrados: ${migrados}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`⏭️ Saltados: ${reportes.length - migrados - errores}`);
    
    return {
      total: reportes.length,
      migrados,
      errores,
      saltados: reportes.length - migrados - errores
    };
    
  } catch (error) {
    console.error('💥 Error en la migración:', error);
    throw error;
  }
};

/**
 * Script para limpiar datos de prueba o resetear historial
 */
export const limpiarHistorialReportes = async () => {
  console.log('🧹 Limpiando historial de reportes...');
  
  try {
    const reportes = await dbHelpers.getAll('reportes');
    
    let limpiados = 0;
    
    for (const reporte of reportes) {
      try {
        await dbHelpers.update('reportes', reporte.id, {
          historialEstados: null,
          fechaUltimaActualizacion: null,
          asignadoA: null,
          prioridad: null,
          fechaEstimada: null
        });
        
        limpiados++;
        console.log(`🧹 Reporte ${reporte.id} limpiado`);
        
      } catch (error) {
        console.error(`❌ Error limpiando reporte ${reporte.id}:`, error);
      }
    }
    
    console.log(`✅ ${limpiados} reportes limpiados`);
    return limpiados;
    
  } catch (error) {
    console.error('💥 Error en la limpieza:', error);
    throw error;
  }
};

/**
 * Verificar integridad de datos después de la migración
 */
export const verificarIntegridadDatos = async () => {
  console.log('🔍 Verificando integridad de datos...');
  
  try {
    const reportes = await dbHelpers.getAll('reportes');
    
    const estadisticas = {
      total: reportes.length,
      conHistorial: 0,
      sinHistorial: 0,
      conAsignacion: 0,
      conPrioridad: 0,
      estadosInvalidos: 0
    };
    
    const estadosValidos = [
      'pendiente', 'asignado', 'en_proceso', 'pausado', 
      'en_revision', 'requiere_informacion', 'resuelto', 
      'cerrado', 'descartado'
    ];
    
    for (const reporte of reportes) {
      // Verificar historial
      if (reporte.historialEstados) {
        estadisticas.conHistorial++;
      } else {
        estadisticas.sinHistorial++;
      }
      
      // Verificar asignación
      if (reporte.asignadoA) {
        estadisticas.conAsignacion++;
      }
      
      // Verificar prioridad
      if (reporte.prioridad) {
        estadisticas.conPrioridad++;
      }
      
      // Verificar estado válido
      if (!estadosValidos.includes(reporte.estado)) {
        estadisticas.estadosInvalidos++;
        console.warn(`⚠️ Estado inválido en reporte ${reporte.id}: ${reporte.estado}`);
      }
    }
    
    console.log('\n📊 Estadísticas de integridad:');
    console.log(`📝 Total de reportes: ${estadisticas.total}`);
    console.log(`✅ Con historial: ${estadisticas.conHistorial}`);
    console.log(`❌ Sin historial: ${estadisticas.sinHistorial}`);
    console.log(`👤 Con asignación: ${estadisticas.conAsignacion}`);
    console.log(`🎯 Con prioridad: ${estadisticas.conPrioridad}`);
    console.log(`⚠️ Estados inválidos: ${estadisticas.estadosInvalidos}`);
    
    return estadisticas;
    
  } catch (error) {
    console.error('💥 Error verificando integridad:', error);
    throw error;
  }
};