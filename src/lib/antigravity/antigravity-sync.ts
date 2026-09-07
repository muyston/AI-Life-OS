import fs from "fs";
import path from "path";
import { prisma } from "../prisma";
import { ProjectCategory, PriorityLevel, ProjectStatus } from "../types";
import { scanAntigravityWorkspaces, getAntigravityPlanDetails } from "./antigravity-service";

export interface AntigravitySyncResult {
  success: boolean;
  projectsSynced: number;
  tasksSynced: number;
  message: string;
  details: {
    projects: {
      name: string;
      category: string;
      repoUrl: string | null;
      tasksCount: number;
    }[];
  };
}

interface DiscoveredProject {
  name: string;
  folderName: string;
  localPath: string;
  description: string;
  repoUrl: string | null;
  category: ProjectCategory;
  priority: PriorityLevel;
  status: ProjectStatus;
  tasks: {
    title: string;
    description: string;
    priority: PriorityLevel;
    estimatedDuration: number;
  }[];
}

/**
 * Lee la URL remota de git desde el archivo .git/config si existe
 */
function getGitRemoteUrl(projectPath: string): string | null {
  try {
    const gitConfigPath = path.join(projectPath, ".git", "config");
    if (fs.existsSync(gitConfigPath)) {
      const config = fs.readFileSync(gitConfigPath, "utf8");
      const match = config.match(/url\s*=\s*(https:\/\/github\.com\/[^\s\r\n\t]+)/i) ||
                    config.match(/url\s*=\s*(git@github\.com:[^\s\r\n\t]+)/i);
      if (match) {
        let url = match[1].trim();
        if (url.startsWith("git@github.com:")) {
          url = url.replace("git@github.com:", "https://github.com/");
        }
        if (url.endsWith(".git")) {
          url = url.slice(0, -4);
        }
        return url;
      }
    }
  } catch {
    // Ignorar si no se puede leer
  }
  return null;
}

/**
 * Extrae tareas o hitos desde package.json o README
 */
function extractProjectTasks(projectPath: string, projectName: string): { title: string; description: string; priority: PriorityLevel; estimatedDuration: number }[] {
  const tasks: { title: string; description: string; priority: PriorityLevel; estimatedDuration: number }[] = [];

  try {
    const pkgPath = path.join(projectPath, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      if (pkg.scripts) {
        if (pkg.scripts.build) {
          tasks.push({
            title: `Validar compilacion y build de ${projectName}`,
            description: `Ejecutar 'npm run build' y verificar tipado estricto en ${projectName}.`,
            priority: "HIGH",
            estimatedDuration: 20,
          });
        }
        if (pkg.scripts.test) {
          tasks.push({
            title: `Ejecutar suite de tests en ${projectName}`,
            description: `Comprobar cobertura y tests unitarios en el workspace.`,
            priority: "MEDIUM",
            estimatedDuration: 25,
          });
        }
      }
    }

    const readmePath = path.join(projectPath, "README.md");
    if (fs.existsSync(readmePath)) {
      const readme = fs.readFileSync(readmePath, "utf8");
      const todoMatches = readme.match(/- \[([ x])\]\s+([^\r\n]+)/g);
      if (todoMatches) {
        todoMatches.slice(0, 5).forEach((item) => {
          const isDone = item.startsWith("- [x]");
          if (!isDone) {
            const cleanTitle = item.replace(/- \[ \]\s+/, "").trim();
            tasks.push({
              title: cleanTitle,
              description: `Tarea extraida del README de ${projectName}.`,
              priority: "MEDIUM",
              estimatedDuration: 45,
            });
          }
        });
      }
    }
  } catch {
    // Continuar sin tareas automaticas si falla la lectura
  }

  if (tasks.length === 0) {
    tasks.push({
      title: `Revision de arquitectura y dependencias en ${projectName}`,
      description: `Comprobar estado del workspace, dependencias actualizadas y sincronizacion con Antigravity.`,
      priority: "MEDIUM",
      estimatedDuration: 30,
    });
  }

  return tasks;
}

/**
 * Determina la categoria y prioridad segun el nombre del proyecto
 */
function categorizeProject(folderName: string, pkgName: string): { category: ProjectCategory; priority: PriorityLevel; name: string; description: string } {
  const lower = (folderName + " " + pkgName).toLowerCase();

  if (lower.includes("lanzing saas")) {
    return {
      category: "business",
      priority: "CRITICAL",
      name: "Lanzing SAAS",
      description: "SaaS clinico integral para automatizacion de citas, agentes y publicacion automatizada con Postiz.",
    };
  }

  if (lower.includes("lanzing")) {
    return {
      category: "business",
      priority: "HIGH",
      name: "Ecosistema Lanzing (Webs y Clientes)",
      description: "Plataforma de conversion y landings medicas de alto impacto para clinicas dentales y esteticas.",
    };
  }

  if (lower.includes("life os") || lower.includes("ai-life-os")) {
    return {
      category: "tech",
      priority: "CRITICAL",
      name: "AI Life OS Core",
      description: "Sistema operativo personal y profesional con orquestacion multi-agente, agenda y planificacion.",
    };
  }

  if (lower.includes("scrapp")) {
    return {
      category: "tech",
      priority: "HIGH",
      name: "ScrAPP Lead Generation",
      description: "Motor de extraccion, scraping inteligente y enriquecimiento de prospectos y clinicas.",
    };
  }

  if (lower.includes("smashlab")) {
    return {
      category: "performance",
      priority: "HIGH",
      name: "SmashLab App - Padel Analytics",
      description: "Aplicacion de seguimiento de estadisticas, tecnica y analisis de rendimiento en partidos de padel.",
    };
  }

  if (lower.includes("padel") || lower.includes("videos")) {
    return {
      category: "performance",
      priority: "MEDIUM",
      name: "Analisis Tecnico de Padel y Videos",
      description: "Grabaciones y sesiones de entrenamiento tactico de padel de competicion.",
    };
  }

  if (lower.includes("motostudent") || lower.includes("upm")) {
    return {
      category: "academic",
      priority: "HIGH",
      name: "Ingenieria UPM y MotoStudent",
      description: "Desarrollo y simulacion del prototipo electrico MotoStudent y proyectos academicos.",
    };
  }

  return {
    category: "tech",
    priority: "MEDIUM",
    name: folderName,
    description: `Workspace de desarrollo local sincronizado desde ${folderName}.`,
  };
}

