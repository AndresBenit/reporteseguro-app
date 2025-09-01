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

console.log('🔍 VERIFICANDO ESQUEMA DE SUPABASE');
console.log('================================\n');

// Crear cliente Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Usando service role para acceso completo
);

async function verifySchema() {
  try {
    console.log('📊 Verificando tablas existentes...\n');
    
    // 1. Verificar tabla reportes
    console.log('🔍 Tabla: reportes');
    const { data: reportes, error: reportesError } = await supabase
      .from('reportes')
      .select('*')
      .limit(1);
      
    if (reportesError) {
      console.log('❌ Error accediendo a tabla reportes:', reportesError.message);
      
      // Intentar obtener información sobre el error
      if (reportesError.code === 'PGRST116') {
        console.log('   Posible causa: La tabla no existe');
        await createReportesTable();
      }
    } else {
      console.log('✅ Tabla reportes existe');
      console.log(`   Registros de ejemplo: ${reportes?.length || 0}`);
    }
    
    // 2. Verificar tabla colaboradores
    console.log('\n🔍 Tabla: colaboradores');
    const { data: colaboradores, error: colaboradoresError } = await supabase
      .from('colaboradores')
      .select('*')
      .limit(1);
      
    if (colaboradoresError) {
      console.log('❌ Error accediendo a tabla colaboradores:', colaboradoresError.message);
      
      if (colaboradoresError.code === 'PGRST116') {
        console.log('   Posible causa: La tabla no existe');
        await createColaboradoresTable();
      }
    } else {
      console.log('✅ Tabla colaboradores existe');
      console.log(`   Registros de ejemplo: ${colaboradores?.length || 0}`);
    }
    
    // 3. Verificar estructura de reportes si existe
    if (!reportesError && reportes) {
      await verifyReportesStructure();
    }
    
    // 4. Verificar estados actuales en reportes
    await verifyEstados();
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

async function verifyReportesStructure() {
  console.log('\n📋 Verificando estructura de tabla reportes...');
  
  try {
    const { data: sampleReporte } = await supabase
      .from('reportes')
      .select('*')
      .limit(1)
      .single();
      
    if (sampleReporte) {
      console.log('📄 Campos encontrados en reportes:');
      Object.keys(sampleReporte).forEach(field => {
        console.log(`   - ${field}: ${typeof sampleReporte[field]}`);
      });
    }
  } catch (error) {
    console.log('⚠️  No hay datos de muestra para analizar estructura');
  }
}

async function verifyEstados() {
  console.log('\n🏷️  Verificando estados actuales en reportes...');
  
  try {
    const { data: estados } = await supabase
      .from('reportes')
      .select('estado')
      .not('estado', 'is', null);
      
    if (estados && estados.length > 0) {
      const uniqueEstados = [...new Set(estados.map(r => r.estado))];
      console.log('📊 Estados encontrados:');
      uniqueEstados.forEach(estado => {
        const count = estados.filter(r => r.estado === estado).length;
        console.log(`   - "${estado}": ${count} reportes`);
      });
      
      // Verificar si hay inconsistencias
      const standardStates = ['pendiente', 'proceso', 'resuelto', 'asignado', 'en_proceso', 'cerrado'];
      const invalidStates = uniqueEstados.filter(estado => !standardStates.includes(estado));
      
      if (invalidStates.length > 0) {
        console.log('\n⚠️  Estados no estándar encontrados:', invalidStates);
        console.log('   Estos estados necesitan ser estandarizados');
      }
    } else {
      console.log('📝 No hay reportes con estados para analizar');
    }
    
  } catch (error) {
    console.log('❌ Error verificando estados:', error.message);
  }
}

async function createReportesTable() {
  console.log('\n🏗️  Intentando crear tabla reportes...');
  
  // Nota: Para crear tablas necesitaríamos ejecutar SQL directo
  // Por ahora solo reportamos que la tabla no existe
  console.log('   ℹ️  Requerirá creación manual en Supabase Dashboard');
}

async function createColaboradoresTable() {
  console.log('\n🏗️  Intentando crear tabla colaboradores...');
  console.log('   ℹ️  Requerirá creación manual en Supabase Dashboard');
}

async function checkSupabaseConnection() {
  console.log('🔗 Probando conexión a Supabase...');
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('⚠️  Advertencia con conexión:', error.message);
    } else {
      console.log('✅ Conexión a Supabase establecida correctamente');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    return false;
  }
}

// Ejecutar verificación
async function main() {
  console.log(`🌐 URL: ${process.env.VITE_SUPABASE_URL}`);
  console.log(`🔑 Service Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ Faltante'}\n`);
  
  const connected = await checkSupabaseConnection();
  
  if (connected) {
    await verifySchema();
  }
  
  console.log('\n📋 RESUMEN:');
  console.log('==========');
  console.log('1. Revisa los errores encontrados arriba');
  console.log('2. Las tablas faltantes deben crearse en Supabase Dashboard');
  console.log('3. Los estados inconsistentes deben estandarizarse');
  console.log('4. Ejecuta este script después de hacer cambios para verificar\n');
}

main().catch(console.error);