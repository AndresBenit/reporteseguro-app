-- ============================================================================
-- 🔧 FIX: Ajustar constraint de fecha_realizacion en capacitaciones_sst
-- ============================================================================
-- Problema: El constraint actual no permite fechas futuras para capacitaciones programadas
-- Solución: Permitir fechas futuras pero dentro de un rango razonable (1 año adelante)
-- ============================================================================

-- 1. Eliminar el constraint restrictivo actual
ALTER TABLE capacitaciones_sst 
DROP CONSTRAINT IF EXISTS capacitaciones_sst_fecha_realizacion_check;

-- 2. Agregar nuevo constraint más flexible
ALTER TABLE capacitaciones_sst 
ADD CONSTRAINT capacitaciones_sst_fecha_realizacion_check 
CHECK (
    fecha_realizacion >= '2020-01-01' AND 
    fecha_realizacion <= CURRENT_DATE + INTERVAL '1 year'
);

-- 3. Verificar que el constraint se aplicó correctamente
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'capacitaciones_sst_fecha_realizacion_check';

-- ============================================================================
-- COMENTARIO DEL CAMBIO
-- ============================================================================
COMMENT ON CONSTRAINT capacitaciones_sst_fecha_realizacion_check ON capacitaciones_sst 
IS 'Permite fechas desde 2020 hasta 1 año en el futuro para capacitaciones programadas';