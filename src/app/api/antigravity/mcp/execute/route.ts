import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { dispatchAntigravityInstruction } from "@/lib/antigravity/antigravity-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { serverName, toolName, args, projectPath, prompt } = body;

    if (!serverName && !toolName && !prompt) {
      return apiError("Se requieren parámetros de ejecución MCP (serverName, toolName o prompt).", { status: 400 });
    }

    const timestamp = new Date().toISOString();

    // Si se pasa una directiva o prompt específico
    if (projectPath && (prompt || toolName)) {
      const instructionText = prompt || `Ejecutar herramienta MCP [${serverName}/${toolName}] con parámetros: ${JSON.stringify(args || {})}`;
      
      const dispatchResult = await dispatchAntigravityInstruction({
        projectPath,
        instruction: instructionText,
        category: "tech",
        createTask: true,
      });

      return apiSuccess({
        status: "DISPATCHED",
        serverName: serverName || "antigravity_core",
        toolName: toolName || "instruction_dispatcher",
        timestamp,
        directiveResult: dispatchResult,
        message: `Directiva MCP despachada exitosamente hacia el workspace de Antigravity.`,
      });
    }

    // Registro formal de la acción en la bitácora institucional
    const actionRecord = await prisma.aiAction.create({
      data: {
        agentName: "ANTIGRAVITY",
        title: `Invocación MCP: ${serverName || "general"}.${toolName || "action"}`,
        description: `Llamada a herramienta MCP desde AI Life OS`,
        actionType: "CODE_SNIPPET",
        category: "tech",
        status: "APPROVED",
        payload: JSON.stringify({ serverName, toolName, args, timestamp }),
      },
    });

    return apiSuccess({
      status: "EXECUTED",
      actionId: actionRecord.id,
      serverName,
      toolName,
      timestamp,
      message: `Herramienta MCP registrada y canalizada en el ecosistema Antigravity.`,
    });
  } catch (error) {
    return handleApiError(error, "Error al ejecutar la acción MCP de Antigravity.");
  }
}
