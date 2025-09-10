CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS auditorias_sst (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    codigo_auditoria TEXT NOT NULL UNIQUE,
    tipo_auditoria TEXT NOT NULL CHECK (tipo_auditoria IN (
        'Interna',
        'Externa', 
        'Gubernamental',
        'Certificación',
        'Seguimiento'
    )),
    
    alcance TEXT NOT NULL,
    objetivo TEXT NOT NULL,
    criterios_auditoria TEXT[],
    
    fecha_planificada DATE NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    duracion_dias INTEGER,
    
    auditor_lider TEXT NOT NULL,
    equipo_auditor TEXT[],
    auditados TEXT[],
    
    areas_auditadas TEXT[] CHECK (areas_auditadas <@ ARRAY['Centro Industrial', 'Hornos Solera', 'Oficinas', 'Todas']),
    procesos_auditados TEXT[],
    
    metodologia TEXT DEFAULT 'ISO 45001',
    normas_referencia TEXT[] DEFAULT ARRAY['ISO 45001:2018', 'Decreto 1072/2015', 'Resolución 0312/2019'],
    
    hallazgos_nc_mayor INTEGER DEFAULT 0,
    hallazgos_nc_menor INTEGER DEFAULT 0,
    observaciones_mejora INTEGER DEFAULT 0,
    fortalezas INTEGER DEFAULT 0,
    
    estado_auditoria TEXT DEFAULT 'planificada' CHECK (estado_auditoria IN (
        'planificada', 'en_ejecucion', 'en_revision', 'cerrada', 'cancelada'
    )),
    
    informe_url TEXT,
    fecha_informe DATE,
    plan_accion_url TEXT,
    
    calificacion_general DECIMAL(3,1) CHECK (calificacion_general >= 0 AND calificacion_general <= 10),
    nivel_madurez TEXT CHECK (nivel_madurez IN ('Inicial', 'En Desarrollo', 'Definido', 'Gestionado', 'Optimizado')),
    
    proxima_auditoria DATE,
    frecuencia_meses INTEGER DEFAULT 12,
    
    observaciones TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS hallazgos_auditoria (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    auditoria_id UUID REFERENCES auditorias_sst(id) ON DELETE CASCADE,
    
    numero_hallazgo TEXT NOT NULL,
    tipo_hallazgo TEXT NOT NULL CHECK (tipo_hallazgo IN (
        'No Conformidad Mayor',
        'No Conformidad Menor', 
        'Observación',
        'Oportunidad de Mejora',
        'Fortaleza'
    )),
    
    requisito_norma TEXT NOT NULL,
    proceso_afectado TEXT,
    area_afectada TEXT,
    
    descripcion_hallazgo TEXT NOT NULL,
    evidencia_objetiva TEXT,
    
    causa_raiz TEXT,
    riesgo_asociado TEXT,
    
    accion_requerida TEXT,
    responsable_accion TEXT,
    fecha_compromiso DATE,
    fecha_verificacion DATE,
    
    estado_hallazgo TEXT DEFAULT 'abierto' CHECK (estado_hallazgo IN (
        'abierto', 'en_tratamiento', 'cerrado', 'verificado'
    )),
    
    eficacia_accion TEXT CHECK (eficacia_accion IN ('Eficaz', 'Parcialmente Eficaz', 'No Eficaz', 'Pendiente')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS programas_auditoria (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    nombre_programa TEXT NOT NULL,
    año INTEGER NOT NULL,
    objetivo_programa TEXT,
    
    alcance_programa TEXT,
    criterios_programa TEXT[],
    
    auditorias_planificadas INTEGER NOT NULL,
    auditorias_ejecutadas INTEGER DEFAULT 0,
    porcentaje_cumplimiento DECIMAL(5,2),
    
    responsable_programa TEXT NOT NULL,
    
    estado_programa TEXT DEFAULT 'activo' CHECK (estado_programa IN ('activo', 'completado', 'suspendido')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(nombre_programa, año)
);

CREATE TABLE IF NOT EXISTS checklist_auditoria (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    nombre_checklist TEXT NOT NULL,
    norma_base TEXT NOT NULL,
    version TEXT DEFAULT '1.0',
    
    items_verificacion JSONB NOT NULL DEFAULT '[]',
    
    activo BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_auditorias_codigo ON auditorias_sst(codigo_auditoria);
CREATE INDEX IF NOT EXISTS idx_auditorias_tipo ON auditorias_sst(tipo_auditoria);
CREATE INDEX IF NOT EXISTS idx_auditorias_fecha ON auditorias_sst(fecha_planificada DESC);
CREATE INDEX IF NOT EXISTS idx_auditorias_estado ON auditorias_sst(estado_auditoria);
CREATE INDEX IF NOT EXISTS idx_auditorias_auditor ON auditorias_sst(auditor_lider);

CREATE INDEX IF NOT EXISTS idx_hallazgos_auditoria ON hallazgos_auditoria(auditoria_id);
CREATE INDEX IF NOT EXISTS idx_hallazgos_tipo ON hallazgos_auditoria(tipo_hallazgo);
CREATE INDEX IF NOT EXISTS idx_hallazgos_estado ON hallazgos_auditoria(estado_hallazgo);
CREATE INDEX IF NOT EXISTS idx_hallazgos_responsable ON hallazgos_auditoria(responsable_accion);

CREATE INDEX IF NOT EXISTS idx_programas_año ON programas_auditoria(año DESC);
CREATE INDEX IF NOT EXISTS idx_programas_estado ON programas_auditoria(estado_programa);

CREATE INDEX IF NOT EXISTS idx_checklist_norma ON checklist_auditoria(norma_base);
CREATE INDEX IF NOT EXISTS idx_checklist_activo ON checklist_auditoria(activo) WHERE activo = true;

CREATE OR REPLACE FUNCTION update_auditorias_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calcular_porcentaje_programa() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.auditorias_planificadas > 0 THEN
        NEW.porcentaje_cumplimiento = (NEW.auditorias_ejecutadas * 100.0) / NEW.auditorias_planificadas;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_auditorias ON auditorias_sst;
CREATE TRIGGER trigger_update_auditorias BEFORE UPDATE ON auditorias_sst FOR EACH ROW EXECUTE FUNCTION update_auditorias_updated_at();
DROP TRIGGER IF EXISTS trigger_update_hallazgos ON hallazgos_auditoria;
CREATE TRIGGER trigger_update_hallazgos BEFORE UPDATE ON hallazgos_auditoria FOR EACH ROW EXECUTE FUNCTION update_auditorias_updated_at();
DROP TRIGGER IF EXISTS trigger_update_programas ON programas_auditoria;
CREATE TRIGGER trigger_update_programas BEFORE UPDATE ON programas_auditoria FOR EACH ROW EXECUTE FUNCTION update_auditorias_updated_at();

DROP TRIGGER IF EXISTS trigger_calcular_porcentaje ON programas_auditoria;
CREATE TRIGGER trigger_calcular_porcentaje BEFORE INSERT OR UPDATE ON programas_auditoria FOR EACH ROW EXECUTE FUNCTION calcular_porcentaje_programa();

ALTER TABLE auditorias_sst ENABLE ROW LEVEL SECURITY;
ALTER TABLE hallazgos_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE programas_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_auditoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auditorias_select_policy" ON auditorias_sst;
CREATE POLICY "auditorias_select_policy" ON auditorias_sst FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auditorias_insert_policy" ON auditorias_sst;
CREATE POLICY "auditorias_insert_policy" ON auditorias_sst FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auditorias_update_policy" ON auditorias_sst;
CREATE POLICY "auditorias_update_policy" ON auditorias_sst FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "auditorias_delete_policy" ON auditorias_sst;
CREATE POLICY "auditorias_delete_policy" ON auditorias_sst FOR DELETE TO authenticated USING (true);

CREATE POLICY "hallazgos_auditoria_select_policy" ON hallazgos_auditoria FOR SELECT TO authenticated USING (true);
CREATE POLICY "hallazgos_auditoria_insert_policy" ON hallazgos_auditoria FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "hallazgos_auditoria_update_policy" ON hallazgos_auditoria FOR UPDATE TO authenticated USING (true);
CREATE POLICY "hallazgos_auditoria_delete_policy" ON hallazgos_auditoria FOR DELETE TO authenticated USING (true);

CREATE POLICY "programas_auditoria_select_policy" ON programas_auditoria FOR SELECT TO authenticated USING (true);
CREATE POLICY "programas_auditoria_insert_policy" ON programas_auditoria FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "programas_auditoria_update_policy" ON programas_auditoria FOR UPDATE TO authenticated USING (true);
CREATE POLICY "programas_auditoria_delete_policy" ON programas_auditoria FOR DELETE TO authenticated USING (true);

CREATE POLICY "checklist_auditoria_select_policy" ON checklist_auditoria FOR SELECT TO authenticated USING (true);
CREATE POLICY "checklist_auditoria_insert_policy" ON checklist_auditoria FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "checklist_auditoria_update_policy" ON checklist_auditoria FOR UPDATE TO authenticated USING (true);
CREATE POLICY "checklist_auditoria_delete_policy" ON checklist_auditoria FOR DELETE TO authenticated USING (true);