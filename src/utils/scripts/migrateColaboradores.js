// Script completo de migración de colaboradores
import { dbHelpers, supabase } from '../../services/supabase.js';

// Datos completos de colaboradores del Excel
const colaboradoresData = {
  centroIndustrial: [
    { item: 1, nombre: "ABRIL JUAN DE JESUS", cedula: "1077145518" },
    { item: 2, nombre: "ACUÑA CARDENAS ROSA", cedula: "1065915056" },
    { item: 3, nombre: "AGUILAR RODRIGUEZ DIEGO", cedula: "1076664538" },
    { item: 4, nombre: "ALARCON ALFONSO", cedula: "1076651952" },
    { item: 5, nombre: "ARIAS GARZON STEFANI", cedula: "1076654860" },
    { item: 6, nombre: "AREVALO AREVALO JHON ALEXIS", cedula: "1077295407" },
    { item: 7, nombre: "AREVALO CAROLINA", cedula: "1077295660" },
    { item: 8, nombre: "ALMONACID YENNY", cedula: "53910597" },
    { item: 9, nombre: "AMAYA YONIER", cedula: "1002759964" },
    { item: 10, nombre: "BAUTISTA KARINA", cedula: "1024539270" },
    { item: 11, nombre: "BALLEN AYDE", cedula: "1003880508" },
    { item: 12, nombre: "BELLO GARZON YADIRA", cedula: "20865396" },
    { item: 13, nombre: "CALDERON RIGOBERTO", cedula: "1071608631" },
    { item: 14, nombre: "CAICEDO ANGARITA SANDRA", cedula: "1075673573" },
    { item: 15, nombre: "CAICEDO JHON JAIRO", cedula: "1077294356" },
    { item: 16, nombre: "CARVAJAL CARVAJAL NICOLAS", cedula: "1004300618" },
    { item: 17, nombre: "CASTILLO DANILO", cedula: "1074888622" },
    { item: 18, nombre: "CASTRO ROMERO RONY", cedula: "80544849" },
    { item: 19, nombre: "CONTRERAS FREDY", cedula: "1076652346" },
    { item: 20, nombre: "CORTES MANUEL FRANCISCO", cedula: "1076654720" },
    { item: 21, nombre: "FORERO JHON ALEXANDER", cedula: "1076656896" },
    { item: 22, nombre: "GOMEZ BELLO YEIMY", cedula: "1076663163" },
    { item: 23, nombre: "GONZALEZ DANIEL", cedula: "1076651361" },
    { item: 24, nombre: "GONZALEZ DIEGO ANDRES", cedula: "1002607661" },
    { item: 25, nombre: "HERNANDEZ CLAUDIA MIREYA", cedula: "20980033" },
    { item: 26, nombre: "LADINO DIEGO", cedula: "1077112341" },
    { item: 27, nombre: "LATORRE INFANTE LEIVER", cedula: "3196310" },
    { item: 28, nombre: "LOPEZ CARRILLO ALEJANDRA", cedula: "1002365022" },
    { item: 29, nombre: "LOPEZ CARRILLO JAVIER", cedula: "1049650185" },
    { item: 30, nombre: "MALAVER PRADA SULIA ANDI", cedula: "1076660237" },
    { item: 31, nombre: "MEDINA GEOVANNY", cedula: "74186778" },
    { item: 32, nombre: "MERCHAN DANILO", cedula: "1057589409" },
    { item: 33, nombre: "MUÑOZ JORGE", cedula: "74364256" },
    { item: 34, nombre: "NIETO GARZON KAMILA", cedula: "1003475948" },
    { item: 35, nombre: "NEIZA LILIANA", cedula: "1002679346" },
    { item: 36, nombre: "OLAYA LEONARDO", cedula: "1076663149" },
    { item: 37, nombre: "PRADA BONILLA YORSK EDWIN", cedula: "1076664572" },
    { item: 38, nombre: "PACHON ELVIS SNEIDER", cedula: "1077294508" },
    { item: 39, nombre: "RAMOS RODRIGO", cedula: "3196771" },
    { item: 40, nombre: "RAMIREZ EDWAR FERNEY", cedula: "1076242476" },
    { item: 41, nombre: "RAMOS RODRIGUEZ JULIAN ALONSO", cedula: "1076649359" },
    { item: 42, nombre: "RIVERA MORENO SERGIO ELIAN", cedula: "1007747430" },
    { item: 43, nombre: "SARMIENTO CAÑON YURI PATRICIA", cedula: "1076654943" },
    { item: 44, nombre: "SALAZAR JENNY", cedula: "20865296" },
    { item: 45, nombre: "SUAREZ ANTONIO", cedula: "79619292" },
    { item: 46, nombre: "TRIVIÑO PRADA BALVIR", cedula: "1003774172" },
    { item: 47, nombre: "VELASQUEZ ANGELICA", cedula: "1003880216" },
    { item: 48, nombre: "VELASQUEZ DANIEL FELIPE", cedula: "1007708872" },
    { item: 49, nombre: "VELASQUEZ LILIA", cedula: "1076650034" }
  ],
  hornosSolera: [
    { item: 1, nombre: "AMAYA JONATHAN", cedula: "1002759963" },
    { item: 2, nombre: "ARCE FERNANDO", cedula: "1022341617" },
    { item: 3, nombre: "ARDILA ANDRES CAMILO", cedula: "1076664005" },
    { item: 4, nombre: "AREVALO AREVALO JESUS ALONSO", cedula: "1077295154" },
    { item: 5, nombre: "BABATIVA LUIS CAMILO", cedula: "1075678531" },
    { item: 6, nombre: "BENAVIDES DEAZA YADIRA", cedula: "35450433" },
    { item: 7, nombre: "CHAVES MARIO", cedula: "1076657553" },
    { item: 8, nombre: "CAICEDO MONTAÑO LUIS ENRIQUE", cedula: "1077112130" },
    { item: 9, nombre: "CAÑON CARLOS ARTURO", cedula: "1076669996" },
    { item: 10, nombre: "CAÑON JAVIER", cedula: "80544266" },
    { item: 11, nombre: "FORERO JOSE LEONARDO", cedula: "1076652958" },
    { item: 12, nombre: "FORERO DANIEL FELIPE", cedula: "1072367095" },
    { item: 13, nombre: "GRANADOS ANGEL ANTONIO", cedula: "1116993091" },
    { item: 14, nombre: "HERNANDEZ EDILFONSO", cedula: "1076661401" },
    { item: 15, nombre: "JORGE SALAZAR BRYAN", cedula: "1076648198" },
    { item: 16, nombre: "QUIMBAYO JUAN JOSE", cedula: "1107974203" },
    { item: 17, nombre: "MALAVER BRAYAN ANDRES", cedula: "1076648033" },
    { item: 18, nombre: "NOVA QUIROGA JUAN", cedula: "3049466" },
    { item: 19, nombre: "PEREZ HEINER DANILO", cedula: "1057605295" },
    { item: 20, nombre: "RAMOS IVER ANDREY", cedula: "1077295178" },
    { item: 21, nombre: "RODRIGUEZ GIOVANY", cedula: "1071608574" },
    { item: 22, nombre: "SANCHEZ RIVERA STIVEN ORLANDO", cedula: "1007383752" },
    { item: 23, nombre: "VARGAS WILSON", cedula: "1076649123" }
  ]
};

