-- ✅ SCRIPT SQL PARA ACTUALIZAR ESQUEMA DE SUPABASE
-- Ejecutar estos comandos en el SQL Editor de Supabase para completar las funcionalidades

-- 1. Agregar campo para fecha de última actualización
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS fecha_ultima_actualizacion TIMESTAMPTZ DEFAULT NOW();

-- 2. Agregar campo para historial de estados (JSON)
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS historial_estados JSONB DEFAULT '{}';

-- 3. Agregar campo para asignación de reportes
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS asignado_a VARCHAR(200);

-- 4. Agregar campo para fecha estimada de resolución
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS fecha_estimada TIMESTAMPTZ;

-- 5. Actualizar registros existentes con historial inicial
UPDATE reportes 
SET historial_estados = jsonb_build_object(
  extract(epoch from created_at)::text, 
  jsonb_build_object(
    'estado', estado,
    'fecha', created_at,
    'comentario', 'Estado inicial del reporte',
    'usuario', 'Sistema'
  )
)
WHERE historial_estados = '{}' OR historial_estados IS NULL;

-- 6. Crear trigger para actualizar fecha_ultima_actualizacion automáticamente
CREATE OR REPLACE FUNCTION update_fecha_ultima_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_ultima_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_update_fecha_ultima_actualizacion ON reportes;
CREATE TRIGGER trigger_update_fecha_ultima_actualizacion
    BEFORE UPDATE ON reportes
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_ultima_actualizacion();

-- 7. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_reportes_fecha_ultima_actualizacion ON reportes(fecha_ultima_actualizacion);
CREATE INDEX IF NOT EXISTS idx_reportes_asignado_a ON reportes(asignado_a);
CREATE INDEX IF NOT EXISTS idx_reportes_fecha_estimada ON reportes(fecha_estimada);

-- 8. Comentarios en las columnas para documentación
COMMENT ON COLUMN reportes.fecha_ultima_actualizacion IS 'Fecha y hora de la última actualización del reporte';
COMMENT ON COLUMN reportes.historial_estados IS 'Historial completo de cambios de estado en formato JSON';
COMMENT ON COLUMN reportes.asignado_a IS 'Usuario o departamento asignado para resolver el reporte';
COMMENT ON COLUMN reportes.fecha_estimada IS 'Fecha estimada para la resolución del reporte';

-- ✅ VERIFICACIÓN: Consulta para validar que todo funcionó
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'reportes' 
  AND column_name IN (
    'fecha_ultima_actualizacion', 
    'historial_estados', 
    'asignado_a', 
    'fecha_estimada'
  )
ORDER BY column_name;