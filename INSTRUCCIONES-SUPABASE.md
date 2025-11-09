# 🔧 INSTRUCCIONES POST-FIX - Configuración Supabase

## ✅ Cambios Realizados en el Código

### 1. **Arreglado: Upload de imágenes y firmas**
- ✅ `SupervisionCampo.jsx` - Ahora obtiene correctamente la URL pública
- ✅ `AbordajeCampo.jsx` - Ahora obtiene correctamente la URL pública
- ✅ `SignaturePad.jsx` - Ya estaba bien implementado
- ✅ `ControlEPP.jsx` - Ya estaba bien implementado

**Problema resuelto**: Antes el código hacía `uploadResult.publicUrl` pero debía usar `storageHelpers.getPublicUrl(bucket, uploadResult.path)`

### 2. **Verificado: Tablas de inventario**
- ✅ `epp_productos` + `epp_movimientos` - Para registros simples de EPP (ControlEPP)
- ✅ `epp_productos` + `movimientos_inventario` - Para gestión formal de inventario (MovimientosForm)
- **Ambas tablas son correctas y tienen propósitos diferentes**

---

## 📋 LO QUE DEBES HACER EN SUPABASE (5 minutos)

### PASO 1: Verificar Storage Buckets Existentes

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto **ReporteSeguro**
3. Click en **"Storage"** (menú izquierdo)
4. Verifica que existan estos buckets:

#### Buckets que YA TIENES:
- ✅ `reportes-firmas` (público)
- ✅ `reportes-adjuntos` (público)
- ✅ `perfiles` (público)

**Estos buckets ya existen y el código los usa correctamente.**

#### Buckets OPCIONALES (solo si quieres mejor organización):
Puedes crear estos buckets para separar mejor los archivos:
- `firmas` (público) - Solo para firmas digitales
- `reportes-fotos` (público) - Solo para fotografías de evidencia

**Cómo crear un bucket:**
1. Click en **"New bucket"**
2. Nombre: `firmas` (o `reportes-fotos`)
3. **Marcar:** ✅ Public bucket
4. Click en **"Create bucket"**

⚠️ **NOTA**: Si no creas estos buckets opcionales, el sistema seguirá funcionando usando `reportes-firmas` para todo (firmas + fotos).

---

### PASO 2: Verificar Políticas de Storage (IMPORTANTE)

Los buckets públicos deben tener estas políticas:

1. En **Storage**, click en el bucket `reportes-firmas`
2. Click en **"Policies"**
3. Verifica que existan políticas:
   - **INSERT**: Permitir uploads para usuarios autenticados
   - **SELECT**: Permitir lectura pública

**Si no existen, créalas:**

#### Política de INSERT (Upload):
```sql
-- Nombre: "Usuarios autenticados pueden subir archivos"
CREATE POLICY "Authenticated users can upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reportes-firmas');
```

#### Política de SELECT (Lectura pública):
```sql
-- Nombre: "Archivos son públicamente accesibles"
CREATE POLICY "Public access to files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'reportes-firmas');
```

**Repite para todos los buckets:** `reportes-adjuntos`, `perfiles`, `firmas` (si lo creaste), `reportes-fotos` (si lo creaste)

---

### PASO 3: Limpieza de Base de Datos (OPCIONAL)

Si quieres limpiar las tablas y columnas duplicadas:

1. Ve a **SQL Editor** en Supabase
2. Abre el archivo `sql/cleanup-database.sql` de tu proyecto
3. **Lee los comentarios** de cada sección
4. **Descomenta** solo las secciones que quieras ejecutar
5. Ejecuta sección por sección (NO todo de una vez)

**Secciones disponibles:**
- 🗑️ Eliminar `reportes_old` (si está vacía o migrada)
- 🧹 Limpiar columnas duplicadas en `planes_emergencia`
- 🧹 Limpiar columnas duplicadas en `simulacros_emergencia`

⚠️ **ADVERTENCIA**: Haz backup antes de ejecutar (Supabase hace backups automáticos diarios)

---

## 🧪 PASO 4: Probar que Todo Funciona

### Probar Supervisión de Campo (con firmas e imágenes):

1. Abre la app: `http://localhost:5173` (o tu URL de producción)
2. Ve a **Supervisión de Campo**
3. Llena el formulario:
   - Selecciona un colaborador
   - Agrega una foto de evidencia
   - Firma digitalmente
   - Envía el formulario

**Resultado esperado:**
- ✅ Mensaje: "¡Supervisión registrada exitosamente!"
- ✅ En consola del navegador: `✅ Imagen subida correctamente: https://...`
- ✅ En consola: `✅ Firma obtenida desde SignaturePad: https://...`

### Probar Inventario EPP:

1. Ve a **Inventario** → **Movimientos**
2. Registra una entrada o salida
3. Envía el formulario

**Resultado esperado:**
- ✅ Movimiento registrado sin errores
- ✅ Stock actualizado en la tabla de productos

---

## 🐛 Solución de Problemas

### Error: "Bucket not found"
**Causa**: El bucket no existe en Supabase Storage
**Solución**: Crea el bucket en Storage (ver PASO 1)

### Error: "Access denied" o "403"
**Causa**: Faltan políticas de acceso al bucket
**Solución**: Configura políticas RLS (ver PASO 2)

### Error: "new row violates row-level security policy"
**Causa**: RLS bloqueando inserts en tablas
**Solución**:
```sql
-- Para supervision_campo (si da error)
CREATE POLICY "supervision_all" ON supervision_campo FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Para abordajes_campo (si da error)
CREATE POLICY "abordajes_all" ON abordajes_campo FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### Imágenes/firmas no se guardan
**Causa**: Probablemente error de red o políticas de storage
**Solución**:
1. Abre **DevTools** (F12) → Pestaña **Network**
2. Intenta subir archivo
3. Busca errores en rojo
4. Revisa el mensaje de error específico

---

## 📊 Verificación Final

Ejecuta este query en **SQL Editor** para ver el estado de tu DB:

```sql
-- Ver todas las tablas
SELECT
  tablename,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = t.tablename AND table_schema = 'public') as columns_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;

-- Ver buckets de storage
SELECT name, public, created_at
FROM storage.buckets
ORDER BY name;
```

---

## ✅ Checklist Final

- [ ] Buckets de storage existen y son públicos
- [ ] Políticas de storage configuradas (INSERT + SELECT)
- [ ] Probado: Upload de firmas funciona
- [ ] Probado: Upload de imágenes funciona
- [ ] Probado: Inventario EPP guarda movimientos
- [ ] (Opcional) Limpieza de DB ejecutada

---

## 📞 Soporte

Si algo no funciona:
1. Revisa la consola del navegador (F12) para errores
2. Revisa los logs de Supabase en **Logs** → **Database**
3. Verifica que tu `.env.local` tenga las credenciales correctas

**Recuerda**: Los cambios de código ya están hechos ✅
Solo falta configurar Supabase siguiendo estos pasos 🚀