/**
 * Escanea y sincroniza todos los workspaces de Antigravity y directorios locales
 */
export async function syncAntigravityProjects(): Promise<AntigravitySyncResult> {
  const discovered: DiscoveredProject[] = [];
  const scannedPaths = new Set<string>();

  // 1. Escanear workspaces profundos de Antigravity
  try {
    const agWorkspaces = await scanAntigravityWorkspaces();
    for (const ws of agWorkspaces) {
      scannedPaths.add(ws.localPath);

      let wsTasks = extractProjectTasks(ws.localPath, ws.name);

      // Si el workspace tiene un plan activo en Antigravity, extraer tareas del plan
      if (ws.latestConversation?.hasPlan) {
        const planDetails = await getAntigravityPlanDetails(ws.latestConversation.conversationId);
        if (planDetails && planDetails.tasks.length > 0) {
          const planTasks = planDetails.tasks.slice(0, 10).map((pt) => ({
            title: pt.title,
            description: pt.description,
            priority: "HIGH" as PriorityLevel,
            estimatedDuration: 30,
          }));
          wsTasks = [...planTasks, ...wsTasks];
        }
      }

      discovered.push({
        name: ws.name,
        folderName: ws.folderName,
        localPath: ws.localPath,
        description: `Workspace Antigravity (${ws.totalConversations} sesiones, ${ws.totalSteps} pasos)`,
        repoUrl: ws.repoUrl,
        category: ws.category,
        priority: ws.priority,
        status: "ACTIVE",
        tasks: wsTasks,
      });
    }
  } catch {
    // Si falla el escaneo de workspaces, continuar con escaneo local de escritorio
  }

  // 2. Escanear directorio Desktop del usuario para proyectos no vinculados
  const homeDir = process.env.USERPROFILE || process.env.HOME || "C:\\Users\\grarr";
  const desktopDir = path.join(homeDir, "Desktop");

  if (fs.existsSync(desktopDir)) {
    const entries = fs.readdirSync(desktopDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = path.join(desktopDir, entry.name);
        if (scannedPaths.has(fullPath)) continue;
        scannedPaths.add(fullPath);

        let pkgName = "";
        const pkgPath = path.join(fullPath, "package.json");
        if (fs.existsSync(pkgPath)) {
          try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
            pkgName = pkg.name || "";
          } catch {
            // Ignorar error
          }
        }

        const repoUrl = getGitRemoteUrl(fullPath);
        const { category, priority, name, description } = categorizeProject(entry.name, pkgName);
        const tasks = extractProjectTasks(fullPath, name);

        discovered.push({
          name,
          folderName: entry.name,
          localPath: fullPath,
          description,
          repoUrl,
          category,
          priority,
          status: "ACTIVE",
          tasks,
        });
      }
    }
  }

  // 3. Upsert en base de datos Prisma
  let projectsSyncedCount = 0;
  let tasksSyncedCount = 0;
  const projectSummary: { name: string; category: string; repoUrl: string | null; tasksCount: number }[] = [];

  for (const item of discovered) {
    let existing = await prisma.project.findFirst({
      where: {
        OR: [
          { name: item.name },
          ...(item.repoUrl ? [{ repoUrl: item.repoUrl }] : []),
        ],
      },
    });

    if (existing) {
      existing = await prisma.project.update({
        where: { id: existing.id },
        data: {
          name: item.name,
          description: item.description,
          repoUrl: item.repoUrl || existing.repoUrl,
          category: item.category,
          priority: item.priority,
          status: existing.status,
        },
      });
    } else {
      existing = await prisma.project.create({
        data: {
          name: item.name,
          description: item.description,
          repoUrl: item.repoUrl,
          category: item.category,
          priority: item.priority,
          status: item.status,
        },
      });
    }

    projectsSyncedCount++;

    // Sincronizar tareas del proyecto
    let projectTaskCount = 0;
    for (const t of item.tasks) {
      const existingTask = await prisma.task.findFirst({
        where: {
          projectId: existing.id,
          title: t.title,
        },
      });

      if (!existingTask) {
        await prisma.task.create({
          data: {
            projectId: existing.id,
            title: t.title,
            description: t.description,
            priority: t.priority,
            estimatedDuration: t.estimatedDuration,
            origin: "ANTIGRAVITY_TODO",
            status: "PENDING",
            type: "NORMAL",
          },
        });
        tasksSyncedCount++;
      }
      projectTaskCount++;
    }

    projectSummary.push({
      name: item.name,
      category: item.category,
      repoUrl: item.repoUrl,
      tasksCount: projectTaskCount,
    });
  }

  return {
    success: true,
    projectsSynced: projectsSyncedCount,
    tasksSynced: tasksSyncedCount,
    message: `Sincronizacion completada con exito. ${projectsSyncedCount} proyectos de Antigravity y ${tasksSyncedCount} nuevas tareas indexadas en el sistema.`,
    details: {
      projects: projectSummary,
    },
  };
}
