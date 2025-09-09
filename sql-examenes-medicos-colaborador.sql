-- ============================================================================
-- 🏥 TABLA: EXAMENES_MEDICOS_SST (EXÁMENES MÉDICOS OCUPACIONALES)
-- ============================================================================
-- ACTUALIZADO: Ahora usa nombre del colaborador en lugar de área
-- Funcionalidad: Gestión integral de exámenes médicos ocupacionales para cumplir
-- con la normatividad colombiana SST (Decreto 1886/2015, Resolución 0312/2019)
-- ============================================================================

CREATE TABLE IF NOT EXISTS examenes_medicos_sst (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Información básica del examen
    tipo_examen TEXT NOT NULL CHECK (
        tipo_examen IN (
            'Ingreso',
            'Periódico',
            'Egreso',
            'Post-incidente',
            'Reintegro',
            'Optométrico',
            'Audiométrico',
            'Espirometría',
            'Visiometría',
            'Rayos X Tórax',
            'Laboratorio Clínico',
            'Electrocardiograma',
            'Otro'
        )
    ),
    
    -- Colaborador al que pertenece el examen
    colaborador_nombre TEXT NOT NULL,
    
    -- Fechas importantes
    fecha_realizacion DATE NOT NULL,
    fecha_vencimiento DATE,
    
    -- Información médica
    entidad_realiza TEXT CHECK (
        entidad_realiza IN (
            'EPS', 'ARL', 'IPS Privada', 'Clínica Ocupacional', 
            'Hospital', 'Centro Médico', 'Otro'
        )
    ),
    medico_tratante TEXT,
    
    -- Resultado del examen
    resultado TEXT DEFAULT 'pendiente' CHECK (
        resultado IN ('pendiente', 'apto', 'no_apto', 'apto_con_restricciones')
    ),
    
    -- Documentación y observaciones
    observaciones TEXT,
    archivo_url TEXT, -- URL del archivo/documento del examen
    
    -- Auditoría y control
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Información adicional para compliance
    cumple_normativa BOOLEAN DEFAULT true,
    
    -- Constraints de validación
    CONSTRAINT examenes_medicos_fecha_realizacion_check 
        CHECK (
            fecha_realizacion >= '2020-01-01' AND 
            fecha_realizacion <= CURRENT_DATE + INTERVAL '1 year'
        ),
    CONSTRAINT examenes_medicos_fecha_vencimiento_check 
        CHECK (fecha_vencimiento IS NULL OR fecha_vencimiento > fecha_realizacion),
    CONSTRAINT examenes_medicos_colaborador_nombre_check
        CHECK (LENGTH(colaborador_nombre) >= 2 AND LENGTH(colaborador_nombre) <= 100)
);

-- ============================================================================
-- ÍNDICES PARA OPTIMIZAR CONSULTAS
-- ============================================================================

-- Índice para búsquedas por colaborador
CREATE INDEX IF NOT EXISTS idx_examenes_medicos_colaborador 
    ON examenes_medicos_sst(colaborador_nombre);

-- Índice para búsquedas por tipo de examen
CREATE INDEX IF NOT EXISTS idx_examenes_medicos_tipo 
    ON examenes_medicos_sst(tipo_examen);

-- Índice para búsquedas por fecha de realización
CREATE INDEX IF NOT EXISTS idx_examenes_medicos_fecha_realizacion 
    ON examenes_medicos_sst(fecha_realizacion DESC);

-- Índice para búsquedas por fecha de vencimiento (importante para alertas)
CREATE INDEX IF NOT EXISTS idx_examenes_medicos_fecha_vencimiento 
    ON examenes_medicos_sst(fecha_vencimiento) 
    WHERE fecha_vencimiento IS NOT NULL;

-- Índice para búsquedas por resultado
CREATE INDEX IF NOT EXISTS idx_examenes_medicos_resultado 
    ON examenes_medicos_sst(resultado);

-- Índice compuesto para reportes de colaborador por fecha
CREATE INDEX IF NOT EXISTS idx_examenes_medicos_colaborador_fecha 
    ON examenes_medicos_sst(colaborador_nombre, fecha_realizacion DESC);

-- Índice compuesto para exámenes pendientes por colaborador
CREATE INDEX IF NOT EXISTS idx_examenes_medicos_pendientes 
    ON examenes_medicos_sst(colaborador_nombre, resultado) 
    WHERE resultado = 'pendiente';

-- Índice de texto completo para búsquedas de colaborador
CREATE INDEX IF NOT EXISTS idx_examenes_medicos_colaborador_text 
    ON examenes_medicos_sst USING gin(to_tsvector('spanish', colaborador_nombre));

