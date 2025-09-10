CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS planes_emergencia_sst (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    nombre TEXT NOT NULL,
    tipo_emergencia TEXT NOT NULL CHECK (tipo_emergencia IN (
        'Incendio',
        'Evacuación',
        'Sismo',
        'Accidente Industrial',
        'Derrame Químico',
        'Emergencia Médica',
        'Colapso Estructural',
        'Inundación',
        'Otro'
    )),
    
    area_aplicacion TEXT CHECK (area_aplicacion IN ('Centro Industrial', 'Hornos Solera', 'Ambas', 'General')),
    alcance TEXT,
    
    objetivos TEXT[],
    procedimientos JSONB DEFAULT '{}',
    recursos_necesarios JSONB DEFAULT '{}',
    responsables JSONB DEFAULT '{}',
    
    rutas_evacuacion TEXT[],
    puntos_encuentro TEXT[],
    numeros_emergencia TEXT[],
    
    activo BOOLEAN DEFAULT true,
    fecha_aprobacion DATE,
    aprobado_por TEXT,
    version TEXT DEFAULT '1.0',
    
    observaciones TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS simulacros_emergencia (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    plan_emergencia_id UUID REFERENCES planes_emergencia_sst(id) ON DELETE CASCADE,
    
    fecha_simulacro DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME,
    duracion_minutos INTEGER,
    
    tipo_simulacro TEXT NOT NULL CHECK (tipo_simulacro IN (
        'Programado',
        'Sorpresa',
        'Parcial',
        'Total'
    )),
    
    area_simulacro TEXT CHECK (area_simulacro IN ('Centro Industrial', 'Hornos Solera', 'Ambas')),
    
    participantes_esperados INTEGER,
    participantes_reales INTEGER,
    porcentaje_participacion DECIMAL(5,2),
    
    tiempo_evacuacion_objetivo INTEGER,
    tiempo_evacuacion_real INTEGER,
    
    observaciones TEXT,
    hallazgos TEXT,
    acciones_mejora TEXT,
    
    responsable_simulacro TEXT NOT NULL,
    estado TEXT DEFAULT 'programado' CHECK (estado IN ('programado', 'ejecutado', 'evaluado')),
    
    evaluacion_general INTEGER CHECK (evaluacion_general >= 1 AND evaluacion_general <= 5),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS brigadas_emergencia (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    nombre TEXT NOT NULL,
    tipo_brigada TEXT NOT NULL CHECK (tipo_brigada IN (
        'Evacuación',
        'Primeros Auxilios',
        'Contra Incendios',
        'Búsqueda y Rescate',
        'Comunicaciones',
        'Coordinación General'
    )),
    
    colaborador_id UUID REFERENCES colaboradores(id),
    cargo_brigada TEXT NOT NULL CHECK (cargo_brigada IN (
        'Coordinador',
        'Sub-coordinador',
        'Brigadista',
        'Suplente'
    )),
    
    area_responsabilidad TEXT,
    fecha_capacitacion DATE,
    vigencia_capacitacion DATE,
    certificado_url TEXT,
    
    activo BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_planes_emergencia_tipo ON planes_emergencia_sst(tipo_emergencia);
CREATE INDEX IF NOT EXISTS idx_planes_emergencia_area ON planes_emergencia_sst(area_aplicacion);
CREATE INDEX IF NOT EXISTS idx_planes_emergencia_activo ON planes_emergencia_sst(activo) WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_simulacros_plan ON simulacros_emergencia(plan_emergencia_id);
CREATE INDEX IF NOT EXISTS idx_simulacros_fecha ON simulacros_emergencia(fecha_simulacro DESC);
CREATE INDEX IF NOT EXISTS idx_simulacros_estado ON simulacros_emergencia(estado);

CREATE INDEX IF NOT EXISTS idx_brigadas_tipo ON brigadas_emergencia(tipo_brigada);
CREATE INDEX IF NOT EXISTS idx_brigadas_colaborador ON brigadas_emergencia(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_brigadas_activo ON brigadas_emergencia(activo) WHERE activo = true;

CREATE OR REPLACE FUNCTION update_planes_emergencia_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_planes_emergencia ON planes_emergencia_sst;
CREATE TRIGGER trigger_update_planes_emergencia BEFORE UPDATE ON planes_emergencia_sst FOR EACH ROW EXECUTE FUNCTION update_planes_emergencia_updated_at();

DROP TRIGGER IF EXISTS trigger_update_simulacros_emergencia ON simulacros_emergencia;
CREATE TRIGGER trigger_update_simulacros_emergencia BEFORE UPDATE ON simulacros_emergencia FOR EACH ROW EXECUTE FUNCTION update_planes_emergencia_updated_at();

DROP TRIGGER IF EXISTS trigger_update_brigadas_emergencia ON brigadas_emergencia;
CREATE TRIGGER trigger_update_brigadas_emergencia BEFORE UPDATE ON brigadas_emergencia FOR EACH ROW EXECUTE FUNCTION update_planes_emergencia_updated_at();

ALTER TABLE planes_emergencia_sst ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulacros_emergencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE brigadas_emergencia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "planes_emergencia_select_policy" ON planes_emergencia_sst;
CREATE POLICY "planes_emergencia_select_policy" ON planes_emergencia_sst FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "planes_emergencia_insert_policy" ON planes_emergencia_sst;
CREATE POLICY "planes_emergencia_insert_policy" ON planes_emergencia_sst FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "planes_emergencia_update_policy" ON planes_emergencia_sst;
CREATE POLICY "planes_emergencia_update_policy" ON planes_emergencia_sst FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "planes_emergencia_delete_policy" ON planes_emergencia_sst;
CREATE POLICY "planes_emergencia_delete_policy" ON planes_emergencia_sst FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "simulacros_emergencia_select_policy" ON simulacros_emergencia;
CREATE POLICY "simulacros_emergencia_select_policy" ON simulacros_emergencia FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "simulacros_emergencia_insert_policy" ON simulacros_emergencia;
CREATE POLICY "simulacros_emergencia_insert_policy" ON simulacros_emergencia FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "simulacros_emergencia_update_policy" ON simulacros_emergencia;
CREATE POLICY "simulacros_emergencia_update_policy" ON simulacros_emergencia FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "simulacros_emergencia_delete_policy" ON simulacros_emergencia;
CREATE POLICY "simulacros_emergencia_delete_policy" ON simulacros_emergencia FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "brigadas_emergencia_select_policy" ON brigadas_emergencia;
CREATE POLICY "brigadas_emergencia_select_policy" ON brigadas_emergencia FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "brigadas_emergencia_insert_policy" ON brigadas_emergencia;
CREATE POLICY "brigadas_emergencia_insert_policy" ON brigadas_emergencia FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "brigadas_emergencia_update_policy" ON brigadas_emergencia;
CREATE POLICY "brigadas_emergencia_update_policy" ON brigadas_emergencia FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "brigadas_emergencia_delete_policy" ON brigadas_emergencia;
CREATE POLICY "brigadas_emergencia_delete_policy" ON brigadas_emergencia FOR DELETE TO authenticated USING (true);

INSERT INTO planes_emergencia_sst (nombre, tipo_emergencia, area_aplicacion, alcance, objetivos, procedimientos, recursos_necesarios, responsables, rutas_evacuacion, puntos_encuentro, numeros_emergencia, activo) VALUES ('Plan General de Evacuación', 'Evacuación', 'Ambas', 'Todas las instalaciones de la mina', '{"Garantizar evacuación segura", "Proteger vidas humanas", "Minimizar daños materiales"}', '{"pasos": ["Activar alarma", "Verificar áreas", "Dirigir evacuación", "Conteo en punto de encuentro"]}', '{"sirenas": 4, "megafonos": 6, "linternas": 12, "botiquin": 3}', '{"coordinador": "Jefe SST", "brigadistas": ["Supervisores de área"], "comunicaciones": "Recepcionista"}', '{"Ruta A: Salida principal", "Ruta B: Salida auxiliar", "Ruta C: Salida de emergencia"}', '{"Punto 1: Parqueadero principal", "Punto 2: Cancha deportiva"}', '{"Bomberos: 119", "Cruz Roja: 132", "Policía: 123", "Ambulancia: 125"}', true);

INSERT INTO planes_emergencia_sst (nombre, tipo_emergencia, area_aplicacion, alcance, objetivos, procedimientos, recursos_necesarios, responsables, rutas_evacuacion, puntos_encuentro, numeros_emergencia, activo) VALUES ('Plan de Emergencia por Incendio', 'Incendio', 'Centro Industrial', 'Área industrial y oficinas administrativas', '{"Controlar incendio", "Evacuar personal", "Preservar equipos críticos"}', '{"pasos": ["Detectar incendio", "Activar alarma", "Usar extintores", "Llamar bomberos", "Evacuar si es necesario"]}', '{"extintores": 15, "mangueras": 4, "detectores": 8, "sistema_rociadores": 1}', '{"jefe_brigada": "Coordinador SST", "brigadistas_incendio": ["Operarios capacitados"]}', '{"Salida de emergencia norte", "Salida principal"}', '{"Parqueadero alejado del área"}', '{"Bomberos: 119", "Emergencias: 123"}', true);