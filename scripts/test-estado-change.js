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

console.log('🧪 PROBANDO CAMBIO DE ESTADOS EN REPORTES');
console.log('==========================================\n');

async function testEstadoChange() {
  try {
    // 1. Obtener un reporte para probar
    console.log('📋 Obteniendo reporte de prueba...');
    const { data: reportes, error: fetchError } = await supabase
      .from('reportes')
      .select('*')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Error obteniendo reportes:', fetchError.message);
      return;
    }
    
    if (!reportes || reportes.length === 0) {
      console.log('⚠️  No hay reportes para probar');
      return;
    }
    
    const reporte = reportes[0];
    console.log(`✅ Reporte obtenido: ID ${reporte.id}`);
    console.log(`   Estado actual: "${reporte.estado}"`);
    console.log(`   Descripción: "${reporte.descripcion?.substring(0, 50)}..."`);
    
    // 2. Cambiar estado a "proceso"
    const nuevoEstado = reporte.estado === 'pendiente' ? 'proceso' : 'pendiente';
    
    console.log(`\n🔄 Cambiando estado a "${nuevoEstado}"...`);
    
    const { data: updated, error: updateError } = await supabase
      .from('reportes')
      .update({ 
        estado: nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq('id', reporte.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error actualizando estado:', updateError.message);
      console.error('   Código:', updateError.code);
      console.error('   Detalles:', updateError.details);
      return;
    }
    
    console.log('✅ Estado actualizado correctamente');
    console.log(`   Estado anterior: "${reporte.estado}"`);
    console.log(`   Estado nuevo: "${updated.estado}"`);
    
    // 3. Verificar que el cambio se guardó
    console.log('\n🔍 Verificando cambio en base de datos...');
    
    const { data: verificacion, error: verifyError } = await supabase
      .from('reportes')
      .select('estado, updated_at')
      .eq('id', reporte.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verificando cambio:', verifyError.message);
      return;
    }
    
    console.log('✅ Verificación completada');
    console.log(`   Estado confirmado: "${verificacion.estado}"`);
    console.log(`   Última actualización: ${new Date(verificacion.updated_at).toLocaleString()}`);
    
    // 4. Revertir el cambio para dejar como estaba
    console.log(`\n↩️  Revirtiendo estado a "${reporte.estado}" para dejar como estaba...`);
    
    const { error: revertError } = await supabase
      .from('reportes')
      .update({ 
        estado: reporte.estado,
        updated_at: new Date().toISOString()
      })
      .eq('id', reporte.id);
    
    if (revertError) {
      console.error('❌ Error revirtiendo:', revertError.message);
    } else {
      console.log('✅ Estado revertido correctamente');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
    return false;
  }
}

async function testRealTimeSubscription() {
  console.log('\n📡 PROBANDO SUSCRIPCIÓN EN TIEMPO REAL');
  console.log('=====================================\n');
  
  console.log('🔄 Iniciando suscripción a cambios de reportes...');
  
  const subscription = supabase
    .channel('test-reportes-changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'reportes' 
      }, 
      (payload) => {
        console.log('📨 Cambio detectado en tiempo real:');
        console.log('   Evento:', payload.eventType);
        console.log('   Tabla:', payload.table);
        if (payload.new) {
          console.log('   Nuevo estado:', payload.new.estado);
        }
        if (payload.old) {
          console.log('   Estado anterior:', payload.old?.estado);
        }
      }
    )
    .subscribe((status) => {
      console.log(`📡 Estado de suscripción: ${status}`);
    });
  
  // Esperar 2 segundos para establecer la suscripción
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  if (subscription) {
    console.log('✅ Suscripción establecida correctamente');
    
    // Hacer un cambio de prueba
    console.log('\n🧪 Haciendo cambio de prueba para activar real-time...');
    await testEstadoChange();
    
    // Esperar un poco más para recibir notificaciones
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Desuscribirse
    await supabase.removeChannel(subscription);
    console.log('🔌 Suscripción cerrada');
  } else {
    console.log('❌ No se pudo establecer la suscripción');
  }
}

async function main() {
  console.log(`🌐 URL: ${process.env.VITE_SUPABASE_URL}`);
  console.log(`🔑 Service Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ Faltante'}\n`);
  
  // Probar cambio de estado básico
  const estadoTestPassed = await testEstadoChange();
  
  if (estadoTestPassed) {
    // Si el test básico pasó, probar real-time
    await testRealTimeSubscription();
  }
  
  console.log('\n📊 CONCLUSIONES:');
  console.log('================');
  if (estadoTestPassed) {
    console.log('✅ El cambio de estados funciona correctamente en la base de datos');
    console.log('🔍 Si hay problemas en el frontend, revisar:');
    console.log('   - Hook useReportes.js');
    console.log('   - Componente ReporteList.jsx');
    console.log('   - Suscripciones en tiempo real');
    console.log('   - Permisos RLS en Supabase');
  } else {
    console.log('❌ Hay problemas con el cambio de estados en la base de datos');
    console.log('🔧 Revisar configuración de Supabase');
  }
}

main().catch(console.error);