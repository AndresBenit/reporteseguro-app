# Claude Code - Metodología de Mejoras Seguras

## Principios Fundamentales

### 1. NUNCA Romper Funcionalidad Existente
- Toda mejora debe mantener la funcionalidad actual
- Siempre hacer backup/commit antes de cambios importantes
- Usar Git como red de seguridad activa

### 2. Mejoras Incrementales y Defensivas
- Cambios pequeños, frecuentes y verificables
- Cada cambio debe ser revertible individualmente
- Priorizar robustez sobre funcionalidad avanzada

### 3. Validación Múltiple de Datos
- Siempre validar types y estructura de datos
- Implementar fallbacks para campos opcionales
- Prevenir errores con datos null/undefined/empty

## Comandos de Desarrollo

### Linting y Verificación
```bash
npm run lint        # Verificar estilo de código
npm run typecheck   # Verificar tipos TypeScript (si aplica)
npm run build       # Verificar compilación
```

### Testing
```bash
npm test           # Ejecutar pruebas
npm run test:watch # Modo watch para desarrollo
```

## Metodología de Trabajo

### Fase 1: Análisis y Backup
1. **Hacer commit** del estado actual funcional
2. **Identificar** qué funciona actualmente
3. **Documenter** el objetivo de la mejora
4. **Identificar** riesgos potenciales

### Fase 2: Implementación Defensiva
1. **Validar datos** con múltiples fallbacks
2. **Mantener compatibilidad** con estructura existente
3. **Agregar logging** temporal para diagnosis
4. **Implementar progresivamente** una funcionalidad a la vez

### Fase 3: Verificación
1. **Probar** en desarrollo local
2. **Verificar** que no hay errores en consola
3. **Confirmar** que funcionalidad existente sigue trabajando
4. **Limpiar** debugging temporal si no es necesario

### Fase 4: Deploy Seguro
1. **Commit** con mensaje descriptivo
2. **Push** a producción
3. **Verificar** funcionamiento en producción
4. **Monitorear** por errores post-deploy

## Patrones de Código Defensivo

### Validación de Arrays
```javascript
const datosValidos = Array.isArray(datos) ? datos : [];
const resultados = datosValidos.filter(item => item && item.campo);
```

### Validación de Strings
```javascript
const campo = reporte.campo && typeof reporte.campo === 'string' && reporte.campo.trim()
  ? reporte.campo.trim()
  : 'Valor por defecto';
```

### Fallbacks Múltiples
```javascript
const area = reporte.area || reporte.lugar_labor || reporte.area_abordaje || 'Sin área';
```

### Validación de Objetos
```javascript
const estadisticas = reporte && reporte.stats && typeof reporte.stats === 'object'
  ? reporte.stats
  : {};
```

## Estrategias para Gráficos y Charts

### Validación de Datos para Recharts
```javascript
const chartData = rawData
  .filter(item => item && typeof item === 'object')
  .map(item => ({
    label: item.label || 'Sin etiqueta',
    value: Number(item.value) || 0
  }))
  .filter(item => item.value > 0);

// Fallback si no hay datos válidos
if (chartData.length === 0 && rawData.length > 0) {
  chartData.push({ label: 'Datos sin procesar', value: rawData.length });
}
```

### Renderizado Condicional Robusto
```javascript
{chartData && chartData.length > 0 ? (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={chartData}>
      {/* Chart components */}
    </BarChart>
  </ResponsiveContainer>
) : (
  <div className="h-[300px] flex items-center justify-center">
    <p>No hay datos disponibles</p>
  </div>
)}
```

## Lecciones Aprendidas - Caso "Invariant Failed"

### Problema
- Mejoras agresivas rompieron funcionalidad básica
- Error "Invariant failed" causó pantallas en blanco
- Datos malformados pasados a componentes Recharts

### Solución Aplicada
1. **Revert completo** a commit funcional conocido
2. **Análisis cuidadoso** de estructura de datos
3. **Implementación defensiva** con validaciones múltiples
4. **Testing incremental** de cada mejora

### Prevención Futura
- Nunca hacer cambios masivos sin backup
- Validar siempre la estructura de datos antes de pasarla a componentes
- Usar múltiples fallbacks para campos críticos
- Implementar mejoras de una en una, no todas juntas

## Estructura de Commits

### Formato Recomendado
```
🔧 TIPO: Descripción concisa del cambio

- Detalle específico del cambio
- Validaciones añadidas
- Compatibilidad mantenida

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Tipos de Commit
- 🛡️ ROBUSTEZ: Mejoras en validación y estabilidad
- 🔧 MEJORA: Funcionalidad nueva sin romper existente
- 🐛 FIX: Corrección de errores
- 🎨 ESTILO: Cambios de diseño/CSS
- 📝 DOCS: Documentación
- ⚡ PERF: Optimizaciones de rendimiento

## Checklist Pre-Deploy

- [ ] ✅ Funcionalidad existente sigue trabajando
- [ ] ✅ No hay errores en consola del navegador
- [ ] ✅ Datos se cargan correctamente
- [ ] ✅ Gráficos/charts renderizan sin errores
- [ ] ✅ Componentes tienen fallbacks apropiados
- [ ] ✅ Validaciones de datos implementadas
- [ ] ✅ Commit realizado con mensaje descriptivo
- [ ] ✅ Build/lint pasan sin errores

---

**Nota**: Esta metodología fue desarrollada después de experimentar errores críticos por mejoras agresivas. El objetivo es mantener un balance entre innovación y estabilidad.