export const migrateColaboradores = async () => {
  try {
    console.log('🚀 Iniciando migración de 72 colaboradores...');
    
    let totalMigrados = 0;
    let yaExisten = 0;
    let errores = 0;

    // Migrar Centro Industrial
    for (const colaborador of colaboradoresData.centroIndustrial) {
      try {
        // Check if colaborador already exists
        const { data: existingColaboradores } = await supabase
          .from('colaboradores')
          .select('*')
          .eq('cedula', colaborador.cedula)
          .limit(1);
        
        if (!existingColaboradores || existingColaboradores.length === 0) {
          await dbHelpers.create('colaboradores', {
            nombre: colaborador.nombre.trim(),
            cedula: colaborador.cedula,
            area: 'Centro Industrial',
            departamento: 'Centro Industrial',
            activo: true,
            fechaCreacion: new Date().toISOString(),
            fechaActualizacion: new Date().toISOString(),
            item: colaborador.item,
            tipoColaborador: 'Operativo'
          });
          totalMigrados++;
        } else {
          yaExisten++;
        }
      } catch (error) {
        errores++;
        console.error(`Error con ${colaborador.nombre}:`, error.message);
      }
    }

    // Migrar Hornos Solera
    for (const colaborador of colaboradoresData.hornosSolera) {
      try {
        // Check if colaborador already exists
        const { data: existingColaboradores } = await supabase
          .from('colaboradores')
          .select('*')
          .eq('cedula', colaborador.cedula)
          .limit(1);
        
        if (!existingColaboradores || existingColaboradores.length === 0) {
          await dbHelpers.create('colaboradores', {
            nombre: colaborador.nombre.trim(),
            cedula: colaborador.cedula,
            area: 'Hornos Solera',
            departamento: 'Hornos Solera',
            activo: true,
            fechaCreacion: new Date().toISOString(),
            fechaActualizacion: new Date().toISOString(),
            item: colaborador.item,
            tipoColaborador: 'Operativo'
          });
          totalMigrados++;
        } else {
          yaExisten++;
        }
      } catch (error) {
        errores++;
        console.error(`Error con ${colaborador.nombre}:`, error.message);
      }
    }

    const resultado = {
      migrados: totalMigrados,
      yaExisten,
      errores,
      total: totalMigrados + yaExisten,
      totalEsperado: colaboradoresData.centroIndustrial.length + colaboradoresData.hornosSolera.length
    };

    console.log('✅ Migración completada:', resultado);
    return resultado;
    
  } catch (error) {
    console.error('❌ Error general en migración:', error);
    throw new Error(`Error en migración: ${error.message}`);
  }
};

