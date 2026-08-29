import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { CreateProjectSchema } from "@/lib/validations/schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    const projects = await prisma.project.findMany({
      where: {
        ...(category && category !== "ALL" ? { category } : {}),
        ...(status && status !== "ALL" ? { status } : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            deadline: true,
            estimatedDuration: true,
          },
        },
      },
    });

    const formatted = projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      repoUrl: p.repoUrl,
      category: p.category,
      status: p.status,
      priority: p.priority,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      tasks: p.tasks,
      tasksCount: {
        total: p.tasks.length,
        pending: p.tasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS").length,
        completed: p.tasks.filter((t) => t.status === "COMPLETED").length,
      },
    }));

    return apiSuccess(formatted);
  } catch (error) {
    return handleApiError(error, "Error al recuperar los proyectos del sistema.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => ({}));
    const validated = CreateProjectSchema.parse(json);

    const project = await prisma.project.create({
      data: {
        name: validated.name.trim(),
        description: validated.description?.trim() || null,
        repoUrl: validated.repoUrl?.trim() || null,
        category: validated.category,
        status: validated.status,
        priority: validated.priority,
      },
    });

    return apiSuccess(project, { status: 201, message: "Proyecto creado exitosamente." });
  } catch (error) {
    return handleApiError(error, "Error al crear el proyecto.");
  }
}
