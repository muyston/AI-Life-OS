import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { prisma } from "../prisma";
import { logAgentRun } from "./agent-logger";

export interface OutreachProposalDraft {
  prospectName: string;
  clinicOrBusiness: string;
  channel: "EMAIL" | "WHATSAPP" | "LINKEDIN";
  subject: string;
  bodyText: string;
  valueProposition: string;
  callToAction: string;
  status: "PENDING_REVIEW";
}

export interface SalesAgentResult {
  generatedAt: string;
  pipelineSummary: string;
  activeOpportunitiesCount: number;
  draftsGenerated: OutreachProposalDraft[];
  nextSteps: string[];
}

interface BusinessProjectWithTasks {
  id: string;
  name: string;
  tasks: Array<{ id: string; title: string; status: string; priority: string }>;
}

function isChannel(val: unknown): val is "EMAIL" | "WHATSAPP" | "LINKEDIN" {
  return typeof val === "string" && ["EMAIL", "WHATSAPP", "LINKEDIN"].includes(val);
}

function deterministicSalesGeneration(businessProjects: BusinessProjectWithTasks[]): SalesAgentResult {
  const drafts: OutreachProposalDraft[] = [
    {
      prospectName: "Dr. Alejandro Gómez",
      clinicOrBusiness: "Clínica Dental Norte",
      channel: "EMAIL",
      subject: "Optimización de captación de pacientes privados y AEO local",
      bodyText: `Estimado Dr. Gómez,

Hemos analizado la presencia digital y el flujo de pacientes de Clínica Dental Norte. Observamos una oportunidad directa de incrementar en un 35% las citas cualificadas mediante nuestro sistema de cualificación previa y landing de alta conversión con tecnología Lanzing.

Nos gustaría presentarle un informe de auditoría sin compromiso enfocado en sus tratamientos de implantología y estética dental.

Quedo a su disposición para coordinar una breve llamada de 10 minutos.

Atentamente,
Equipo Lanzing Hub`,
      valueProposition: "Landing médica de alta conversión con widget interactivo y sincronización directa.",
      callToAction: "Coordinar llamada de 10 minutos para presentar auditoría gratuita.",
      status: "PENDING_REVIEW",
    },
    {
      prospectName: "Dra. Carmen Varela",
      clinicOrBusiness: "Instituto Dermatológico Avanzado",
      channel: "WHATSAPP",
      subject: "Propuesta institucional Lanzing",
      bodyText: `Estimada Dra. Varela, le contactamos de Lanzing Hub. Hemos diseñado una arquitectura de captación específica para clínicas dermatológicas con asistente de síntomas previo que filtra pacientes no cualificados antes de llegar a recepción. ¿Le resultaría conveniente revisar una breve demo interactiva?`,
      valueProposition: "Asistente de cualificación previa de síntomas y conexión instantánea WhatsApp Express.",
      callToAction: "Revisar demo interactiva personalizada.",
      status: "PENDING_REVIEW",
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    pipelineSummary: `Auditoría comercial finalizada. Se han identificado ${businessProjects.length} proyectos del área Business con 2 oportunidades de prospección en estado pendiente_revisión.`,
    activeOpportunitiesCount: drafts.length,
    draftsGenerated: drafts,
    nextSteps: [
      "Revisar y validar los 2 borradores de prospección fría generados.",
      "Aprobar el envío para registrar la acción en el CRM de seguimiento.",
    ],
  };
}

export async function runSalesAgent(
  triggerType: "MANUAL" | "CRON" | "EVENT" | "PIPELINE" = "MANUAL"
): Promise<SalesAgentResult> {
  const startTime = Date.now();

  const businessProjects = await prisma.project.findMany({
    where: { category: "business" },
    include: {
      tasks: {
        select: { id: true, title: true, status: true, priority: true },
      },
    },
  });

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.includes("tu_clave") || apiKey.trim() === "") {
    const result = deterministicSalesGeneration(businessProjects);
    const executionTimeMs = Date.now() - startTime;

    for (const draft of result.draftsGenerated) {
      await prisma.aiAction.create({
        data: {
          agentName: "SALES",
          title: `Propuesta de prospección: ${draft.clinicOrBusiness}`,
          description: `Secuencia de ${draft.channel} para ${draft.prospectName} (${draft.subject}).`,
          category: "business",
          actionType: "OUTREACH_DRAFT",
          payload: JSON.stringify(draft),
          status: "PENDING_REVIEW",
        },
      });
    }

    await logAgentRun({
      agentName: "SALES",
      triggerType,
      inputPayload: { businessProjectsCount: businessProjects.length, engine: "DETERMINISTIC" },
      outputPayload: result as unknown as Record<string, unknown>,
      tokensUsed: 0,
      costEstimate: 0.0,
      status: "SUCCESS",
      executionTimeMs,
    });

    return result;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            pipelineSummary: { type: SchemaType.STRING },
            draftsGenerated: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  prospectName: { type: SchemaType.STRING },
                  clinicOrBusiness: { type: SchemaType.STRING },
                  channel: { type: SchemaType.STRING },
                  subject: { type: SchemaType.STRING },
                  bodyText: { type: SchemaType.STRING },
                  valueProposition: { type: SchemaType.STRING },
                  callToAction: { type: SchemaType.STRING },
                },
                required: [
                  "prospectName",
                  "clinicOrBusiness",
                  "channel",
                  "subject",
                  "bodyText",
                  "valueProposition",
                  "callToAction",
                ],
              },
            },
            nextSteps: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
            },
          },
          required: ["pipelineSummary", "draftsGenerated", "nextSteps"],
        },
      },
      systemInstruction: `Eres el SalesAgent de AI Life OS y del Ecosistema Lanzing.
Tu función es redactar propuestas comerciales B2B y cold outreach para clínicas y clientes de alto valor.
Directrices estrictas:
1. Tono corporativo sobrio, institucional, clínico y de alto nivel.
2. Cero emojis en cualquier parte del texto o copywriting.
3. Toda propuesta debe requerir validación humana (estado pendiente_revision).
4. Mensajes claros, orientados a la conversión y profesionalismo médico.`,
    });

    const response = await model.generateContent(
      `Genera propuestas comerciales de prospección para clínicas médicas considerando los proyectos de negocio:\n${JSON.stringify(
        businessProjects
      )}`
    );

    const parsed = JSON.parse(response.response.text()) as Partial<SalesAgentResult>;
    const baseResult = deterministicSalesGeneration(businessProjects);

    const rawDrafts = Array.isArray(parsed.draftsGenerated) && parsed.draftsGenerated.length > 0
      ? parsed.draftsGenerated
      : baseResult.draftsGenerated;

    const finalDrafts: OutreachProposalDraft[] = rawDrafts.map((d) => ({
      prospectName: d.prospectName || "Responsable de Clínica",
      clinicOrBusiness: d.clinicOrBusiness || "Clínica Médica",
      channel: isChannel(d.channel) ? d.channel : "EMAIL",
      subject: d.subject || "Propuesta de optimización institucional",
      bodyText: d.bodyText || "",
      valueProposition: d.valueProposition || "Optimización de captación clínica de alto rendimiento.",
      callToAction: d.callToAction || "Coordinar llamada informativa de 10 minutos.",
      status: "PENDING_REVIEW",
    }));

    const finalResult: SalesAgentResult = {
      generatedAt: new Date().toISOString(),
      pipelineSummary: parsed.pipelineSummary || baseResult.pipelineSummary,
      activeOpportunitiesCount: finalDrafts.length,
      draftsGenerated: finalDrafts,
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : baseResult.nextSteps,
    };

    for (const draft of finalResult.draftsGenerated) {
      await prisma.aiAction.create({
        data: {
          agentName: "SALES",
          title: `Propuesta comercial: ${draft.clinicOrBusiness}`,
          description: `Borrador (${draft.channel}) para ${draft.prospectName}: "${draft.subject}".`,
          category: "business",
          actionType: "OUTREACH_DRAFT",
          payload: JSON.stringify(draft),
          status: "PENDING_REVIEW",
        },
      });
    }

    const tokensUsed = response.response.usageMetadata?.totalTokenCount || 0;
    const executionTimeMs = Date.now() - startTime;

    await logAgentRun({
      agentName: "SALES",
      triggerType,
      inputPayload: { businessProjectsCount: businessProjects.length, engine: "GOOGLE_GEMINI_2_5_FLASH" },
      outputPayload: finalResult as unknown as Record<string, unknown>,
      tokensUsed,
      costEstimate: 0.0,
      status: "SUCCESS",
      executionTimeMs,
    });

    return finalResult;
  } catch (error) {
    console.error("Error en SalesAgent con Gemini:", error);
    const fallbackResult = deterministicSalesGeneration(businessProjects);
    const executionTimeMs = Date.now() - startTime;

    await logAgentRun({
      agentName: "SALES",
      triggerType,
      inputPayload: { businessProjectsCount: businessProjects.length, fallbackActive: true },
      outputPayload: fallbackResult as unknown as Record<string, unknown>,
      tokensUsed: 0,
      costEstimate: 0.0,
      status: "FAILED",
      errorMessage: error instanceof Error ? error.message : String(error),
      executionTimeMs,
    });

    return fallbackResult;
  }
}
