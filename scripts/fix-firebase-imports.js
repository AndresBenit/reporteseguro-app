#!/usr/bin/env node

/**
 * 🔧 SCRIPT PARA ARREGLAR IMPORTS DE FIREBASE A SUPABASE
 * 
 * Reemplaza automáticamente todos los imports de Firebase por Supabase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '..', 'src');

// Mapeo de reemplazos
const replacements = [
    {
        from: /import\s*\{[^}]*\}\s*from\s*['"]firebase\/app['"];?\s*/g,
        to: ''
    },
    {
        from: /import\s*\{[^}]*\}\s*from\s*['"]firebase\/auth['"];?\s*/g,
        to: ''
    },
    {
        from: /import\s*\{[^}]*\}\s*from\s*['"]firebase\/firestore['"];?\s*/g,
        to: ''
    },
    {
        from: /import\s*\{[^}]*\}\s*from\s*['"]firebase\/storage['"];?\s*/g,
        to: ''
    },
    {
        from: /import\s*\{[^}]*\}\s*from\s*['"]firebase\/analytics['"];?\s*/g,
        to: ''
    },
    {
        from: /import\s*\{\s*db\s*\}\s*from\s*['"][^'"]*firebase['"];?\s*/g,
        to: 'import { supabase, dbHelpers } from "../services/supabase" : import { supabase, dbHelpers } from "../../services/supabase" : import { supabase, dbHelpers } from "../../../services/supabase";'
    },
    {
        from: /import\s*\{\s*storage\s*\}\s*from\s*['"][^'"]*firebase['"];?\s*/g,
        to: 'import { storageHelpers } from "../services/supabase" : import { storageHelpers } from "../../services/supabase" : import { storageHelpers } from "../../../services/supabase";'
    }
];

/**
 * Procesa un archivo y reemplaza los imports de Firebase
 */
function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let hasChanges = false;
        
        // Aplicar reemplazos
        for (const replacement of replacements) {
            const originalContent = content;
            content = content.replace(replacement.from, replacement.to);
            if (content !== originalContent) {
                hasChanges = true;
            }
        }
        
        // Determinar el número correcto de ../ para supabase
        const depth = filePath.split(path.sep).length - srcDir.split(path.sep).length - 1;
        const relativePath = '../'.repeat(depth) + 'services/supabase';
        
        // Reemplazar imports genéricos de Firebase
        const firebaseImports = [
            /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"][^'"]*firebase['"];?\s*/g
        ];
        
        for (const regex of firebaseImports) {
            content = content.replace(regex, (match, imports) => {
                // Limpiar imports duplicados
                if (content.includes('from "../services/supabase"') || 
                    content.includes('from "../../services/supabase"') ||
                    content.includes('from "../../../services/supabase"')) {
                    return '';
                }
                
                hasChanges = true;
                return `import { supabase, dbHelpers, storageHelpers } from "${relativePath}";\n`;
            });
        }
        
        // Escribir archivo si hay cambios
        if (hasChanges) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Actualizado: ${path.relative(srcDir, filePath)}`);
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error(`❌ Error procesando ${filePath}:`, error.message);
        return false;
    }
}

/**
 * Procesa recursivamente todos los archivos JS/JSX en un directorio
 */
function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    let processedCount = 0;
    
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            processedCount += processDirectory(filePath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            if (processFile(filePath)) {
                processedCount++;
            }
        }
    }
    
    return processedCount;
}

console.log('🔧 ARREGLANDO IMPORTS DE FIREBASE A SUPABASE');
console.log('==============================================\n');

const processedCount = processDirectory(srcDir);

console.log(`\n📊 RESUMEN:`);
console.log(`   ✅ Archivos procesados: ${processedCount}`);
console.log(`\n🎉 ¡Imports de Firebase actualizados a Supabase!`);

export { processDirectory, processFile };