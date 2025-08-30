#!/usr/bin/env node

/**
 * 🔍 SCRIPT DE VERIFICACIÓN DE SUPABASE
 * 
 * Verifica que la configuración de Supabase esté correcta
 * y que las tablas necesarias existan
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables de entorno de Supabase faltantes');
    console.error('Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Verifica que una tabla exista y tenga las columnas esperadas
 */
const verifyTable = async (tableName, expectedColumns = []) => {
    try {
        console.log(`\n🔍 Verificando tabla: ${tableName}`);
        
        // Intentar hacer una consulta simple
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
        
        if (error) {
            if (error.message.includes('relation') && error.message.includes('does not exist')) {
                console.log(`❌ La tabla '${tableName}' no existe`);
                return false;
            } else {
                console.log(`⚠️  Error accediendo a '${tableName}': ${error.message}`);
                return false;
            }
        }
        
        console.log(`✅ Tabla '${tableName}' existe y es accesible`);
        
        // Verificar columnas si se especificaron
        if (expectedColumns.length > 0 && data && data.length > 0) {
            const actualColumns = Object.keys(data[0]);
            const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
            
            if (missingColumns.length > 0) {
                console.log(`⚠️  Columnas faltantes en '${tableName}': ${missingColumns.join(', ')}`);
            } else {
                console.log(`✅ Todas las columnas esperadas están presentes`);
            }
        }
        
        return true;
        
    } catch (err) {
        console.log(`❌ Error verificando tabla '${tableName}': ${err.message}`);
        return false;
    }
};

/**
 * Verifica la autenticación
 */
const verifyAuth = async () => {
    try {
        console.log(`\n🔐 Verificando autenticación...`);
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
            console.log(`⚠️  Error obteniendo sesión: ${error.message}`);
        } else {
            console.log(`✅ Sistema de autenticación funcionando`);
            
            if (data.session) {
                console.log(`👤 Usuario autenticado: ${data.session.user.email}`);
            } else {
                console.log(`👤 No hay usuario autenticado (normal para verificación inicial)`);
            }
        }
        
        return true;
        
    } catch (err) {
        console.log(`❌ Error verificando autenticación: ${err.message}`);
        return false;
    }
};

/**
 * Verifica el storage
 */
const verifyStorage = async () => {
    try {
        console.log(`\n📁 Verificando storage...`);
        
        const { data, error } = await supabase.storage.listBuckets();
        
        if (error) {
            console.log(`⚠️  Error accediendo al storage: ${error.message}`);
            return false;
        }
        
        console.log(`✅ Storage accesible`);
        console.log(`📊 Buckets disponibles: ${data.length}`);
        
        data.forEach(bucket => {
            console.log(`   - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
        });
        
        return true;
        
    } catch (err) {
        console.log(`❌ Error verificando storage: ${err.message}`);
        return false;
    }
};

/**
 * Función principal de verificación
 */
const runVerification = async () => {
    console.log('🔍 VERIFICANDO CONFIGURACIÓN DE SUPABASE');
    console.log('==========================================\n');
    
    console.log('📋 Configuración:');
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);
    
    const results = {
        connection: false,
        auth: false,
        storage: false,
        tables: {
            reportes: false,
            colaboradores: false,
            profiles: false
        }
    };
    
    // Verificar conexión básica
    try {
        const { data, error } = await supabase.from('reportes').select('count').limit(1);
        results.connection = true;
        console.log('\n✅ Conexión a Supabase establecida');
    } catch (error) {
        console.log('\n❌ Error conectando a Supabase:', error.message);
        console.log('\nVerifica que:');
        console.log('1. VITE_SUPABASE_URL sea correcto');
        console.log('2. VITE_SUPABASE_ANON_KEY sea correcto');
        console.log('3. El proyecto Supabase esté activo');
        process.exit(1);
    }
    
    // Verificar autenticación
    results.auth = await verifyAuth();
    
    // Verificar storage
    results.storage = await verifyStorage();
    
    // Verificar tablas principales
    console.log(`\n📊 Verificando tablas...`);
    
    const tables = [
        { 
            name: 'reportes', 
            columns: ['id', 'titulo', 'descripcion', 'estado', 'severidad', 'fecha_creacion'] 
        },
        { 
            name: 'colaboradores', 
            columns: ['id', 'nombre', 'email', 'area', 'cargo', 'activo'] 
        },
        { 
            name: 'profiles', 
            columns: ['id', 'email'] 
        }
    ];
    
    for (const table of tables) {
        results.tables[table.name] = await verifyTable(table.name, table.columns);
    }
    
    // Resumen final
    console.log('\n📊 RESUMEN DE VERIFICACIÓN');
    console.log('===========================');
    
    const connectionStatus = results.connection ? '✅' : '❌';
    const authStatus = results.auth ? '✅' : '⚠️';
    const storageStatus = results.storage ? '✅' : '⚠️';
    
    console.log(`${connectionStatus} Conexión: ${results.connection ? 'OK' : 'ERROR'}`);
    console.log(`${authStatus} Autenticación: ${results.auth ? 'OK' : 'ADVERTENCIA'}`);
    console.log(`${storageStatus} Storage: ${results.storage ? 'OK' : 'ADVERTENCIA'}`);
    
    console.log(`\n📋 Tablas:`);
    for (const [tableName, status] of Object.entries(results.tables)) {
        const tableStatus = status ? '✅' : '❌';
        console.log(`${tableStatus} ${tableName}: ${status ? 'OK' : 'FALTA'}`);
    }
    
    const allTablesOk = Object.values(results.tables).every(status => status);
    
    if (results.connection && allTablesOk) {
        console.log('\n🎉 ¡CONFIGURACIÓN SUPABASE CORRECTA!');
        console.log('Tu aplicación debería funcionar correctamente.');
    } else if (results.connection && !allTablesOk) {
        console.log('\n⚠️  CONFIGURACIÓN PARCIAL');
        console.log('La conexión funciona pero faltan algunas tablas.');
        console.log('Ejecuta las migraciones SQL en tu dashboard de Supabase.');
    } else {
        console.log('\n❌ CONFIGURACIÓN INCOMPLETA');
        console.log('Revisa tu configuración de Supabase.');
    }
};

// Ejecutar verificación si el archivo se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    runVerification().catch(error => {
        console.error('❌ Error fatal en la verificación:', error);
        process.exit(1);
    });
}

export { runVerification };