-- ============================================================================
-- TRIGGER PARA ACTUALIZAR FECHA DE MODIFICACIÓN
-- ============================================================================

CREATE OR REPLACE FUNCTION update_examenes_medicos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_examenes_medicos_updated_at
    BEFORE UPDATE ON examenes_medicos_sst
    FOR EACH ROW
    EXECUTE FUNCTION update_examenes_medicos_updated_at();

-- ============================================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Habilitar RLS en la tabla
ALTER TABLE examenes_medicos_sst ENABLE ROW LEVEL SECURITY;

-- Política para permitir SELECT a usuarios autenticados
CREATE POLICY "examenes_medicos_select_policy" 
    ON examenes_medicos_sst FOR SELECT 
    TO authenticated 
    USING (true);

-- Política para permitir INSERT a usuarios autenticados
CREATE POLICY "examenes_medicos_insert_policy" 
    ON examenes_medicos_sst FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Política para permitir UPDATE a usuarios autenticados
CREATE POLICY "examenes_medicos_update_policy" 
    ON examenes_medicos_sst FOR UPDATE 
    TO authenticated 
    USING (true);

-- Política simple para eliminación (sin recursión)
CREATE POLICY "examenes_medicos_delete_policy" 
    ON examenes_medicos_sst FOR DELETE 
    TO authenticated 
    USING (true);

-- ============================================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE examenes_medicos_sst IS 'Tabla para gestionar exámenes médicos ocupacionales según normativa colombiana SST';
COMMENT ON COLUMN examenes_medicos_sst.tipo_examen IS 'Tipo de examen médico según clasificación ocupacional';
COMMENT ON COLUMN examenes_medicos_sst.colaborador_nombre IS 'Nombre completo del colaborador al que pertenece el examen';
COMMENT ON COLUMN examenes_medicos_sst.resultado IS 'Resultado del examen: pendiente, apto, no_apto, apto_con_restricciones';
COMMENT ON COLUMN examenes_medicos_sst.fecha_vencimiento IS 'Fecha de vencimiento del examen (si aplica)';
COMMENT ON COLUMN examenes_medicos_sst.entidad_realiza IS 'Entidad que realiza el examen médico';
COMMENT ON COLUMN examenes_medicos_sst.archivo_url IS 'URL del documento/archivo del examen médico';
COMMENT ON COLUMN examenes_medicos_sst.cumple_normativa IS 'Indica si el examen cumple con normativa SST colombiana vigente';

-- ============================================================================
-- VERIFICACIÓN DE ESTRUCTURA
-- ============================================================================

-- Verificar que la tabla se creó correctamente
\d examenes_medicos_sst;

-- Listar todas las políticas de la tabla
SELECT policyname, cmd, permissive, roles, qual 
FROM pg_policies 
WHERE tablename = 'examenes_medicos_sst';

-- ============================================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ============================================================================

-- Ejemplos de exámenes médicos para testing
-- INSERT INTO examenes_medicos_sst (
--     tipo_examen,
--     colaborador_nombre,
--     fecha_realizacion,
--     entidad_realiza,
--     medico_tratante,
--     resultado,
--     observaciones,
--     fecha_vencimiento,
--     cumple_normativa
-- ) VALUES
-- (
--     'Ingreso',
--     'Juan Carlos Rodríguez',
--     CURRENT_DATE - INTERVAL '15 days',
--     'ARL',
--     'Dr. María González',
--     'apto',
--     'Examen de ingreso completo sin observaciones',
--     CURRENT_DATE + INTERVAL '11 months',
--     true
-- ),
-- (
--     'Periódico',
--     'Ana María Torres',
--     CURRENT_DATE - INTERVAL '30 days',
--     'EPS',
--     'Dr. Carlos Rodríguez',
--     'apto_con_restricciones',
--     'Restricción para trabajo en alturas por vértigo leve',
--     CURRENT_DATE + INTERVAL '10 months',
--     true
-- ),
-- (
--     'Audiométrico',
--     'Luis Fernando López',
--     CURRENT_DATE - INTERVAL '60 days',
--     'Clínica Ocupacional',
--     'Dr. Ana Torres',
--     'apto',
--     'Audiometría normal dentro de parámetros',
--     CURRENT_DATE + INTERVAL '11 months',
--     true
-- );

-- ============================================================================
-- FIN SCRIPT EXÁMENES MÉDICOS SST - VERSIÓN COLABORADOR
-- ============================================================================