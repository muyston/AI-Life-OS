import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { CreateTaskSchema } from "@/lib/validations/schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const projectId = searchParams.get("projectId");
    const priority = searchParams.get("priority");
    const type = searchParams.get("type");

    const tasks = await prisma.task.findMany({
      where: {
        ...(status && status !== "ALL" ? { status } : {}),
        ...(projectId ? { projectId } : {}),
        ...(priority && priority !== "ALL" ? { priority } : {}),
        ...(type && type !== "ALL" ? { type } : {}),
      },
      include: {
        project: {
          select: { id: true, name: true, category: true },
        },
      },
      orderBy: [
        { priority: "desc" },
        { deadline: "asc" },
        { createdAt: "desc" },
      ],
    });

    return apiSuccess(tasks);
  } catch (error) {
    return handleApiError(error, "Error al recuperar las tareas del sistema.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => ({}));
    const validated = CreateTaskSchema.parse(json);

    const task = await prisma.task.create({
      data: {
        title: validated.title.trim(),
        description: validated.description?.trim() || null,
        projectId: validated.projectId || null,
        type: validated.type,
        priority: validated.priority,
        status: validated.status,
        deadline: validated.deadline ? new Date(validated.deadline) : null,
        estimatedDuration: validated.estimatedDuration,
        origin: validated.origin,
        scheduledStart: validated.scheduledStart ? new Date(validated.scheduledStart) : null,
        scheduledEnd: validated.scheduledEnd ? new Date(validated.scheduledEnd) : null,
      },
      include: {
        project: {
          select: { id: true, name: true, category: true },
        },
      },
    });

    return apiSuccess(task, { status: 201, message: "Tarea creada correctamente." });
  } catch (error) {
    return handleApiError(error, "Error al crear la tarea.");
  }
}
