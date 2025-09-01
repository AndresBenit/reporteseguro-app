#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 Starting Vercel build with Rollup fix...");

// Función para ejecutar comandos
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { 
      stdio: "inherit",
      shell: true,
      ...options 
    });
    
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function main() {
  try {
    // Paso 1: Limpiar binarios de plataforma incorrecta
    console.log("🧹 Cleaning platform-specific binaries...");
    try {
      await runCommand("rm", ["-rf", "node_modules/@esbuild"]);
      await runCommand("rm", ["-rf", "node_modules/.bin"]);
      console.log("✅ Platform binaries cleaned");
    } catch (error) {
      console.log("⚠️  Cleanup failed, continuing...");
    }
    
    // Paso 2: Reinstalar dependencias para plataforma correcta
    console.log("📦 Reinstalling for correct platform...");
    try {
      await runCommand("npm", ["rebuild", "esbuild"]);
      console.log("✅ esbuild rebuilt for Linux");
    } catch (error) {
      console.log("⚠️  Rebuild failed, trying fresh install...");
      try {
        await runCommand("npm", ["install", "@esbuild/linux-x64", "--force"]);
        console.log("✅ Linux esbuild installed");
      } catch (error2) {
        console.log("⚠️  Linux esbuild install failed, continuing...");
      }
    }
    
    // Paso 3: Instalar Rollup Linux (puede fallar, no pasa nada)
    console.log("📦 Installing Rollup Linux binary...");
    try {
      await runCommand("npm", ["install", "@rollup/rollup-linux-x64-gnu", "--optional", "--force"]);
      console.log("✅ Rollup Linux installed successfully");
    } catch (error) {
      console.log("⚠️  Rollup Linux install failed, continuing with fallback");
    }
    
    // Paso 2: Ejecutar build con Node directamente
    console.log("🏗️  Building with Vite...");
    
    // Intentar múltiples métodos de ejecución
    const vitePath = path.join(__dirname, "..", "node_modules", "vite", "bin", "vite.js");
    
    try {
      await runCommand("node", [vitePath, "build"]);
      console.log("✅ Build completed successfully with node vite.js");
    } catch (error1) {
      console.log("⚠️  Method 1 failed, trying npx...");
      try {
        await runCommand("npx", ["vite", "build"]);
        console.log("✅ Build completed successfully with npx");
      } catch (error2) {
        console.log("⚠️  Method 2 failed, trying direct binary...");
        try {
          await runCommand("./node_modules/.bin/vite", ["build"]);
          console.log("✅ Build completed successfully with direct binary");
        } catch (error3) {
          console.error("❌ All build methods failed:");
          console.error("Method 1 (node vite.js):", error1.message);
          console.error("Method 2 (npx):", error2.message);
          console.error("Method 3 (direct binary):", error3.message);
          process.exit(1);
        }
      }
    }
    
    console.log("🎉 Build completed successfully!");
  } catch (error) {
    console.error("❌ Build script failed:", error.message);
    process.exit(1);
  }
}

main();
