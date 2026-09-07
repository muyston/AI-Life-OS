import fs from "fs";
import path from "path";
import { prisma } from "../prisma";
import { 
  ProjectCategory, 
  PriorityLevel, 
  AntigravityProjectDetails, 
  AntigravityConversationSummary, 
  AntigravityWorkspaceStatus, 
  AntigravityPlanData, 
  AntigravityPlanTaskItem,
  AntigravityInstructionPayload,
  AntigravityMcpServerInfo
} from "../types";

/**
 * Rutas base del ecosistema Antigravity en el sistema operativo local
 */
export function getAntigravityBasePaths() {
  const homeDir = process.env.USERPROFILE || process.env.HOME || "C:\\Users\\grarr";
  const antigravityDir = path.join(homeDir, ".gemini", "antigravity");
  const conversationsDir = path.join(antigravityDir, "conversations");
  const brainDir = path.join(antigravityDir, "brain");

  return {
    homeDir,
    antigravityDir,
    conversationsDir,
    brainDir,
  };
}

/**
 * Determina categoria institucional segun el nombre o ruta del proyecto
 */
function categorizePath(folderName: string): { category: ProjectCategory; priority: PriorityLevel; displayName: string } {
  const lower = folderName.toLowerCase();

  if (lower.includes("lanzing saas")) {
    return {
      category: "business",
      priority: "CRITICAL",
      displayName: "Lanzing SAAS",
    };
  }

  if (lower.includes("lanzing")) {
    return {
      category: "business",
      priority: "HIGH",
      displayName: "Ecosistema Lanzing (Webs y Clientes)",
    };
  }

  if (lower.includes("life os") || lower.includes("ai-life-os")) {
    return {
      category: "tech",
      priority: "CRITICAL",
      displayName: "AI Life OS Core",
    };
  }

  if (lower.includes("scrapp")) {
    return {
      category: "tech",
      priority: "HIGH",
      displayName: "ScrAPP Lead Generation",
    };
  }

  if (lower.includes("smashlab")) {
    return {
      category: "performance",
      priority: "HIGH",
      displayName: "SmashLab App - Padel Analytics",
    };
  }

  if (lower.includes("padel") || lower.includes("videos")) {
    return {
      category: "performance",
      priority: "MEDIUM",
      displayName: "Analisis Tecnico de Padel",
    };
  }

  if (lower.includes("motostudent") || lower.includes("upm")) {
    return {
      category: "academic",
      priority: "HIGH",
      displayName: "Ingenieria UPM y MotoStudent",
    };
  }

  return {
    category: "tech",
    priority: "MEDIUM",
    displayName: folderName,
  };
}

/**
 * Extrae la URL de Git de .git/config de un workspace local
 */
function readLocalGitRemote(projectPath: string): string | null {
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
    // Ignorar fallo de lectura
  }
  return null;
}

/**
 * Lee el ultimo bloque relevante de un archivo transcript.jsonl
 */
function parseTranscriptTail(transcriptPath: string): {
  lastUserInput: string | null;
  lastStepTime: string | null;
} {
  try {
    if (!fs.existsSync(transcriptPath)) {
      return { lastUserInput: null, lastStepTime: null };
    }

    const content = fs.readFileSync(transcriptPath, "utf8");
    const lines = content.trim().split("\n");
    let lastUserInput: string | null = null;
    let lastStepTime: string | null = null;

    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const item = JSON.parse(lines[i]);
        if (!lastStepTime && item.created_at) {
          lastStepTime = item.created_at;
        }
        if (!lastUserInput && item.type === "USER_INPUT" && item.content) {
          const raw = String(item.content);
          const reqMatch = raw.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/i);
          lastUserInput = reqMatch ? reqMatch[1].trim() : raw.trim();
        }
        if (lastUserInput && lastStepTime) break;
      } catch {
        // Linea no parseable ignorada
      }
    }

    return { lastUserInput, lastStepTime };
  } catch {
    return { lastUserInput: null, lastStepTime: null };
  }
}

/**
 * Escanea todos los workspaces y conversaciones activas de Antigravity
 */
