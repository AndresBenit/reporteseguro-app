#!/usr/bin/env node

/**
 * 🛠️ SCRIPT DE CONFIGURACIÓN INICIAL DE SUPABASE
 * 
 * Genera los comandos SQL necesarios para crear las tablas en Supabase
 */

console.log('🛠️ CONFIGURACIÓN INICIAL DE SUPABASE');
console.log('=====================================\n');

console.log('📋 Para configurar tu base de datos Supabase, ejecuta estos comandos SQL');
console.log('en tu dashboard de Supabase (SQL Editor):\n');

const sqlCommands = `
-- ============================================================================
-- 🏗️ CREACIÓN DE TABLAS PARA REPORTESEGURO
-- ============================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 👤 TABLA: PROFILES (PERFILES DE USUARIO)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT,
    role TEXT DEFAULT 'usuario' CHECK (role IN ('usuario', 'supervisor', 'admin')),
    avatar_url TEXT,
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    activo BOOLEAN DEFAULT true,
    
    -- Índices
    CONSTRAINT profiles_email_check CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- RLS (Row Level Security) para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Los usuarios pueden ver su propio perfil"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Los administradores pueden ver todos los perfiles"
    ON profiles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- 📋 TABLA: REPORTES
-- ============================================================================
CREATE TABLE IF NOT EXISTS reportes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    firebase_id TEXT UNIQUE, -- Para migración desde Firebase
    
    -- Información básica
    titulo TEXT NOT NULL CHECK (LENGTH(titulo) >= 5 AND LENGTH(titulo) <= 100),
    descripcion TEXT NOT NULL CHECK (LENGTH(descripcion) >= 10),
    
    -- Clasificación
    tipo TEXT DEFAULT 'incidencia' CHECK (tipo IN ('incidencia', 'observacion', 'seguimiento', 'personal')),
    area TEXT NOT NULL,
    severidad TEXT NOT NULL CHECK (severidad IN ('baja', 'media', 'alta', 'critica')),
    prioridad TEXT DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
    
    -- Estado y flujo
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'asignado', 'en_proceso', 'resuelto', 'cerrado', 'cancelado')),
    asignado_a TEXT,
    
    -- Fechas
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_ultima_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_estimada TIMESTAMPTZ,
    fecha_resolucion TIMESTAMPTZ,
    
    -- Información adicional
    ubicacion TEXT,
    equipo_involucrado TEXT,
    personal_involucrado TEXT[],
    acciones_inmediatas TEXT,
    
    -- Metadatos
    creado_por UUID REFERENCES profiles(id),
    historial_estados JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    -- Archivos adjuntos (URLs)
    adjuntos TEXT[] DEFAULT '{}',
    
    -- Índices y constraints
    CONSTRAINT reportes_fecha_check CHECK (fecha_estimada IS NULL OR fecha_estimada >= fecha_creacion)
);

-- Índices para reportes
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_severidad ON reportes(severidad);
CREATE INDEX IF NOT EXISTS idx_reportes_area ON reportes(area);
CREATE INDEX IF NOT EXISTS idx_reportes_creado_por ON reportes(creado_por);
CREATE INDEX IF NOT EXISTS idx_reportes_fecha_creacion ON reportes(fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_reportes_asignado_a ON reportes(asignado_a);
CREATE INDEX IF NOT EXISTS idx_reportes_firebase_id ON reportes(firebase_id);

-- RLS para reportes
ALTER TABLE reportes ENABLE ROW LEVEL SECURITY;

-- Políticas para reportes
CREATE POLICY "Todos los usuarios autenticados pueden leer reportes"
    ON reportes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Los usuarios pueden crear reportes"
    ON reportes FOR INSERT
    TO authenticated
    WITH CHECK (creado_por = auth.uid());

CREATE POLICY "Los creadores y supervisores pueden actualizar reportes"
    ON reportes FOR UPDATE
    TO authenticated
    USING (
        creado_por = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
        )
    );

CREATE POLICY "Solo administradores pueden eliminar reportes"
    ON reportes FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- 👥 TABLA: COLABORADORES
-- ============================================================================
CREATE TABLE IF NOT EXISTS colaboradores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    firebase_id TEXT UNIQUE, -- Para migración desde Firebase
    
    -- Información personal
    nombre TEXT NOT NULL CHECK (LENGTH(nombre) >= 2 AND LENGTH(nombre) <= 100),
    cedula TEXT UNIQUE,
    email TEXT UNIQUE CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
    telefono TEXT,
    
    -- Información laboral
    cargo TEXT NOT NULL,
    area TEXT NOT NULL,
    centro_trabajo TEXT,
    jefe_directo TEXT,
    
    -- Estado
    activo BOOLEAN DEFAULT true,
    
    -- Fechas
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_ingreso DATE,
    fecha_retiro DATE,
    
    -- Información adicional
    nivel_riesgo TEXT DEFAULT 'medio' CHECK (nivel_riesgo IN ('bajo', 'medio', 'alto')),
    capacitaciones JSONB DEFAULT '[]',
    observaciones TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Índices para colaboradores
CREATE INDEX IF NOT EXISTS idx_colaboradores_nombre ON colaboradores(nombre);
CREATE INDEX IF NOT EXISTS idx_colaboradores_cedula ON colaboradores(cedula);
CREATE INDEX IF NOT EXISTS idx_colaboradores_email ON colaboradores(email);
CREATE INDEX IF NOT EXISTS idx_colaboradores_area ON colaboradores(area);
CREATE INDEX IF NOT EXISTS idx_colaboradores_activo ON colaboradores(activo);
CREATE INDEX IF NOT EXISTS idx_colaboradores_firebase_id ON colaboradores(firebase_id);

-- RLS para colaboradores
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;

-- Políticas para colaboradores
CREATE POLICY "Usuarios autenticados pueden leer colaboradores"
    ON colaboradores FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Solo supervisores pueden crear colaboradores"
    ON colaboradores FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
        )
    );

CREATE POLICY "Solo supervisores pueden actualizar colaboradores"
    ON colaboradores FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
        )
    );

CREATE POLICY "Solo administradores pueden eliminar colaboradores"
    ON colaboradores FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- 📊 TABLA: ESTADISTICAS (OPCIONAL)
-- ============================================================================
CREATE TABLE IF NOT EXISTS estadisticas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tipo TEXT NOT NULL,
    periodo DATE NOT NULL,
    datos JSONB NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tipo, periodo)
);

-- Índice para estadísticas
CREATE INDEX IF NOT EXISTS idx_estadisticas_tipo_periodo ON estadisticas(tipo, periodo DESC);

-- RLS para estadísticas
ALTER TABLE estadisticas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden leer estadísticas"
    ON estadisticas FOR SELECT
    TO authenticated
    USING (true);

-- ============================================================================
-- 🗂️ CONFIGURACIÓN DE STORAGE BUCKETS
-- ============================================================================

-- Bucket para adjuntos de reportes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('reportes-adjuntos', 'reportes-adjuntos', false)
ON CONFLICT DO NOTHING;

-- Bucket para fotos de perfil
INSERT INTO storage.buckets (id, name, public) 
VALUES ('perfiles', 'perfiles', true)
ON CONFLICT DO NOTHING;

-- Políticas para storage de reportes
CREATE POLICY "Usuarios autenticados pueden ver adjuntos de reportes"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'reportes-adjuntos' AND auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden subir adjuntos de reportes"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'reportes-adjuntos' AND auth.role() = 'authenticated');

-- Políticas para storage de perfiles
CREATE POLICY "Todos pueden ver fotos de perfil"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'perfiles');

CREATE POLICY "Los usuarios pueden subir su propia foto de perfil"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'perfiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- 🔧 FUNCIONES ÚTILES
-- ============================================================================

-- Función para actualizar timestamp de modificación automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar automáticamente fecha_actualizacion
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_reportes_updated_at 
    BEFORE UPDATE ON reportes 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_colaboradores_updated_at 
    BEFORE UPDATE ON colaboradores 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- 📝 DATOS INICIALES (OPCIONAL)
-- ============================================================================

-- Insertar algunos datos de ejemplo (opcional)
-- INSERT INTO areas_ejemplo (nombre) VALUES 
--     ('Centro Industrial'),
--     ('Hornos Solera'),
--     ('Administración'),
--     ('Mantenimiento');

-- ============================================================================
-- ✅ CONFIGURACIÓN COMPLETADA
-- ============================================================================

-- Mensaje de confirmación
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Configuración de base de datos completada exitosamente!';
    RAISE NOTICE '🎯 Tablas creadas: profiles, reportes, colaboradores, estadisticas';
    RAISE NOTICE '🔐 RLS habilitado en todas las tablas';
    RAISE NOTICE '📁 Buckets de storage configurados';
    RAISE NOTICE '🚀 ¡Tu aplicación ReporteSeguro está lista para usar!';
END $$;
`;

console.log(sqlCommands);

console.log('\n📋 INSTRUCCIONES:');
console.log('1. Ve a tu dashboard de Supabase: https://app.supabase.com');
console.log('2. Selecciona tu proyecto');
console.log('3. Ve a la sección "SQL Editor"');
console.log('4. Crea una nueva consulta y pega el código SQL de arriba');
console.log('5. Ejecuta la consulta');
console.log('6. ¡Listo! Ya puedes usar tu aplicación con Supabase');

console.log('\n🔍 Para verificar que todo esté correcto, ejecuta:');
console.log('npm run supabase:verify');

export { sqlCommands };