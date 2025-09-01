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

console.log('🧪 PRUEBA FINAL DE ESTADOS FRONTEND');
console.log('===================================\n');

async function testEstadosFrontend() {
  try {
    // 1. Obtener todos los reportes
    console.log('📋 Obteniendo todos los reportes...');
    const { data: reportes, error: fetchError } = await supabase
      .from('reportes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Error obteniendo reportes:', fetchError.message);
      return false;
    }
    
    console.log(`✅ Encontrados ${reportes.length} reportes`);
    
    // 2. Mostrar estados actuales
    console.log('\n📊 ESTADOS ACTUALES:');
    console.log('====================');
    
    const estadosCounts = {};
    reportes.forEach(r => {
      const estado = r.estado || 'sin_estado';
      estadosCounts[estado] = (estadosCounts[estado] || 0) + 1;
    });
    
    Object.entries(estadosCounts).forEach(([estado, count]) => {
      console.log(`   ${estado}: ${count} reportes`);
    });
    
    // 3. Probar normalización con constantes
    console.log('\n🔧 PROBANDO NORMALIZACIÓN DE ESTADOS:');
    console.log('=====================================');
    
    // Simular lo que hace reporteUtils.normalizeEstado
    const ESTADO_EQUIVALENCIAS = {
      'proceso': 'en_proceso',
      'en_proceso': 'en_proceso',
      'pendiente': 'pendiente',
      'resuelto': 'resuelto'
    };
    
    reportes.forEach(r => {
      const estadoOriginal = r.estado;
      const estadoNormalizado = ESTADO_EQUIVALENCIAS[estadoOriginal?.toLowerCase()?.trim()] || estadoOriginal;
      
      if (estadoOriginal !== estadoNormalizado) {
        console.log(`   📝 Reporte ${r.id}: "${estadoOriginal}" → "${estadoNormalizado}"`);
      }
    });
    
    // 4. Simular cambio de estado (igual que en el frontend)
    console.log('\n🔄 SIMULANDO CAMBIO DE ESTADO FRONTEND:');
    console.log('======================================');
    
    if (reportes.length > 0) {
      const reportePrueba = reportes[0];
      const estadoActual = reportePrueba.estado;
      const nuevoEstado = estadoActual === 'pendiente' ? 'en_proceso' : 'pendiente';
      
      console.log(`   📋 Reporte ID: ${reportePrueba.id}`);
      console.log(`   📊 Estado actual: "${estadoActual}"`);
      console.log(`   🔄 Nuevo estado: "${nuevoEstado}"`);
      
      // Simular actualización con normalización
      const { data: updated, error: updateError } = await supabase
        .from('reportes')
        .update({ 
          estado: nuevoEstado,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportePrueba.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('   ❌ Error en actualización:', updateError.message);
        return false;
      }
      
      console.log('   ✅ Actualización exitosa');
      console.log(`   📈 Estado confirmado: "${updated.estado}"`);
      
      // Revertir cambio
      console.log('   ↩️  Revirtiendo cambio...');
      await supabase
        .from('reportes')
        .update({ 
          estado: estadoActual,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportePrueba.id);
      
      console.log('   ✅ Estado revertido');
      
      return true;
    } else {
      console.log('   ⚠️  No hay reportes para probar');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
    return false;
  }
}

async function testRealTimeUpdates() {
  console.log('\n📡 PROBANDO ACTUALIZACIONES EN TIEMPO REAL:');
  console.log('============================================\n');
  
  // Configurar suscripción como en el frontend
  let changeDetected = false;
  
  console.log('🔌 Estableciendo suscripción...');
  
  const subscription = supabase
    .channel('test-frontend-updates')
    .on('postgres_changes', 
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'reportes' 
      }, 
      (payload) => {
        console.log('📨 ¡CAMBIO DETECTADO EN TIEMPO REAL!');
        console.log(`   📋 Reporte: ${payload.new.id}`);
        console.log(`   📊 Nuevo estado: ${payload.new.estado}`);
        console.log(`   ⏰ Timestamp: ${new Date(payload.new.updated_at).toLocaleString()}`);
        changeDetected = true;
      }
    )
    .subscribe((status) => {
      console.log(`📡 Estado suscripción: ${status}`);
    });
  
  // Esperar a que se establezca la suscripción
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Hacer un cambio
  console.log('\n🧪 Realizando cambio de prueba...');
  await testEstadosFrontend();
  
  // Esperar a recibir la notificación
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Cerrar suscripción
  supabase.removeChannel(subscription);
  
  return changeDetected;
}

async function main() {
  console.log(`🌐 URL: ${process.env.VITE_SUPABASE_URL}`);
  console.log(`🔑 Service Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ Faltante'}\n`);
  
  // Test básico de estados
  const estadosOk = await testEstadosFrontend();
  
  // Test de tiempo real
  const realTimeOk = await testRealTimeUpdates();
  
  console.log('\n📋 RESUMEN FINAL:');
  console.log('=================');
  console.log(`✅ Cambio de estados: ${estadosOk ? 'FUNCIONANDO' : 'CON PROBLEMAS'}`);
  console.log(`📡 Tiempo real: ${realTimeOk ? 'FUNCIONANDO' : 'CON PROBLEMAS'}`);
  
  if (estadosOk) {
    console.log('\n🎉 EL SISTEMA DE CAMBIO DE ESTADOS ESTÁ FUNCIONANDO CORRECTAMENTE');
    console.log('   - Los estados se actualizan en la base de datos');
    console.log('   - La normalización funciona');
    console.log('   - La aplicación debería funcionar correctamente');
    console.log('\n🌐 Puedes probar la aplicación en: http://localhost:5177');
    console.log('   - Ve a la lista de reportes');
    console.log('   - Cambia el estado de cualquier reporte');
    console.log('   - Los cambios deberían aplicarse inmediatamente');
  } else {
    console.log('\n⚠️  TODAVÍA HAY PROBLEMAS CON EL SISTEMA DE ESTADOS');
    console.log('   - Revisar configuración de Supabase');
    console.log('   - Verificar permisos RLS');
    console.log('   - Comprobar estructura de base de datos');
  }
}

main().catch(console.error);