-- ============================================================================
-- 👥 TABLAS: COPASST SST (COMITÉ PARITARIO DE SEGURIDAD Y SALUD EN EL TRABAJO)
-- ============================================================================
-- Funcionalidad: Gestión integral del COPASST para cumplir con la normatividad 
-- colombiana SST (Resolución 2013/2014, Decreto 1443/2014, Resolución 0312/2019)
-- ============================================================================

-- ============================================================================
-- 📋 TABLA: COPASST_MIEMBROS
-- ============================================================================

CREATE TABLE IF NOT EXISTS copasst_miembros (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Información básica del miembro
    colaborador_nombre TEXT NOT NULL,
    cedula TEXT NOT NULL,
    cargo TEXT NOT NULL,
    area TEXT NOT NULL CHECK (area IN ('Centro Industrial', 'Hornos Solera')),
    
    -- Rol en el COPASST
    tipo_miembro TEXT NOT NULL CHECK (
        tipo_miembro IN ('Empleador', 'Trabajador', 'Presidente', 'Secretario')
    ),
    es_principal BOOLEAN DEFAULT true,
    es_suplente BOOLEAN DEFAULT false,
    
    -- Período de vigencia
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    
    -- Información de contacto
    telefono TEXT,
    email TEXT CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
    
    -- Estado
    activo BOOLEAN DEFAULT true,
    
    -- Capacitación
    capacitacion_copasst BOOLEAN DEFAULT false,
    fecha_capacitacion DATE,
    institucion_capacitacion TEXT,
    
    -- Auditoría y control
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints de validación
    CONSTRAINT copasst_miembros_fecha_periodo_check 
        CHECK (fecha_fin > fecha_inicio),
    CONSTRAINT copasst_miembros_colaborador_nombre_check
        CHECK (LENGTH(colaborador_nombre) >= 2 AND LENGTH(colaborador_nombre) <= 100),
    CONSTRAINT copasst_miembros_cedula_check
        CHECK (LENGTH(cedula) >= 6 AND LENGTH(cedula) <= 15)
);

-- ============================================================================
-- 📝 TABLA: COPASST_REUNIONES
-- ============================================================================

CREATE TABLE IF NOT EXISTS copasst_reuniones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Información básica de la reunión
    numero_reunion INTEGER NOT NULL,
    fecha_reunion DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME,
    lugar TEXT NOT NULL,
    
    -- Tipo de reunión
    tipo_reunion TEXT DEFAULT 'Ordinaria' CHECK (
        tipo_reunion IN ('Ordinaria', 'Extraordinaria', 'Instalación', 'Virtual')
    ),
    
    -- Información de la reunión
    presidente TEXT NOT NULL,
    secretario TEXT NOT NULL,
    
    -- Contenido
    orden_dia TEXT NOT NULL,
    desarrollo_reunion TEXT NOT NULL,
    compromisos TEXT,
    observaciones TEXT,
    
    -- Asistentes (JSON array con nombres)
    asistentes JSONB DEFAULT '[]',
    
    -- Documentos adjuntos
    acta_url TEXT,
    evidencias_urls TEXT[] DEFAULT '{}',
    
    -- Control de aprobación
    aprobada BOOLEAN DEFAULT false,
    fecha_aprobacion DATE,
    aprobada_por TEXT,
    
    -- Seguimiento
    requiere_seguimiento BOOLEAN DEFAULT false,
    fecha_seguimiento DATE,
    
    -- Auditoría y control
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints de validación
    CONSTRAINT copasst_reuniones_fecha_reunion_check 
        CHECK (
            fecha_reunion >= '2020-01-01' AND 
            fecha_reunion <= CURRENT_DATE + INTERVAL '1 year'
        ),
    CONSTRAINT copasst_reuniones_hora_check 
        CHECK (hora_fin IS NULL OR hora_fin > hora_inicio),
    CONSTRAINT copasst_reuniones_numero_reunion_check
        CHECK (numero_reunion > 0)
);

-- ============================================================================
-- ÍNDICES PARA OPTIMIZAR CONSULTAS
-- ============================================================================

-- Índices para copasst_miembros
CREATE INDEX IF NOT EXISTS idx_copasst_miembros_colaborador 
    ON copasst_miembros(colaborador_nombre);

CREATE INDEX IF NOT EXISTS idx_copasst_miembros_area 
    ON copasst_miembros(area);

CREATE INDEX IF NOT EXISTS idx_copasst_miembros_tipo 
    ON copasst_miembros(tipo_miembro);

CREATE INDEX IF NOT EXISTS idx_copasst_miembros_activo 
    ON copasst_miembros(activo) 
    WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_copasst_miembros_vigencia 
    ON copasst_miembros(fecha_inicio, fecha_fin);

-- Índices para copasst_reuniones
CREATE INDEX IF NOT EXISTS idx_copasst_reuniones_fecha 
    ON copasst_reuniones(fecha_reunion DESC);

CREATE INDEX IF NOT EXISTS idx_copasst_reuniones_numero 
    ON copasst_reuniones(numero_reunion DESC);

CREATE INDEX IF NOT EXISTS idx_copasst_reuniones_tipo 
    ON copasst_reuniones(tipo_reunion);

CREATE INDEX IF NOT EXISTS idx_copasst_reuniones_aprobada 
    ON copasst_reuniones(aprobada);

CREATE INDEX IF NOT EXISTS idx_copasst_reuniones_seguimiento 
    ON copasst_reuniones(requiere_seguimiento) 
    WHERE requiere_seguimiento = true;

-- Índice de texto completo para búsquedas en reuniones
CREATE INDEX IF NOT EXISTS idx_copasst_reuniones_contenido_text 
    ON copasst_reuniones USING gin(
        to_tsvector('spanish', COALESCE(orden_dia, '') || ' ' || COALESCE(desarrollo_reunion, ''))
    );

