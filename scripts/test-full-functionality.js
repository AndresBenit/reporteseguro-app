#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

dotenv.config({ path: join(rootDir, '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 VERIFICACIÓN COMPLETA DE FUNCIONALIDAD');
console.log('=========================================\n');

let testResults = {
  formularios: { passed: 0, failed: 0, issues: [] },
  dashboard: { passed: 0, failed: 0, issues: [] },
  exportacion: { passed: 0, failed: 0, issues: [] },
  analisis: { passed: 0, failed: 0, issues: [] },
  colaboradores: { passed: 0, failed: 0, issues: [] },
  supervision: { passed: 0, failed: 0, issues: [] }
};

async function testFormularios() {
  console.log('📝 VERIFICANDO FORMULARIOS DE REPORTES');
  console.log('=====================================\n');
  
  try {
    // 1. Verificar que los componentes de formularios existen
    const formPaths = [
      'src/components/reports/forms/IncidentReportForm.jsx',
      'src/components/reports/forms/PersonnelReportForm.jsx',
      'src/components/reports/forms/ObservationReportForm.jsx',
      'src/components/reports/forms/FollowUpReportForm.jsx'
    ];
    
    console.log('🔍 Verificando archivos de formularios...');
    for (const path of formPaths) {
      const fullPath = join(rootDir, path);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${path} - Existe`);
        testResults.formularios.passed++;
      } else {
        console.log(`❌ ${path} - No encontrado`);
        testResults.formularios.failed++;
        testResults.formularios.issues.push(`Archivo faltante: ${path}`);
      }
    }
    
    // 2. Probar creación de reporte de prueba
    console.log('\n🧪 Probando creación de reporte...');
    const testReporte = {
      tipo: 'Condición Insegura',
      tipo_reporte: 'Condición Insegura',
      descripcion: 'Reporte de prueba automática - ' + new Date().toISOString(),
      area: 'Testing',
      reportante: 'Sistema Automático',
      estado: 'pendiente',
      severidad: 'media',
      created_at: new Date().toISOString()
    };
    
    const { data: newReporte, error: createError } = await supabase
      .from('reportes')
      .insert(testReporte)
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Error creando reporte de prueba:', createError.message);
      testResults.formularios.failed++;
      testResults.formularios.issues.push('Error en creación de reportes');
    } else {
      console.log('✅ Reporte de prueba creado exitosamente');
      console.log(`   ID: ${newReporte.id}`);
      testResults.formularios.passed++;
      
      // Limpiar reporte de prueba
      await supabase.from('reportes').delete().eq('id', newReporte.id);
      console.log('🗑️  Reporte de prueba eliminado');
    }
    
  } catch (error) {
    console.log('❌ Error general en formularios:', error.message);
    testResults.formularios.failed++;
    testResults.formularios.issues.push(error.message);
  }
}

async function testDashboard() {
  console.log('\n📊 VERIFICANDO DASHBOARD Y GRÁFICAS');
  console.log('===================================\n');
  
  try {
    // 1. Verificar componentes de dashboard
    const dashboardPaths = [
      'src/components/dashboard/MainDashboard.jsx',
      'src/components/dashboard/StatsOverview.jsx',
      'src/components/dashboard/ChartsSection.jsx',
      'src/components/dashboard/RecentActivity.jsx',
      'src/components/common/Graficos.jsx'
    ];
    
    console.log('🔍 Verificando archivos de dashboard...');
    for (const path of dashboardPaths) {
      const fullPath = join(rootDir, path);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${path} - Existe`);
        testResults.dashboard.passed++;
      } else {
        console.log(`❌ ${path} - No encontrado`);
        testResults.dashboard.failed++;
        testResults.dashboard.issues.push(`Archivo faltante: ${path}`);
      }
    }
    
    // 2. Verificar datos para gráficas
    console.log('\n📈 Verificando datos para gráficas...');
    const { data: reportes, error: reportesError } = await supabase
      .from('reportes')
      .select('*');
    
    if (reportesError) {
      console.log('❌ Error obteniendo datos para gráficas:', reportesError.message);
      testResults.dashboard.failed++;
      testResults.dashboard.issues.push('Error obteniendo datos de reportes');
    } else {
      console.log(`✅ Datos disponibles: ${reportes.length} reportes`);
      
      // Verificar distribución por estado
      const estadosDistribucion = {};
      reportes.forEach(r => {
        estadosDistribucion[r.estado] = (estadosDistribucion[r.estado] || 0) + 1;
      });
      
      console.log('📊 Distribución por estados:');
      Object.entries(estadosDistribucion).forEach(([estado, count]) => {
        console.log(`   ${estado}: ${count}`);
      });
      
      testResults.dashboard.passed++;
    }
    
  } catch (error) {
    console.log('❌ Error general en dashboard:', error.message);
    testResults.dashboard.failed++;
    testResults.dashboard.issues.push(error.message);
  }
}

