import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
        ...(priority ? { priority } : {}),
        ...(type ? { type } : {}),
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { priority: "desc" },
        { deadline: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    return NextResponse.json(
      { success: false, error: "Error interno al recuperar tareas." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      projectId,
      type,
      priority,
      status,
      deadline,
      estimatedDuration,
      origin,
      scheduledStart,
      scheduledEnd,
    } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "El titulo de la tarea es obligatorio." },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        projectId: projectId || null,
        type: type || "NORMAL",
        priority: priority || "MEDIUM",
        status: status || "PENDING",
        deadline: deadline ? new Date(deadline) : null,
        estimatedDuration: Number(estimatedDuration) || 30,
        origin: origin || "MANUAL",
        scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    console.error("Error al crear tarea:", error);
    return NextResponse.json(
      { success: false, error: "Error interno al crear la tarea." },
      { status: 500 }
    );
  }
}
