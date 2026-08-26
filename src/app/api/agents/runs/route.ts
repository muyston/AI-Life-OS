import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentName = searchParams.get("agentName");
    const limit = Number(searchParams.get("limit")) || 50;

    const runs = await prisma.agentRun.findMany({
      where: {
        ...(agentName ? { agentName } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ success: true, data: runs });
  } catch (error) {
    console.error("Error al obtener registros de agentes:", error);
    return NextResponse.json(
      { success: false, error: "Error interno al recuperar historial de agentes." },
      { status: 500 }
    );
  }
}
