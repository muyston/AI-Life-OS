export type ProjectStatus = "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
export type PriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "URGENT";
export type TaskType = "MANUAL" | "RECURRING" | "NORMAL" | "AGENT_GENERATED";
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type TaskOrigin = "MANUAL" | "GITHUB_TODO" | "ANTIGRAVITY_TODO" | "AGENT_PLANNING" | "SYSTEM";

export interface ProjectEntity {
  id: string;
  name: string;
  description: string | null;
  repoUrl: string | null;
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
  triggerType: "MANUAL" | "CRON" | "EVENT";
  inputPayload: string | null;
  outputPayload: string | null;
  tokensUsed: number;
  costEstimate: number;
  status: "SUCCESS" | "FAILED" | "RUNNING";
  errorMessage: string | null;
  executionTimeMs: number;
  createdAt: string | Date;
}
