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

console.log('📊 TESTING GRÁFICOS AUTO-UPDATE');
console.log('===============================\n');

async function testGraficosUpdate() {
  try {
    console.log('🔍 1. Obteniendo reportes actuales...');
    const { data: reportes } = await supabase
      .from('reportes')
      .select('*')
      .limit(5);
    
    if (!reportes || reportes.length === 0) {
      console.log('⚠️  No hay reportes para probar');
      return;
    }
    
    console.log(`📋 Encontrados ${reportes.length} reportes`);
    
    // Mostrar distribución actual
    const distribucion = reportes.reduce((acc, r) => {
      acc[r.estado] = (acc[r.estado] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Distribución ANTES del cambio:');
    Object.entries(distribucion).forEach(([estado, count]) => {
      console.log(`   ${estado}: ${count}`);
    });
    
    // Cambiar estados de algunos reportes
    console.log('\n🔄 2. Cambiando estados para probar actualización...');
    
    const cambios = [
      { id: reportes[0].id, estadoAnterior: reportes[0].estado, nuevoEstado: 'en_proceso' },
      { id: reportes[1].id, estadoAnterior: reportes[1].estado, nuevoEstado: 'resuelto' }
    ];
    
    for (const cambio of cambios) {
      console.log(`   📝 Reporte ${cambio.id}: ${cambio.estadoAnterior} → ${cambio.nuevoEstado}`);
      
      const { error } = await supabase
        .from('reportes')
        .update({ estado: cambio.nuevoEstado })
        .eq('id', cambio.id);
        
      if (error) {
        console.error(`   ❌ Error en reporte ${cambio.id}:`, error.message);
      } else {
        console.log(`   ✅ Reporte ${cambio.id} actualizado`);
      }
    }
    
    console.log('\n⏳ 3. Esperando 2 segundos para que se procesen los cambios...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar cambios
    console.log('\n🔍 4. Verificando nueva distribución...');
    const { data: reportesActualizados } = await supabase
      .from('reportes')
      .select('*')
      .limit(5);
    
    const nuevaDistribucion = reportesActualizados.reduce((acc, r) => {
      acc[r.estado] = (acc[r.estado] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Distribución DESPUÉS del cambio:');
    Object.entries(nuevaDistribucion).forEach(([estado, count]) => {
      console.log(`   ${estado}: ${count}`);
    });
    
    // Analizar diferencias
    console.log('\n🔍 5. Análisis de cambios:');
    const estadosAntes = Object.keys(distribucion);
    const estadosDespues = Object.keys(nuevaDistribucion);
    const todosEstados = [...new Set([...estadosAntes, ...estadosDespues])];
    
    let hayCambios = false;
    todosEstados.forEach(estado => {
      const antes = distribucion[estado] || 0;
      const despues = nuevaDistribucion[estado] || 0;
      if (antes !== despues) {
        hayCambios = true;
        const diferencia = despues - antes;
        const simbolo = diferencia > 0 ? '📈' : '📉';
        console.log(`   ${simbolo} ${estado}: ${antes} → ${despues} (${diferencia > 0 ? '+' : ''}${diferencia})`);
      }
    });
    
    if (!hayCambios) {
      console.log('   ⚠️  No se detectaron cambios en la distribución');
    }
    
    console.log('\n🔄 6. Revirtiendo cambios...');
    for (const cambio of cambios) {
      const { error } = await supabase
        .from('reportes')
        .update({ estado: cambio.estadoAnterior })
        .eq('id', cambio.id);
        
      if (!error) {
        console.log(`   ✅ Reporte ${cambio.id} revertido a ${cambio.estadoAnterior}`);
      }
    }
    
    console.log('\n✅ CONCLUSIÓN:');
    if (hayCambios) {
      console.log('   🎉 Los datos SÍ se actualizan en la base de datos');
      console.log('   📊 Los gráficos deberían actualizarse automáticamente');
    } else {
      console.log('   ⚠️  Los cambios no se reflejan correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
  }
}

testGraficosUpdate().catch(console.error);