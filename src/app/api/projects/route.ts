import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    const formatted = projects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      repoUrl: p.repoUrl,
      status: p.status,
      priority: p.priority,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      tasksCount: {
        total: p.tasks.length,
        pending: p.tasks.filter(t => t.status === "PENDING" || t.status === "IN_PROGRESS").length,
        completed: p.tasks.filter(t => t.status === "COMPLETED").length,
      },
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Error al obtener proyectos:", error);
    return NextResponse.json(
      { success: false, error: "Error interno al recuperar proyectos." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, repoUrl, status, priority } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "El nombre del proyecto es obligatorio." },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        repoUrl: repoUrl?.trim() || null,
        status: status || "ACTIVE",
        priority: priority || "MEDIUM",
      },
    });

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error) {
    console.error("Error al crear proyecto:", error);
    return NextResponse.json(
      { success: false, error: "Error interno al crear el proyecto." },
      { status: 500 }
    );
  }
}
