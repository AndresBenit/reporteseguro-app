#!/usr/bin/env node

/**
 * 🔄 SCRIPT DE MIGRACIÓN DE FIREBASE A SUPABASE
 * 
 * Este script migra todos los datos desde Firebase Firestore a Supabase PostgreSQL
 * Mantiene la estructura de datos y relaciones existentes
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

// Configuración Firebase (desde variables de entorno existentes)
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

// Configuración Supabase (desde nuevas variables de entorno)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usar service role para escritura

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Faltan variables de entorno de Supabase');
    console.error('Asegúrate de tener VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu .env.local');
    process.exit(1);
}

// Inicializar Firebase
const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

// Inicializar Supabase con service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Convierte timestamp de Firebase a ISO string para PostgreSQL
 */
const convertFirebaseTimestamp = (timestamp) => {
    if (!timestamp) return null;
    if (timestamp.toDate) {
        return timestamp.toDate().toISOString();
    }
    if (timestamp instanceof Date) {
        return timestamp.toISOString();
    }
    return timestamp;
};

/**
 * Convierte un documento de Firebase a formato Supabase
 */
const convertFirebaseDoc = (doc, collectionName) => {
    const data = doc.data();
    const converted = { ...data };
    
    // Mantener el ID original como string
    converted.firebase_id = doc.id;
    
    // Convertir campos de fecha según la colección
    if (collectionName === 'reportes') {
        converted.fecha_creacion = convertFirebaseTimestamp(data.fecha || data.fechaCreacion);
        converted.fecha_ultima_actualizacion = convertFirebaseTimestamp(data.fechaUltimaActualizacion);
        converted.fecha_estimada = convertFirebaseTimestamp(data.fechaEstimada);
        
        // Convertir campos renombrados
        converted.creado_por = data.creadoPor || data.userId || data.createdBy;
        converted.asignado_a = data.asignadoA;
        converted.historial_estados = data.historialEstados;
        
        // Eliminar campos antiguos de Firebase
        delete converted.fecha;
        delete converted.fechaCreacion;
        delete converted.fechaUltimaActualizacion;
        delete converted.fechaEstimada;
        delete converted.creadoPor;
        delete converted.userId;
        delete converted.createdBy;
        delete converted.asignadoA;
        delete converted.historialEstados;
    }
    
    if (collectionName === 'colaboradores') {
        converted.fecha_registro = convertFirebaseTimestamp(data.fechaRegistro);
        converted.fecha_actualizacion = convertFirebaseTimestamp(data.fechaActualizacion);
        
        // Asegurar que tenga campo activo
        if (converted.activo === undefined) {
            converted.activo = true;
        }
        
        // Eliminar campos antiguos
        delete converted.fechaRegistro;
        delete converted.fechaActualizacion;
    }
    
    if (collectionName === 'users') {
        converted.fecha_registro = convertFirebaseTimestamp(data.fechaRegistro);
        converted.fecha_actualizacion = convertFirebaseTimestamp(data.fechaActualizacion);
        
        // Eliminar campos antiguos
        delete converted.fechaRegistro;
        delete converted.fechaActualizacion;
    }
    
    return converted;
};

/**
 * Migra una colección completa de Firebase a Supabase
 */
