-- ============================================================================
-- 🏗️ PASO 1: CREAR TABLAS BÁSICAS PARA REPORTESEGURO
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