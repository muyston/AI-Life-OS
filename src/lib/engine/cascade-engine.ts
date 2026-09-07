import { IdeaEntity, ProjectCategory } from "@/lib/types";

export interface CascadeExecutionResult {
  success: boolean;
  message: string;
  projectId?: string;
  projectName?: string;
  tasksCreatedCount: number;
}

/**
 * Ejecucion en cascada instantanea:
 * Toma una idea analizada y genera en un solo paso:
 * 1. Proyecto en su dominio
 * 2. Tareas atomicas
 * 3. Notifica al store global
 */
export async function executeIdeaCascade(
  idea: IdeaEntity,
  options?: {
    customProjectName?: string;
    targetCategory?: ProjectCategory;
  }
): Promise<CascadeExecutionResult> {
  const analysis = idea.structuredAnalysis;
  if (!analysis) {
    throw new Error("La idea seleccionada debe contar con un analisis previo.");
  }

  const projectName = options?.customProjectName || analysis.suggestedProjectName || `Iniciativa: ${idea.rawContent.slice(0, 40)}`;
  const category = options?.targetCategory || analysis.targetCategory || (idea.category !== "general" ? idea.category : "tech");

  const res = await fetch(`/api/ideas/${idea.id}/convert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target: "PROJECT",
      projectName,
      category,
      priority: "HIGH",
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Fallo en la ejecucion en cascada.");
  }

  return {
    success: true,
    message: json.message || `Proyecto "${projectName}" y sus tareas se han integrado en el sistema.`,
    projectId: json.data?.project?.id,
    projectName: json.data?.project?.name,
    tasksCreatedCount: json.data?.tasksCount || 0,
  };
}