const migrateCollection = async (collectionName, supabaseTable) => {
    try {
        console.log(`\n🔄 Migrando colección: ${collectionName} -> ${supabaseTable}`);
        
        // Obtener todos los documentos de Firebase
        const querySnapshot = await getDocs(collection(firestore, collectionName));
        const docs = querySnapshot.docs;
        
        console.log(`📋 Encontrados ${docs.length} documentos en ${collectionName}`);
        
        if (docs.length === 0) {
            console.log(`⚪ Sin documentos para migrar en ${collectionName}`);
            return { success: 0, errors: 0 };
        }
        
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        // Migrar en lotes de 100 para evitar límites
        const batchSize = 100;
        for (let i = 0; i < docs.length; i += batchSize) {
            const batch = docs.slice(i, i + batchSize);
            const convertedDocs = batch.map(doc => convertFirebaseDoc(doc, collectionName));
            
            try {
                const { data, error } = await supabase
                    .from(supabaseTable)
                    .insert(convertedDocs);
                
                if (error) {
                    console.error(`❌ Error en lote ${Math.floor(i/batchSize) + 1}:`, error);
                    errorCount += batch.length;
                    errors.push({
                        batch: Math.floor(i/batchSize) + 1,
                        error: error.message,
                        docs: batch.length
                    });
                } else {
                    successCount += batch.length;
                    console.log(`✅ Lote ${Math.floor(i/batchSize) + 1}: ${batch.length} documentos migrados`);
                }
            } catch (err) {
                console.error(`❌ Error insertando lote ${Math.floor(i/batchSize) + 1}:`, err);
                errorCount += batch.length;
                errors.push({
                    batch: Math.floor(i/batchSize) + 1,
                    error: err.message,
                    docs: batch.length
                });
            }
        }
        
        console.log(`📊 Resultado ${collectionName}:`);
        console.log(`   ✅ Exitosos: ${successCount}`);
        console.log(`   ❌ Fallidos: ${errorCount}`);
        
        if (errors.length > 0) {
            console.log(`   🐛 Errores:`, errors);
        }
        
        return { success: successCount, errors: errorCount, details: errors };
        
    } catch (error) {
        console.error(`❌ Error general migrando ${collectionName}:`, error);
        return { success: 0, errors: -1, details: [error.message] };
    }
};

/**
 * Función principal de migración
 */
const runMigration = async () => {
    console.log('🚀 INICIANDO MIGRACIÓN DE FIREBASE A SUPABASE');
    console.log('================================================\n');
    
    const startTime = Date.now();
    const results = {};
    
    // Verificar conexión a Supabase
    try {
        const { data, error } = await supabase.from('reportes').select('count').limit(1);
        if (error && !error.message.includes('relation "reportes" does not exist')) {
            throw error;
        }
        console.log('✅ Conexión a Supabase verificada');
    } catch (error) {
        console.error('❌ Error conectando a Supabase:', error.message);
        console.error('Verifica que:');
        console.error('1. Las tablas estén creadas en Supabase');
        console.error('2. El SUPABASE_SERVICE_ROLE_KEY sea correcto');
        console.error('3. Las políticas RLS permitan inserción');
        process.exit(1);
    }
    
    // Migrar cada colección
    const migrations = [
        { firebase: 'reportes', supabase: 'reportes' },
        { firebase: 'colaboradores', supabase: 'colaboradores' },
        { firebase: 'users', supabase: 'profiles' }, // users -> profiles en Supabase
    ];
    
    for (const migration of migrations) {
        results[migration.firebase] = await migrateCollection(
            migration.firebase, 
            migration.supabase
        );
        
        // Pausa breve entre migraciones
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Resumen final
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\n📊 RESUMEN DE MIGRACIÓN');
    console.log('========================');
    console.log(`⏱️  Tiempo total: ${duration} segundos`);
    
    let totalSuccess = 0;
    let totalErrors = 0;
    
    for (const [collection, result] of Object.entries(results)) {
        console.log(`\n📋 ${collection.toUpperCase()}:`);
        console.log(`   ✅ Exitosos: ${result.success}`);
        console.log(`   ❌ Fallidos: ${result.errors}`);
        
        totalSuccess += result.success;
        totalErrors += result.errors;
    }
    
    console.log(`\n🎯 TOTAL GENERAL:`);
    console.log(`   ✅ Registros migrados: ${totalSuccess}`);
    console.log(`   ❌ Errores: ${totalErrors}`);
    
    if (totalErrors === 0) {
        console.log('\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
        console.log('Ya puedes usar Supabase en lugar de Firebase.');
    } else {
        console.log(`\n⚠️  Migración completada con ${totalErrors} errores.`);
        console.log('Revisa los logs arriba para ver los detalles.');
    }
};

// Ejecutar migración si el archivo se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    runMigration().catch(error => {
        console.error('❌ Error fatal en la migración:', error);
        process.exit(1);
    });
}

export { runMigration, migrateCollection };