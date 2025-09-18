-- Funciones y triggers para el sistema de exámenes médicos SST

-- 1. Función para calcular fecha de vencimiento automática
CREATE OR REPLACE FUNCTION calcular_fecha_vencimiento_examen()
RETURNS TRIGGER AS $$
BEGIN
    -- Si no se especifica fecha de vencimiento, calcularla automáticamente
    IF NEW.fecha_vencimiento IS NULL AND NEW.fecha_realizacion IS NOT NULL THEN
        CASE NEW.tipo_examen
            WHEN 'periódico' THEN
                NEW.fecha_vencimiento := NEW.fecha_realizacion + INTERVAL '1 year';
            WHEN 'ingreso' THEN
                NEW.fecha_vencimiento := NEW.fecha_realizacion + INTERVAL '6 months';
            WHEN 'reintegro' THEN
                NEW.fecha_vencimiento := NEW.fecha_realizacion + INTERVAL '6 months';
            WHEN 'post-incidente' THEN
                NEW.fecha_vencimiento := NEW.fecha_realizacion + INTERVAL '3 months';
            WHEN 'egreso' THEN
                NEW.fecha_vencimiento := NULL; -- Los exámenes de egreso no vencen
            ELSE
                NEW.fecha_vencimiento := NEW.fecha_realizacion + INTERVAL '1 year';
        END CASE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger para calcular fecha de vencimiento
DROP TRIGGER IF EXISTS trigger_calcular_vencimiento_examen ON examenes_medicos_sst;
CREATE TRIGGER trigger_calcular_vencimiento_examen
    BEFORE INSERT OR UPDATE OF fecha_realizacion, tipo_examen
    ON examenes_medicos_sst
    FOR EACH ROW
    EXECUTE FUNCTION calcular_fecha_vencimiento_examen();

-- 3. Función para validar datos del examen
CREATE OR REPLACE FUNCTION validar_datos_examen()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar que la fecha de realización no sea futura
    IF NEW.fecha_realizacion IS NOT NULL AND NEW.fecha_realizacion > CURRENT_DATE THEN
        RAISE EXCEPTION 'La fecha de realización no puede ser futura';
    END IF;

    -- Validar que la fecha programada sea coherente
    IF NEW.fecha_programada IS NOT NULL AND NEW.fecha_programada < CURRENT_DATE - INTERVAL '1 year' THEN
        RAISE EXCEPTION 'La fecha programada es muy antigua';
    END IF;

    -- Validar estado según fechas
    IF NEW.estado = 'realizado' AND NEW.fecha_realizacion IS NULL THEN
        NEW.fecha_realizacion := CURRENT_DATE;
    END IF;

    -- Asegurar que el documento del colaborador coincida
    IF NEW.colaborador_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM colaboradores
            WHERE id = NEW.colaborador_id
            AND documento = NEW.documento_colaborador
        ) THEN
            RAISE EXCEPTION 'El documento del colaborador no coincide con el ID';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para validar datos
DROP TRIGGER IF EXISTS trigger_validar_examen ON examenes_medicos_sst;
CREATE TRIGGER trigger_validar_examen
    BEFORE INSERT OR UPDATE
    ON examenes_medicos_sst
    FOR EACH ROW
    EXECUTE FUNCTION validar_datos_examen();

