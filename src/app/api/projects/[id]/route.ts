import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        tasks: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    console.error("Error al obtener detalle de proyecto:", error);
    return NextResponse.json(
      { success: false, error: "Error interno al recuperar el proyecto." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, repoUrl, status, priority } = body;

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(repoUrl !== undefined && { repoUrl: repoUrl?.trim() || null }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error al actualizar proyecto:", error);
    return NextResponse.json(
      { success: false, error: "Error interno al actualizar el proyecto." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.project.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Proyecto eliminado correctamente." });
  } catch (error) {
    console.error("Error al eliminar proyecto:", error);
    return NextResponse.json(
      { success: false, error: "Error interno al eliminar el proyecto." },
      { status: 500 }
    );
  }
}
