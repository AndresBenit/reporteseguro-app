# Configuración de Storage en Supabase

## Buckets Requeridos

Para que el sistema funcione correctamente, necesitas crear los siguientes buckets en Supabase Storage:

### 1. `reportes-adjuntos` (PÚBLICO)
- **Uso**: Archivos adjuntos de reportes
- **Tipo**: Público
- **Formatos**: Imágenes, PDFs, documentos de texto
- **Tamaño máximo**: 10MB

### 2. `firmas` (PÚBLICO)
- **Uso**: Firmas digitales de formularios
- **Tipo**: Público
- **Formatos**: PNG, JPEG
- **Tamaño máximo**: 1MB

### 3. `reportes-fotos` (PÚBLICO)
- **Uso**: Fotografías de evidencia para reportes
- **Tipo**: Público
- **Formatos**: Imágenes
- **Tamaño máximo**: 5MB

### 4. `colaboradores-fotos` (PRIVADO)
- **Uso**: Fotografías de perfil de colaboradores
- **Tipo**: Privado
- **Formatos**: Imágenes
- **Tamaño máximo**: 2MB

## Instrucciones para Crear Buckets

### Paso 1: Acceder a Supabase Dashboard
1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto ReporteSeguro

### Paso 2: Navegar a Storage
1. En el menú lateral, haz clic en **"Storage"**
2. Selecciona **"Buckets"**

### Paso 3: Crear cada bucket
Para cada bucket requerido:

1. Haz clic en **"Create bucket"**
2. Ingresa el nombre exacto del bucket (ej: `reportes-adjuntos`)
3. Marca/desmarca **"Public bucket"** según corresponda:
   - ✅ **PÚBLICO**: `reportes-adjuntos`, `firmas`, `reportes-fotos`
   - ❌ **PRIVADO**: `colaboradores-fotos`
4. Haz clic en **"Create bucket"**

### Paso 4: Configurar Políticas (Automático)
Las políticas de seguridad se configuran automáticamente:
- **Buckets públicos**: Acceso de lectura para todos, escritura para usuarios autenticados
- **Buckets privados**: Acceso solo para usuarios autenticados

## Verificación

Una vez creados todos los buckets, la aplicación debería funcionar sin errores de "Bucket not found".

### Errores Comunes:
- ❌ **"Bucket not found"**: El bucket no existe en Supabase
- ❌ **"Access denied"**: Problemas de políticas de seguridad
- ❌ **"File too large"**: El archivo excede el límite de tamaño

### Estado Actual:
Necesitas crear los siguientes buckets en tu dashboard de Supabase:
- [ ] `reportes-adjuntos` (público)
- [ ] `firmas` (público)
- [ ] `reportes-fotos` (público)
- [ ] `colaboradores-fotos` (privado)

## Soporte
Si tienes problemas:
1. Verifica que el nombre del bucket sea exacto
2. Confirma que el tipo (público/privado) sea correcto
3. Revisa las políticas de seguridad en la pestaña "Policies"

Una vez completada la configuración, elimina los errores de consola y permitirá subir archivos correctamente.