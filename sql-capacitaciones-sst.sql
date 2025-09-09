-- ============================================================================
-- 📚 TABLA: CAPACITACIONES_SST (CAPACITACIONES EN SEGURIDAD Y SALUD EN EL TRABAJO)
-- ============================================================================
-- Funcionalidad: Gestión integral de capacitaciones en SST para cumplir con 
-- la normatividad colombiana (Decreto 1886/2015, Resolución 0312/2019)
-- ============================================================================

CREATE TABLE IF NOT EXISTS capacitaciones_sst (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Información básica de la capacitación
    titulo TEXT NOT NULL CHECK (LENGTH(titulo) >= 5 AND LENGTH(titulo) <= 200),
    descripcion TEXT CHECK (LENGTH(descripcion) <= 1000),
    
    -- Relación con colaborador
    colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
    
    -- Clasificación de la capacitación
    tipo_capacitacion TEXT DEFAULT 'Seguridad Industrial' CHECK (
        tipo_capacitacion IN (
            'Seguridad Industrial',
            'Uso de EPP',
            'Primeros Auxilios', 
            'Prevención de Riesgos',
            'Trabajo en Alturas',
            'Espacios Confinados',
            'Manejo de Químicos',
            'Emergencias y Evacuación',
            'Higiene Industrial',
            'Ergonomía',
            'COPASST',
            'Brigada de Emergencia',
            'Investigación de Accidentes',
            'Matriz de Riesgos',
            'Otro'
        )
    ),
    
    -- Información de la capacitación
    instructor TEXT,
    duracion_horas DECIMAL(5,2) DEFAULT 0 CHECK (duracion_horas >= 0),
    
    -- Fechas importantes
    fecha_realizacion DATE NOT NULL,
    fecha_vencimiento DATE, -- Fecha de vencimiento del certificado
    
    -- Documentación y evidencias
    certificado_url TEXT, -- URL del certificado o documento
    
    -- Estado de la capacitación
    estado TEXT DEFAULT 'completada' CHECK (
        estado IN ('programada', 'completada', 'cancelada', 'reprogramada')
    ),
    
    -- Auditoría y control
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Información adicional para compliance
    observaciones TEXT,
    cumple_normativa BOOLEAN DEFAULT true, -- Indica si cumple con normativa colombiana
    
    -- Índices para optimizar búsquedas
    CONSTRAINT capacitaciones_sst_fecha_realizacion_check 
        CHECK (fecha_realizacion <= CURRENT_DATE),
    CONSTRAINT capacitaciones_sst_fecha_vencimiento_check 
        CHECK (fecha_vencimiento IS NULL OR fecha_vencimiento > fecha_realizacion)
);

-- ============================================================================
-- ÍNDICES PARA OPTIMIZAR CONSULTAS
-- ============================================================================

-- Índice para búsquedas por colaborador
CREATE INDEX IF NOT EXISTS idx_capacitaciones_sst_colaborador_id 
    ON capacitaciones_sst(colaborador_id);

-- Índice para búsquedas por tipo de capacitación
CREATE INDEX IF NOT EXISTS idx_capacitaciones_sst_tipo 
    ON capacitaciones_sst(tipo_capacitacion);

-- Índice para búsquedas por fecha de realización
CREATE INDEX IF NOT EXISTS idx_capacitaciones_sst_fecha_realizacion 
    ON capacitaciones_sst(fecha_realizacion DESC);

-- Índice para búsquedas por fecha de vencimiento (importante para alertas)
CREATE INDEX IF NOT EXISTS idx_capacitaciones_sst_fecha_vencimiento 
    ON capacitaciones_sst(fecha_vencimiento) 
    WHERE fecha_vencimiento IS NOT NULL;

-- Índice compuesto para reportes de colaborador por fecha
CREATE INDEX IF NOT EXISTS idx_capacitaciones_sst_colaborador_fecha 
    ON capacitaciones_sst(colaborador_id, fecha_realizacion DESC);

-- ============================================================================
-- TRIGGER PARA ACTUALIZAR FECHA DE MODIFICACIÓN
-- ============================================================================

CREATE OR REPLACE FUNCTION update_capacitaciones_sst_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_capacitaciones_sst_updated_at
    BEFORE UPDATE ON capacitaciones_sst
    FOR EACH ROW
    EXECUTE FUNCTION update_capacitaciones_sst_updated_at();

-- ============================================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Habilitar RLS en la tabla
ALTER TABLE capacitaciones_sst ENABLE ROW LEVEL SECURITY;

-- Política para permitir SELECT a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden ver capacitaciones" 
    ON capacitaciones_sst FOR SELECT 
    TO authenticated 
    USING (true);

-- Política para permitir INSERT a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden crear capacitaciones" 
    ON capacitaciones_sst FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Política para permitir UPDATE a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden actualizar capacitaciones" 
    ON capacitaciones_sst FOR UPDATE 
    TO authenticated 
    USING (true);

-- Política para permitir DELETE solo a administradores o al creador
CREATE POLICY "Solo admins o creadores pueden eliminar capacitaciones" 
    ON capacitaciones_sst FOR DELETE 
    TO authenticated 
    USING (
        auth.uid() = created_by OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
        )
    );

-- ============================================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE capacitaciones_sst IS 'Tabla para gestionar capacitaciones en Seguridad y Salud en el Trabajo según normativa colombiana';
COMMENT ON COLUMN capacitaciones_sst.titulo IS 'Título de la capacitación';
COMMENT ON COLUMN capacitaciones_sst.tipo_capacitacion IS 'Tipo de capacitación según clasificación SST';
COMMENT ON COLUMN capacitaciones_sst.colaborador_id IS 'ID del colaborador que recibió la capacitación';
COMMENT ON COLUMN capacitaciones_sst.fecha_vencimiento IS 'Fecha de vencimiento del certificado (si aplica)';
COMMENT ON COLUMN capacitaciones_sst.cumple_normativa IS 'Indica si la capacitación cumple con normativa colombiana vigente';

-- ============================================================================
-- INSERTAR DATOS DE EJEMPLO (OPCIONAL)
-- ============================================================================

-- Capacitaciones de ejemplo para testing
-- INSERT INTO capacitaciones_sst (
--     titulo, 
--     descripcion, 
--     colaborador_id, 
--     tipo_capacitacion, 
--     instructor, 
--     duracion_horas, 
--     fecha_realizacion,
--     fecha_vencimiento,
--     cumple_normativa
-- ) 
-- SELECT 
--     'Capacitación en Uso de EPP Básico',
--     'Capacitación fundamental sobre el uso correcto de elementos de protección personal según normativa colombiana',
--     c.id,
--     'Uso de EPP',
--     'Ing. María Rodríguez',
--     4.0,
--     CURRENT_DATE - INTERVAL '30 days',
--     CURRENT_DATE + INTERVAL '11 months',
--     true
-- FROM colaboradores c 
-- WHERE c.activo = true 
-- LIMIT 3;

-- ============================================================================
-- FIN SCRIPT CAPACITACIONES SST
-- ============================================================================