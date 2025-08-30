-- ============================================================================
-- 🏗️ PASO 3: CONFIGURAR SEGURIDAD (RLS - Row Level Security)
-- ============================================================================

-- RLS (Row Level Security) para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Los usuarios pueden ver su propio perfil"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Los administradores pueden ver todos los perfiles"
    ON profiles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS para reportes
ALTER TABLE reportes ENABLE ROW LEVEL SECURITY;

-- Políticas para reportes
CREATE POLICY "Todos los usuarios autenticados pueden leer reportes"
    ON reportes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Los usuarios pueden crear reportes"
    ON reportes FOR INSERT
    TO authenticated
    WITH CHECK (creado_por = auth.uid());

CREATE POLICY "Los creadores y supervisores pueden actualizar reportes"
    ON reportes FOR UPDATE
    TO authenticated
    USING (
        creado_por = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
        )
    );

CREATE POLICY "Solo administradores pueden eliminar reportes"
    ON reportes FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS para colaboradores
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;

-- Políticas para colaboradores
CREATE POLICY "Usuarios autenticados pueden leer colaboradores"
    ON colaboradores FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Solo supervisores pueden crear colaboradores"
    ON colaboradores FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
        )
    );

CREATE POLICY "Solo supervisores pueden actualizar colaboradores"
    ON colaboradores FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
        )
    );

CREATE POLICY "Solo administradores pueden eliminar colaboradores"
    ON colaboradores FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );