-- TABLA: supervision_campo (faltante)
CREATE TABLE IF NOT EXISTS public.supervision_campo (
    id BIGSERIAL PRIMARY KEY,
    colaborador_id UUID REFERENCES public.colaboradores(id),
    colaborador_nombre TEXT NOT NULL,
    colaborador_area TEXT,
    area TEXT,
    supervisor_reporta TEXT NOT NULL,
    lugar_labor TEXT NOT NULL,
    hallazgo TEXT NOT NULL,
    recomendacion TEXT NOT NULL,
    evidencia_url TEXT,
    firma_url TEXT,
    firmado_por TEXT,
    fecha_firma TIMESTAMPTZ,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    estado TEXT DEFAULT 'pendiente',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: abordajes_campo (por si también falta)
CREATE TABLE IF NOT EXISTS public.abordajes_campo (
    id BIGSERIAL PRIMARY KEY,
    colaborador_id UUID REFERENCES public.colaboradores(id),
    colaborador_nombre TEXT NOT NULL,
    colaborador_area TEXT,
    supervisor_reporta TEXT NOT NULL,
    lugar_labor TEXT NOT NULL,
    hallazgo TEXT NOT NULL,
    abordaje TEXT NOT NULL,
    firma_url TEXT,
    firmado_por TEXT,
    fecha_firma TIMESTAMPTZ,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    estado TEXT DEFAULT 'completado',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.supervision_campo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abordajes_campo ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso (permitir todo por ahora)
CREATE POLICY "supervision_campo_all" ON public.supervision_campo
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "abordajes_campo_all" ON public.abordajes_campo
    FOR ALL USING (true) WITH CHECK (true);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_supervision_campo_updated_at
    BEFORE UPDATE ON public.supervision_campo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_abordajes_campo_updated_at
    BEFORE UPDATE ON public.abordajes_campo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();