-- ============================================================================
-- TRIGGERS PARA ACTUALIZAR FECHA DE MODIFICACIÓN
-- ============================================================================

CREATE OR REPLACE FUNCTION update_copasst_miembros_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_copasst_miembros_updated_at
    BEFORE UPDATE ON copasst_miembros
    FOR EACH ROW
    EXECUTE FUNCTION update_copasst_miembros_updated_at();

CREATE OR REPLACE FUNCTION update_copasst_reuniones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_copasst_reuniones_updated_at
    BEFORE UPDATE ON copasst_reuniones
    FOR EACH ROW
    EXECUTE FUNCTION update_copasst_reuniones_updated_at();

-- ============================================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Habilitar RLS en ambas tablas
ALTER TABLE copasst_miembros ENABLE ROW LEVEL SECURITY;
ALTER TABLE copasst_reuniones ENABLE ROW LEVEL SECURITY;

-- Políticas para copasst_miembros
CREATE POLICY "copasst_miembros_select_policy" 
    ON copasst_miembros FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "copasst_miembros_insert_policy" 
    ON copasst_miembros FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

CREATE POLICY "copasst_miembros_update_policy" 
    ON copasst_miembros FOR UPDATE 
    TO authenticated 
    USING (true);

CREATE POLICY "copasst_miembros_delete_policy" 
    ON copasst_miembros FOR DELETE 
    TO authenticated 
    USING (true);

-- Políticas para copasst_reuniones
CREATE POLICY "copasst_reuniones_select_policy" 
    ON copasst_reuniones FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "copasst_reuniones_insert_policy" 
    ON copasst_reuniones FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

CREATE POLICY "copasst_reuniones_update_policy" 
    ON copasst_reuniones FOR UPDATE 
    TO authenticated 
    USING (true);

CREATE POLICY "copasst_reuniones_delete_policy" 
    ON copasst_reuniones FOR DELETE 
    TO authenticated 
    USING (true);

-- ============================================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE copasst_miembros IS 'Tabla para gestionar miembros del COPASST según normativa colombiana SST';
COMMENT ON COLUMN copasst_miembros.tipo_miembro IS 'Tipo de miembro: Empleador, Trabajador, Presidente, Secretario';
COMMENT ON COLUMN copasst_miembros.es_principal IS 'Indica si es miembro principal o suplente';
COMMENT ON COLUMN copasst_miembros.capacitacion_copasst IS 'Indica si ha recibido capacitación específica para COPASST';

COMMENT ON TABLE copasst_reuniones IS 'Tabla para gestionar actas y reuniones del COPASST';
COMMENT ON COLUMN copasst_reuniones.tipo_reunion IS 'Tipo: Ordinaria, Extraordinaria, Instalación, Virtual';
COMMENT ON COLUMN copasst_reuniones.asistentes IS 'Array JSON con nombres de asistentes a la reunión';
COMMENT ON COLUMN copasst_reuniones.aprobada IS 'Indica si el acta ha sido aprobada formalmente';

-- ============================================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ============================================================================

-- Ejemplos de miembros COPASST para testing
-- INSERT INTO copasst_miembros (
--     colaborador_nombre,
--     cedula,
--     cargo,
--     area,
--     tipo_miembro,
--     es_principal,
--     fecha_inicio,
--     fecha_fin,
--     telefono,
--     email,
--     capacitacion_copasst,
--     fecha_capacitacion
-- ) VALUES
-- (
--     'Juan Carlos Rodríguez',
--     '12345678',
--     'Supervisor de Seguridad',
--     'Centro Industrial',
--     'Presidente',
--     true,
--     CURRENT_DATE - INTERVAL '30 days',
--     CURRENT_DATE + INTERVAL '2 years' - INTERVAL '30 days',
--     '+57 300 123-4567',
--     'juan.rodriguez@empresa.com',
--     true,
--     CURRENT_DATE - INTERVAL '60 days'
-- ),
-- (
--     'Ana María Torres',
--     '87654321',
--     'Operaria de Producción',
--     'Hornos Solera',
--     'Secretario',
--     true,
--     CURRENT_DATE - INTERVAL '30 days',
--     CURRENT_DATE + INTERVAL '2 years' - INTERVAL '30 days',
--     '+57 301 234-5678',
--     'ana.torres@empresa.com',
--     true,
--     CURRENT_DATE - INTERVAL '60 days'
-- );

-- Ejemplo de reunión para testing
-- INSERT INTO copasst_reuniones (
--     numero_reunion,
--     fecha_reunion,
--     hora_inicio,
--     hora_fin,
--     lugar,
--     tipo_reunion,
--     presidente,
--     secretario,
--     orden_dia,
--     desarrollo_reunion,
--     compromisos,
--     asistentes
-- ) VALUES
-- (
--     1,
--     CURRENT_DATE - INTERVAL '7 days',
--     '14:00',
--     '16:00',
--     'Sala de Reuniones - Centro Industrial',
--     'Ordinaria',
--     'Juan Carlos Rodríguez',
--     'Ana María Torres',
--     '1. Instalación del comité\n2. Presentación de miembros\n3. Reglamento interno\n4. Plan de trabajo 2025',
--     'Se realizó la instalación formal del COPASST...',
--     '1. Elaborar cronograma de inspecciones\n2. Programar capacitación en identificación de peligros',
--     '["Juan Carlos Rodríguez", "Ana María Torres", "Luis Fernando López", "Carmen Lucía Vargas"]'::jsonb
-- );

-- ============================================================================
-- FIN SCRIPT COPASST SST
-- ============================================================================