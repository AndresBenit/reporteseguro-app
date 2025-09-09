-- ============================================================================
-- 🔧 FIX: Arreglar política de eliminación para capacitaciones_sst
-- ============================================================================
-- Problema: Error al eliminar capacitaciones debido a políticas RLS restrictivas
-- Solución: Permitir que usuarios autenticados puedan eliminar sus propias capacitaciones
-- ============================================================================

-- 1. Eliminar política restrictiva existente si existe
DROP POLICY IF EXISTS "Solo admins o creadores pueden eliminar capacitaciones" ON capacitaciones_sst;

-- 2. Crear nueva política más permisiva para eliminación
CREATE POLICY "Usuarios autenticados pueden eliminar capacitaciones" 
    ON capacitaciones_sst FOR DELETE 
    TO authenticated 
    USING (true);

-- 3. Opcional: Si quieres mantener restricciones, usa esta política más específica
-- CREATE POLICY "Solo creadores pueden eliminar capacitaciones" 
--     ON capacitaciones_sst FOR DELETE 
--     TO authenticated 
--     USING (
--         auth.uid() = created_by OR 
--         created_by IS NULL OR  -- Para registros sin creador específico
--         EXISTS (
--             SELECT 1 FROM profiles 
--             WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
--         )
--     );

-- 4. Verificar que las políticas están correctas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'capacitaciones_sst' AND cmd = 'd';

-- ============================================================================
-- ALTERNATIVA: Si prefieres eliminar completamente RLS para esta tabla
-- ============================================================================
-- CUIDADO: Esto elimina toda la seguridad a nivel de fila
-- ALTER TABLE capacitaciones_sst DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICACIÓN DEL PROBLEMA
-- ============================================================================
-- Para debug: Verificar que el usuario actual tiene permisos
-- SELECT 
--     auth.uid() as current_user_id,
--     EXISTS (
--         SELECT 1 FROM profiles 
--         WHERE id = auth.uid()
--     ) as user_exists_in_profiles;

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- 1. La política permisiva permite que cualquier usuario autenticado elimine
-- 2. Si necesitas más seguridad, usa la política comentada más específica
-- 3. Asegúrate de que el campo created_by se esté llenando correctamente
-- ============================================================================