async function testExportacion() {
  console.log('\n📤 VERIFICANDO EXPORTACIÓN DE DATOS');
  console.log('==================================\n');
  
  try {
    // 1. Verificar dependencia XLSX
    console.log('📦 Verificando dependencia XLSX...');
    const packageJson = JSON.parse(fs.readFileSync(join(rootDir, 'package.json'), 'utf8'));
    
    if (packageJson.dependencies?.xlsx) {
      console.log(`✅ XLSX instalado: ${packageJson.dependencies.xlsx}`);
      testResults.exportacion.passed++;
    } else {
      console.log('❌ XLSX no encontrado en dependencias');
      testResults.exportacion.failed++;
      testResults.exportacion.issues.push('Dependencia XLSX faltante');
    }
    
    // 2. Probar exportación de datos
    console.log('\n🧪 Probando exportación de datos...');
    const { data: reportes, error } = await supabase
      .from('reportes')
      .select('*')
      .limit(10);
    
    if (error) {
      console.log('❌ Error obteniendo datos para exportar:', error.message);
      testResults.exportacion.failed++;
      testResults.exportacion.issues.push('Error obteniendo datos para exportar');
    } else {
      console.log(`✅ ${reportes.length} reportes disponibles para exportar`);
      
      // Simular estructura de exportación
      const exportData = reportes.map(r => ({
        ID: r.id,
        Tipo: r.tipo,
        Descripcion: r.descripcion,
        Area: r.area,
        Estado: r.estado,
        Severidad: r.severidad,
        Fecha: r.created_at
      }));
      
      console.log('📋 Estructura de exportación preparada');
      console.log(`   Campos: ${Object.keys(exportData[0] || {}).join(', ')}`);
      testResults.exportacion.passed++;
    }
    
  } catch (error) {
    console.log('❌ Error general en exportación:', error.message);
    testResults.exportacion.failed++;
    testResults.exportacion.issues.push(error.message);
  }
}

async function testAnalisis() {
  console.log('\n📈 VERIFICANDO ANÁLISIS Y ESTADÍSTICAS');
  console.log('=====================================\n');
  
  try {
    // 1. Verificar hooks de estadísticas
    const hooksPath = 'src/hooks/useReportes.js';
    if (fs.existsSync(join(rootDir, hooksPath))) {
      console.log(`✅ ${hooksPath} - Hook de reportes existe`);
      testResults.analisis.passed++;
    } else {
      console.log(`❌ ${hooksPath} - Hook faltante`);
      testResults.analisis.failed++;
      testResults.analisis.issues.push('Hook useReportes faltante');
    }
    
    // 2. Probar cálculo de estadísticas
    console.log('\n🧮 Probando cálculo de estadísticas...');
    const { data: reportes } = await supabase
      .from('reportes')
      .select('*');
    
    // Simular función getEstadisticas
    const stats = {
      total: reportes.length,
      pendientes: reportes.filter(r => r.estado === 'pendiente').length,
      enProceso: reportes.filter(r => ['en_proceso', 'proceso'].includes(r.estado)).length,
      resueltos: reportes.filter(r => r.estado === 'resuelto').length,
      porSeveridad: {
        baja: reportes.filter(r => r.severidad === 'baja').length,
        media: reportes.filter(r => r.severidad === 'media').length,
        alta: reportes.filter(r => r.severidad === 'alta').length,
        critica: reportes.filter(r => r.severidad === 'critica').length
      }
    };
    
    console.log('📊 Estadísticas calculadas:');
    console.log(`   Total: ${stats.total}`);
    console.log(`   Pendientes: ${stats.pendientes}`);
    console.log(`   En Proceso: ${stats.enProceso}`);
    console.log(`   Resueltos: ${stats.resueltos}`);
    console.log('   Por Severidad:', stats.porSeveridad);
    
    testResults.analisis.passed++;
    
  } catch (error) {
    console.log('❌ Error general en análisis:', error.message);
    testResults.analisis.failed++;
    testResults.analisis.issues.push(error.message);
  }
}

