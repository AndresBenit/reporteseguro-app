CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS reportes_legales_sst (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    tipo_reporte TEXT NOT NULL CHECK (
        tipo_reporte IN (
            'Mensual Accidentalidad',
            'Trimestral Estadísticas', 
            'Anual Gestión SST',
            'Indicadores Cumplimiento',
            'Reporte ARL',
            'Matriz Legal',
            'Plan Trabajo Anual',
            'Evaluación SG-SST'
        )
    ),
    
    periodo TEXT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    
    area TEXT CHECK (area IN ('Centro Industrial', 'Hornos Solera', 'Ambas', 'General')),
    
    datos_reporte JSONB NOT NULL DEFAULT '{}',
    
    indicadores JSONB DEFAULT '{}',
    
    observaciones TEXT,
    conclusiones TEXT,
    recomendaciones TEXT,
    
    estado TEXT DEFAULT 'borrador' CHECK (
        estado IN ('borrador', 'revision', 'aprobado', 'enviado')
    ),
    
    archivo_url TEXT,
    fecha_generacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_aprobacion TIMESTAMPTZ,
    aprobado_por TEXT,
    
    enviado_a TEXT,
    fecha_envio TIMESTAMPTZ,
    numero_radicado TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT reportes_legales_fecha_periodo_check 
        CHECK (fecha_fin >= fecha_inicio),
    CONSTRAINT reportes_legales_periodo_check
        CHECK (LENGTH(periodo) >= 4 AND LENGTH(periodo) <= 20)
);

CREATE TABLE IF NOT EXISTS plantillas_reportes_sst (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    nombre TEXT NOT NULL,
    tipo_reporte TEXT NOT NULL,
    descripcion TEXT,
    
    estructura JSONB NOT NULL DEFAULT '{}',
    campos_requeridos JSONB DEFAULT '[]',
    formulas_calculo JSONB DEFAULT '{}',
    
    activa BOOLEAN DEFAULT true,
    version TEXT DEFAULT '1.0',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_reportes_legales_tipo ON reportes_legales_sst(tipo_reporte);
CREATE INDEX IF NOT EXISTS idx_reportes_legales_periodo ON reportes_legales_sst(periodo);
CREATE INDEX IF NOT EXISTS idx_reportes_legales_fecha_inicio ON reportes_legales_sst(fecha_inicio DESC);
CREATE INDEX IF NOT EXISTS idx_reportes_legales_estado ON reportes_legales_sst(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_legales_area ON reportes_legales_sst(area);

CREATE INDEX IF NOT EXISTS idx_plantillas_reportes_tipo ON plantillas_reportes_sst(tipo_reporte);
CREATE INDEX IF NOT EXISTS idx_plantillas_reportes_activa ON plantillas_reportes_sst(activa) WHERE activa = true;

CREATE OR REPLACE FUNCTION update_reportes_legales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reportes_legales_updated_at ON reportes_legales_sst;
CREATE TRIGGER trigger_update_reportes_legales_updated_at
    BEFORE UPDATE ON reportes_legales_sst
    FOR EACH ROW
    EXECUTE FUNCTION update_reportes_legales_updated_at();

DROP TRIGGER IF EXISTS trigger_update_plantillas_reportes_updated_at ON plantillas_reportes_sst;
CREATE TRIGGER trigger_update_plantillas_reportes_updated_at
    BEFORE UPDATE ON plantillas_reportes_sst
    FOR EACH ROW
    EXECUTE FUNCTION update_reportes_legales_updated_at();

ALTER TABLE reportes_legales_sst ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas_reportes_sst ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reportes_legales_select_policy" ON reportes_legales_sst;
CREATE POLICY "reportes_legales_select_policy" ON reportes_legales_sst FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "reportes_legales_insert_policy" ON reportes_legales_sst;
CREATE POLICY "reportes_legales_insert_policy" ON reportes_legales_sst FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "reportes_legales_update_policy" ON reportes_legales_sst;
CREATE POLICY "reportes_legales_update_policy" ON reportes_legales_sst FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "reportes_legales_delete_policy" ON reportes_legales_sst;
CREATE POLICY "reportes_legales_delete_policy" ON reportes_legales_sst FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "plantillas_reportes_select_policy" ON plantillas_reportes_sst;
CREATE POLICY "plantillas_reportes_select_policy" ON plantillas_reportes_sst FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "plantillas_reportes_insert_policy" ON plantillas_reportes_sst;
CREATE POLICY "plantillas_reportes_insert_policy" ON plantillas_reportes_sst FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "plantillas_reportes_update_policy" ON plantillas_reportes_sst;
CREATE POLICY "plantillas_reportes_update_policy" ON plantillas_reportes_sst FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "plantillas_reportes_delete_policy" ON plantillas_reportes_sst;
CREATE POLICY "plantillas_reportes_delete_policy" ON plantillas_reportes_sst FOR DELETE TO authenticated USING (true);

INSERT INTO plantillas_reportes_sst (nombre, tipo_reporte, descripcion, estructura, campos_requeridos, formulas_calculo) VALUES
('Reporte Mensual de Accidentalidad', 'Mensual Accidentalidad', 'Reporte mensual de accidentes e incidentes de trabajo', 
 '{"secciones": ["datos_generales", "accidentes", "incidentes", "indicadores", "analisis"]}'::jsonb,
 '["periodo", "area", "total_trabajadores", "horas_trabajadas"]'::jsonb,
 '{"indice_frecuencia": "(num_accidentes * 200000) / horas_trabajadas", "indice_severidad": "(dias_perdidos * 200000) / horas_trabajadas"}'::jsonb),

('Estadísticas Trimestrales SST', 'Trimestral Estadísticas', 'Consolidado trimestral de gestión SST',
 '{"secciones": ["resumen_ejecutivo", "capacitaciones", "examenes_medicos", "inspecciones", "copasst"]}'::jsonb,
 '["periodo", "trimestre", "capacitaciones_realizadas", "examenes_realizados"]'::jsonb,
 '{"cumplimiento_capacitaciones": "(capacitaciones_realizadas / capacitaciones_programadas) * 100"}'::jsonb),

('Reporte Anual de Gestión SST', 'Anual Gestión SST', 'Informe anual completo del Sistema de Gestión SST',
 '{"secciones": ["politica", "organizacion", "planificacion", "aplicacion", "evaluacion", "auditoria", "mejoramiento"]}'::jsonb,
 '["año", "recursos_asignados", "objetivos_cumplidos", "no_conformidades"]'::jsonb,
 '{"efectividad_sistema": "(objetivos_cumplidos / objetivos_programados) * 100"}'::jsonb),

('Indicadores de Cumplimiento Legal', 'Indicadores Cumplimiento', 'Seguimiento a requisitos normativos SST',
 '{"secciones": ["matriz_legal", "cumplimiento", "planes_accion", "seguimiento"]}'::jsonb,
 '["periodo", "requisitos_aplicables", "requisitos_cumplidos"]'::jsonb,
 '{"porcentaje_cumplimiento": "(requisitos_cumplidos / requisitos_aplicables) * 100"}'::jsonb);