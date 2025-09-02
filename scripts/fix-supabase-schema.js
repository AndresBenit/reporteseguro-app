#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

dotenv.config({ path: join(rootDir, '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔧 FIXING SUPABASE SCHEMA ISSUES');
console.log('=================================\n');

async function getCurrentSchema() {
  console.log('📊 Verificando estructura actual de tabla reportes...');
  
  try {
    // Obtener un reporte para ver la estructura actual
    const { data: reportes, error } = await supabase
      .from('reportes')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error obteniendo reportes:', error.message);
      return null;
    }
    
    if (reportes && reportes.length > 0) {
      const sample = reportes[0];
      console.log('📋 Estructura actual encontrada:');
      Object.keys(sample).forEach(field => {
        console.log(`   - ${field}: ${typeof sample[field]}`);
      });
      return Object.keys(sample);
    } else {
      console.log('⚠️  No hay reportes para analizar estructura');
      return [];
    }
  } catch (error) {
    console.error('❌ Error general:', error.message);
    return null;
  }
}

async function addMissingColumns() {
  console.log('\n🔧 Verificando y agregando columnas faltantes...');
  
  const expectedColumns = [
    'fecha_ultima_actualizacion',
    'updated_at',
    'historial_estados',
    'asignado_a',
    'fecha_estimada',
    'prioridad'
  ];
  
  // Obtener estructura actual
  const currentFields = await getCurrentSchema();
  
  if (!currentFields) {
    console.error('❌ No se pudo obtener estructura actual');
    return false;
  }
  
  // Detectar campos faltantes
  const missingFields = expectedColumns.filter(field => !currentFields.includes(field));
  
  if (missingFields.length === 0) {
    console.log('✅ Todos los campos necesarios ya existen');
    return true;
  }
  
  console.log('⚠️  Campos faltantes detectados:', missingFields);
  
  // Intentar agregar campos usando UPDATE (workaround)
  console.log('\n🛠️  Intentando corregir usando UPDATE...');
  
  try {
    // Para cada campo faltante, intentamos hacer un UPDATE que agregue el campo
    const sampleData = {};
    
    if (missingFields.includes('fecha_ultima_actualizacion')) {
      sampleData.fecha_ultima_actualizacion = new Date().toISOString();
    }
    
    if (missingFields.includes('updated_at')) {
      sampleData.updated_at = new Date().toISOString();
    }
    
    if (missingFields.includes('historial_estados')) {
      sampleData.historial_estados = {};
    }
    
    if (missingFields.includes('asignado_a')) {
      sampleData.asignado_a = null;
    }
    
    if (missingFields.includes('fecha_estimada')) {
      sampleData.fecha_estimada = null;
    }
    
    if (missingFields.includes('prioridad')) {
      sampleData.prioridad = 'normal';
    }
    
    // Intentar actualizar el primer reporte para "crear" los campos
    const { data: firstReport } = await supabase
      .from('reportes')
      .select('id')
      .limit(1)
      .single();
    
    if (firstReport) {
      const { error: updateError } = await supabase
        .from('reportes')
        .update(sampleData)
        .eq('id', firstReport.id);
        
      if (updateError) {
        console.error('❌ Error en UPDATE:', updateError.message);
        console.log('\n📝 SQL MANUAL REQUERIDO:');
        console.log('Ejecuta estos comandos en Supabase SQL Editor:');
        console.log('===========================================');
        
        if (missingFields.includes('fecha_ultima_actualizacion')) {
          console.log('ALTER TABLE reportes ADD COLUMN fecha_ultima_actualizacion TIMESTAMPTZ DEFAULT NOW();');
        }
        
        if (missingFields.includes('updated_at')) {
          console.log('ALTER TABLE reportes ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();');
        }
        
        if (missingFields.includes('historial_estados')) {
          console.log('ALTER TABLE reportes ADD COLUMN historial_estados JSONB DEFAULT \'{}\';');
        }
        
        if (missingFields.includes('asignado_a')) {
          console.log('ALTER TABLE reportes ADD COLUMN asignado_a VARCHAR(200);');
        }
        
        if (missingFields.includes('fecha_estimada')) {
          console.log('ALTER TABLE reportes ADD COLUMN fecha_estimada TIMESTAMPTZ;');
        }
        
        if (missingFields.includes('prioridad')) {
          console.log('ALTER TABLE reportes ADD COLUMN prioridad VARCHAR(50) DEFAULT \'normal\';');
        }
        
        return false;
      } else {
        console.log('✅ Campos agregados exitosamente via UPDATE');
        return true;
      }
    }
    
  } catch (error) {
    console.error('❌ Error agregando campos:', error.message);
    return false;
  }
}

async function testStateChange() {
  console.log('\n🧪 Probando cambio de estado...');
  
  try {
    // Obtener un reporte
    const { data: reportes } = await supabase
      .from('reportes')
      .select('*')
      .limit(1);
      
    if (!reportes || reportes.length === 0) {
      console.log('⚠️  No hay reportes para probar');
      return false;
    }
    
    const reporte = reportes[0];
    console.log(`📋 Probando con reporte ID: ${reporte.id}`);
    console.log(`   Estado actual: ${reporte.estado}`);
    
    // Intentar cambio de estado simple
    const nuevoEstado = reporte.estado === 'pendiente' ? 'en_proceso' : 'pendiente';
    
    const updateData = {
      estado: nuevoEstado
    };
    
    // Agregar campos solo si existen
    const currentFields = Object.keys(reporte);
    
    if (currentFields.includes('fecha_ultima_actualizacion')) {
      updateData.fecha_ultima_actualizacion = new Date().toISOString();
    }
    
    if (currentFields.includes('updated_at')) {
      updateData.updated_at = new Date().toISOString();
    }
    
    const { data: updated, error: updateError } = await supabase
      .from('reportes')
      .update(updateData)
      .eq('id', reporte.id)
      .select()
      .single();
      
    if (updateError) {
      console.error('❌ Error en cambio de estado:', updateError.message);
      return false;
    }
    
    console.log('✅ Cambio de estado exitoso');
    console.log(`   Estado anterior: ${reporte.estado}`);
    console.log(`   Estado nuevo: ${updated.estado}`);
    
    // Revertir
    const { error: revertError } = await supabase
      .from('reportes')
      .update({ estado: reporte.estado })
      .eq('id', reporte.id);
      
    if (!revertError) {
      console.log('✅ Estado revertido correctamente');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
    return false;
  }
}

async function main() {
  console.log(`🌐 URL: ${process.env.VITE_SUPABASE_URL}`);
  console.log(`🔑 Service Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ Faltante'}\n`);
  
  // Paso 1: Verificar estructura actual
  const currentSchema = await getCurrentSchema();
  
  if (!currentSchema) {
    console.log('❌ No se pudo verificar la estructura');
    return;
  }
  
  // Paso 2: Agregar campos faltantes
  const schemaFixed = await addMissingColumns();
  
  // Paso 3: Probar cambio de estado
  const stateChangeWorks = await testStateChange();
  
  console.log('\n📊 RESUMEN:');
  console.log('===========');
  console.log(`Estructura verificada: ${currentSchema ? '✅' : '❌'}`);
  console.log(`Esquema corregido: ${schemaFixed ? '✅' : '❌'}`);
  console.log(`Cambio de estado: ${stateChangeWorks ? '✅' : '❌'}`);
  
  if (schemaFixed && stateChangeWorks) {
    console.log('\n🎉 ESQUEMA CORREGIDO - El cambio de estados debería funcionar ahora');
  } else {
    console.log('\n⚠️  INTERVENCIÓN MANUAL REQUERIDA - Revisa los comandos SQL arriba');
  }
}

main().catch(console.error);