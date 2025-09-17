// Script para actualizar abordajes existentes de "completado" a "pendiente"
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAbordajesEstado() {
  try {
    console.log('🔄 Actualizando estado de abordajes de "completado" a "pendiente"...');

    const { data, error } = await supabase
      .from('abordajes_campo')
      .update({ estado: 'pendiente' })
      .eq('estado', 'completado');

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Abordajes actualizados exitosamente:', data);
    console.log('📊 Total de registros actualizados:', data?.length || 0);

  } catch (error) {
    console.error('❌ Error ejecutando script:', error);
  }
}

// Ejecutar el script
updateAbordajesEstado();