-- 5. Función para obtener exámenes próximos a vencer
CREATE OR REPLACE FUNCTION obtener_examenes_proximos_vencer(dias_limite INTEGER DEFAULT 30)
RETURNS TABLE (
    id UUID,
    nombre_colaborador TEXT,
    documento_colaborador TEXT,
    tipo_examen TEXT,
    fecha_vencimiento DATE,
    dias_restantes INTEGER,
    severidad TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.nombre_colaborador,
        e.documento_colaborador,
        e.tipo_examen,
        e.fecha_vencimiento,
        (e.fecha_vencimiento - CURRENT_DATE)::INTEGER as dias_restantes,
        CASE
            WHEN e.fecha_vencimiento < CURRENT_DATE THEN 'critica'
            WHEN e.fecha_vencimiento - CURRENT_DATE <= 7 THEN 'alta'
            WHEN e.fecha_vencimiento - CURRENT_DATE <= 15 THEN 'media'
            ELSE 'baja'
        END as severidad
    FROM examenes_medicos_sst e
    WHERE e.fecha_vencimiento IS NOT NULL
    AND e.fecha_vencimiento <= CURRENT_DATE + dias_limite
    AND e.estado IN ('aprobado', 'realizado')
    ORDER BY e.fecha_vencimiento ASC;
END;
$$ LANGUAGE plpgsql;

-- 6. Función para obtener estadísticas de exámenes
CREATE OR REPLACE FUNCTION obtener_estadisticas_examenes()
RETURNS TABLE (
    total_examenes BIGINT,
    examenes_realizados BIGINT,
    examenes_aprobados BIGINT,
    examenes_pendientes BIGINT,
    examenes_vencidos BIGINT,
    examenes_proximos_vencer BIGINT,
    porcentaje_cumplimiento NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_examenes,
        COUNT(*) FILTER (WHERE estado = 'realizado') as examenes_realizados,
        COUNT(*) FILTER (WHERE estado = 'aprobado') as examenes_aprobados,
        COUNT(*) FILTER (WHERE estado IN ('programado', 'pendiente')) as examenes_pendientes,
        COUNT(*) FILTER (WHERE fecha_vencimiento < CURRENT_DATE AND estado = 'aprobado') as examenes_vencidos,
        COUNT(*) FILTER (WHERE fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + 30 AND estado = 'aprobado') as examenes_proximos_vencer,
        CASE
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND((COUNT(*) FILTER (WHERE estado = 'aprobado') * 100.0 / COUNT(*)), 2)
        END as porcentaje_cumplimiento
    FROM examenes_medicos_sst;
END;
$$ LANGUAGE plpgsql;

-- 7. Función para programar exámenes automáticamente
CREATE OR REPLACE FUNCTION programar_examenes_automaticos()
RETURNS TABLE (
    colaborador_id UUID,
    nombre_colaborador TEXT,
    tipo_examen_sugerido TEXT,
    motivo TEXT
) AS $$
BEGIN
    -- Programar exámenes periódicos para colaboradores que no tienen examen vigente
    RETURN QUERY
    WITH colaboradores_sin_examen AS (
        SELECT
            c.id,
            c.nombre,
            c.documento,
            c.cargo,
            c.area
        FROM colaboradores c
        WHERE c.activo = true
        AND NOT EXISTS (
            SELECT 1 FROM examenes_medicos_sst e
            WHERE e.colaborador_id = c.id
            AND e.estado = 'aprobado'
            AND e.fecha_vencimiento > CURRENT_DATE
        )
    )
    SELECT
        cse.id,
        cse.nombre,
        'periódico'::TEXT,
        'Colaborador sin examen médico vigente'::TEXT
    FROM colaboradores_sin_examen cse;
END;
$$ LANGUAGE plpgsql;

-- 8. Función para actualizar campos automáticos
CREATE OR REPLACE FUNCTION actualizar_campos_automaticos()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar timestamps
    NEW.updated_at := NOW();

    -- Completar información del colaborador si falta
    IF NEW.colaborador_id IS NOT NULL AND (
        NEW.nombre_colaborador IS NULL OR
        NEW.documento_colaborador IS NULL OR
        NEW.cargo_colaborador IS NULL OR
        NEW.area_colaborador IS NULL
    ) THEN
        SELECT
            nombre, documento, cargo, area
        INTO
            NEW.nombre_colaborador, NEW.documento_colaborador, NEW.cargo_colaborador, NEW.area_colaborador
        FROM colaboradores
        WHERE id = NEW.colaborador_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger para campos automáticos
DROP TRIGGER IF EXISTS trigger_actualizar_campos_automaticos ON examenes_medicos_sst;
CREATE TRIGGER trigger_actualizar_campos_automaticos
    BEFORE INSERT OR UPDATE
    ON examenes_medicos_sst
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_campos_automaticos();

-- 10. Vista para dashboard de exámenes
CREATE OR REPLACE VIEW vista_dashboard_examenes AS
SELECT
    e.*,
    c.activo as colaborador_activo,
    c.fecha_ingreso as colaborador_fecha_ingreso,
    CASE
        WHEN e.fecha_vencimiento IS NULL THEN NULL
        WHEN e.fecha_vencimiento < CURRENT_DATE THEN 'vencido'
        WHEN e.fecha_vencimiento <= CURRENT_DATE + 30 THEN 'proximo_vencer'
        ELSE 'vigente'
    END as estado_vencimiento,
    (e.fecha_vencimiento - CURRENT_DATE)::INTEGER as dias_para_vencer
FROM examenes_medicos_sst e
LEFT JOIN colaboradores c ON e.colaborador_id = c.id
ORDER BY e.fecha_vencimiento ASC NULLS LAST;

-- 11. Función para generar reportes de cumplimiento
CREATE OR REPLACE FUNCTION generar_reporte_cumplimiento(
    fecha_inicio DATE DEFAULT CURRENT_DATE - INTERVAL '1 year',
    fecha_fin DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    area TEXT,
    total_colaboradores BIGINT,
    colaboradores_con_examen BIGINT,
    examenes_vigentes BIGINT,
    examenes_vencidos BIGINT,
    porcentaje_cumplimiento NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(c.area, 'Sin área') as area,
        COUNT(DISTINCT c.id) as total_colaboradores,
        COUNT(DISTINCT CASE WHEN e.id IS NOT NULL THEN c.id END) as colaboradores_con_examen,
        COUNT(DISTINCT CASE WHEN e.estado = 'aprobado' AND e.fecha_vencimiento > CURRENT_DATE THEN c.id END) as examenes_vigentes,
        COUNT(DISTINCT CASE WHEN e.estado = 'aprobado' AND e.fecha_vencimiento <= CURRENT_DATE THEN c.id END) as examenes_vencidos,
        CASE
            WHEN COUNT(DISTINCT c.id) = 0 THEN 0
            ELSE ROUND((COUNT(DISTINCT CASE WHEN e.estado = 'aprobado' AND e.fecha_vencimiento > CURRENT_DATE THEN c.id END) * 100.0 / COUNT(DISTINCT c.id)), 2)
        END as porcentaje_cumplimiento
    FROM colaboradores c
    LEFT JOIN examenes_medicos_sst e ON c.id = e.colaborador_id
        AND e.created_at BETWEEN fecha_inicio AND fecha_fin
    WHERE c.activo = true
    GROUP BY c.area
    ORDER BY porcentaje_cumplimiento DESC;
END;
$$ LANGUAGE plpgsql;

-- 12. Índices para optimizar rendimiento
CREATE INDEX IF NOT EXISTS idx_examenes_colaborador_fecha_vencimiento
ON examenes_medicos_sst(colaborador_id, fecha_vencimiento);

CREATE INDEX IF NOT EXISTS idx_examenes_estado_fecha_vencimiento
ON examenes_medicos_sst(estado, fecha_vencimiento);

CREATE INDEX IF NOT EXISTS idx_examenes_tipo_fecha_realizacion
ON examenes_medicos_sst(tipo_examen, fecha_realizacion);

CREATE INDEX IF NOT EXISTS idx_examenes_documento_colaborador
ON examenes_medicos_sst(documento_colaborador);

-- 13. Política de seguridad RLS (Row Level Security)
ALTER TABLE examenes_medicos_sst ENABLE ROW LEVEL SECURITY;

-- Política para lectura (todos los usuarios autenticados pueden leer)
CREATE POLICY "Permitir lectura examenes medicos" ON examenes_medicos_sst
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para inserción (todos los usuarios autenticados pueden insertar)
CREATE POLICY "Permitir insercion examenes medicos" ON examenes_medicos_sst
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para actualización (todos los usuarios autenticados pueden actualizar)
CREATE POLICY "Permitir actualizacion examenes medicos" ON examenes_medicos_sst
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para eliminación (solo administradores pueden eliminar)
CREATE POLICY "Permitir eliminacion examenes medicos" ON examenes_medicos_sst
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Comentarios en la tabla para documentación
COMMENT ON TABLE examenes_medicos_sst IS 'Tabla para el registro y seguimiento de exámenes médicos ocupacionales según normativa SST colombiana';
COMMENT ON COLUMN examenes_medicos_sst.tipo_examen IS 'Tipo de examen: ingreso, periódico, egreso, post-incidente, reintegro';
COMMENT ON COLUMN examenes_medicos_sst.estado IS 'Estado del examen: programado, realizado, aprobado, no-aprobado, pendiente';
COMMENT ON COLUMN examenes_medicos_sst.fecha_vencimiento IS 'Fecha de vencimiento del examen, calculada automáticamente según el tipo';
COMMENT ON COLUMN examenes_medicos_sst.restricciones_medicas IS 'Restricciones o recomendaciones médicas resultado del examen';
COMMENT ON COLUMN examenes_medicos_sst.concepto_aptitud IS 'Concepto médico de aptitud: apto, apto_con_restricciones, no_apto, pendiente';

-- Finalización
SELECT 'Funciones y triggers para exámenes médicos SST creados exitosamente' as resultado;