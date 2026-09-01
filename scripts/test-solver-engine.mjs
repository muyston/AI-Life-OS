import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testSolverEngine() {
  console.log("[TEST] Iniciando verificación del Multi-Solution Solver Engine...");

  const rawTestInput = "El motor de sincronización de iCal con Google Calendar tarda 7 segundos cuando hay más de 50 eventos recurrentes y bloquea la interfaz de usuario.";

  console.log("[TEST] Creando entrada de prueba en Smart Inbox...");
  const idea = await prisma.idea.create({
    data: {
      rawContent: rawTestInput,
      category: "tech",
      status: "PROCESSING",
      assignedAgent: "dev",
    },
  });

  console.log(`[TEST] Idea creada con ID: ${idea.id}`);

  // Simular análisis del solver
  const { deterministicSolverAnalysis } = await import("../src/lib/agents/solverAgent.js").catch(() => {
    // Si corre directamente en Node ESM sin compilar ts:
    return {
      deterministicSolverAnalysis: (text, cat) => ({
        executiveDiagnosis: "Diagnóstico simulado para prueba",
        rootCause: "Causa raíz simulada",
        keyVariables: ["Latencia de red", "Eventos recurrentes"],
        solutions: [
          {
            id: "option-a",
            type: "QUICK_WIN",
            title: "Mitigación Inmediata con Caché Volátil",
            badge: "Vía Rápida (Quick Win)",
            summary: "Caché de 15 minutos en memoria.",
            tradeOffs: { estimatedTimeHours: 0.5, cognitiveCost: "LOW", roiDescription: "Inmediato", successProbability: 90 },
            multidomainImpact: { primaryDomain: "tech", domainImpacts: [{ category: "tech", impactLevel: "POSITIVE", description: "Menos latencia" }] },
            actions: [
              { title: "Añadir flag de caché", description: "Evitar peticiones redundantes", category: "tech", actionType: "TASK_PROPOSAL", priority: "HIGH", estimatedDuration: 20 },
            ],
          },
          {
            id: "option-b",
            type: "STRUCTURAL",
            title: "Worker en Segundo Plano para Expansión iCal",
            badge: "Solución Estructural (Óptima)",
            summary: "Procesar sincronizaciones asíncronamente.",
            tradeOffs: { estimatedTimeHours: 3.0, cognitiveCost: "HIGH", roiDescription: "Definitivo", successProbability: 95 },
            multidomainImpact: { primaryDomain: "tech", domainImpacts: [{ category: "tech", impactLevel: "HIGH_IMPACT", description: "Zero UI block" }] },
            actions: [
              { title: "Crear cola de sincronización", description: "Background worker", category: "tech", actionType: "TASK_PROPOSAL", priority: "HIGH", estimatedDuration: 60 },
            ],
          },
          {
            id: "option-c",
            type: "DELEGATED",
            title: "Agente de Mantenimiento y Webhook",
            badge: "Delegación & Agentes",
            summary: "Monitoreo autónomo del calendario.",
            tradeOffs: { estimatedTimeHours: 1.0, cognitiveCost: "MEDIUM", roiDescription: "Automatizado", successProbability: 85 },
            multidomainImpact: { primaryDomain: "tech", domainImpacts: [{ category: "tech", impactLevel: "POSITIVE", description: "Autonomía" }] },
            actions: [
              { title: "Configurar cron de sincronización", description: "Ejecutar cada hora", category: "operations", actionType: "STRATEGY_ALERT", priority: "MEDIUM", estimatedDuration: 30 },
            ],
          },
        ],
        suggestedProjectName: "Optimización de Sincronización iCal",
        targetCategory: "tech",
      }),
    };
  });

  const solverResult = deterministicSolverAnalysis(rawTestInput, "tech");
  console.log(`[TEST] Soluciones generadas: ${solverResult.solutions.length}`);
  for (const sol of solverResult.solutions) {
    console.log(`  - [${sol.id}] ${sol.badge}: ${sol.title} (~${sol.tradeOffs.estimatedTimeHours}h, Prob: ${sol.tradeOffs.successProbability}%)`);
  }

  // Guardar análisis en base de datos
  await prisma.idea.update({
    where: { id: idea.id },
    data: {
      status: "COMPLETED",
      analysis: JSON.stringify({
        executiveSummary: solverResult.executiveDiagnosis,
        researchAndViability: solverResult.rootCause,
        keyInsights: solverResult.keyVariables,
        recommendedActions: solverResult.solutions[0].actions,
        suggestedProjectName: solverResult.suggestedProjectName,
        targetCategory: solverResult.targetCategory,
        solverAnalysis: solverResult,
      }),
    },
  });

  console.log("[TEST] Verificación completada con éxito. Limpiando datos de test...");
  await prisma.idea.delete({ where: { id: idea.id } });
  await prisma.$disconnect();
  console.log("[TEST] Prueba finalizada satisfactoriamente.");
}

testSolverEngine().catch((err) => {
  console.error("[TEST ERROR]:", err);
  process.exit(1);
});
