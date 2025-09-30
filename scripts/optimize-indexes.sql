-- 🚀 OPTIMIZACIÓN DE ÍNDICES PARA REPORTESEGURO
-- Mejora el rendimiento de consultas frecuentes en Supabase PostgreSQL

-- ============================================
-- TABLA: reportes
-- ============================================

-- Índice para filtrar por estado (consulta más frecuente)
CREATE INDEX IF NOT EXISTS idx_reportes_estado
ON reportes(estado);

-- Índice para ordenar por fecha de creación (dashboard, listas)
CREATE INDEX IF NOT EXISTS idx_reportes_created_at
ON reportes(created_at DESC);

-- Índice compuesto para filtrar por estado + ordenar por fecha
CREATE INDEX IF NOT EXISTS idx_reportes_estado_created
ON reportes(estado, created_at DESC);

-- Índice para búsquedas por tipo de reporte
CREATE INDEX IF NOT EXISTS idx_reportes_tipo
ON reportes(tipo);

-- Índice para búsquedas por prioridad
CREATE INDEX IF NOT EXISTS idx_reportes_prioridad
ON reportes(prioridad)
WHERE prioridad IS NOT NULL;

-- Índice para búsquedas por área
CREATE INDEX IF NOT EXISTS idx_reportes_area
ON reportes(area)
WHERE area IS NOT NULL;

-- ============================================
-- TABLA: colaboradores
-- ============================================

-- Índice para filtrar colaboradores activos (consulta muy frecuente)
CREATE INDEX IF NOT EXISTS idx_colaboradores_activo
ON colaboradores(activo)
WHERE activo = true;

-- Índice para ordenar por nombre (listas alfabéticas)
CREATE INDEX IF NOT EXISTS idx_colaboradores_nombre
ON colaboradores(nombre);

-- Índice para búsquedas por área
CREATE INDEX IF NOT EXISTS idx_colaboradores_area
ON colaboradores(area)
WHERE area IS NOT NULL;

-- Índice para búsquedas por cédula (identificación única)
CREATE INDEX IF NOT EXISTS idx_colaboradores_cedula
ON colaboradores(cedula)
WHERE cedula IS NOT NULL;

-- Índice compuesto área + activo (análisis EPP)
CREATE INDEX IF NOT EXISTS idx_colaboradores_area_activo
ON colaboradores(area, activo)
WHERE activo = true AND area IS NOT NULL;

-- ============================================
-- TABLA: supervision_campo
-- ============================================

-- Índice para ordenar por fecha
CREATE INDEX IF NOT EXISTS idx_supervision_created_at
ON supervision_campo(created_at DESC);

-- Índice para filtrar por estado
CREATE INDEX IF NOT EXISTS idx_supervision_estado
ON supervision_campo(estado);

-- Índice compuesto estado + fecha
CREATE INDEX IF NOT EXISTS idx_supervision_estado_created
ON supervision_campo(estado, created_at DESC);

-- ============================================
-- TABLA: abordajes_campo
-- ============================================

-- Índice para ordenar por fecha
CREATE INDEX IF NOT EXISTS idx_abordajes_created_at
ON abordajes_campo(created_at DESC);

-- Índice para filtrar por estado
CREATE INDEX IF NOT EXISTS idx_abordajes_estado
ON abordajes_campo(estado);

-- Índice compuesto estado + fecha
CREATE INDEX IF NOT EXISTS idx_abordajes_estado_created
ON abordajes_campo(estado, created_at DESC);

-- ============================================
-- TABLA: control_epp
-- ============================================

-- Índice para ordenar por fecha de entrega
CREATE INDEX IF NOT EXISTS idx_control_epp_fecha
ON control_epp(fecha_entrega DESC);

-- Índice para búsquedas por nombre de persona
CREATE INDEX IF NOT EXISTS idx_control_epp_nombre
ON control_epp(nombre);

-- Índice para análisis por área
CREATE INDEX IF NOT EXISTS idx_control_epp_area
ON control_epp(area)
WHERE area IS NOT NULL;

-- Índice compuesto área + fecha (análisis temporal por área)
CREATE INDEX IF NOT EXISTS idx_control_epp_area_fecha
ON control_epp(area, fecha_entrega DESC)
WHERE area IS NOT NULL;

-- ============================================
-- TABLA: capacitaciones
-- ============================================

-- Índice para ordenar por fecha
CREATE INDEX IF NOT EXISTS idx_capacitaciones_fecha
ON capacitaciones(fecha_capacitacion DESC);

-- Índice para filtrar por estado
CREATE INDEX IF NOT EXISTS idx_capacitaciones_estado
ON capacitaciones(estado);

-- ============================================
-- TABLA: examenes_medicos
-- ============================================

-- Índice para ordenar por fecha de examen
CREATE INDEX IF NOT EXISTS idx_examenes_fecha
ON examenes_medicos(fecha_examen DESC);

-- Índice para filtrar por tipo de examen
CREATE INDEX IF NOT EXISTS idx_examenes_tipo
ON examenes_medicos(tipo_examen);

-- Índice para búsquedas por colaborador
CREATE INDEX IF NOT EXISTS idx_examenes_colaborador
ON examenes_medicos(colaborador_id)
WHERE colaborador_id IS NOT NULL;

-- ============================================
-- TABLA: inventario_epp
-- ============================================

-- Índice para ordenar por nombre de producto
CREATE INDEX IF NOT EXISTS idx_inventario_nombre
ON inventario_epp(nombre);

-- Índice para productos con stock bajo
CREATE INDEX IF NOT EXISTS idx_inventario_stock_bajo
ON inventario_epp(cantidad_actual)
WHERE cantidad_actual < cantidad_minima;

-- ============================================
-- TABLA: auditorias
-- ============================================

-- Índice para ordenar por fecha de auditoría
CREATE INDEX IF NOT EXISTS idx_auditorias_fecha
ON auditorias(fecha_auditoria DESC);

-- Índice para filtrar por estado
CREATE INDEX IF NOT EXISTS idx_auditorias_estado
ON auditorias(estado);

-- ============================================
-- TABLA: matriz_riesgos
-- ============================================

-- Índice para filtrar por nivel de riesgo
CREATE INDEX IF NOT EXISTS idx_riesgos_nivel
ON matriz_riesgos(nivel_riesgo);

-- Índice para búsquedas por área
CREATE INDEX IF NOT EXISTS idx_riesgos_area
ON matriz_riesgos(area)
WHERE area IS NOT NULL;

-- Índice compuesto nivel + área
CREATE INDEX IF NOT EXISTS idx_riesgos_nivel_area
ON matriz_riesgos(nivel_riesgo, area);

-- ============================================
-- VERIFICACIÓN DE ÍNDICES
-- ============================================

-- Ejecutar esta consulta para ver todos los índices creados:
/*
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
*/

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. Los índices mejoran SELECT pero ralentizan INSERT/UPDATE
-- 2. WHERE clauses en índices parciales reducen tamaño
-- 3. Índices descendentes (DESC) optimizan ORDER BY DESC
-- 4. Índices compuestos optimizan filtrado + ordenamiento
-- 5. Ejecutar ANALYZE después de crear índices

-- Ejecutar análisis de estadísticas (opcional, recomendado)
ANALYZE reportes;
ANALYZE colaboradores;
ANALYZE supervision_campo;
ANALYZE abordajes_campo;
ANALYZE control_epp;
ANALYZE capacitaciones;
ANALYZE examenes_medicos;
ANALYZE inventario_epp;
ANALYZE auditorias;
ANALYZE matriz_riesgos;

-- ✅ COMPLETADO: Índices optimizados para consultas frecuentes
