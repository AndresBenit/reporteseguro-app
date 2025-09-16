import { supabase, storage } from '../services/supabase';

// Configuración de buckets requeridos
const REQUIRED_BUCKETS = [
  {
    name: 'reportes-adjuntos',
    public: true,
    allowedMimeTypes: ['image/*', 'application/pdf', 'text/plain'],
    fileSizeLimit: 10485760, // 10MB
    description: 'Archivos adjuntos de reportes'
  },
  {
    name: 'firmas',
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg'],
    fileSizeLimit: 1048576, // 1MB
    description: 'Firmas digitales de formularios'
  },
  {
    name: 'reportes-fotos',
    public: true,
    allowedMimeTypes: ['image/*'],
    fileSizeLimit: 5242880, // 5MB
    description: 'Fotografías de evidencia para reportes'
  },
  {
    name: 'colaboradores-fotos',
    public: false,
    allowedMimeTypes: ['image/*'],
    fileSizeLimit: 2097152, // 2MB
    description: 'Fotografías de perfil de colaboradores'
  }
];

/**
 * Verifica si un bucket existe
 */
const bucketExists = async (bucketName) => {
  try {
    const { data, error } = await storage.listBuckets();
    if (error) throw error;

    return data.some(bucket => bucket.name === bucketName);
  } catch (error) {
    console.error(`Error verificando bucket ${bucketName}:`, error);
    return false;
  }
};

/**
 * Crea un bucket si no existe
 */
const createBucket = async (bucketConfig) => {
  try {
    console.log(`Creando bucket: ${bucketConfig.name}`);

    const { data, error } = await storage.createBucket(bucketConfig.name, {
      public: bucketConfig.public,
      allowedMimeTypes: bucketConfig.allowedMimeTypes,
      fileSizeLimit: bucketConfig.fileSizeLimit
    });

    if (error) {
      // Si el bucket ya existe, no es un error crítico
      if (error.message.includes('already exists')) {
        console.log(`Bucket ${bucketConfig.name} ya existe`);
        return { success: true, existed: true };
      }
      throw error;
    }

    console.log(`Bucket ${bucketConfig.name} creado exitosamente`);
    return { success: true, created: true, data };

  } catch (error) {
    console.error(`Error creando bucket ${bucketConfig.name}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Configura las políticas RLS para un bucket
 */
const setupBucketPolicies = async (bucketName, isPublic = true) => {
  try {
    // Las políticas se deben configurar desde el dashboard de Supabase o SQL
    // Este es solo un placeholder para documentar las políticas necesarias

    const policies = {
      select: `
        CREATE POLICY "Public can view ${bucketName}" ON storage.objects
        FOR SELECT USING (bucket_id = '${bucketName}');
      `,
      insert: `
        CREATE POLICY "Authenticated users can upload to ${bucketName}" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = '${bucketName}' AND auth.role() = 'authenticated');
      `,
      update: `
        CREATE POLICY "Users can update own files in ${bucketName}" ON storage.objects
        FOR UPDATE USING (bucket_id = '${bucketName}' AND auth.uid() = owner);
      `,
      delete: `
        CREATE POLICY "Users can delete own files in ${bucketName}" ON storage.objects
        FOR DELETE USING (bucket_id = '${bucketName}' AND auth.uid() = owner);
      `
    };

    console.log(`Políticas RLS requeridas para ${bucketName}:`, policies);
    return { success: true, policies };

  } catch (error) {
    console.error(`Error configurando políticas para ${bucketName}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Función principal para configurar todos los buckets
 */
export const setupStorageBuckets = async () => {
  console.log('Iniciando configuración de buckets de storage...');

  const results = {
    success: true,
    bucketsCreated: [],
    bucketsExisted: [],
    errors: []
  };

  try {
    for (const bucketConfig of REQUIRED_BUCKETS) {
      console.log(`\nProcesando bucket: ${bucketConfig.name}`);

      // Verificar si existe
      const exists = await bucketExists(bucketConfig.name);

      if (exists) {
        console.log(`Bucket ${bucketConfig.name} ya existe`);
        results.bucketsExisted.push(bucketConfig.name);
      } else {
        // Crear bucket
        const createResult = await createBucket(bucketConfig);

        if (createResult.success) {
          if (createResult.created) {
            results.bucketsCreated.push(bucketConfig.name);
          } else if (createResult.existed) {
            results.bucketsExisted.push(bucketConfig.name);
          }
        } else {
          results.errors.push({
            bucket: bucketConfig.name,
            error: createResult.error
          });
          results.success = false;
        }
      }

      // Configurar políticas (documentar)
      await setupBucketPolicies(bucketConfig.name, bucketConfig.public);
    }

    // Resumen final
    console.log('\n=== RESUMEN DE CONFIGURACIÓN ===');
    console.log(`Buckets creados: ${results.bucketsCreated.length}`);
    console.log(`Buckets existentes: ${results.bucketsExisted.length}`);
    console.log(`Errores: ${results.errors.length}`);

    if (results.bucketsCreated.length > 0) {
      console.log('Nuevos buckets:', results.bucketsCreated.join(', '));
    }

    if (results.errors.length > 0) {
      console.log('Errores encontrados:');
      results.errors.forEach(err => {
        console.log(`- ${err.bucket}: ${err.error}`);
      });
    }

    return results;

  } catch (error) {
    console.error('Error en la configuración de buckets:', error);
    return {
      success: false,
      bucketsCreated: [],
      bucketsExisted: [],
      errors: [{ bucket: 'general', error: error.message }]
    };
  }
};

/**
 * Función para verificar el estado de los buckets
 */
export const checkBucketsStatus = async () => {
  console.log('Verificando estado de buckets...');

  try {
    const { data: buckets, error } = await storage.listBuckets();
    if (error) throw error;

    const status = {
      total: buckets.length,
      required: REQUIRED_BUCKETS.length,
      existing: [],
      missing: []
    };

    REQUIRED_BUCKETS.forEach(required => {
      const exists = buckets.some(bucket => bucket.name === required.name);
      if (exists) {
        status.existing.push(required.name);
      } else {
        status.missing.push(required.name);
      }
    });

    console.log('Estado de buckets:', status);
    return status;

  } catch (error) {
    console.error('Error verificando buckets:', error);
    return { error: error.message };
  }
};

/**
 * Función para testing - crear un archivo de prueba
 */
export const testBucketUpload = async (bucketName = 'reportes-adjuntos') => {
  try {
    const testData = new Blob(['Test file content'], { type: 'text/plain' });
    const fileName = `test-${Date.now()}.txt`;

    const { data, error } = await storage
      .from(bucketName)
      .upload(fileName, testData);

    if (error) throw error;

    console.log(`Test upload exitoso en ${bucketName}:`, data);

    // Limpiar archivo de prueba
    await storage.from(bucketName).remove([fileName]);

    return { success: true, path: data.path };

  } catch (error) {
    console.error(`Error en test upload para ${bucketName}:`, error);
    return { success: false, error: error.message };
  }
};

// Exportar configuración para referencia
export { REQUIRED_BUCKETS };