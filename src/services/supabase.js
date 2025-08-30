import { createClient } from '@supabase/supabase-js';

// 🔐 CONFIGURACIÓN SEGURA DE SUPABASE
// ⚠️ IMPORTANTE: Todas las credenciales deben estar en variables de entorno

// Validar que las variables de entorno existen
const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
];

// Verificar configuración requerida
const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

if (missingVars.length > 0) {
    const errorMsg = `❌ Variables de entorno faltantes: ${missingVars.join(', ')}
    
    🔧 Para solucionarlo:
    1. Crea un archivo .env.local en la raíz del proyecto
    2. Agrega las variables faltantes:
    
    ${missingVars.map(varName => `${varName}=tu_valor_aqui`).join('\n    ')}
    
    📚 Consulta el README.md para más información sobre configuración segura.
    `;
    
    console.error(errorMsg);
    throw new Error('Configuración Supabase incompleta. Revisa las variables de entorno.');
}

// Configuración Supabase usando variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validación adicional de formato
const validateConfig = (url, key) => {
    const validations = [
        {
            field: 'URL',
            test: (value) => value && value.startsWith('https://') && value.includes('.supabase.co'),
            message: 'URL debe ser una URL válida de Supabase (https://...supabase.co)'
        },
        {
            field: 'ANON_KEY',
            test: (value) => value && value.length > 50,
            message: 'ANON_KEY debe ser una clave válida de Supabase'
        }
    ];

    const errors = validations
        .filter(({ field, test }) => !test(field === 'URL' ? url : key))
        .map(({ field, message }) => `${field}: ${message}`);

    if (errors.length > 0) {
        throw new Error(`❌ Configuración Supabase inválida:\n${errors.join('\n')}`);
    }
};

// Validar configuración antes de inicializar
validateConfig(supabaseUrl, supabaseKey);

// Inicializar Supabase
let supabase;
try {
    supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        },
        realtime: {
            params: {
                eventsPerSecond: 2
            }
        }
    });
    console.log('✅ Supabase inicializado correctamente');
} catch (error) {
    console.error('❌ Error inicializando Supabase:', error);
    throw new Error('No se pudo inicializar Supabase. Verifica tu configuración.');
}

// Exportar cliente y servicios
export { supabase };
export const auth = supabase.auth;
export const db = supabase;
export const storage = supabase.storage;

// Funciones de utilidad para autenticación
export const authHelpers = {
    // Obtener usuario actual
    getCurrentUser: () => auth.getUser(),
    
    // Verificar si está autenticado
    isAuthenticated: async () => {
        const { data: { user } } = await auth.getUser();
        return !!user;
    },
    
    // Login con email y password
    signIn: async (email, password) => {
        const { data, error } = await auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    },
    
    // Registro de usuario
    signUp: async (email, password, metadata = {}) => {
        const { data, error } = await auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });
        if (error) throw error;
        return data;
    },
    
    // Cerrar sesión
    signOut: async () => {
        const { error } = await auth.signOut();
        if (error) throw error;
    },
    
    // Restablecer contraseña
    resetPassword: async (email) => {
        const { error } = await auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) throw error;
    },
    
    // Obtener sesión actual
    getSession: () => auth.getSession(),
    
    // Escuchar cambios de autenticación
    onAuthStateChange: (callback) => {
        return auth.onAuthStateChange(callback);
    }
};

// Funciones de utilidad para base de datos
export const dbHelpers = {
    // Obtener todos los registros de una tabla
    getAll: async (table, options = {}) => {
        let query = supabase.from(table).select('*');
        
        if (options.orderBy) {
            query = query.order(options.orderBy, { ascending: options.ascending ?? true });
        }
        
        if (options.limit) {
            query = query.limit(options.limit);
        }
        
        if (options.filters) {
            Object.entries(options.filters).forEach(([column, value]) => {
                query = query.eq(column, value);
            });
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },
    
    // Obtener un registro por ID
    getById: async (table, id) => {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    },
    
    // Crear un nuevo registro
    create: async (table, data) => {
        const { data: result, error } = await supabase
            .from(table)
            .insert([data])
            .select()
            .single();
        
        if (error) throw error;
        return result;
    },
    
    // Actualizar un registro
    update: async (table, id, updates) => {
        const { data, error } = await supabase
            .from(table)
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    // Eliminar un registro
    delete: async (table, id) => {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    },
    
    // Suscribirse a cambios en tiempo real
    subscribe: (table, callback, filters = {}) => {
        let subscription = supabase
            .channel(`public:${table}`)
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: table,
                    ...filters 
                }, 
                callback
            );
        
        return subscription.subscribe();
    },
    
    // Contar registros
    count: async (table, filters = {}) => {
        let query = supabase.from(table).select('*', { count: 'exact', head: true });
        
        if (filters) {
            Object.entries(filters).forEach(([column, value]) => {
                query = query.eq(column, value);
            });
        }
        
        const { count, error } = await query;
        if (error) throw error;
        return count || 0;
    }
};

// Funciones de utilidad para storage
export const storageHelpers = {
    // Subir archivo
    upload: async (bucket, path, file, options = {}) => {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false,
                ...options
            });
        
        if (error) throw error;
        return data;
    },
    
    // Obtener URL pública de un archivo
    getPublicUrl: (bucket, path) => {
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);
        
        return data.publicUrl;
    },
    
    // Descargar archivo
    download: async (bucket, path) => {
        const { data, error } = await supabase.storage
            .from(bucket)
            .download(path);
        
        if (error) throw error;
        return data;
    },
    
    // Eliminar archivo
    remove: async (bucket, paths) => {
        const { data, error } = await supabase.storage
            .from(bucket)
            .remove(paths);
        
        if (error) throw error;
        return data;
    },
    
    // Listar archivos
    list: async (bucket, path = '', options = {}) => {
        const { data, error } = await supabase.storage
            .from(bucket)
            .list(path, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'name', order: 'asc' },
                ...options
            });
        
        if (error) throw error;
        return data || [];
    }
};

// Configuración de seguridad adicional
if (import.meta.env.DEV) {
    // Solo en desarrollo: verificar que no estamos usando valores por defecto peligrosos
    const dangerousDefaults = [
        'your-project-url',
        'your-anon-key',
        'demo-project',
        'test-project'
    ];
    
    const hasDangerousDefaults = dangerousDefaults.some(dangerous => 
        [supabaseUrl, supabaseKey].some(value => 
            value && value.toString().toLowerCase().includes(dangerous)
        )
    );
    
    if (hasDangerousDefaults) {
        console.warn('⚠️ ADVERTENCIA: Detectados valores por defecto en configuración Supabase. Asegúrate de usar credenciales de producción.');
    }
}

// Logging seguro (solo en desarrollo)
if (import.meta.env.DEV) {
    console.log('🔧 Supabase Config Info:', {
        url: supabaseUrl,
        hasKey: !!supabaseKey,
        keyLength: supabaseKey ? supabaseKey.length : 0,
        environment: import.meta.env.MODE
    });
}

// Exportar por defecto
export default supabase;

// 🛡️ NOTAS DE SEGURIDAD:
// 1. ✅ Todas las credenciales están en variables de entorno
// 2. ✅ Validación de configuración implementada
// 3. ✅ No se exponen credenciales en logs
// 4. ✅ Detección de valores por defecto peligrosos
// 5. ✅ Manejo de errores robusto
// 6. ✅ Funciones de utilidad para operaciones comunes
// 7. ✅ Configuración optimizada para el proyecto