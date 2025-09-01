// Script para probar formularios automáticamente
const puppeteer = require('puppeteer');

async function testForm(url, formName) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capturar errores de consola
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });
  
  // Capturar errores de JavaScript
  const jsErrors = [];
  page.on('pageerror', error => {
    jsErrors.push(error.message);
  });

  try {
    console.log(`🧪 Probando formulario: ${formName}`);
    console.log(`📍 URL: ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Esperar un momento para que se cargue completamente
    await page.waitForTimeout(3000);
    
    // Verificar si la página cargó correctamente
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    
    console.log(`✅ ${formName} cargado correctamente`);
    console.log(`📊 Errores JS: ${jsErrors.length}`);
    console.log(`📊 Mensajes consola: ${consoleLogs.length}`);
    
    if (jsErrors.length > 0) {
      console.log('🚨 ERRORES JS ENCONTRADOS:');
      jsErrors.forEach(error => console.log(`  - ${error}`));
    }
    
    // Filtrar solo errores importantes de consola
    const importantLogs = consoleLogs.filter(log => 
      log.type === 'error' || 
      log.text.includes('Warning') || 
      log.text.includes('Error')
    );
    
    if (importantLogs.length > 0) {
      console.log('⚠️ MENSAJES IMPORTANTES DE CONSOLA:');
      importantLogs.forEach(log => 
        console.log(`  [${log.type}] ${log.text}`)
      );
    }
    
    return {
      success: true,
      jsErrors,
      consoleLogs: importantLogs,
      formName
    };
    
  } catch (error) {
    console.log(`❌ Error cargando ${formName}:`, error.message);
    return {
      success: false,
      error: error.message,
      jsErrors,
      consoleLogs,
      formName
    };
  } finally {
    await browser.close();
  }
}

// Función principal
async function runTests() {
  const baseUrl = 'http://localhost:5177';
  
  const forms = [
    { url: `${baseUrl}/reportes/incident-form-original`, name: 'IncidentReportForm' },
    { url: `${baseUrl}/formularios/recomendacion-original`, name: 'SupervisionCampo' },
    { url: `${baseUrl}/formularios/abordaje-original`, name: 'AbordajeCampo' }
  ];
  
  console.log('🚀 Iniciando pruebas automáticas de formularios...\n');
  
  const results = [];
  
  for (const form of forms) {
    const result = await testForm(form.url, form.name);
    results.push(result);
    console.log('─'.repeat(60));
  }
  
  // Resumen final
  console.log('\n📋 RESUMEN DE PRUEBAS:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.formName}: ${result.success ? 'OK' : 'ERROR'}`);
    if (!result.success) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.jsErrors.length > 0) {
      console.log(`   JS Errors: ${result.jsErrors.length}`);
    }
  });
}

if (require.main === module) {
  runTests().catch(console.error);
}