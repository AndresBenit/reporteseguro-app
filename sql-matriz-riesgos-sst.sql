CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS matriz_riesgos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    codigo_riesgo TEXT NOT NULL UNIQUE,
    version TEXT DEFAULT '1.0',
    fecha_evaluacion DATE NOT NULL DEFAULT CURRENT_DATE,
    
    proceso TEXT NOT NULL,
    actividad TEXT NOT NULL,
    tarea TEXT,
    
    area TEXT CHECK (area IN ('Centro Industrial', 'Hornos Solera', 'Oficinas', 'Transporte', 'General')),
    puesto_trabajo TEXT,
    
    peligro_identificado TEXT NOT NULL,
    clasificacion_peligro TEXT NOT NULL CHECK (clasificacion_peligro IN (
        'Biológico', 'Físico', 'Químico', 'Psicosocial', 'Biomecánico', 
        'Condiciones de Seguridad', 'Fenómenos Naturales'
    )),
    
    descripcion_riesgo TEXT NOT NULL,
    efectos_salud TEXT[],
    
    personas_expuestas INTEGER DEFAULT 1,
    tiempo_exposicion_horas DECIMAL(4,2),
    rutinario BOOLEAN DEFAULT true,
    
    controles_existentes JSONB DEFAULT '{"fuente": [], "medio": [], "persona": []}',
    
    nivel_deficiencia INTEGER CHECK (nivel_deficiencia IN (2, 6, 10)),
    nivel_exposicion INTEGER CHECK (nivel_exposicion IN (1, 2, 3, 4)),
    nivel_probabilidad INTEGER,
    interpretacion_probabilidad TEXT,
    
    nivel_consecuencia INTEGER CHECK (nivel_consecuencia IN (10, 25, 60, 100)),
    interpretacion_consecuencia TEXT,
    
    nivel_riesgo INTEGER,
    interpretacion_riesgo TEXT,
    aceptabilidad_riesgo TEXT CHECK (aceptabilidad_riesgo IN ('Aceptable', 'Aceptable con Control', 'No Aceptable')),
    
    medidas_control_requeridas JSONB DEFAULT '{"eliminacion": [], "sustitucion": [], "ingenieria": [], "administrativas": [], "epp": []}',
    responsable_implementacion TEXT,
    fecha_implementacion DATE,
    
    nivel_riesgo_residual INTEGER,
    aceptabilidad_residual TEXT,
    
    seguimiento_medicion TEXT,
    fecha_revision DATE,
    responsable_revision TEXT,
    
    estado_riesgo TEXT DEFAULT 'identificado' CHECK (estado_riesgo IN ('identificado', 'evaluado', 'controlado', 'monitoreado')),
    
    observaciones TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS controles_riesgo (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    riesgo_id UUID REFERENCES matriz_riesgos(id) ON DELETE CASCADE,
    
    tipo_control TEXT NOT NULL CHECK (tipo_control IN (
        'Eliminación', 'Sustitución', 'Controles de Ingeniería', 
        'Controles Administrativos', 'EPP'
    )),
    
    descripcion_control TEXT NOT NULL,
    responsable TEXT,
    fecha_implementacion DATE,
    fecha_verificacion DATE,
    
    eficacia TEXT CHECK (eficacia IN ('Alta', 'Media', 'Baja')),
    estado_implementacion TEXT DEFAULT 'planificado' CHECK (estado_implementacion IN (
        'planificado', 'en_implementacion', 'implementado', 'verificado'
    )),
    
    costo_estimado DECIMAL(12,2),
    recursos_necesarios TEXT,
    
    evidencias_implementacion TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS evaluaciones_riesgo (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    nombre_evaluacion TEXT NOT NULL,
    fecha_evaluacion DATE NOT NULL,
    evaluador TEXT NOT NULL,
    
    alcance_evaluacion TEXT NOT NULL,
    metodologia TEXT DEFAULT 'GTC 45',
    
    total_riesgos_identificados INTEGER DEFAULT 0,
    riesgos_no_aceptables INTEGER DEFAULT 0,
    riesgos_aceptables_control INTEGER DEFAULT 0,
    riesgos_aceptables INTEGER DEFAULT 0,
    
    estado_evaluacion TEXT DEFAULT 'en_proceso' CHECK (estado_evaluacion IN (
        'planificada', 'en_proceso', 'completada', 'aprobada'
    )),
    
    observaciones_generales TEXT,
    recomendaciones TEXT,
    
    aprobado_por TEXT,
    fecha_aprobacion DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS plantillas_evaluacion (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    nombre_plantilla TEXT NOT NULL,
    descripcion TEXT,
    
    metodologia TEXT NOT NULL,
    criterios_evaluacion JSONB DEFAULT '{}',
    
    campos_personalizados JSONB DEFAULT '[]',
    
    activa BOOLEAN DEFAULT true,
    version TEXT DEFAULT '1.0',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_matriz_codigo ON matriz_riesgos(codigo_riesgo);
CREATE INDEX IF NOT EXISTS idx_matriz_proceso ON matriz_riesgos(proceso);
CREATE INDEX IF NOT EXISTS idx_matriz_area ON matriz_riesgos(area);
CREATE INDEX IF NOT EXISTS idx_matriz_clasificacion ON matriz_riesgos(clasificacion_peligro);
CREATE INDEX IF NOT EXISTS idx_matriz_nivel_riesgo ON matriz_riesgos(nivel_riesgo DESC);
CREATE INDEX IF NOT EXISTS idx_matriz_aceptabilidad ON matriz_riesgos(aceptabilidad_riesgo);
CREATE INDEX IF NOT EXISTS idx_matriz_estado ON matriz_riesgos(estado_riesgo);
CREATE INDEX IF NOT EXISTS idx_matriz_fecha ON matriz_riesgos(fecha_evaluacion DESC);

CREATE INDEX IF NOT EXISTS idx_controles_riesgo ON controles_riesgo(riesgo_id);
CREATE INDEX IF NOT EXISTS idx_controles_tipo ON controles_riesgo(tipo_control);
CREATE INDEX IF NOT EXISTS idx_controles_estado ON controles_riesgo(estado_implementacion);

CREATE INDEX IF NOT EXISTS idx_evaluaciones_fecha ON evaluaciones_riesgo(fecha_evaluacion DESC);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_estado ON evaluaciones_riesgo(estado_evaluacion);

CREATE INDEX IF NOT EXISTS idx_plantillas_activa ON plantillas_evaluacion(activa) WHERE activa = true;

CREATE OR REPLACE FUNCTION calcular_nivel_riesgo() RETURNS TRIGGER AS $$
BEGIN
    NEW.nivel_probabilidad = NEW.nivel_deficiencia * NEW.nivel_exposicion;
    
    IF NEW.nivel_probabilidad >= 40 THEN
        NEW.interpretacion_probabilidad = 'Muy Alto';
    ELSIF NEW.nivel_probabilidad >= 20 THEN
        NEW.interpretacion_probabilidad = 'Alto';
    ELSIF NEW.nivel_probabilidad >= 8 THEN
        NEW.interpretacion_probabilidad = 'Medio';
    ELSE
        NEW.interpretacion_probabilidad = 'Bajo';
    END IF;
    
    CASE NEW.nivel_consecuencia
        WHEN 10 THEN NEW.interpretacion_consecuencia = 'Leve';
        WHEN 25 THEN NEW.interpretacion_consecuencia = 'Moderado';  
        WHEN 60 THEN NEW.interpretacion_consecuencia = 'Grave';
        WHEN 100 THEN NEW.interpretacion_consecuencia = 'Muy Grave';
    END CASE;
    
    NEW.nivel_riesgo = NEW.nivel_probabilidad * NEW.nivel_consecuencia;
    
    IF NEW.nivel_riesgo >= 4000 THEN
        NEW.interpretacion_riesgo = 'I - Crítico';
        NEW.aceptabilidad_riesgo = 'No Aceptable';
    ELSIF NEW.nivel_riesgo >= 500 THEN
        NEW.interpretacion_riesgo = 'II - Alto';
        NEW.aceptabilidad_riesgo = 'No Aceptable';
    ELSIF NEW.nivel_riesgo >= 150 THEN
        NEW.interpretacion_riesgo = 'III - Medio';
        NEW.aceptabilidad_riesgo = 'Aceptable con Control';
    ELSE
        NEW.interpretacion_riesgo = 'IV - Bajo';
        NEW.aceptabilidad_riesgo = 'Aceptable';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_matriz_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calcular_riesgo ON matriz_riesgos;
CREATE TRIGGER trigger_calcular_riesgo BEFORE INSERT OR UPDATE ON matriz_riesgos FOR EACH ROW EXECUTE FUNCTION calcular_nivel_riesgo();

DROP TRIGGER IF EXISTS trigger_update_matriz ON matriz_riesgos;
CREATE TRIGGER trigger_update_matriz BEFORE UPDATE ON matriz_riesgos FOR EACH ROW EXECUTE FUNCTION update_matriz_updated_at();
DROP TRIGGER IF EXISTS trigger_update_controles ON controles_riesgo;
CREATE TRIGGER trigger_update_controles BEFORE UPDATE ON controles_riesgo FOR EACH ROW EXECUTE FUNCTION update_matriz_updated_at();
DROP TRIGGER IF EXISTS trigger_update_evaluaciones ON evaluaciones_riesgo;
CREATE TRIGGER trigger_update_evaluaciones BEFORE UPDATE ON evaluaciones_riesgo FOR EACH ROW EXECUTE FUNCTION update_matriz_updated_at();

ALTER TABLE matriz_riesgos ENABLE ROW LEVEL SECURITY;
ALTER TABLE controles_riesgo ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluaciones_riesgo ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas_evaluacion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "matriz_riesgos_select_policy" ON matriz_riesgos;
CREATE POLICY "matriz_riesgos_select_policy" ON matriz_riesgos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "matriz_riesgos_insert_policy" ON matriz_riesgos;
CREATE POLICY "matriz_riesgos_insert_policy" ON matriz_riesgos FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "matriz_riesgos_update_policy" ON matriz_riesgos;
CREATE POLICY "matriz_riesgos_update_policy" ON matriz_riesgos FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "matriz_riesgos_delete_policy" ON matriz_riesgos;
CREATE POLICY "matriz_riesgos_delete_policy" ON matriz_riesgos FOR DELETE TO authenticated USING (true);

CREATE POLICY "controles_riesgo_select_policy" ON controles_riesgo FOR SELECT TO authenticated USING (true);
CREATE POLICY "controles_riesgo_insert_policy" ON controles_riesgo FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "controles_riesgo_update_policy" ON controles_riesgo FOR UPDATE TO authenticated USING (true);
CREATE POLICY "controles_riesgo_delete_policy" ON controles_riesgo FOR DELETE TO authenticated USING (true);

CREATE POLICY "evaluaciones_riesgo_select_policy" ON evaluaciones_riesgo FOR SELECT TO authenticated USING (true);
CREATE POLICY "evaluaciones_riesgo_insert_policy" ON evaluaciones_riesgo FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "evaluaciones_riesgo_update_policy" ON evaluaciones_riesgo FOR UPDATE TO authenticated USING (true);
CREATE POLICY "evaluaciones_riesgo_delete_policy" ON evaluaciones_riesgo FOR DELETE TO authenticated USING (true);

CREATE POLICY "plantillas_evaluacion_select_policy" ON plantillas_evaluacion FOR SELECT TO authenticated USING (true);
CREATE POLICY "plantillas_evaluacion_insert_policy" ON plantillas_evaluacion FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "plantillas_evaluacion_update_policy" ON plantillas_evaluacion FOR UPDATE TO authenticated USING (true);
CREATE POLICY "plantillas_evaluacion_delete_policy" ON plantillas_evaluacion FOR DELETE TO authenticated USING (true);