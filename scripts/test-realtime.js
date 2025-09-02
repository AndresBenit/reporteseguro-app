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
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🧪 TESTING REAL-TIME UPDATES');
console.log('=============================\n');

async function testRealtimeUpdates() {
  console.log('🔄 Configurando suscripción en tiempo real...');
  
  // Configurar suscripción
  const subscription = supabase
    .channel('public:reportes')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'reportes' 
    }, (payload) => {
      console.log('\n📡 EVENTO EN TIEMPO REAL RECIBIDO:');
      console.log(`   Tipo: ${payload.eventType}`);
      console.log(`   Tabla: ${payload.table}`);
      
      if (payload.new) {
        console.log(`   Nuevo estado: ${payload.new.estado}`);
        console.log(`   ID: ${payload.new.id}`);
      }
      
      if (payload.old) {
        console.log(`   Estado anterior: ${payload.old.estado}`);
      }
    })
    .subscribe();

  console.log('✅ Suscripción configurada');
  console.log('\n🔄 Esperando 3 segundos para establecer conexión...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // Obtener un reporte para probar
    const { data: reportes } = await supabase
      .from('reportes')
      .select('*')
      .limit(1);
      
    if (!reportes || reportes.length === 0) {
      console.log('⚠️  No hay reportes para probar');
      return;
    }
    
    const reporte = reportes[0];
    console.log(`\n📋 Probando con reporte ID: ${reporte.id}`);
    console.log(`   Estado actual: ${reporte.estado}`);
    
    // Cambiar estado
    const nuevoEstado = reporte.estado === 'pendiente' ? 'en_proceso' : 'pendiente';
    console.log(`\n🔄 Cambiando estado a: ${nuevoEstado}`);
    
    const { error } = await supabase
      .from('reportes')
      .update({ estado: nuevoEstado })
      .eq('id', reporte.id);
      
    if (error) {
      console.error('❌ Error actualizando:', error.message);
      return;
    }
    
    console.log('✅ Update enviado a Supabase');
    console.log('\n⏳ Esperando evento en tiempo real...');
    
    // Esperar para ver el evento
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Revertir
    console.log(`\n🔄 Revirtiendo estado a: ${reporte.estado}`);
    await supabase
      .from('reportes')
      .update({ estado: reporte.estado })
      .eq('id', reporte.id);
      
    console.log('✅ Estado revertido');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
  } finally {
    console.log('\n🔌 Cerrando suscripción...');
    subscription.unsubscribe();
    console.log('✅ Test completado');
  }
}

testRealtimeUpdates().catch(console.error);