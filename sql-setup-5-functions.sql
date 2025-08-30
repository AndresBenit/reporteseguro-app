-- ============================================================================
-- 🏗️ PASO 5: FUNCIONES Y TRIGGERS ÚTILES
-- ============================================================================

-- Función para actualizar timestamp de modificación automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar automáticamente fecha_actualizacion
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_reportes_updated_at 
    BEFORE UPDATE ON reportes 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_colaboradores_updated_at 
    BEFORE UPDATE ON colaboradores 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- Mensaje de confirmación
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Configuración de base de datos completada exitosamente!';
    RAISE NOTICE '🎯 Tablas creadas: profiles, reportes, colaboradores';
    RAISE NOTICE '🔐 RLS habilitado en todas las tablas';
    RAISE NOTICE '📁 Buckets de storage configurados';
    RAISE NOTICE '🚀 ¡Tu aplicación ReporteSeguro está lista para usar!';
END $$;