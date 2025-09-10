CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS investigaciones_accidentes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    numero_caso TEXT NOT NULL UNIQUE,
    fecha_accidente TIMESTAMPTZ NOT NULL,
    fecha_reporte TIMESTAMPTZ DEFAULT NOW(),
    fecha_investigacion DATE,
    
    tipo_evento TEXT NOT NULL CHECK (tipo_evento IN (
        'Accidente de Trabajo',
        'Incidente de Trabajo', 
        'Enfermedad Laboral',
        'Accidente de Trayecto',
        'Casi Accidente'
    )),
    
    clasificacion_inicial TEXT CHECK (clasificacion_inicial IN (
        'Leve',
        'Grave', 
        'Mortal',
        'Catastrófico'
    )),
    
    lugar_accidente TEXT NOT NULL,
    area_accidente TEXT CHECK (area_accidente IN ('Centro Industrial', 'Hornos Solera', 'Ambas', 'Otro')),
    
    persona_afectada_id UUID REFERENCES colaboradores(id),
    persona_afectada_externa TEXT,
    cargo_persona TEXT,
    experiencia_cargo INTEGER,
    
    descripcion_hechos TEXT NOT NULL,
    actividad_realizada TEXT,
    condiciones_ambientales TEXT,
    epp_utilizados TEXT[],
    
    lesiones_descripcion TEXT,
    parte_cuerpo_lesionada TEXT[],
    atencion_medica TEXT CHECK (atencion_medica IN ('Primeros Auxilios', 'Centro Médico', 'Hospitalización', 'No requirió', 'Otro')),
    dias_incapacidad INTEGER DEFAULT 0,
    
    testigos JSONB DEFAULT '[]',
    evidencias_fotos TEXT[],
    evidencias_documentos TEXT[],
    
    investigador_principal TEXT NOT NULL,
    equipo_investigacion TEXT[],
    metodologia TEXT DEFAULT 'Árbol de Causas' CHECK (metodologia IN ('Árbol de Causas', 'Espina de Pescado', 'Análisis de Barreras', 'TRIPOD', 'Otro')),
    
    causas_inmediatas JSONB DEFAULT '[]',
    causas_basicas JSONB DEFAULT '[]',
    causas_raiz TEXT,
    
    acciones_inmediatas TEXT,
    acciones_correctivas JSONB DEFAULT '[]',
    acciones_preventivas JSONB DEFAULT '[]',
    
    responsables_acciones JSONB DEFAULT '{}',
    fechas_cumplimiento JSONB DEFAULT '{}',
    estado_acciones TEXT DEFAULT 'pendiente' CHECK (estado_acciones IN ('pendiente', 'en_proceso', 'completadas', 'vencidas')),
    
    costo_estimado DECIMAL(12,2),
    dias_perdidos INTEGER DEFAULT 0,
    
    estado_investigacion TEXT DEFAULT 'abierta' CHECK (estado_investigacion IN ('abierta', 'en_investigacion', 'cerrada', 'reabierta')),
    fecha_cierre DATE,
    aprobado_por TEXT,
    
    lecciones_aprendidas TEXT,
    recomendaciones_generales TEXT,
    
    notificacion_arl BOOLEAN DEFAULT false,
    fecha_notificacion_arl DATE,
    numero_furat TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS causas_accidentes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    investigacion_id UUID REFERENCES investigaciones_accidentes(id) ON DELETE CASCADE,
    
    tipo_causa TEXT NOT NULL CHECK (tipo_causa IN ('Inmediata', 'Básica', 'Raíz')),
    categoria TEXT NOT NULL CHECK (categoria IN (
        'Actos Inseguros',
        'Condiciones Inseguras', 
        'Factores Personales',
        'Factores del Trabajo',
        'Falta de Control Gerencial',
        'Factores Ambientales',
        'Deficiencias del Sistema'
    )),
    
    descripcion TEXT NOT NULL,
    evidencias TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS acciones_correctivas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    investigacion_id UUID REFERENCES investigaciones_accidentes(id) ON DELETE CASCADE,
    
    tipo_accion TEXT NOT NULL CHECK (tipo_accion IN ('Correctiva', 'Preventiva', 'Mejora')),
    descripcion TEXT NOT NULL,
    
    responsable TEXT NOT NULL,
    fecha_compromiso DATE NOT NULL,
    fecha_completada DATE,
    
    recursos_necesarios TEXT,
    costo_estimado DECIMAL(10,2),
    
    estado TEXT DEFAULT 'asignada' CHECK (estado IN ('asignada', 'en_proceso', 'completada', 'vencida', 'cancelada')),
    porcentaje_avance INTEGER DEFAULT 0 CHECK (porcentaje_avance >= 0 AND porcentaje_avance <= 100),
    
    evidencia_cumplimiento TEXT,
    observaciones TEXT,
    
    prioridad TEXT DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS indicadores_accidentalidad (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    periodo TEXT NOT NULL,
    año INTEGER NOT NULL,
    mes INTEGER CHECK (mes >= 1 AND mes <= 12),
    
    area TEXT CHECK (area IN ('Centro Industrial', 'Hornos Solera', 'Ambas', 'General')),
    
    total_trabajadores INTEGER NOT NULL,
    horas_trabajadas INTEGER NOT NULL,
    
    accidentes_trabajo INTEGER DEFAULT 0,
    incidentes_trabajo INTEGER DEFAULT 0,
    casi_accidentes INTEGER DEFAULT 0,
    dias_perdidos INTEGER DEFAULT 0,
    
    indice_frecuencia DECIMAL(10,2),
    indice_severidad DECIMAL(10,2), 
    indice_lesiones DECIMAL(10,2),
    tasa_accidentalidad DECIMAL(5,2),
    
    accidentes_leves INTEGER DEFAULT 0,
    accidentes_graves INTEGER DEFAULT 0,
    accidentes_mortales INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(periodo, area)
);

