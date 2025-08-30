-- ============================================================================
-- 🏗️ PASO 4: CONFIGURAR STORAGE PARA ARCHIVOS
-- ============================================================================

-- Bucket para adjuntos de reportes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('reportes-adjuntos', 'reportes-adjuntos', false)
ON CONFLICT DO NOTHING;

-- Bucket para fotos de perfil
INSERT INTO storage.buckets (id, name, public) 
VALUES ('perfiles', 'perfiles', true)
ON CONFLICT DO NOTHING;

-- Políticas para storage de reportes
CREATE POLICY "Usuarios autenticados pueden ver adjuntos de reportes"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'reportes-adjuntos' AND auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden subir adjuntos de reportes"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'reportes-adjuntos' AND auth.role() = 'authenticated');

-- Políticas para storage de perfiles
CREATE POLICY "Todos pueden ver fotos de perfil"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'perfiles');

CREATE POLICY "Los usuarios pueden subir su propia foto de perfil"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'perfiles' AND auth.uid()::text = (storage.foldername(name))[1]);