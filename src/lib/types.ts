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
  | "OPERATIONS_AGENT"
  | "VOICE_CAPTURE";

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
  start: Date | string;
  end: Date | string;
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

export type SolverOptionType = "QUICK_WIN" | "STRUCTURAL" | "DELEGATED";
export type CognitiveCostLevel = "LOW" | "MEDIUM" | "HIGH";

export interface SolverActionProposal {
  title: string;
  description: string;
  category: ProjectCategory | "operations";
  actionType: AiActionType;
  priority: PriorityLevel;
  estimatedDuration: number;
  payload?: string | null;
}

export interface SolverOption {
  id: "option-a" | "option-b" | "option-c";
  type: SolverOptionType;
  title: string;
  badge: string;
  summary: string;
  tradeOffs: {
    estimatedTimeHours: number;
    cognitiveCost: CognitiveCostLevel;
    roiDescription: string;
    successProbability: number;
  };
  multidomainImpact: {
    primaryDomain: ProjectCategory;
    domainImpacts: {
      category: ProjectCategory;
      impactLevel: "POSITIVE" | "NEUTRAL" | "HIGH_IMPACT";
      description: string;
    }[];
  };
  actions: SolverActionProposal[];
}

export interface MultiSolutionAnalysis {
  executiveDiagnosis: string;
  rootCause: string;
  keyVariables: string[];
  solutions: [SolverOption, SolverOption, SolverOption];
  suggestedProjectName?: string;
  targetCategory: IdeaCategory;
}

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
  solverAnalysis?: MultiSolutionAnalysis | null;
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

// -------------------------------------------------------------
// HABIT TYPES
// -------------------------------------------------------------
export type HabitFrequency = "DAILY" | "WEEKDAYS" | "WEEKLY";

export interface HabitLogEntity {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string | null;
  createdAt: string | Date;
}

