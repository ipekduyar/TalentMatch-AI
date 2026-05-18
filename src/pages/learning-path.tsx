import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  detectStudentDomain,
  generateLearningPath,
  generateSkillGaps,
  getLatestStudentCvAnalysis,
  type StudentCvAnalysis,
} from "@/lib/student-insights-service";

export const LearningPathPage = () => {
  const [analysis, setAnalysis] = useState<StudentCvAnalysis | null>(null);
  const [tab, setTab] = useState<"roadmap" | "library">("roadmap");
  const [filter, setFilter] = useState("All");
  const [started, setStarted] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getLatestStudentCvAnalysis()
      .then((row) => {
        if (mounted) setAnalysis(row);
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

  const safePlan = analysis
    ? generateLearningPath(analysis)
    : {
        resources: [],
        roadmap: { week: [], month: [], quarter: [] },
      };
  const safeDomain = analysis ? detectStudentDomain(analysis) : null;
  const safeGaps = analysis ? generateSkillGaps(analysis) : [];
  const topGap = safeGaps[0];

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
      <div className="flex gap-2">
        <Button onClick={() => setTab("roadmap")}>Roadmap</Button>
        <Button onClick={() => setTab("library")}>Library</Button>
      </div>

      <div className="flex gap-2">
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
                    {section.items.map((r) => (
                      <div key={r.id} className="rounded border p-3">
                        <div>{r.title}</div>
                        <div className="text-sm">
                          {r.provider} • {r.skill}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {r.description}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <a href={r.url} target="_blank" rel="noreferrer">
                            <Button
                              size="sm"
                              onClick={() =>
                                setStarted((prev) =>
                                  prev.includes(r.id) ? prev : [...prev, r.id],
                                )
                              }
                            >
                              {started.includes(r.id)
                                ? "In Progress"
                                : "Start Learning"}
                            </Button>
                          </a>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setSaved((prev) =>
                                prev.includes(r.id)
                                  ? prev.filter((x) => x !== r.id)
                                  : [...prev, r.id],
                              )
                            }
                          >
                            {saved.includes(r.id) ? "Bookmarked" : "Bookmark"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((r) => (
                <div
                  key={r.id}
                  className="flex justify-between rounded border p-3"
                >
                  <div>
                    <div>{r.title}</div>
                    <div className="text-xs">
                      {r.level} • {r.type} • {r.cost_type}
                    </div>
                  </div>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    Open
                  </a>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-2 p-4">
          <h3 className="font-semibold">Development Focus</h3>
          <p>
            Current CV score: <b>{analysis.overall_score ?? "N/A"}</b>
          </p>
          <p>
            Suggested focus domain: <b>{safeDomain?.confidence && safeDomain.confidence < 55 ? "General / Early Career" : (safeDomain?.domain ?? "N/A")}</b>
          </p>
          <p>
            Top missing skills: <b>{safeGaps.slice(0, 3).map((g) => g.skill).join(", ") || "N/A"}</b>
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
            only a guidance indicator.
          </p>
          <div className="mt-3 space-y-2">
            <Badge>Platform Onboarding</Badge>
            <Badge>
              {started.length
                ? "First Resource Started"
                : "First Resource Started (Locked)"}
            </Badge>
            <Badge>Domain Focus</Badge>
            <Badge>
              {started.length >= 2 ? "Skill Builder" : "Skill Builder (Locked)"}
            </Badge>
          </div>
        </Card>
      </div>
    </div>
  );
};