export async function scanAntigravityWorkspaces(): Promise<AntigravityProjectDetails[]> {
  const { homeDir, conversationsDir, brainDir } = getAntigravityBasePaths();
  const desktopDir = path.join(homeDir, "Desktop");

  // Mapa de proyectos raiz descubiertos
  const workspaceMap = new Map<string, {
    localPath: string;
    folderName: string;
    workspaceUri: string;
    repoUrl: string | null;
    conversations: AntigravityConversationSummary[];
  }>();

  // 1. Escaneo directo de proyectos reales en el Desktop del usuario
  if (fs.existsSync(desktopDir)) {
    try {
      const desktopEntries = fs.readdirSync(desktopDir, { withFileTypes: true });
      for (const entry of desktopEntries) {
        if (entry.isDirectory()) {
          const folderPath = path.join(desktopDir, entry.name);
          const repoUrl = readLocalGitRemote(folderPath);
          const normalizedKey = folderPath.toLowerCase();

          workspaceMap.set(normalizedKey, {
            localPath: folderPath,
            folderName: entry.name,
            workspaceUri: `file:///${folderPath.replace(/\\/g, "/")}`,
            repoUrl,
            conversations: [],
          });
        }
      }
    } catch (err) {
      console.error("Error al escanear directorio Desktop:", err);
    }
  }

  // Ordenar las claves por longitud descendente para que 'Lanzing SAAS' empareje antes que 'Lanzing'
  const sortedRootKeys = Array.from(workspaceMap.keys()).sort((a, b) => b.length - a.length);

  // 2. Escaneo y asociacion de conversaciones activas en Antigravity
  if (fs.existsSync(conversationsDir)) {
    const dbFiles = fs.readdirSync(conversationsDir).filter((f) => f.endsWith(".db"));

    for (const dbFile of dbFiles) {
      const conversationId = path.basename(dbFile, ".db");
      const dbPath = path.join(conversationsDir, dbFile);

      try {
        const buffer = fs.readFileSync(dbPath);
        const rawString = buffer.toString("latin1");

        // Buscar todas las URIs de workspace
        const matches = rawString.match(/file:\/\/\/[a-zA-Z]:\/[^\x00-\x1f"'\s<>\)\*\&]+/g) || [];
        let matchedRootKey: string | null = null;
        let detectedRepoUrl: string | null = null;

        for (const m of matches) {
          if (m.toLowerCase().includes(".gemini") || m.includes("transcript.jsonl")) continue;
          const clean = m.replace(/[\x00-\x20zš]+$/, "");
          const decoded = decodeURIComponent(clean.replace("file:///", "").replace(/\//g, "\\")).toLowerCase();

          for (const rootKey of sortedRootKeys) {
            if (decoded.startsWith(rootKey)) {
              matchedRootKey = rootKey;
              break;
            }
          }
          if (matchedRootKey) break;
        }

        const matchRepo = rawString.match(/(https:\/\/github\.com\/[^\s\x00-\x1f"'\r\n<>]+\.git)/);
        if (matchRepo) {
          detectedRepoUrl = matchRepo[1].replace(/\.git$/, "");
        }

        // Conteo de pasos en la conversacion
        const stepMatches = rawString.match(/steps/g);
        const stepCount = stepMatches ? Math.max(1, Math.floor(stepMatches.length / 2)) : 10;

        // Inspeccion del Brain de Antigravity
        const conversationBrain = path.join(brainDir, conversationId);
        let hasPlan = false;
        let planSummary: string | null = null;
        let requestFeedback = false;
        let hasWalkthrough = false;
        let walkthroughSummary: string | null = null;
        let artifacts: string[] = [];

        if (fs.existsSync(conversationBrain)) {
          const planPath = path.join(conversationBrain, "implementation_plan.md");
          const planMetaPath = path.join(conversationBrain, "implementation_plan.md.metadata.json");
          hasPlan = fs.existsSync(planPath);

          if (fs.existsSync(planMetaPath)) {
            try {
              const meta = JSON.parse(fs.readFileSync(planMetaPath, "utf8"));
              planSummary = meta.summary || null;
              requestFeedback = Boolean(meta.requestFeedback);
            } catch {}
          }

          const walkthroughPath = path.join(conversationBrain, "walkthrough.md");
          const walkthroughMetaPath = path.join(conversationBrain, "walkthrough.md.metadata.json");
          hasWalkthrough = fs.existsSync(walkthroughPath);

          if (fs.existsSync(walkthroughMetaPath)) {
            try {
              const meta = JSON.parse(fs.readFileSync(walkthroughMetaPath, "utf8"));
              walkthroughSummary = meta.summary || null;
            } catch {}
          }

          try {
            const files = fs.readdirSync(conversationBrain);
            artifacts = files.filter(
              (f) => f.endsWith(".md") && f !== "implementation_plan.md" && f !== "walkthrough.md"
            );
          } catch {}
        }

        const transcriptPath = path.join(conversationBrain, ".system_generated", "logs", "transcript.jsonl");
        const { lastUserInput, lastStepTime } = parseTranscriptTail(transcriptPath);

        const convSummary: AntigravityConversationSummary = {
          conversationId,
          stepCount,
          lastStepTime,
          lastUserInput,
          hasPlan,
          planSummary,
          requestFeedback,
          hasWalkthrough,
          walkthroughSummary,
          artifactsCount: artifacts.length,
          artifacts,
        };

        if (matchedRootKey && workspaceMap.has(matchedRootKey)) {
          const targetWs = workspaceMap.get(matchedRootKey)!;
          if (!targetWs.repoUrl && detectedRepoUrl) {
            targetWs.repoUrl = detectedRepoUrl;
          }
          targetWs.conversations.push(convSummary);
        }
      } catch {}
    }
  }

  // 3. Cruzar con proyectos persistidos en base de datos
  const allDbProjects = await prisma.project.findMany({
    include: {
      tasks: {
        select: { id: true, status: true },
      },
    },
  });

  const results: AntigravityProjectDetails[] = [];

  for (const [, data] of workspaceMap.entries()) {
    const folderName = data.folderName;
    const { category, priority, displayName } = categorizePath(folderName);

    data.conversations.sort((a, b) => {
      const timeA = a.lastStepTime ? new Date(a.lastStepTime).getTime() : 0;
      const timeB = b.lastStepTime ? new Date(b.lastStepTime).getTime() : 0;
      return timeB - timeA;
    });

    const latest = data.conversations[0] || null;
    const totalSteps = data.conversations.reduce((acc, c) => acc + c.stepCount, 0);

    let status: AntigravityWorkspaceStatus = "IDLE";
    if (latest) {
      if (latest.requestFeedback) {
        status = "WAITING_APPROVAL";
      } else if (latest.lastStepTime) {
        const diffMinutes = (Date.now() - new Date(latest.lastStepTime).getTime()) / (1000 * 60);
        if (diffMinutes < 45) {
          status = "ACTIVE";
        } else if (latest.hasPlan && !latest.hasWalkthrough) {
          status = "PLANNING";
        } else if (latest.hasWalkthrough) {
          status = "COMPLETED";
        }
      }
    }

    let matchedPrismaProject = allDbProjects.find((p) => {
      if (p.repoUrl && data.repoUrl && p.repoUrl.toLowerCase() === data.repoUrl.toLowerCase()) return true;
      if (p.name.toLowerCase() === displayName.toLowerCase()) return true;
      if (p.name.toLowerCase() === folderName.toLowerCase()) return true;
      return false;
    });

    // Auto-upsert del proyecto en BD si tiene conversaciones y aun no existe en Prisma
    if (!matchedPrismaProject && data.conversations.length > 0) {
      try {
        matchedPrismaProject = await prisma.project.create({
          data: {
            name: displayName,
            description: `Workspace local de ${folderName} sincronizado desde Antigravity`,
            repoUrl: data.repoUrl,
            category,
            priority,
            status: "ACTIVE",
          },
          include: {
            tasks: { select: { id: true, status: true } },
          },
        });
      } catch {}
    }

    const tasksCount = matchedPrismaProject ? {
      total: matchedPrismaProject.tasks.length,
      pending: matchedPrismaProject.tasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS").length,
      completed: matchedPrismaProject.tasks.filter((t) => t.status === "COMPLETED").length,
    } : undefined;

    results.push({
      id: matchedPrismaProject?.id || Buffer.from(data.localPath).toString("base64url"),
      name: displayName,
      folderName,
      localPath: data.localPath,
      workspaceUri: data.workspaceUri,
      repoUrl: data.repoUrl,
      category: (matchedPrismaProject?.category as ProjectCategory) || category,
      priority: (matchedPrismaProject?.priority as PriorityLevel) || priority,
      status,
      totalConversations: data.conversations.length,
      totalSteps,
      latestConversation: latest,
      recentConversations: data.conversations.slice(0, 5),
      linkedLifeOsProjectId: matchedPrismaProject?.id || null,
      tasksCount,
    });
  }

  results.sort((a, b) => {
    const statusOrder: Record<AntigravityWorkspaceStatus, number> = {
      WAITING_APPROVAL: 0,
      ACTIVE: 1,
      PLANNING: 2,
      COMPLETED: 3,
      IDLE: 4,
    };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return results;
}

/**
 * Obtiene el contenido detallado de un plan de implementacion o walkthrough
 */
export async function getAntigravityPlanDetails(conversationId: string): Promise<AntigravityPlanData | null> {
  const { brainDir } = getAntigravityBasePaths();
  const conversationBrain = path.join(brainDir, conversationId);

  if (!fs.existsSync(conversationBrain)) {
    return null;
  }

  const planPath = path.join(conversationBrain, "implementation_plan.md");
  const planMetaPath = path.join(conversationBrain, "implementation_plan.md.metadata.json");
  const walkthroughPath = path.join(conversationBrain, "walkthrough.md");
  const walkthroughMetaPath = path.join(conversationBrain, "walkthrough.md.metadata.json");

  let content = "";
  if (fs.existsSync(planPath)) {
    content = fs.readFileSync(planPath, "utf8");
  }

  let planSummary: string | null = null;
  let requestFeedback = false;
  let userFacing = true;
  let updatedAt: string | null = null;

  if (fs.existsSync(planMetaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(planMetaPath, "utf8"));
      planSummary = meta.summary || null;
      requestFeedback = Boolean(meta.requestFeedback);
      userFacing = meta.userFacing ?? true;
      updatedAt = meta.updatedAt || null;
    } catch {
      // Ignorar fallo de lectura
    }
  }

  let hasWalkthrough = fs.existsSync(walkthroughPath);
  let walkthroughContent = "";
  let walkthroughSummary: string | null = null;

  if (hasWalkthrough) {
    walkthroughContent = fs.readFileSync(walkthroughPath, "utf8");
    if (fs.existsSync(walkthroughMetaPath)) {
      try {
        const wMeta = JSON.parse(fs.readFileSync(walkthroughMetaPath, "utf8"));
        walkthroughSummary = wMeta.summary || null;
      } catch {
        // Ignorar
      }
    }
  }

  const tasks: AntigravityPlanTaskItem[] = [];
  const lines = content.split("\n");
  let currentSection = "";

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ") || trimmed.startsWith("### ")) {
      currentSection = trimmed.replace(/^#+\s*/, "");
    }

    const checkMatch = trimmed.match(/^-\s*\[([ xX])\]\s+(.+)$/);
    if (checkMatch) {
      const completed = checkMatch[1].toLowerCase() === "x";
      const title = checkMatch[2].trim();
      tasks.push({
        id: `task_${idx}`,
        title,
        description: currentSection ? `Seccion: ${currentSection}` : "Hito del Plan de Implementacion",
        completed,
      });
      return;
    }

    const fileMatch = trimmed.match(/^####\s+\[(NEW|MODIFY|DELETE)\]\s+\*?\[?([^\]\(\)]+)\]?/);
    if (fileMatch) {
      const action = fileMatch[1];
      const fileName = fileMatch[2];
      tasks.push({
        id: `file_${idx}`,
        title: `[${action}] ${fileName}`,
        description: currentSection ? `Componente: ${currentSection}` : `Archivo ${action.toLowerCase()}`,
        completed: false,
        filePath: fileName,
      });
    }
  });

  const titleMatch = content.match(/^#\s+([^\r\n]+)/m);
  const planTitle = titleMatch ? titleMatch[1].trim() : "Plan de Implementacion Antigravity";

  return {
    conversationId,
    projectPath: "",
    projectName: planTitle,
    planTitle,
    planSummary,
    requestFeedback,
    userFacing,
    updatedAt,
    content,
    tasks,
    hasWalkthrough,
    walkthroughContent,
    walkthroughSummary,
  };
}

/**
 * Aprueba formalmente el plan de implementacion de una conversacion
 */
export async function approveAntigravityPlan(conversationId: string, approvalNote?: string): Promise<{ success: boolean; message: string }> {
  const { brainDir } = getAntigravityBasePaths();
  const planMetaPath = path.join(brainDir, conversationId, "implementation_plan.md.metadata.json");

  if (fs.existsSync(planMetaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(planMetaPath, "utf8"));
      meta.requestFeedback = false;
      meta.approvedAt = new Date().toISOString();
      meta.approvalNote = approvalNote || "Aprobado por usuario desde AI Life OS";
      fs.writeFileSync(planMetaPath, JSON.stringify(meta, null, 2), "utf8");
    } catch {
      // Ignorar fallo de escritura
    }
  }

  await prisma.aiAction.create({
    data: {
      agentName: "ANTIGRAVITY",
      title: `Plan Aprobado: Conversacion ${conversationId.slice(0, 8)}`,
      description: approvalNote || "Plan de implementacion validado institucionalmente desde AI Life OS.",
      actionType: "TASK_PROPOSAL",
      status: "APPROVED",
      category: "tech",
      payload: JSON.stringify({ conversationId, approvalNote }),
    },
  });

  return {
    success: true,
    message: "Plan de implementacion aprobado formalmente en Antigravity.",
  };
}

/**
 * Importa los hitos y tareas del plan de Antigravity hacia la tabla Task de Life OS
 */
export async function importPlanTasksToLifeOs(conversationId: string, targetProjectId?: string): Promise<{
  success: boolean;
  tasksImported: number;
  message: string;
}> {
  const planData = await getAntigravityPlanDetails(conversationId);
  if (!planData || planData.tasks.length === 0) {
    return {
      success: false,
      tasksImported: 0,
      message: "No se encontraron tareas ni hitos en el plan para importar.",
    };
  }

  let projectId = targetProjectId;
  if (!projectId) {
    const existingProject = await prisma.project.findFirst({
      where: {
        name: { contains: planData.projectName },
      },
    });
    projectId = existingProject?.id;
  }

  if (!projectId) {
    const newProject = await prisma.project.create({
      data: {
        name: planData.planTitle.slice(0, 100),
        description: planData.planSummary || "Proyecto sincronizado desde plan de Antigravity",
        category: "tech",
        priority: "HIGH",
        status: "ACTIVE",
      },
    });
    projectId = newProject.id;
  }

  let importedCount = 0;

  for (const task of planData.tasks) {
    const existing = await prisma.task.findFirst({
      where: {
        projectId,
        title: task.title,
      },
    });

    if (!existing) {
      await prisma.task.create({
        data: {
          projectId,
          title: task.title,
          description: task.description,
          priority: "HIGH",
          status: task.completed ? "COMPLETED" : "PENDING",
          origin: "ANTIGRAVITY_TODO",
          type: "NORMAL",
          estimatedDuration: 30,
        },
      });
      importedCount++;
    }
  }

  return {
    success: true,
    tasksImported: importedCount,
    message: `Se han importado ${importedCount} hitos del plan a las tareas de AI Life OS.`,
  };
}

/**
 * Despacha una directiva o instruccion tecnica desde Life OS hacia el workspace de Antigravity
 */
export async function dispatchAntigravityInstruction(payload: AntigravityInstructionPayload): Promise<{
  success: boolean;
  message: string;
  directiveFilePath?: string;
}> {
  const { projectPath, instruction, category = "tech", createTask = true } = payload;

  if (!fs.existsSync(projectPath)) {
    throw new Error(`El directorio del workspace no existe: ${projectPath}`);
  }

  const directiveFile = path.join(projectPath, "ANTIGRAVITY_DIRECTIVES.md");
  const timestamp = new Date().toISOString();
  const entry = `\n\n## Directiva enviada desde AI Life OS (${timestamp})\n\n${instruction.trim()}\n\n---\n`;

  if (fs.existsSync(directiveFile)) {
    fs.appendFileSync(directiveFile, entry, "utf8");
  } else {
    fs.writeFileSync(
      directiveFile,
      `# Directivas Operativas de AI Life OS\n\nInstrucciones emitidas para el agente de Antigravity.\n${entry}`,
      "utf8"
    );
  }

  await prisma.aiAction.create({
    data: {
      agentName: "ANTIGRAVITY",
      title: `Directiva enviada a ${path.basename(projectPath)}`,
      description: instruction.slice(0, 300),
      actionType: "CODE_SNIPPET",
      category,
      status: "APPROVED",
      payload: JSON.stringify({
        projectPath,
        directiveFile,
        timestamp,
        instruction,
      }),
    },
  });

  if (createTask) {
    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { name: path.basename(projectPath) },
          { name: { contains: path.basename(projectPath) } },
        ],
      },
    });

    await prisma.task.create({
      data: {
        projectId: project?.id || null,
        title: `Ejecutar directiva en ${path.basename(projectPath)}`,
        description: instruction,
        priority: "HIGH",
        status: "IN_PROGRESS",
        origin: "ANTIGRAVITY_TODO",
        type: "NORMAL",
        estimatedDuration: 45,
      },
    });
  }

  return {
    success: true,
    message: `Directiva tecnica archivada exitosamente en ${path.basename(directiveFile)}.`,
    directiveFilePath: directiveFile,
  };
}

/**
 * Descubre e inspecciona los servidores MCP configurados en el ecosistema Antigravity
 */
export async function getAntigravityMcpServers(): Promise<AntigravityMcpServerInfo[]> {
  const { antigravityDir } = getAntigravityBasePaths();
  const mcpDir = path.join(antigravityDir, "mcp");

  const defaultDescriptions: Record<string, string> = {
    github: "Operaciones en repositorios remotos de GitHub (commits, pull requests, issues y sincronizacion de ramas)",
    context7: "Resolucion y consulta semantica de documentacion tecnica y bibliotecas de codigo",
    memory: "Grafo de conocimiento estructurado, relaciones entre entidades y memoria persistente",
    firecrawl: "Rastreo y extraccion estructurada de contenido web para LLMs",
  };

  const results: AntigravityMcpServerInfo[] = [];

  if (!fs.existsSync(mcpDir)) {
    // Si el directorio no existe aun, devolver la declaracion estandar de los servidores nativos
    return [
      {
        name: "github",
        status: "CONFIGURED",
        toolsCount: 26,
        tools: ["create_or_update_file", "push_files", "create_pull_request", "list_issues"],
        description: defaultDescriptions.github,
      },
      {
        name: "context7",
        status: "CONFIGURED",
        toolsCount: 2,
        tools: ["resolve-library-id", "query-docs"],
        description: defaultDescriptions.context7,
      },
      {
        name: "memory",
        status: "CONFIGURED",
        toolsCount: 9,
        tools: ["create_entities", "create_relations", "read_graph", "search_nodes"],
        description: defaultDescriptions.memory,
      },
    ];
  }

  try {
    const entries = fs.readdirSync(mcpDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const serverName = entry.name;
        const serverPath = path.join(mcpDir, serverName);
        let tools: string[] = [];

        try {
          const files = fs.readdirSync(serverPath);
          tools = files
            .filter((f) => f.endsWith(".json"))
            .map((f) => f.replace(/\.json$/, ""));
        } catch {
          tools = [];
        }

        results.push({
          name: serverName,
          status: "ACTIVE",
          toolsCount: tools.length,
          tools: tools.slice(0, 8),
          description: defaultDescriptions[serverName] || `Servidor MCP para integracion agéntica con ${serverName}`,
        });
      }
    }
  } catch (err) {
    console.error("Error al descubrir servidores MCP de Antigravity:", err);
  }

  return results;
}

