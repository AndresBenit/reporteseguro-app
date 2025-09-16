// Script para configurar buckets de storage en Supabase
import { supabase } from '../src/services/supabase.js';

const REQUIRED_BUCKETS = [
  {
    name: 'reportes-adjuntos',
    public: true,
    description: 'Archivos adjuntos de reportes'
  },
  {
    name: 'firmas',
    public: true,
    description: 'Firmas digitales de formularios'
  },
  {
    name: 'reportes-fotos',
    public: true,
    description: 'Fotografías de evidencia para reportes'
  },
  {
    name: 'colaboradores-fotos',
    public: false,
    description: 'Fotografías de perfil de colaboradores'
  }
];

async function setupBuckets() {
  console.log('🚀 Iniciando configuración de buckets de storage...\n');

  try {
    // Listar buckets existentes
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      throw new Error(`Error listando buckets: ${listError.message}`);
    }

    console.log(`📊 Buckets existentes: ${existingBuckets.length}`);
    existingBuckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
    });
    console.log('');

    // Crear buckets faltantes
    for (const bucketConfig of REQUIRED_BUCKETS) {
      const exists = existingBuckets.some(b => b.name === bucketConfig.name);

      if (exists) {
        console.log(`✅ Bucket "${bucketConfig.name}" ya existe`);
      } else {
        console.log(`🔨 Creando bucket "${bucketConfig.name}"...`);

        const { data, error } = await supabase.storage.createBucket(bucketConfig.name, {
          public: bucketConfig.public
        });

        if (error) {
          if (error.message.includes('already exists')) {
            console.log(`✅ Bucket "${bucketConfig.name}" ya existía`);
          } else {
            console.error(`❌ Error creando bucket "${bucketConfig.name}": ${error.message}`);
          }
        } else {
          console.log(`✅ Bucket "${bucketConfig.name}" creado exitosamente`);
        }
      }
    }

    console.log('\n🎯 Configuración de buckets completada');

    // Verificar estado final
    const { data: finalBuckets } = await supabase.storage.listBuckets();
    console.log(`\n📊 Estado final: ${finalBuckets.length} buckets disponibles`);

    REQUIRED_BUCKETS.forEach(required => {
      const exists = finalBuckets.some(b => b.name === required.name);
      console.log(`  ${exists ? '✅' : '❌'} ${required.name}`);
    });

  } catch (error) {
    console.error('❌ Error en la configuración:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupBuckets().then(() => {
    console.log('\n🚀 Script completado exitosamente');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Error ejecutando script:', error);
    process.exit(1);
  });
}

export default setupBuckets;