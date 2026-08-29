import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando sembrado de datos multidominio en SQLite...");

  const projectTech = await prisma.project.upsert({
    where: { id: "proj-life-os" },
    update: { category: "tech" },
    create: {
      id: "proj-life-os",
      name: "Antigravity & AI Life OS Core",
      description: "Sistema operativo personal con arquitectura multi-agente modular y memoria estructurada.",
      repoUrl: "https://github.com/usuario/life-os",
      category: "tech",
      status: "ACTIVE",
      priority: "CRITICAL",
    },
  });

  const projectBusiness = await prisma.project.upsert({
    where: { id: "proj-lanzing" },
    update: { category: "business" },
    create: {
      id: "proj-lanzing",
      name: "Ecosistema Lanzing Clínicas",
      description: "Desarrollo y automatizaciones clínicas, captación y cualificación B2B.",
      repoUrl: "https://github.com/usuario/lanzing-hub",
      category: "business",
      status: "ACTIVE",
      priority: "HIGH",
    },
  });

  const projectAcademic = await prisma.project.upsert({
    where: { id: "proj-upm" },
    update: { category: "academic" },
    create: {
      id: "proj-upm",
      name: "Ingeniería UPM & MotoStudent",
      description: "Proyectos académicos, telemetría y diseño de sistemas mecánicos y de control.",
      repoUrl: "https://github.com/usuario/motostudent-upm",
      category: "academic",
      status: "ACTIVE",
      priority: "HIGH",
    },
  });

  const projectPerformance = await prisma.project.upsert({
    where: { id: "proj-performance" },
    update: { category: "performance" },
    create: {
      id: "proj-performance",
      name: "Pádel de Competición & Hábitos",
      description: "Entrenamiento físico, rutinas de gimnasio y registro de rendimiento deportivo.",
      repoUrl: null,
      category: "performance",
      status: "ACTIVE",
      priority: "MEDIUM",
    },
  });

  const projectPersonal = await prisma.project.upsert({
    where: { id: "proj-personal" },
    update: { category: "personal" },
    create: {
      id: "proj-personal",
      name: "Finanzas Personales & Viajes",
      description: "Planificación patrimonial, presupuestos mensuales y logística de viajes.",
      repoUrl: null,
      category: "personal",
      status: "ACTIVE",
      priority: "LOW",
    },
  });

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
      projectId: projectTech.id,
      title: "Revisar arquitectura de agentes e inferencia en Google Gemini",
      description: "Asegurar esquemas estructurados JSON y fallback determinista.",
      type: "NORMAL",
      status: "PENDING",
      priority: "URGENT",
      deadline: deadlineToday,
      estimatedDuration: 45,
      origin: "DEV_AGENT",
    },
  });

  await prisma.task.upsert({
    where: { id: "task-002" },
    update: {},
    create: {
      id: "task-002",
      projectId: projectBusiness.id,
      title: "Auditoría de prospectos y propuesta de cold outreach para clínicas",
      description: "Supervisar registros en estado pendiente_revision para validación en 1 clic.",
      type: "NORMAL",
      status: "PENDING",
      priority: "HIGH",
      deadline: deadlineToday,
      estimatedDuration: 30,
      origin: "SALES_AGENT",
    },
  });

  await prisma.task.upsert({
    where: { id: "task-003" },
    update: {},
    create: {
      id: "task-003",
      projectId: projectAcademic.id,
      title: "Análisis de telemetría y entrega de informe MotoStudent",
      description: "Revisar curvas de aceleración y consumo de potencia.",
      type: "NORMAL",
      status: "PENDING",
      priority: "HIGH",
      deadline: tomorrow,
      estimatedDuration: 60,
      origin: "MANUAL",
    },
  });

  await prisma.task.upsert({
    where: { id: "task-004" },
    update: {},
    create: {
      id: "task-004",
      projectId: projectPerformance.id,
      title: "Sesión de gimnasio: Fuerza tren superior y prevención de lesiones",
      description: "Bloque de acondicionamiento físico pre-partido.",
      type: "RECURRING",
      status: "PENDING",
      priority: "MEDIUM",
      deadline: deadlineToday,
      estimatedDuration: 60,
      origin: "MANUAL",
    },
  });

  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();

  await prisma.calendarEvent.upsert({
    where: { externalId: `seed-ev-1-${y}-${m}-${d}` },
    update: {},
    create: {
      externalId: `seed-ev-1-${y}-${m}-${d}`,
      summary: "Reunión de Coordinación Técnica",
      description: "Sincronización de arquitectura y dependencias.",
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
      summary: "Revisión de Métricas y Operaciones",
      description: "Análisis de rendimiento y ejecución de servicios.",
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
      summary: "Sincronización de Roadmap y Agentes",
      description: "Puesta en común de prioridades de desarrollo.",
      startTime: new Date(y, m, d, 16, 30),
      endTime: new Date(y, m, d, 17, 30),
      location: "Google Meet",
      status: "CONFIRMED",
    },
  });

  await prisma.aiAction.upsert({
    where: { id: "action-seed-1" },
    update: {},
    create: {
      id: "action-seed-1",
      agentName: "STRATEGY",
      title: "Desbalance detectado en dominio Academic",
      description: "Se han identificado 2 entregas de MotoStudent sin tareas desglosadas para esta semana.",
      category: "academic",
      actionType: "STRATEGY_ALERT",
      payload: JSON.stringify({ projectId: projectAcademic.id, suggestedAction: "DESGLOSAR_TAREAS" }),
      status: "PENDING_REVIEW",
    },
  });

  await prisma.aiAction.upsert({
    where: { id: "action-seed-2" },
    update: {},
    create: {
      id: "action-seed-2",
      agentName: "SALES",
      title: "Borrador de propuesta de prospección para Clínica Dental Norte",
      description: "Secuencia de 3 correos personalizados redactados y listos para validación humana.",
      category: "business",
      actionType: "OUTREACH_DRAFT",
      payload: JSON.stringify({ target: "Clínica Dental Norte", template: "AEO_HEALTHCARE_V1" }),
      status: "PENDING_REVIEW",
    },
  });

  console.log("Sembrado de datos multidominio completado con éxito.");
}

main()
  .catch((e) => {
    console.error("Error durante el sembrado:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