export const getEstadisticasColaboradores = async () => {
  try {
    const colaboradores = await dbHelpers.getAll('colaboradores');
    
    const stats = {
      total: 0,
      centroIndustrial: 0,
      hornosSolera: 0,
      activos: 0,
      inactivos: 0,
      porArea: {},
      colaboradores: []
    };

    // Procesar datos de forma optimizada
    colaboradores.forEach((data) => {
      stats.total++;
      
      // Contar por área
      if (data.area === 'Centro Industrial') {
        stats.centroIndustrial++;
      } else if (data.area === 'Hornos Solera') {
        stats.hornosSolera++;
      }
      
      // Contar por estado
      if (data.activo) {
        stats.activos++;
      } else {
        stats.inactivos++;
      }
      
      // Contar por área general
      const area = data.area || 'Sin especificar';
      stats.porArea[area] = (stats.porArea[area] || 0) + 1;
    });
    
    stats.colaboradores = colaboradores;
    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return {
      total: 0,
      centroIndustrial: 0,
      hornosSolera: 0,
      activos: 0,
      inactivos: 0,
      porArea: {},
      colaboradores: []
    };
  }
};

export const getColaboradoresActivos = async () => {
  try {
    const colaboradores = await dbHelpers.getAll('colaboradores', {
      filters: { activo: true },
      orderBy: 'nombre',
      ascending: true
    });
    
    return colaboradores;
  } catch (error) {
    console.error('Error obteniendo colaboradores activos:', error);
    return [];
  }
};

export { colaboradoresData };

export const validarCedulaColombiana = (cedula) => {
  if (!cedula || typeof cedula !== 'string') return false;
  const cedulaLimpia = cedula.replace(/\D/g, '');
  return cedulaLimpia.length >= 6 && cedulaLimpia.length <= 10 && !cedulaLimpia.startsWith('0');
};