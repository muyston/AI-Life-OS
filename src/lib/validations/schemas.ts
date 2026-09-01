import { z } from "zod";

export const ProjectCategoryEnum = z.enum([
  "tech",
  "business",
  "academic",
  "performance",
  "personal",
]);

export const ProjectStatusEnum = z.enum([
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "ARCHIVED",
]);

export const PriorityLevelEnum = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
  "URGENT",
]);

export const TaskTypeEnum = z.enum([
  "NORMAL",
  "MANUAL",
  "RECURRING",
  "AGENT_GENERATED",
]);

export const TaskStatusEnum = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const AgentNameEnum = z.enum([
  "ORCHESTRATOR",
  "STRATEGY",
  "SALES",
  "DEV",
  "OPERATIONS",
  "PLANNING_AGENT",
  "CAPTURE_AGENT",
  "PATTERN_AGENT",
  "BRIEFING_AGENT",
  "MINI_APP_GENERATOR",
]);

export const IdeaCategoryEnum = z.enum([
  "tech",
  "business",
  "personal",
  "academic",
  "performance",
  "general",
]);

export const IdeaAssignedAgentEnum = z.enum([
  "strategy",
  "dev",
  "sales",
  "operations",
  "general",
]);

export const AiActionStatusEnum = z.enum([
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
  "EXECUTED",
]);

export const TriggerTypeEnum = z.enum(["MANUAL", "CRON", "EVENT", "PIPELINE"]);

// --- Schemas de Proyecto ---
export const CreateProjectSchema = z.object({
  name: z.string().min(1, "El nombre del proyecto es obligatorio").max(120),
  description: z.string().nullable().optional(),
  repoUrl: z.string().url("URL de repositorio no válida").nullable().optional().or(z.literal("")),
  category: ProjectCategoryEnum.default("tech"),
  status: ProjectStatusEnum.default("ACTIVE"),
  priority: PriorityLevelEnum.default("MEDIUM"),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

// --- Schemas de Tarea ---
export const CreateTaskSchema = z.object({
  title: z.string().min(1, "El título de la tarea es obligatorio").max(200),
  description: z.string().nullable().optional(),
  projectId: z.string().cuid().nullable().optional().or(z.literal("")),
  type: TaskTypeEnum.default("NORMAL"),
  status: TaskStatusEnum.default("PENDING"),
  priority: PriorityLevelEnum.default("MEDIUM"),
  deadline: z.string().datetime().nullable().optional().or(z.literal("")),
  estimatedDuration: z.coerce.number().min(5, "Duración mínima: 5 minutos").default(30),
  origin: z.string().default("MANUAL"),
  scheduledStart: z.string().datetime().nullable().optional(),
  scheduledEnd: z.string().datetime().nullable().optional(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  type: TaskTypeEnum.optional(),
  status: TaskStatusEnum.optional(),
  priority: PriorityLevelEnum.optional(),
  deadline: z.string().nullable().optional(),
  estimatedDuration: z.coerce.number().min(5).optional(),
  origin: z.string().optional(),
  scheduledStart: z.string().nullable().optional(),
  scheduledEnd: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
});

// --- Schemas de Ideas (Smart Inbox) ---
export const CreateIdeaSchema = z.object({
  rawContent: z.string().min(1, "El contenido de la idea es obligatorio"),
  category: IdeaCategoryEnum.optional(),
  assignedAgent: IdeaAssignedAgentEnum.optional(),
});

export const UpdateIdeaSchema = z.object({
  rawContent: z.string().min(1).optional(),
  category: IdeaCategoryEnum.optional(),
  assignedAgent: IdeaAssignedAgentEnum.optional(),
  reanalyze: z.boolean().optional(),
});

export const ConvertIdeaSchema = z.object({
  target: z.enum(["PROJECT", "TASKS"]).default("PROJECT"),
  projectName: z.string().optional(),
  category: ProjectCategoryEnum.optional(),
  priority: PriorityLevelEnum.optional(),
  selectedActionIndices: z.array(z.number().int().nonnegative()).optional(),
});

export const ApplySolverSolutionSchema = z.object({
  selectedOptionId: z.enum(["option-a", "option-b", "option-c"]),
  mode: z.enum([
    "DISPATCH_TO_AI_ACTIONS",
    "MATERIALIZE_AS_TASKS",
    "CREATE_PROJECT",
  ]).default("DISPATCH_TO_AI_ACTIONS"),
  projectName: z.string().optional(),
  category: ProjectCategoryEnum.optional(),
  priority: PriorityLevelEnum.optional(),
});

// --- Schemas de Acciones IA ---
export const UpdateAiActionSchema = z.object({
  status: AiActionStatusEnum,
  execute: z.boolean().default(true),
});

// --- Schemas de Ejecución de Agentes ---
export const RunAgentSchema = z.object({
  agentName: z.union([AgentNameEnum, z.enum(["ALL", "PIPELINE"])]).default("ORCHESTRATOR"),
  targetDate: z.string().optional(),
  triggerType: TriggerTypeEnum.default("MANUAL"),
});

export const ApplyPlanningSchema = z.object({
  action: z.enum(["RUN", "APPLY"]).optional(),
  targetDate: z.string().optional(),
  assignments: z
    .array(
      z.object({
        taskId: z.string().min(1),
        assignedStart: z.string().min(1),
        assignedEnd: z.string().min(1),
      })
    )
    .optional(),
});