export interface HabitWithStats {
  id: string;
  title: string;
  description: string | null;
  category: ProjectCategory;
  frequency: HabitFrequency | string;
  targetDays: number;
  icon?: string | null;
  active: boolean;
  isCompletedToday: boolean;
  streak: number;
  bestStreak: number;
  weeklyCompletedCount: number;
  monthlyCompletedCount: number;
  consistencyPercent: number;
  recentLogs: { date: string; completed: boolean }[];
  weekDaysStatus: { date: string; dayName: string; dayNumber: number; completed: boolean; isToday: boolean }[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

// -------------------------------------------------------------
// CALENDAR TYPES
// -------------------------------------------------------------
export type CalendarViewType = "month" | "week" | "day" | "list";

// -------------------------------------------------------------
// VOICE TYPES
// -------------------------------------------------------------
export type VoiceIntentType = "TASK" | "IDEA" | "HABIT_LOG" | "QUICK_NOTE" | "UNKNOWN";

export interface VoiceProcessResult {
  intent: VoiceIntentType;
  transcript: string;
  confidence: number;
  summary: string;
  taskData?: {
    title: string;
    description?: string;
    priority: PriorityLevel;
    category?: ProjectCategory;
    deadline?: string | null;
    estimatedDuration?: number;
    scheduledStart?: string | null;
    scheduledEnd?: string | null;
  };
  ideaData?: {
    rawContent: string;
    category: IdeaCategory;
    assignedAgent: IdeaAssignedAgent;
  };
  habitData?: {
    habitId?: string;
    habitName?: string;
    date: string;
    completed: boolean;
  };
}

// -------------------------------------------------------------
// VISION ROUTINE TYPES
// -------------------------------------------------------------
export type VisionRoutineDayOfWeek = 
  | "MONDAY" 
  | "TUESDAY" 
  | "WEDNESDAY" 
  | "THURSDAY" 
  | "FRIDAY" 
  | "SATURDAY" 
  | "SUNDAY";

export interface VisionRoutineClass {
  id: string;
  dayOfWeek: VisionRoutineDayOfWeek;
  dayName: string;
  subject: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  classroom?: string;
  selected?: boolean;
}

export interface VisionRoutineGymSession {
  id: string;
  dayOfWeek: VisionRoutineDayOfWeek;
  dayName: string;
  focus: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  durationMinutes: number;
  rationale: string;
  selected?: boolean;
}

export interface VisionRoutineStudySession {
  id: string;
  dayOfWeek: VisionRoutineDayOfWeek;
  dayName: string;
  subject: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  durationMinutes: number;
  rationale: string;
  selected?: boolean;
}

export interface VisionRoutineHabit {
  id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  frequency: HabitFrequency;
  targetDays: number;
  selected?: boolean;
}

export interface VisionRoutineProposal {
  generatedAt: string;
  startDate: string;
  summary: string;
  detectedClasses: VisionRoutineClass[];
  gymSessions: VisionRoutineGymSession[];
  studySessions: VisionRoutineStudySession[];
  suggestedHabits: VisionRoutineHabit[];
  tacticalAdvice: string[];
}

export interface VisionRoutineApplyPayload {
  targetStartDate: string;
  classes: VisionRoutineClass[];
  gymSessions: VisionRoutineGymSession[];
  studySessions: VisionRoutineStudySession[];
  habits: VisionRoutineHabit[];
  createCalendarEvents?: boolean;
  createTasks?: boolean;
  createHabits?: boolean;
}

export type AntigravityWorkspaceStatus = 
  | "ACTIVE" 
  | "PLANNING" 
  | "WAITING_APPROVAL" 
  | "COMPLETED" 
  | "IDLE";

export interface AntigravityPlanTaskItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  filePath?: string;
}

export interface AntigravityPlanData {
  conversationId: string;
  projectPath: string;
  projectName: string;
  planTitle: string;
  planSummary: string | null;
  requestFeedback: boolean;
  userFacing: boolean;
  updatedAt: string | null;
  content: string;
  tasks: AntigravityPlanTaskItem[];
  hasWalkthrough: boolean;
  walkthroughContent?: string;
  walkthroughSummary?: string | null;
}

export interface AntigravityConversationSummary {
  conversationId: string;
  stepCount: number;
  lastStepTime: string | null;
  lastUserInput: string | null;
  hasPlan: boolean;
  planSummary: string | null;
  requestFeedback: boolean;
  hasWalkthrough: boolean;
  walkthroughSummary: string | null;
  artifactsCount: number;
  artifacts: string[];
}

export interface AntigravityProjectDetails {
  id: string;
  name: string;
  folderName: string;
  localPath: string;
  workspaceUri: string;
  repoUrl: string | null;
  category: ProjectCategory;
  priority: PriorityLevel;
  status: AntigravityWorkspaceStatus;
  totalConversations: number;
  totalSteps: number;
  latestConversation: AntigravityConversationSummary | null;
  recentConversations: AntigravityConversationSummary[];
  linkedLifeOsProjectId?: string | null;
  tasksCount?: {
    total: number;
    pending: number;
    completed: number;
  };
}

export interface AntigravityInstructionPayload {
  projectPath: string;
  conversationId?: string;
  instruction: string;
  category?: ProjectCategory;
  createTask?: boolean;
}

export type RoutineFrequencyType = "DAILY" | "WEEKDAYS" | "WEEKENDS" | "WEEKLY";

export interface RoutinePrediction {
  id: string;
  name: string;
  domain: ProjectCategory;
  confidenceScore: number;
  detectedFrequency: RoutineFrequencyType;
  suggestedTimeStart: string;
  suggestedTimeEnd: string;
  durationMinutes: number;
  reasoning: string;
  historicalOccurrences: number;
  active: boolean;
  selected?: boolean;
}

export interface RoutinePredictionReport {
  analyzedEventsCount: number;
  analyzedTasksCount: number;
  analyzedHabitsCount: number;
  overallPredictabilityScore: number;
  predictions: RoutinePrediction[];
  generatedAt: string;
}

export type ReflectionType = "MORNING" | "EVENING" | "FULL_DAY";

export interface DailyReflection {
  id: string;
  date: string;
  type: ReflectionType;
  domainRatings: Record<ProjectCategory, number>;
  clarityScore: number;
  energyScore: number;
  wins: string[];
  frictionPoints: string[];
  keyLearnings: string[];
  nextDayCommitments: string[];
  notes: string;
  audioTranscript?: string | null;
  paperScanImageUrl?: string | null;
  paperScanAnalysis?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReflectionPaperAnalysisResult {
  transcription: string;
  summary: string;
  wins: string[];
  frictionPoints: string[];
  keyLearnings: string[];
  extractedTasks: string[];
  estimatedMoodScore: number;
  domainInsights: Record<ProjectCategory, string>;
}

export interface AntigravityMcpServerInfo {
  name: string;
  status: "ACTIVE" | "CONFIGURED" | "AVAILABLE";
  toolsCount: number;
  tools: string[];
  description: string;
}


