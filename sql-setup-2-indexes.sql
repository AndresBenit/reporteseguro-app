-- ============================================================================
-- 🏗️ PASO 2: CREAR ÍNDICES PARA MEJOR PERFORMANCE
-- ============================================================================

-- Índices para reportes
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_severidad ON reportes(severidad);
CREATE INDEX IF NOT EXISTS idx_reportes_area ON reportes(area);
CREATE INDEX IF NOT EXISTS idx_reportes_creado_por ON reportes(creado_por);
CREATE INDEX IF NOT EXISTS idx_reportes_fecha_creacion ON reportes(fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_reportes_asignado_a ON reportes(asignado_a);
CREATE INDEX IF NOT EXISTS idx_reportes_firebase_id ON reportes(firebase_id);

-- Índices para colaboradores
CREATE INDEX IF NOT EXISTS idx_colaboradores_nombre ON colaboradores(nombre);
CREATE INDEX IF NOT EXISTS idx_colaboradores_cedula ON colaboradores(cedula);
CREATE INDEX IF NOT EXISTS idx_colaboradores_email ON colaboradores(email);
CREATE INDEX IF NOT EXISTS idx_colaboradores_area ON colaboradores(area);
CREATE INDEX IF NOT EXISTS idx_colaboradores_activo ON colaboradores(activo);
CREATE INDEX IF NOT EXISTS idx_colaboradores_firebase_id ON colaboradores(firebase_id);