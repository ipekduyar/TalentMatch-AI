import { getCurrentStudentId } from "@/lib/student-insights-service";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type LearningProgressStatus = "not_started" | "in_progress" | "completed";

export type LearningProgressRow = {
  progress_id: string;
  student_id: string;
  recommendation_key: string;
  recommendation_title: string;
  provider: string | null;
  url: string | null;
  related_skill: string | null;
  status: LearningProgressStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LearningProgressInput = {
  recommendationKey: string;
  recommendationTitle: string;
  provider?: string | null;
  url?: string | null;
  relatedSkill?: string | null;
  status: LearningProgressStatus;
};

const VALID_STATUSES: LearningProgressStatus[] = [
  "not_started",
  "in_progress",
  "completed",
];

const normalizeKeyPart = (value?: string | null): string =>
  (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown";

export const buildRecommendationKey = ({
  title,
  provider,
  relatedSkill,
}: {
  title: string;
  provider?: string | null;
  relatedSkill?: string | null;
}): string =>
  [
    normalizeKeyPart(title),
    normalizeKeyPart(provider),
    normalizeKeyPart(relatedSkill),
  ].join("::");

const requireSupabase = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured.");
  }
  return supabase;
};

const requireCurrentStudentId = async (): Promise<string> => {
  const studentId = await getCurrentStudentId();
  if (!studentId) {
    throw new Error("Current student profile could not be resolved.");
  }
  return studentId;
};

export const getCurrentStudentLearningProgress = async (): Promise<
  LearningProgressRow[]
> => {
  const client = requireSupabase();
  const studentId = await requireCurrentStudentId();

  const { data, error } = await client
    .from("student_learning_progress")
    .select(
      "progress_id, student_id, recommendation_key, recommendation_title, provider, url, related_skill, status, started_at, completed_at, created_at, updated_at",
    )
    .eq("student_id", studentId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as LearningProgressRow[];
};

export const upsertLearningProgress = async (
  input: LearningProgressInput,
): Promise<LearningProgressRow> => {
  const client = requireSupabase();
  const studentId = await requireCurrentStudentId();

  if (!VALID_STATUSES.includes(input.status)) {
    throw new Error("Invalid learning progress status.");
  }

  const { data: existing, error: existingError } = await client
    .from("student_learning_progress")
    .select("started_at")
    .eq("student_id", studentId)
    .eq("recommendation_key", input.recommendationKey)
    .maybeSingle();

  if (existingError) throw existingError;

  const now = new Date().toISOString();
  const startedAt =
    input.status === "not_started"
      ? null
      : ((existing as { started_at?: string | null } | null)?.started_at ?? now);
  const completedAt = input.status === "completed" ? now : null;

  const { data, error } = await client
    .from("student_learning_progress")
    .upsert(
      {
        student_id: studentId,
        recommendation_key: input.recommendationKey,
        recommendation_title: input.recommendationTitle,
        provider: input.provider ?? null,
        url: input.url ?? null,
        related_skill: input.relatedSkill ?? null,
        status: input.status,
        started_at: startedAt,
        completed_at: completedAt,
        updated_at: now,
      },
      { onConflict: "student_id,recommendation_key" },
    )
    .select(
      "progress_id, student_id, recommendation_key, recommendation_title, provider, url, related_skill, status, started_at, completed_at, created_at, updated_at",
    )
    .single();

  if (error) throw error;
  return data as LearningProgressRow;
};

export const markRecommendationInProgress = (
  input: Omit<LearningProgressInput, "status">,
): Promise<LearningProgressRow> =>
  upsertLearningProgress({ ...input, status: "in_progress" });

export const markRecommendationCompleted = (
  input: Omit<LearningProgressInput, "status">,
): Promise<LearningProgressRow> =>
  upsertLearningProgress({ ...input, status: "completed" });

export const resetRecommendationProgress = (
  input: Omit<LearningProgressInput, "status">,
): Promise<LearningProgressRow> =>
  upsertLearningProgress({ ...input, status: "not_started" });
