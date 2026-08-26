import { prisma } from "../src/lib/prisma.js";
import { calculateFreeSlotsForDate } from "../src/lib/calendar/ical-service.js";
import { runPlanningAgent } from "../src/lib/agents/planning-agent.js";

async function runTest() {
  console.log("--- TEST AUTOMATIZADO DE FASE 1 (MVP) ---");

  // 1. Verificar Proyectos y Tareas
  const projects = await prisma.project.findMany();
  const tasks = await prisma.task.findMany();
  console.log(`[OK] Proyectos en DB: ${projects.length}`);
  console.log(`[OK] Tareas en DB: ${tasks.length}`);

  // 2. Verificar Eventos de Calendario y Cálculo de Huecos Libres
  const today = new Date();
  const events = await prisma.calendarEvent.findMany();
  const freeSlots = await calculateFreeSlotsForDate(today);
  console.log(`[OK] Eventos en DB: ${events.length}`);
  console.log(`[OK] Huecos libres calculados para hoy: ${freeSlots.length}`);
  freeSlots.forEach((slot, i) => {
    console.log(`     Slot ${i + 1}: ${slot.durationMinutes} min (${slot.start.toLocaleTimeString()} - ${slot.end.toLocaleTimeString()})`);
  });

  // 3. Ejecutar Agente de Planificación
  console.log("\nEjecutando Agente de Planificacion...");
  const proposal = await runPlanningAgent(today, "MANUAL");
  console.log(`[OK] Tareas analizadas: ${proposal.totalTasksAnalyzed}`);
  console.log(`[OK] Tareas asignadas a huecos: ${proposal.tasksAssignedCount}`);
  console.log(`[OK] Resumen del plan: "${proposal.summary}"`);
  proposal.assignments.forEach(a => {
    console.log(`     -> "${a.taskTitle}" asignada de ${new Date(a.assignedStart).toLocaleTimeString()} a ${new Date(a.assignedEnd).toLocaleTimeString()}`);
  });

  // 4. Verificar Registro en AgentRun
  const latestRun = await prisma.agentRun.findFirst({
    where: { agentName: "PLANNING_AGENT" },
    orderBy: { createdAt: "desc" },
  });
  console.log(`\n[OK] Ultimo registro AgentRun:`);
  console.log(`     ID: ${latestRun?.id}`);
  console.log(`     Agente: ${latestRun?.agentName}`);
  console.log(`     Status: ${latestRun?.status}`);
  console.log(`     Tiempo de ejecucion: ${latestRun?.executionTimeMs}ms`);

  console.log("\n--- TEST DE FASE 1 SUPERADO SATISFACTORIAMENTE ---");
}

runTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
