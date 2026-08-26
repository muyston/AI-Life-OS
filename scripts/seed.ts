import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando sembrado de datos iniciales en SQLite...");

  // 1. Limpiar o verificar proyectos
  const project1 = await prisma.project.upsert({
    where: { id: "proj-life-os" },
    update: {},
    create: {
      id: "proj-life-os",
      name: "Life OS Core",
      description: "Sistema operativo personal con arquitectura de agentes de IA y memoria estructurada.",
      repoUrl: "https://github.com/usuario/life-os",
      status: "ACTIVE",
      priority: "CRITICAL",
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: "proj-lanzing" },
    update: {},
    create: {
      id: "proj-lanzing",
      name: "Ecosistema Lanzing",
      description: "Desarrollo y automatizaciones clínicas del ecosistema Lanzing.",
      repoUrl: "https://github.com/usuario/lanzing-hub",
      status: "ACTIVE",
      priority: "HIGH",
    },
  });

  // 2. Crear tareas iniciales
  const today = new Date();
  const deadlineToday = new Date(today);
  deadlineToday.setHours(18, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  await prisma.task.upsert({
    where: { id: "task-001" },
    update: {},
    create: {
      id: "task-001",
      projectId: project1.id,
      title: "Configurar credenciales OAuth de Google Calendar en consola GCP",
      description: "Generar Client ID y Refresh Token para sincronizacion automatica bidireccional.",
      type: "MANUAL",
      status: "PENDING",
      priority: "URGENT",
      deadline: deadlineToday,
      estimatedDuration: 30,
      origin: "MANUAL",
    },
  });

  await prisma.task.upsert({
    where: { id: "task-002" },
    update: {},
    create: {
      id: "task-002",
      projectId: project1.id,
      title: "Diseñar arquitectura del Agente de Captura de GitHub para Fase 2",
      description: "Escanear bloques MANUAL_TODO en repositorios activos y convertirlos en tareas de Life OS.",
      type: "NORMAL",
      status: "PENDING",
      priority: "HIGH",
      deadline: tomorrow,
      estimatedDuration: 45,
      origin: "MANUAL",
    },
  });

  await prisma.task.upsert({
    where: { id: "task-003" },
    update: {},
    create: {
      id: "task-003",
      projectId: project2.id,
      title: "Revisar pipeline de cualificacion de leads en clinicas",
      description: "Supervisar registros en estado pendiente_revision segun directriz de intervencion humana.",
      type: "RECURRING",
      status: "PENDING",
      priority: "HIGH",
      deadline: deadlineToday,
      estimatedDuration: 45,
      origin: "MANUAL",
    },
  });

  await prisma.task.upsert({
    where: { id: "task-004" },
    update: {},
    create: {
      id: "task-004",
      projectId: project1.id,
      title: "Auditoria de seguridad y validacion estricta de variables de entorno",
      description: "Asegurar que ningun token o credencial se filtre fuera de .env.",
      type: "NORMAL",
      status: "COMPLETED",
      priority: "MEDIUM",
      estimatedDuration: 20,
      origin: "MANUAL",
      completedAt: new Date(),
    },
  });

  // 3. Eventos de calendario para hoy
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();

  await prisma.calendarEvent.upsert({
    where: { externalId: `seed-ev-1-${y}-${m}-${d}` },
    update: {},
    create: {
      externalId: `seed-ev-1-${y}-${m}-${d}`,
      summary: "Reunion de Coordinacion Tecnica",
      description: "Sincronizacion de arquitectura y dependencias.",
      startTime: new Date(y, m, d, 9, 30),
      endTime: new Date(y, m, d, 10, 30),
      location: "Google Meet",
      status: "CONFIRMED",
    },
  });

  await prisma.calendarEvent.upsert({
    where: { externalId: `seed-ev-2-${y}-${m}-${d}` },
    update: {},
    create: {
      externalId: `seed-ev-2-${y}-${m}-${d}`,
      summary: "Revision de Metricas y Operaciones",
      description: "Analisis de rendimiento y ejecucion de servicios.",
      startTime: new Date(y, m, d, 13, 0),
      endTime: new Date(y, m, d, 14, 0),
      location: "Oficina",
      status: "CONFIRMED",
    },
  });

  await prisma.calendarEvent.upsert({
    where: { externalId: `seed-ev-3-${y}-${m}-${d}` },
    update: {},
    create: {
      externalId: `seed-ev-3-${y}-${m}-${d}`,
      summary: "Sincronizacion de Roadmap y Agentes",
      description: "Puesta en comun de prioridades de desarrollo.",
      startTime: new Date(y, m, d, 16, 30),
      endTime: new Date(y, m, d, 17, 30),
      location: "Google Meet",
      status: "CONFIRMED",
    },
  });

  console.log("Sembrado de datos iniciales completado con exito.");
}

main()
  .catch((e) => {
    console.error("Error durante el sembrado:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
