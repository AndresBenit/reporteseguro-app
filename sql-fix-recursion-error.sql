-- ============================================================================
-- 🔧 FIX URGENTE: Resolver recursión infinita en políticas RLS
-- ============================================================================
-- ERROR: "infinite recursion detected in policy for relation 'profiles'"
-- CAUSA: La política de eliminación está referenciando profiles que tiene recursión
-- SOLUCIÓN: Políticas simples sin referencias cruzadas
-- ============================================================================

-- 1. ELIMINAR TODAS LAS POLÍTICAS PROBLEMÁTICAS
DROP POLICY IF EXISTS "Solo admins o creadores pueden eliminar capacitaciones" ON capacitaciones_sst;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar capacitaciones" ON capacitaciones_sst;

-- 2. CREAR POLÍTICA SIMPLE SIN REFERENCIAS A PROFILES
CREATE POLICY "capacitaciones_delete_policy" 
    ON capacitaciones_sst FOR DELETE 
    TO authenticated 
    USING (true);  -- Política simple: cualquier usuario autenticado puede eliminar

-- 3. VERIFICAR QUE NO HAY RECURSIÓN EN POLICIES
-- Si el problema persiste, podemos deshabilitar RLS temporalmente:
-- ALTER TABLE capacitaciones_sst DISABLE ROW LEVEL SECURITY;

-- 4. LISTAR TODAS LAS POLÍTICAS DE LA TABLA PARA VERIFICAR
SELECT policyname, cmd, permissive, roles, qual 
FROM pg_policies 
WHERE tablename = 'capacitaciones_sst';

-- ============================================================================
-- ALTERNATIVA DRÁSTICA: DESHABILITAR RLS COMPLETAMENTE
-- ============================================================================
-- Solo usar si el problema persiste:
-- ALTER TABLE capacitaciones_sst DISABLE ROW LEVEL SECURITY;
-- GRANT ALL ON capacitaciones_sst TO authenticated;

-- ============================================================================
-- VERIFICAR POLÍTICAS DE PROFILES (CAUSA DEL PROBLEMA)
-- ============================================================================
-- Ver qué políticas están causando recursión en profiles:
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles' AND qual LIKE '%profiles%';

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. El error viene de que alguna política en 'profiles' se referencia a sí misma
-- 2. Nuestra política de capacitaciones intentaba verificar roles en profiles
-- 3. La solución temporal es una política simple sin referencias externas
-- 4. Después podemos investigar y arreglar las políticas de profiles
-- ============================================================================