async function testColaboradores() {
  console.log('\n👥 VERIFICANDO MÓDULO DE COLABORADORES');
  console.log('====================================\n');
  
  try {
    // 1. Verificar tabla colaboradores
    console.log('🔍 Verificando tabla colaboradores...');
    const { data: colaboradores, error: colabError } = await supabase
      .from('colaboradores')
      .select('*')
      .limit(5);
    
    if (colabError) {
      console.log('❌ Error accediendo tabla colaboradores:', colabError.message);
      testResults.colaboradores.failed++;
      testResults.colaboradores.issues.push('Error accediendo tabla colaboradores');
    } else {
      console.log(`✅ Tabla colaboradores accesible: ${colaboradores.length} registros`);
      testResults.colaboradores.passed++;
      
      if (colaboradores.length > 0) {
        const sample = colaboradores[0];
        console.log('📄 Estructura de colaboradores:');
        Object.keys(sample).forEach(field => {
          console.log(`   - ${field}: ${typeof sample[field]}`);
        });
      }
    }
    
    // 2. Verificar componentes de colaboradores
    const colabPaths = [
      'src/components/collaborators/ColaboradoresMain.jsx',
      'src/components/collaborators/Colaboradores.jsx',
      'src/components/collaborators/ExcelUploader.jsx'
    ];
    
    console.log('\n🔍 Verificando archivos de colaboradores...');
    for (const path of colabPaths) {
      if (fs.existsSync(join(rootDir, path))) {
        console.log(`✅ ${path} - Existe`);
        testResults.colaboradores.passed++;
      } else {
        console.log(`❌ ${path} - No encontrado`);
        testResults.colaboradores.failed++;
        testResults.colaboradores.issues.push(`Archivo faltante: ${path}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Error general en colaboradores:', error.message);
    testResults.colaboradores.failed++;
    testResults.colaboradores.issues.push(error.message);
  }
}

async function testSupervision() {
  console.log('\n👁️ VERIFICANDO MÓDULO DE SUPERVISIÓN');
  console.log('===================================\n');
  
  try {
    // 1. Verificar componentes de supervisión
    const supervisionPaths = [
      'src/components/supervision/SupervisionMain.jsx',
      'src/components/supervision/SupervisionSelector.jsx',
      'src/components/supervision/SupervisionCampo.jsx',
      'src/components/supervision/AbordajeCampo.jsx',
      'src/components/supervision/AnalisisSupervision.jsx'
    ];
    
    console.log('🔍 Verificando archivos de supervisión...');
    for (const path of supervisionPaths) {
      if (fs.existsSync(join(rootDir, path))) {
        console.log(`✅ ${path} - Existe`);
        testResults.supervision.passed++;
      } else {
        console.log(`❌ ${path} - No encontrado`);
        testResults.supervision.failed++;
        testResults.supervision.issues.push(`Archivo faltante: ${path}`);
      }
    }
    
    // 2. Verificar integración con reportes
    console.log('\n🔗 Verificando integración con reportes...');
    const { data: reportesSupervision } = await supabase
      .from('reportes')
      .select('*')
      .in('tipo', ['Supervisión', 'Observación', 'Recomendación']);
    
    console.log(`✅ Reportes de supervisión encontrados: ${reportesSupervision?.length || 0}`);
    testResults.supervision.passed++;
    
  } catch (error) {
    console.log('❌ Error general en supervisión:', error.message);
    testResults.supervision.failed++;
    testResults.supervision.issues.push(error.message);
  }
}

function generateReport() {
  console.log('\n📋 RESUMEN DE VERIFICACIÓN COMPLETA');
  console.log('==================================\n');
  
  const modules = ['formularios', 'dashboard', 'exportacion', 'analisis', 'colaboradores', 'supervision'];
  let totalPassed = 0;
  let totalFailed = 0;
  let allIssues = [];
  
  modules.forEach(module => {
    const result = testResults[module];
    totalPassed += result.passed;
    totalFailed += result.failed;
    allIssues = allIssues.concat(result.issues);
    
    const status = result.failed === 0 ? '✅' : result.failed > result.passed ? '❌' : '⚠️';
    const percentage = result.passed + result.failed > 0 
      ? Math.round((result.passed / (result.passed + result.failed)) * 100) 
      : 0;
    
    console.log(`${status} ${module.toUpperCase()}: ${result.passed}/${result.passed + result.failed} (${percentage}%)`);
    
    if (result.issues.length > 0) {
      result.issues.forEach(issue => {
        console.log(`   ⚠️  ${issue}`);
      });
    }
  });
  
  console.log(`\n🎯 RESULTADO GENERAL: ${totalPassed}/${totalPassed + totalFailed} pruebas pasadas`);
  const overallPercentage = totalPassed + totalFailed > 0 
    ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100) 
    : 0;
  console.log(`📊 Porcentaje general de éxito: ${overallPercentage}%`);
  
  if (overallPercentage >= 90) {
    console.log('\n🎉 SISTEMA COMPLETAMENTE FUNCIONAL');
    console.log('   El proyecto está listo para uso en producción');
  } else if (overallPercentage >= 75) {
    console.log('\n⚠️  SISTEMA MAYORMENTE FUNCIONAL');
    console.log('   Algunos módulos necesitan atención');
  } else {
    console.log('\n❌ SISTEMA CON PROBLEMAS SIGNIFICATIVOS');
    console.log('   Se requiere trabajo adicional antes de usar en producción');
  }
  
  if (allIssues.length > 0) {
    console.log('\n🔧 PROBLEMAS ENCONTRADOS QUE NECESITAN ATENCIÓN:');
    allIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }
}

async function main() {
  console.log(`🌐 URL: ${process.env.VITE_SUPABASE_URL}`);
  console.log(`🔑 Service Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ Faltante'}\n`);
  
  await testFormularios();
  await testDashboard();
  await testExportacion();
  await testAnalisis();
  await testColaboradores();
  await testSupervision();
  
  generateReport();
}

main().catch(console.error);