CREATE INDEX IF NOT EXISTS idx_investigaciones_numero_caso ON investigaciones_accidentes(numero_caso);
CREATE INDEX IF NOT EXISTS idx_investigaciones_fecha_accidente ON investigaciones_accidentes(fecha_accidente DESC);
CREATE INDEX IF NOT EXISTS idx_investigaciones_tipo_evento ON investigaciones_accidentes(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_investigaciones_clasificacion ON investigaciones_accidentes(clasificacion_inicial);
CREATE INDEX IF NOT EXISTS idx_investigaciones_area ON investigaciones_accidentes(area_accidente);
CREATE INDEX IF NOT EXISTS idx_investigaciones_estado ON investigaciones_accidentes(estado_investigacion);
CREATE INDEX IF NOT EXISTS idx_investigaciones_persona ON investigaciones_accidentes(persona_afectada_id);

CREATE INDEX IF NOT EXISTS idx_causas_investigacion ON causas_accidentes(investigacion_id);
CREATE INDEX IF NOT EXISTS idx_causas_tipo ON causas_accidentes(tipo_causa);
CREATE INDEX IF NOT EXISTS idx_causas_categoria ON causas_accidentes(categoria);

CREATE INDEX IF NOT EXISTS idx_acciones_investigacion ON acciones_correctivas(investigacion_id);
CREATE INDEX IF NOT EXISTS idx_acciones_tipo ON acciones_correctivas(tipo_accion);
CREATE INDEX IF NOT EXISTS idx_acciones_estado ON acciones_correctivas(estado);
CREATE INDEX IF NOT EXISTS idx_acciones_responsable ON acciones_correctivas(responsable);
CREATE INDEX IF NOT EXISTS idx_acciones_fecha_compromiso ON acciones_correctivas(fecha_compromiso);

CREATE INDEX IF NOT EXISTS idx_indicadores_periodo ON indicadores_accidentalidad(año DESC, mes DESC);
CREATE INDEX IF NOT EXISTS idx_indicadores_area ON indicadores_accidentalidad(area);

CREATE OR REPLACE FUNCTION update_investigacion_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calcular_indicadores_accidentalidad() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.horas_trabajadas > 0 THEN
        NEW.indice_frecuencia = (NEW.accidentes_trabajo * 200000.0) / NEW.horas_trabajadas;
        NEW.indice_severidad = (NEW.dias_perdidos * 200000.0) / NEW.horas_trabajadas;
        NEW.indice_lesiones = NEW.indice_frecuencia * NEW.indice_severidad / 1000.0;
        NEW.tasa_accidentalidad = (NEW.accidentes_trabajo * 100.0) / NEW.total_trabajadores;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_investigaciones ON investigaciones_accidentes;
CREATE TRIGGER trigger_update_investigaciones BEFORE UPDATE ON investigaciones_accidentes FOR EACH ROW EXECUTE FUNCTION update_investigacion_updated_at();
DROP TRIGGER IF EXISTS trigger_update_acciones ON acciones_correctivas;
CREATE TRIGGER trigger_update_acciones BEFORE UPDATE ON acciones_correctivas FOR EACH ROW EXECUTE FUNCTION update_investigacion_updated_at();
DROP TRIGGER IF EXISTS trigger_update_indicadores ON indicadores_accidentalidad;
CREATE TRIGGER trigger_update_indicadores BEFORE UPDATE ON indicadores_accidentalidad FOR EACH ROW EXECUTE FUNCTION update_investigacion_updated_at();

DROP TRIGGER IF EXISTS trigger_calcular_indicadores ON indicadores_accidentalidad;
CREATE TRIGGER trigger_calcular_indicadores BEFORE INSERT OR UPDATE ON indicadores_accidentalidad FOR EACH ROW EXECUTE FUNCTION calcular_indicadores_accidentalidad();

ALTER TABLE investigaciones_accidentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE causas_accidentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE acciones_correctivas ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicadores_accidentalidad ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "investigaciones_select_policy" ON investigaciones_accidentes;
CREATE POLICY "investigaciones_select_policy" ON investigaciones_accidentes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "investigaciones_insert_policy" ON investigaciones_accidentes;
CREATE POLICY "investigaciones_insert_policy" ON investigaciones_accidentes FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "investigaciones_update_policy" ON investigaciones_accidentes;
CREATE POLICY "investigaciones_update_policy" ON investigaciones_accidentes FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "investigaciones_delete_policy" ON investigaciones_accidentes;
CREATE POLICY "investigaciones_delete_policy" ON investigaciones_accidentes FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "causas_select_policy" ON causas_accidentes;
CREATE POLICY "causas_select_policy" ON causas_accidentes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "causas_insert_policy" ON causas_accidentes;
CREATE POLICY "causas_insert_policy" ON causas_accidentes FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "causas_update_policy" ON causas_accidentes;
CREATE POLICY "causas_update_policy" ON causas_accidentes FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "causas_delete_policy" ON causas_accidentes;
CREATE POLICY "causas_delete_policy" ON causas_accidentes FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "acciones_select_policy" ON acciones_correctivas;
CREATE POLICY "acciones_select_policy" ON acciones_correctivas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "acciones_insert_policy" ON acciones_correctivas;
CREATE POLICY "acciones_insert_policy" ON acciones_correctivas FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "acciones_update_policy" ON acciones_correctivas;
CREATE POLICY "acciones_update_policy" ON acciones_correctivas FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "acciones_delete_policy" ON acciones_correctivas;
CREATE POLICY "acciones_delete_policy" ON acciones_correctivas FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "indicadores_select_policy" ON indicadores_accidentalidad;
CREATE POLICY "indicadores_select_policy" ON indicadores_accidentalidad FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "indicadores_insert_policy" ON indicadores_accidentalidad;
CREATE POLICY "indicadores_insert_policy" ON indicadores_accidentalidad FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "indicadores_update_policy" ON indicadores_accidentalidad;
CREATE POLICY "indicadores_update_policy" ON indicadores_accidentalidad FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "indicadores_delete_policy" ON indicadores_accidentalidad;
CREATE POLICY "indicadores_delete_policy" ON indicadores_accidentalidad FOR DELETE TO authenticated USING (true);