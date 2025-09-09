-- ============================================================================
-- 🔧 ACTUALIZAR: Cambiar capacitaciones_sst de colaborador_id a area
-- ============================================================================
-- Cambio solicitado: En lugar de asociar capacitaciones a colaboradores específicos,
-- ahora las capacitaciones se asociarán a áreas (Centro Industrial / Hornos Solera)
-- ============================================================================

-- 1. Agregar nueva columna 'area' 
ALTER TABLE capacitaciones_sst 
ADD COLUMN IF NOT EXISTS area TEXT;

-- 2. Actualizar constraint para el campo area
ALTER TABLE capacitaciones_sst 
ADD CONSTRAINT capacitaciones_sst_area_check 
CHECK (area IN ('Centro Industrial', 'Hornos Solera'));

-- 3. Hacer el campo area obligatorio después de migrar datos existentes
-- (por ahora lo dejamos nullable para migración)

-- 4. Opcionalmente, si tienes datos existentes y quieres migrarlos:
-- UPDATE capacitaciones_sst 
-- SET area = 'Centro Industrial' 
-- WHERE colaborador_id IN (
--     SELECT id FROM colaboradores WHERE area = 'Centro Industrial'
-- );

-- UPDATE capacitaciones_sst 
-- SET area = 'Hornos Solera' 
-- WHERE colaborador_id IN (
--     SELECT id FROM colaboradores WHERE area = 'Hornos Solera'
-- );

-- 5. Una vez migrados los datos, puedes eliminar la referencia a colaborador_id
-- (CUIDADO: esto elimina la relación permanentemente)
-- ALTER TABLE capacitaciones_sst DROP CONSTRAINT IF EXISTS capacitaciones_sst_colaborador_id_fkey;
-- ALTER TABLE capacitaciones_sst DROP COLUMN IF EXISTS colaborador_id;

-- 6. Hacer area obligatorio después de la migración
-- ALTER TABLE capacitaciones_sst ALTER COLUMN area SET NOT NULL;

-- 7. Actualizar índices
DROP INDEX IF EXISTS idx_capacitaciones_sst_colaborador_id;
DROP INDEX IF EXISTS idx_capacitaciones_sst_colaborador_fecha;

CREATE INDEX IF NOT EXISTS idx_capacitaciones_sst_area 
    ON capacitaciones_sst(area);

CREATE INDEX IF NOT EXISTS idx_capacitaciones_sst_area_fecha 
    ON capacitaciones_sst(area, fecha_realizacion DESC);

-- 8. Comentarios actualizados
COMMENT ON COLUMN capacitaciones_sst.area IS 'Área de la empresa: Centro Industrial o Hornos Solera';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Verificar la nueva estructura
\d capacitaciones_sst;

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Este script agrega la columna 'area' pero mantiene 'colaborador_id' temporalmente
-- 2. Si tienes datos existentes, descomenta las líneas de migración (UPDATE)
-- 3. Una vez verificado que todo funciona, puedes eliminar 'colaborador_id'
-- 4. El campo 'area' se hará obligatorio después de migrar los datos
-- ============================================================================