-- ============================================================================
-- 🔧 FIX URGENTE: Resolver constraint NOT NULL en colaborador_id
-- ============================================================================
-- PROBLEMA: El campo colaborador_id sigue siendo NOT NULL pero ya no lo usamos
-- SOLUCIÓN: Hacer colaborador_id nullable o eliminarlo completamente
-- ============================================================================

-- OPCIÓN 1: HACER COLABORADOR_ID NULLABLE (Recomendado para mantener datos)
-- ============================================================================

-- 1. Quitar constraint NOT NULL de colaborador_id
ALTER TABLE capacitaciones_sst 
ALTER COLUMN colaborador_id DROP NOT NULL;

-- 2. Verificar que el cambio se aplicó
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'capacitaciones_sst' 
    AND column_name IN ('colaborador_id', 'area');

-- ============================================================================
-- OPCIÓN 2: ELIMINAR COMPLETAMENTE COLABORADOR_ID (Si no tienes datos importantes)
-- ============================================================================

-- Solo ejecutar si quieres eliminar completamente la columna:
-- CUIDADO: Esto eliminará permanentemente todos los datos de colaborador_id

-- -- 1. Eliminar foreign key constraint primero
-- ALTER TABLE capacitaciones_sst 
-- DROP CONSTRAINT IF EXISTS capacitaciones_sst_colaborador_id_fkey;

-- -- 2. Eliminar índices relacionados
-- DROP INDEX IF EXISTS idx_capacitaciones_sst_colaborador_id;
-- DROP INDEX IF EXISTS idx_capacitaciones_sst_colaborador_fecha;

-- -- 3. Eliminar la columna completamente
-- ALTER TABLE capacitaciones_sst 
-- DROP COLUMN IF EXISTS colaborador_id;

-- ============================================================================
-- VERIFICACIONES
-- ============================================================================

-- Verificar estructura actual de la tabla
\d capacitaciones_sst;

-- Ver todas las constraints de la tabla
SELECT 
    conname, 
    contype, 
    pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'capacitaciones_sst';

-- ============================================================================
-- PRUEBA DESPUÉS DEL FIX
-- ============================================================================

-- Después de ejecutar el fix, prueba insertar un registro:
-- INSERT INTO capacitaciones_sst (
--     titulo, 
--     area, 
--     tipo_capacitacion, 
--     fecha_realizacion
-- ) VALUES (
--     'Prueba de inserción',
--     'Centro Industrial',
--     'Seguridad Industrial',
--     CURRENT_DATE
-- );

-- ============================================================================
-- RECOMENDACIÓN
-- ============================================================================
-- Usar OPCIÓN 1 (hacer nullable) porque:
-- 1. Mantiene compatibilidad hacia atrás
-- 2. No pierde datos existentes
-- 3. Permite transición gradual
-- 4. Más seguro para producción
-- ============================================================================