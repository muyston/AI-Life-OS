export type ProjectStatus = "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
export type ProjectCategory = "tech" | "business" | "academic" | "performance" | "personal";
export type PriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "URGENT";
export type TaskType = "MANUAL" | "RECURRING" | "NORMAL" | "AGENT_GENERATED";
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type TaskOrigin = 
  | "MANUAL" 
  | "GITHUB_TODO" 
  | "ANTIGRAVITY_TODO" 
  | "AGENT_PLANNING" 
  | "SYSTEM" 
  | "DEV_AGENT" 
  | "STRATEGY_AGENT" 
  | "SALES_AGENT" 
  | "OPERATIONS_AGENT";

export type AgentName = 
  | "ORCHESTRATOR" 
  | "STRATEGY" 
  | "SALES" 
  | "DEV" 
  | "OPERATIONS" 
  | "PLANNING_AGENT" 
  | "CAPTURE_AGENT" 
  | "PATTERN_AGENT" 
  | "BRIEFING_AGENT" 
  | "MINI_APP_GENERATOR";

export type AgentStatus = "IDLE" | "THINKING" | "RUNNING" | "COMPLETED" | "ERROR";

export type AiActionStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "EXECUTED";
export type AiActionType = 
  | "TASK_PROPOSAL" 
  | "CALENDAR_RESCHEDULE" 
  | "CODE_SNIPPET" 
  | "OUTREACH_DRAFT" 
  | "STRATEGY_ALERT";

export interface ProjectEntity {
  id: string;
  name: string;
  description: string | null;
  repoUrl: string | null;
  category: ProjectCategory;
  status: ProjectStatus;
  priority: PriorityLevel;
  createdAt: string | Date;
  updatedAt: string | Date;
  tasksCount?: {
    total: number;
    pending: number;
    completed: number;
  };
}

export interface TaskEntity {
  id: string;
  projectId: string | null;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: PriorityLevel;
  deadline: string | Date | null;
  estimatedDuration: number; // minutos
  origin: string;
  scheduledStart: string | Date | null;
  scheduledEnd: string | Date | null;
  completedAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  project?: {
    id: string;
    name: string;
    category?: ProjectCategory;
  } | null;
}

export interface CalendarEventEntity {
  id: string;
  externalId: string;
  summary: string;
  description: string | null;
  startTime: string | Date;
  endTime: string | Date;
  isAllDay: boolean;
  location: string | null;
  status: string;
  rawData?: string | null;
  syncedAt: string | Date;
}

export interface FreeTimeSlot {
  start: Date;
  end: Date;
  durationMinutes: number;
}

export interface PlannedTaskAssignment {
  taskId: string;
  taskTitle: string;
  projectId: string | null;
  projectName?: string;
  priority: PriorityLevel;
  estimatedDuration: number;
  assignedStart: string; // ISO String
  assignedEnd: string;   // ISO String
  slotDurationMinutes: number;
  rationale: string;
}

export interface PlanningAgentProposal {
  generatedAt: string;
  targetDate: string;
  summary: string;
  totalTasksAnalyzed: number;
  tasksAssignedCount: number;
  unassignedTasksCount: number;
  assignments: PlannedTaskAssignment[];
  unassignedTasks: {
    taskId: string;
    taskTitle: string;
    reason: string;
  }[];
  calendarFreeSlotsFound: number;
  recommendations: string[];
}

export interface AgentRunEntity {
  id: string;
  agentName: string;
  triggerType: "MANUAL" | "CRON" | "EVENT" | "PIPELINE";
  inputPayload: string | null;
  outputPayload: string | null;
  tokensUsed: number;
  costEstimate: number;
  status: "SUCCESS" | "FAILED" | "RUNNING";
  errorMessage: string | null;
  executionTimeMs: number;
  createdAt: string | Date;
}

export interface AiActionEntity {
  id: string;
  agentName: AgentName;
  title: string;
  description: string;
  category: ProjectCategory | "operations";
  actionType: AiActionType;
  payload: string | null;
  status: AiActionStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AgentSpecialistInfo {
  id: AgentName;
  name: string;
  role: string;
  description: string;
  category: string;
  status: AgentStatus;
  lastRun?: AgentRunEntity | null;
}

export const SPECIALIST_AGENTS: AgentSpecialistInfo[] = [
  {
    id: "ORCHESTRATOR",
    name: "Orchestrator Central",
    role: "Coordinador Multi-Agente",
    description: "Sincroniza y encadena los agentes especializados para formular el roadmap del día.",
    category: "General",
    status: "IDLE",
  },
  {
    id: "STRATEGY",
    name: "Strategy & KPIs Agent",
    role: "Auditor Estratégico",
    description: "Analiza el equilibrio multidominio entre Tech, Business, Academic y Performance.",
    category: "Estrategia",
    status: "IDLE",
  },
  {
    id: "SALES",
    name: "Sales & Pipeline Agent",
    role: "Gestor Comercial B2B",
    description: "Cualifica oportunidades de prospección y redacta propuestas frías para clínicas.",
    category: "Business",
    status: "IDLE",
  },
  {
    id: "DEV",
    name: "Architecture & Dev Agent",
    role: "Lead Software Architect",
    description: "Desglosa requerimientos técnicos en tareas atómicas y especifica contratos de datos.",
    category: "Tech",
    status: "IDLE",
  },
  {
    id: "OPERATIONS",
    name: "Operations & Calendar Agent",
    role: "Programador de Agenda",
    description: "Cruza tareas pendientes con huecos libres de Google Calendar en tiempo real.",
    category: "Operaciones",
    status: "IDLE",
  },
];

export type IdeaCategory = "tech" | "business" | "personal" | "academic" | "performance" | "general";
export type IdeaStatus = "RAW" | "PROCESSING" | "COMPLETED" | "FAILED";
export type IdeaAssignedAgent = "strategy" | "dev" | "sales" | "operations" | "general";

export interface IdeaRecommendedAction {
  title: string;
  description: string;
  priority: PriorityLevel;
  estimatedDuration: number;
  type?: TaskType;
}

export interface IdeaStructuredAnalysis {
  executiveSummary: string;
  researchAndViability: string;
  keyInsights?: string[];
  recommendedActions: IdeaRecommendedAction[];
  suggestedProjectName?: string;
  targetCategory?: IdeaCategory;
}

export interface IdeaEntity {
  id: string;
  rawContent: string;
  category: IdeaCategory;
  status: IdeaStatus;
  assignedAgent: IdeaAssignedAgent;
  analysis: string | null;
  structuredAnalysis?: IdeaStructuredAnalysis | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

