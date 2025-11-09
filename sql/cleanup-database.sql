-- =====================================================================
-- SCRIPT DE LIMPIEZA DE BASE DE DATOS - ReporteSeguro
-- =====================================================================
-- Este script elimina tablas duplicadas y columnas redundantes
-- IMPORTANTE: Revisa cada sección antes de ejecutar
-- =====================================================================

-- =====================================================================
-- SECCIÓN 1: ELIMINAR TABLA reportes_old (SI NO TIENE DATOS IMPORTANTES)
-- =====================================================================
-- ⚠️ ADVERTENCIA: Esta tabla parece ser una versión antigua de 'reportes'
-- Antes de ejecutar, verifica si tiene datos importantes:
--
-- SELECT COUNT(*) FROM reportes_old;
-- SELECT * FROM reportes_old LIMIT 10;
--
-- Si la tabla está vacía o sus datos ya están migrados a 'reportes', ejecuta:

-- DROP TABLE IF EXISTS reportes_old CASCADE;

-- =====================================================================
-- SECCIÓN 2: LIMPIAR COLUMNAS DUPLICADAS EN planes_emergencia
-- =====================================================================
-- Esta tabla tiene columnas duplicadas (versión 1 y versión 2)
-- Vamos a mantener la versión 2 (más descriptiva) y eliminar la versión 1

-- ⚠️ ANTES DE EJECUTAR: Verifica qué columnas tienen datos
-- SELECT
--   COUNT(nombre) as nombre_count,
--   COUNT(nombre_plan) as nombre_plan_count,
--   COUNT(tipo_emergencia) as tipo_emergencia_count,
--   COUNT(nivel_emergencia) as nivel_emergencia_count
-- FROM planes_emergencia;

-- Si las columnas antiguas están vacías, ejecuta este bloque:

-- Migrar datos de columnas antiguas a nuevas (por si acaso)
UPDATE planes_emergencia
SET
  nombre_plan = COALESCE(nombre_plan, nombre),
  nivel_emergencia = COALESCE(nivel_emergencia, tipo_emergencia),
  alcance_plan = COALESCE(alcance_plan, alcance),
  responsable_plan = COALESCE(responsable_plan, (responsables->0->>'nombre')::text),
  version_plan = COALESCE(version_plan, version),
  objetivo_plan = COALESCE(objetivo_plan, (objetivos->0)::text),
  estado_plan = COALESCE(estado_plan,
    CASE WHEN activo = true THEN 'activo' ELSE 'inactivo' END)
WHERE nombre_plan IS NULL OR nivel_emergencia IS NULL;

-- Ahora eliminar las columnas duplicadas (versión 1)
ALTER TABLE planes_emergencia
  DROP COLUMN IF EXISTS nombre,
  DROP COLUMN IF EXISTS tipo_emergencia,
  DROP COLUMN IF EXISTS area_aplicacion,
  DROP COLUMN IF EXISTS alcance,
  DROP COLUMN IF EXISTS objetivos,
  DROP COLUMN IF EXISTS procedimientos,
  DROP COLUMN IF EXISTS recursos_necesarios,
  DROP COLUMN IF EXISTS responsables,
  DROP COLUMN IF EXISTS rutas_evacuacion,
  DROP COLUMN IF EXISTS puntos_encuentro,
  DROP COLUMN IF EXISTS numeros_emergencia,
  DROP COLUMN IF EXISTS activo,
  DROP COLUMN IF EXISTS fecha_aprobacion,
  DROP COLUMN IF EXISTS aprobado_por,
  DROP COLUMN IF EXISTS version,
  DROP COLUMN IF EXISTS observaciones;

-- =====================================================================
-- SECCIÓN 3: LIMPIAR COLUMNAS DUPLICADAS EN simulacros_emergencia
-- =====================================================================
-- Similar a planes_emergencia, esta tabla tiene duplicación

-- ⚠️ ANTES DE EJECUTAR: Verifica qué columnas tienen datos
-- SELECT
--   COUNT(fecha_simulacro) as fecha_simulacro_count,
--   COUNT(fecha_programada) as fecha_programada_count,
--   COUNT(observaciones) as observaciones_count,
--   COUNT(estado) as estado_count,
--   COUNT(estado_simulacro) as estado_simulacro_count
-- FROM simulacros_emergencia;

-- Migrar datos de columnas antiguas a nuevas
UPDATE simulacros_emergencia
SET
  codigo_simulacro = COALESCE(codigo_simulacro, 'SIM-' || id::text),
  fecha_programada = COALESCE(fecha_programada, fecha_simulacro),
  estado_simulacro = COALESCE(estado_simulacro, estado)
WHERE codigo_simulacro IS NULL OR fecha_programada IS NULL;

-- Eliminar columnas duplicadas
ALTER TABLE simulacros_emergencia
  DROP COLUMN IF EXISTS fecha_simulacro,
  DROP COLUMN IF EXISTS hora_inicio,
  DROP COLUMN IF EXISTS hora_fin,
  DROP COLUMN IF EXISTS duracion_minutos,
  DROP COLUMN IF EXISTS tipo_simulacro,
  DROP COLUMN IF EXISTS area_simulacro,
  DROP COLUMN IF EXISTS participantes_esperados,
  DROP COLUMN IF EXISTS participantes_reales,
  DROP COLUMN IF EXISTS porcentaje_participacion,
  DROP COLUMN IF EXISTS tiempo_evacuacion_objetivo,
  DROP COLUMN IF EXISTS tiempo_evacuacion_real,
  DROP COLUMN IF EXISTS observaciones,
  DROP COLUMN IF EXISTS hallazgos,
  DROP COLUMN IF EXISTS acciones_mejora,
  DROP COLUMN IF EXISTS responsable_simulacro,
  DROP COLUMN IF EXISTS estado,
  DROP COLUMN IF EXISTS evaluacion_general;

-- =====================================================================
-- SECCIÓN 4: VERIFICACIÓN FINAL
-- =====================================================================
-- Ejecuta estos queries para verificar que todo quedó bien:

-- Ver todas las tablas que quedaron
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Ver columnas de planes_emergencia
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'planes_emergencia'
ORDER BY ordinal_position;

-- Ver columnas de simulacros_emergencia
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'simulacros_emergencia'
ORDER BY ordinal_position;

-- =====================================================================
-- NOTAS IMPORTANTES:
-- =====================================================================
-- 1. Este script está comentado por seguridad
-- 2. Descomenta cada sección SOLO después de verificar
-- 3. Haz backup antes de ejecutar (Supabase hace backups automáticos)
-- 4. Ejecuta sección por sección, no todo de una vez
-- 5. Si algo sale mal, contacta a soporte de Supabase para restaurar
-- =====================================================================
