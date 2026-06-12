import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  buildRecommendationKey,
  getCurrentStudentLearningProgress,
  markRecommendationCompleted,
  markRecommendationInProgress,
  resetRecommendationProgress,
  type LearningProgressRow,
  type LearningProgressStatus,
} from "@/lib/learning-progress-service";
import {
  detectStudentDomain,
  generateLearningPath,
  generateSkillGaps,
  getLatestStudentCvAnalysis,
  type StudentCvAnalysis,
} from "@/lib/student-insights-service";

type LearningPathPlan = ReturnType<typeof generateLearningPath>;
type LearningRecommendation = LearningPathPlan["resources"][number];

type RecommendationAction = "start" | "complete" | "reset";

const progressLabels: Record<LearningProgressStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

const formatDate = (value: string | null) => {
  if (!value) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const getRecommendationKey = (recommendation: LearningRecommendation) =>
  buildRecommendationKey({
    title: recommendation.title,
    provider: recommendation.provider,
    relatedSkill: recommendation.skill,
  });

export const LearningPathPage = () => {
  const [analysis, setAnalysis] = useState<StudentCvAnalysis | null>(null);
  const [tab, setTab] = useState<"roadmap" | "library">("roadmap");
  const [filter, setFilter] = useState("All");
  const [progressRows, setProgressRows] = useState<LearningProgressRow[]>([]);
  const [savingKeys, setSavingKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getLatestStudentCvAnalysis(),
      getCurrentStudentLearningProgress().catch((err) => {
        toast.error(
          err instanceof Error
            ? err.message
            : "Could not load saved learning progress.",
        );
        return [] as LearningProgressRow[];
      }),
    ])
      .then(([row, savedProgress]) => {
        if (!mounted) return;
        setAnalysis(row);
        setProgressRows(savedProgress);
      })
      .catch((err) => {
        if (mounted)
          setError(
            err instanceof Error
              ? err.message
              : "Could not load learning path.",
          );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const safePlan = useMemo<LearningPathPlan>(
    () =>
      analysis
        ? generateLearningPath(analysis)
        : {
            resources: [],
            roadmap: { week: [], month: [], quarter: [] },
          },
    [analysis],
  );
  const safeDomain = analysis ? detectStudentDomain(analysis) : null;
  const safeGaps = analysis ? generateSkillGaps(analysis) : [];
  const topGap = safeGaps[0];

  const progressByKey = useMemo(
    () =>
      new Map(
        progressRows.map((row) => [row.recommendation_key, row] as const),
      ),
    [progressRows],
  );

  const recommendationKeys = useMemo(
    () => safePlan.resources.map(getRecommendationKey),
    [safePlan.resources],
  );

  const summary = useMemo(() => {
    const total = recommendationKeys.length;
    const inProgress = recommendationKeys.filter(
      (key) => progressByKey.get(key)?.status === "in_progress",
    ).length;
    const completed = recommendationKeys.filter(
      (key) => progressByKey.get(key)?.status === "completed",
    ).length;
    const percentage = total ? Math.round((completed / total) * 100) : 0;

    return { total, inProgress, completed, percentage };
  }, [progressByKey, recommendationKeys]);

  const filtered = useMemo(
    () =>
      (safePlan.resources ?? []).filter(
        (r) =>
          filter === "All" ||
          (filter === "Free" && r.cost_type === "Free") ||
          (filter === "Beginner" && r.level === "Beginner") ||
          (filter === "Technical" && r.type === "Technical") ||
          (filter === "Soft Skill" && r.type === "Soft Skill"),
      ),
    [safePlan.resources, filter],
  );

  const upsertLocalProgress = (row: LearningProgressRow) => {
    setProgressRows((prev) => {
      const withoutExisting = prev.filter(
        (item) => item.recommendation_key !== row.recommendation_key,
      );
      return [row, ...withoutExisting];
    });
  };

  const handleProgressAction = async (
    recommendation: LearningRecommendation,
    action: RecommendationAction,
  ) => {
    const recommendationKey = getRecommendationKey(recommendation);
    if (savingKeys.includes(recommendationKey)) return;

    const payload = {
      recommendationKey,
      recommendationTitle: recommendation.title,
      provider: recommendation.provider,
      url: recommendation.url,
      relatedSkill: recommendation.skill,
    };

    setSavingKeys((prev) => [...prev, recommendationKey]);

    try {
      const row =
        action === "start"
          ? await markRecommendationInProgress(payload)
          : action === "complete"
            ? await markRecommendationCompleted(payload)
            : await resetRecommendationProgress(payload);

      upsertLocalProgress(row);
      toast.success(`Learning progress updated to ${progressLabels[row.status]}.`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not save learning progress.",
      );
    } finally {
      setSavingKeys((prev) => prev.filter((key) => key !== recommendationKey));
    }
  };

  const renderStatusBadge = (status: LearningProgressStatus) => {
    if (status === "completed") {
      return <Badge className="bg-green-600 text-white">Completed</Badge>;
    }
    if (status === "in_progress") {
      return <Badge className="bg-blue-600 text-white">In Progress</Badge>;
    }
    return <Badge variant="outline">Not Started</Badge>;
  };

  const renderProgressControls = (recommendation: LearningRecommendation) => {
    const recommendationKey = getRecommendationKey(recommendation);
    const row = progressByKey.get(recommendationKey);
    const status = row?.status ?? "not_started";
    const isSaving = savingKeys.includes(recommendationKey);
    const completedDate = formatDate(row?.completed_at ?? null);

    return (
      <div className="mt-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {renderStatusBadge(status)}
          {completedDate ? (
            <span className="text-xs text-muted-foreground">
              Completed {completedDate}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={isSaving || status === "in_progress"}
            onClick={() => handleProgressAction(recommendation, "start")}
          >
            {isSaving ? "Saving..." : "Start"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isSaving || status === "completed"}
            onClick={() => handleProgressAction(recommendation, "complete")}
          >
            Mark as Completed
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isSaving || status === "not_started"}
            onClick={() => handleProgressAction(recommendation, "reset")}
          >
            Reset
          </Button>
          <a href={recommendation.url} target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline">
              Open Course
            </Button>
          </a>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="p-8">
        <p>Loading learning path...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <p>Could not load learning path.</p>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="p-8">
        <p>No completed CV analysis found.</p>
        <Link to="/onboarding">
          <Button className="mt-4">Upload & Analyze CV</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Learning Path</h1>

      <Card className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Recommendations</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">
              {summary.inProgress}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {summary.completed}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Progress</p>
            <p className="text-2xl font-bold">{summary.percentage}%</p>
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span>
              {summary.completed} of {summary.total} completed
            </span>
            <span>{summary.percentage}% progress</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-green-600 transition-all"
              style={{ width: `${summary.percentage}%` }}
            />
          </div>
        </div>
      </Card>

      <div className="flex gap-2">
        <Button onClick={() => setTab("roadmap")}>Roadmap</Button>
        <Button onClick={() => setTab("library")}>Library</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {["All", "Free", "Beginner", "Technical", "Soft Skill"].map((f) => (
          <Button key={f} variant="outline" onClick={() => setFilter(f)}>
            {f}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          {tab === "roadmap" ? (
            <div className="space-y-4">
              {[
                { t: "This Week", items: safePlan.roadmap.week ?? [] },
                { t: "Next 30 Days", items: safePlan.roadmap.month ?? [] },
                { t: "Next 3 Months", items: safePlan.roadmap.quarter ?? [] },
              ].map((section) => (
                <div key={section.t}>
                  <h3 className="font-semibold">{section.t}</h3>
                  <div className="space-y-2">
                    {section.items.map((r) => {
                      const status =
                        progressByKey.get(getRecommendationKey(r))?.status ??
                        "not_started";

                      return (
                        <div
                          key={getRecommendationKey(r)}
                          className={`rounded border p-3 ${
                            status === "completed" ? "bg-green-50" : ""
                          }`}
                        >
                          <div className="font-medium">{r.title}</div>
                          <div className="text-sm">
                            {r.provider} • {r.skill}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {r.description}
                          </div>
                          {renderProgressControls(r)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((r) => {
                const status =
                  progressByKey.get(getRecommendationKey(r))?.status ??
                  "not_started";

                return (
                  <div
                    key={getRecommendationKey(r)}
                    className={`rounded border p-3 ${
                      status === "completed" ? "bg-green-50" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="font-medium">{r.title}</div>
                        <div className="text-xs">
                          {r.provider} • {r.skill} • {r.level} • {r.type} •{" "}
                          {r.cost_type}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {r.description}
                        </div>
                      </div>
                    </div>
                    {renderProgressControls(r)}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="space-y-2 p-4">
          <h3 className="font-semibold">Development Focus</h3>
          <p>
            Current CV score: <b>{analysis.overall_score ?? "N/A"}</b>
          </p>
          <p>
            Suggested focus domain:{" "}
            <b>
              {safeDomain?.confidence && safeDomain.confidence < 55
                ? "General / Early Career"
                : (safeDomain?.domain ?? "N/A")}
            </b>
          </p>
          <p>
            Top missing skills:{" "}
            <b>
              {safeGaps
                .slice(0, 3)
                .map((g) => g.skill)
                .join(", ") || "N/A"}
            </b>
          </p>
          <p>
            Suggested next step:{" "}
            <b>
              {topGap
                ? `Start with ${topGap.skill} using one beginner-friendly resource from the roadmap.`
                : "Review foundational resources and update your CV."}
            </b>
          </p>
          <p className="text-xs text-muted-foreground">
            Focus area based on your latest CV analysis. Estimated improvement is
            only a guidance indicator. Completing courses tracks learning
            progress only and does not change CV-extracted skill levels.
          </p>
          <div className="mt-3 space-y-2">
            <Badge>Platform Onboarding</Badge>
            <Badge>
              {summary.inProgress || summary.completed
                ? "First Resource Started"
                : "First Resource Started (Locked)"}
            </Badge>
            <Badge>Domain Focus</Badge>
            <Badge>
              {summary.completed >= 2 ? "Skill Builder" : "Skill Builder (Locked)"}
            </Badge>
          </div>
        </Card>
      </div>
    </div>
  );
};
