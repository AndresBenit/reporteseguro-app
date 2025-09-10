CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS inspecciones_sst (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    titulo TEXT NOT NULL,
    tipo_inspeccion TEXT NOT NULL CHECK (tipo_inspeccion IN (
        'Seguridad General',
        'EPP',
        'Herramientas y Equipos',
        'Orden y Aseo',
        'Condiciones Locativas',
        'Sistemas de Emergencia',
        'Riesgo Eléctrico',
        'Trabajo en Alturas',
        'Espacios Confinados',
        'Maquinaria y Equipos',
        'Higiene Industrial',
        'Otro'
    )),
    
    area_inspeccion TEXT CHECK (area_inspeccion IN ('Centro Industrial', 'Hornos Solera', 'Ambas', 'General')),
    ubicacion_especifica TEXT,
    
    fecha_programada DATE NOT NULL,
    fecha_realizada DATE,
    hora_inicio TIME,
    hora_fin TIME,
    duracion_minutos INTEGER,
    
    inspector_responsable TEXT NOT NULL,
    acompanantes TEXT[],
    
    checklist_items JSONB DEFAULT '[]',
    total_items INTEGER DEFAULT 0,
    items_conformes INTEGER DEFAULT 0,
    items_no_conformes INTEGER DEFAULT 0,
    porcentaje_cumplimiento DECIMAL(5,2),
    
    hallazgos JSONB DEFAULT '[]',
    observaciones_generales TEXT,
    recomendaciones TEXT,
    
    estado TEXT DEFAULT 'programada' CHECK (estado IN ('programada', 'en_proceso', 'completada', 'cerrada')),
    prioridad TEXT DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
    
    evidencias_fotos TEXT[],
    documento_url TEXT,
    
    requiere_seguimiento BOOLEAN DEFAULT false,
    fecha_seguimiento DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS plantillas_checklist (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    nombre TEXT NOT NULL,
    tipo_inspeccion TEXT NOT NULL,
    descripcion TEXT,
    
    items JSONB NOT NULL DEFAULT '[]',
    
    activa BOOLEAN DEFAULT true,
    version TEXT DEFAULT '1.0',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS hallazgos_inspeccion (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    inspeccion_id UUID REFERENCES inspecciones_sst(id) ON DELETE CASCADE,
    
    descripcion TEXT NOT NULL,
    tipo_hallazgo TEXT NOT NULL CHECK (tipo_hallazgo IN (
        'Condición Insegura',
        'Acto Inseguro',
        'Falta de EPP',
        'Deficiencia Equipos',
        'Falta Señalización',
        'Orden y Aseo',
        'Documentación',
        'Capacitación',
        'Otro'
    )),
    
    severidad TEXT NOT NULL CHECK (severidad IN ('baja', 'media', 'alta', 'critica')),
    ubicacion TEXT,
    
    evidencia_foto_url TEXT,
    
    accion_requerida TEXT,
    responsable_accion TEXT,
    fecha_compromiso DATE,
    
    estado_accion TEXT DEFAULT 'pendiente' CHECK (estado_accion IN ('pendiente', 'en_proceso', 'completada', 'vencida')),
    fecha_completada DATE,
    evidencia_correccion_url TEXT,
    
    observaciones TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS programacion_inspecciones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    nombre_programa TEXT NOT NULL,
    descripcion TEXT,
    
    tipo_inspeccion TEXT NOT NULL,
    area_objetivo TEXT,
    frecuencia TEXT NOT NULL CHECK (frecuencia IN ('diaria', 'semanal', 'quincenal', 'mensual', 'bimestral', 'trimestral', 'semestral', 'anual')),
    
    dia_semana INTEGER CHECK (dia_semana >= 1 AND dia_semana <= 7),
    dia_mes INTEGER CHECK (dia_mes >= 1 AND dia_mes <= 31),
    
    inspector_asignado TEXT,
    plantilla_checklist_id UUID REFERENCES plantillas_checklist(id),
    
    activo BOOLEAN DEFAULT true,
    ultima_ejecucion DATE,
    proxima_ejecucion DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_inspecciones_tipo ON inspecciones_sst(tipo_inspeccion);
CREATE INDEX IF NOT EXISTS idx_inspecciones_area ON inspecciones_sst(area_inspeccion);
CREATE INDEX IF NOT EXISTS idx_inspecciones_estado ON inspecciones_sst(estado);
CREATE INDEX IF NOT EXISTS idx_inspecciones_fecha_programada ON inspecciones_sst(fecha_programada DESC);
CREATE INDEX IF NOT EXISTS idx_inspecciones_fecha_realizada ON inspecciones_sst(fecha_realizada DESC);
CREATE INDEX IF NOT EXISTS idx_inspecciones_prioridad ON inspecciones_sst(prioridad);

CREATE INDEX IF NOT EXISTS idx_plantillas_checklist_tipo ON plantillas_checklist(tipo_inspeccion);
CREATE INDEX IF NOT EXISTS idx_plantillas_checklist_activa ON plantillas_checklist(activa) WHERE activa = true;

CREATE INDEX IF NOT EXISTS idx_hallazgos_inspeccion ON hallazgos_inspeccion(inspeccion_id);
CREATE INDEX IF NOT EXISTS idx_hallazgos_tipo ON hallazgos_inspeccion(tipo_hallazgo);
CREATE INDEX IF NOT EXISTS idx_hallazgos_severidad ON hallazgos_inspeccion(severidad);
CREATE INDEX IF NOT EXISTS idx_hallazgos_estado_accion ON hallazgos_inspeccion(estado_accion);
CREATE INDEX IF NOT EXISTS idx_hallazgos_fecha_compromiso ON hallazgos_inspeccion(fecha_compromiso);

CREATE INDEX IF NOT EXISTS idx_programacion_tipo ON programacion_inspecciones(tipo_inspeccion);
CREATE INDEX IF NOT EXISTS idx_programacion_activo ON programacion_inspecciones(activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_programacion_proxima ON programacion_inspecciones(proxima_ejecucion);

CREATE OR REPLACE FUNCTION update_inspecciones_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_inspecciones ON inspecciones_sst;
CREATE TRIGGER trigger_update_inspecciones BEFORE UPDATE ON inspecciones_sst FOR EACH ROW EXECUTE FUNCTION update_inspecciones_updated_at();
DROP TRIGGER IF EXISTS trigger_update_plantillas_checklist ON plantillas_checklist;
CREATE TRIGGER trigger_update_plantillas_checklist BEFORE UPDATE ON plantillas_checklist FOR EACH ROW EXECUTE FUNCTION update_inspecciones_updated_at();
DROP TRIGGER IF EXISTS trigger_update_hallazgos_inspeccion ON hallazgos_inspeccion;
CREATE TRIGGER trigger_update_hallazgos_inspeccion BEFORE UPDATE ON hallazgos_inspeccion FOR EACH ROW EXECUTE FUNCTION update_inspecciones_updated_at();
DROP TRIGGER IF EXISTS trigger_update_programacion_inspecciones ON programacion_inspecciones;
CREATE TRIGGER trigger_update_programacion_inspecciones BEFORE UPDATE ON programacion_inspecciones FOR EACH ROW EXECUTE FUNCTION update_inspecciones_updated_at();

ALTER TABLE inspecciones_sst ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE hallazgos_inspeccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE programacion_inspecciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inspecciones_select_policy" ON inspecciones_sst;
CREATE POLICY "inspecciones_select_policy" ON inspecciones_sst FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "inspecciones_insert_policy" ON inspecciones_sst;
CREATE POLICY "inspecciones_insert_policy" ON inspecciones_sst FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "inspecciones_update_policy" ON inspecciones_sst;
CREATE POLICY "inspecciones_update_policy" ON inspecciones_sst FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "inspecciones_delete_policy" ON inspecciones_sst;
CREATE POLICY "inspecciones_delete_policy" ON inspecciones_sst FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "plantillas_checklist_select_policy" ON plantillas_checklist;
CREATE POLICY "plantillas_checklist_select_policy" ON plantillas_checklist FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "plantillas_checklist_insert_policy" ON plantillas_checklist;
CREATE POLICY "plantillas_checklist_insert_policy" ON plantillas_checklist FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "plantillas_checklist_update_policy" ON plantillas_checklist;
CREATE POLICY "plantillas_checklist_update_policy" ON plantillas_checklist FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "plantillas_checklist_delete_policy" ON plantillas_checklist;
CREATE POLICY "plantillas_checklist_delete_policy" ON plantillas_checklist FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "hallazgos_inspeccion_select_policy" ON hallazgos_inspeccion;
CREATE POLICY "hallazgos_inspeccion_select_policy" ON hallazgos_inspeccion FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "hallazgos_inspeccion_insert_policy" ON hallazgos_inspeccion;
CREATE POLICY "hallazgos_inspeccion_insert_policy" ON hallazgos_inspeccion FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "hallazgos_inspeccion_update_policy" ON hallazgos_inspeccion;
CREATE POLICY "hallazgos_inspeccion_update_policy" ON hallazgos_inspeccion FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "hallazgos_inspeccion_delete_policy" ON hallazgos_inspeccion;
CREATE POLICY "hallazgos_inspeccion_delete_policy" ON hallazgos_inspeccion FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "programacion_inspecciones_select_policy" ON programacion_inspecciones;
CREATE POLICY "programacion_inspecciones_select_policy" ON programacion_inspecciones FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "programacion_inspecciones_insert_policy" ON programacion_inspecciones;
CREATE POLICY "programacion_inspecciones_insert_policy" ON programacion_inspecciones FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "programacion_inspecciones_update_policy" ON programacion_inspecciones;
CREATE POLICY "programacion_inspecciones_update_policy" ON programacion_inspecciones FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "programacion_inspecciones_delete_policy" ON programacion_inspecciones;
CREATE POLICY "programacion_inspecciones_delete_policy" ON programacion_inspecciones FOR DELETE TO authenticated USING (true);

INSERT INTO plantillas_checklist (nombre, tipo_inspeccion, descripcion, items, activa) VALUES ('Checklist Seguridad General', 'Seguridad General', 'Inspección general de condiciones de seguridad', '[{"item": "Señalización visible y clara", "tipo": "boolean", "obligatorio": true}, {"item": "Rutas de evacuación despejadas", "tipo": "boolean", "obligatorio": true}, {"item": "Extintores en su lugar y vigentes", "tipo": "boolean", "obligatorio": true}, {"item": "Botiquín completo y vigente", "tipo": "boolean", "obligatorio": true}, {"item": "Iluminación adecuada", "tipo": "boolean", "obligatorio": true}]', true);

INSERT INTO plantillas_checklist (nombre, tipo_inspeccion, descripcion, items, activa) VALUES ('Checklist EPP', 'EPP', 'Verificación uso correcto de elementos de protección personal', '[{"item": "Uso de casco", "tipo": "boolean", "obligatorio": true}, {"item": "Uso de gafas de seguridad", "tipo": "boolean", "obligatorio": true}, {"item": "Uso de calzado de seguridad", "tipo": "boolean", "obligatorio": true}, {"item": "Uso de chaleco reflectivo", "tipo": "boolean", "obligatorio": true}, {"item": "EPP en buen estado", "tipo": "boolean", "obligatorio": true}]', true);

INSERT INTO programacion_inspecciones (nombre_programa, descripcion, tipo_inspeccion, area_objetivo, frecuencia, inspector_asignado, activo) VALUES ('Inspección Semanal Seguridad', 'Inspección semanal de condiciones generales de seguridad', 'Seguridad General', 'Ambas', 'semanal', 'Coordinador SST', true);

INSERT INTO programacion_inspecciones (nombre_programa, descripcion, tipo_inspeccion, area_objetivo, frecuencia, inspector_asignado, activo) VALUES ('Control Diario EPP', 'Verificación diaria del uso correcto de EPP', 'EPP', 'Ambas', 'diaria', 'Supervisor de turno', true);