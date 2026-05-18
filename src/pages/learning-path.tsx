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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"roadmap" | "library">("roadmap");
  const [filter, setFilter] = useState("All");
  const [started, setStarted] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const latest = await getLatestStudentCvAnalysis();
        setAnalysis(latest);
      } catch {
        setError("We couldn't load your learning path right now. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const emptyPlan = {
    resources: [],
    roadmap: {
      week: [],
      month: [],
      quarter: [],
    },
  };

  const plan = analysis ? generateLearningPath(analysis) : emptyPlan;
  const domain = analysis ? detectStudentDomain(analysis) : null;
  const gaps = analysis ? generateSkillGaps(analysis) : [];
  const topGap = gaps[0];
  const est = analysis ? Math.min(98, (analysis.overall_score ?? 70) + 10) : null;

  const safeResources = Array.isArray(plan.resources) ? plan.resources : [];
  const weekItems = Array.isArray(plan.roadmap?.week) ? plan.roadmap.week : [];
  const monthItems = Array.isArray(plan.roadmap?.month) ? plan.roadmap.month : [];
  const quarterItems = Array.isArray(plan.roadmap?.quarter) ? plan.roadmap.quarter : [];

  const filtered = useMemo(
    () =>
      safeResources.filter(
        (r) =>
          filter === "All" ||
          (filter === "Free" && r.cost !== "Paid") ||
          (filter === "Beginner" && r.level === "Beginner") ||
          (filter === "Technical" && r.type === "Technical") ||
          (filter === "Soft Skill" && r.type === "Soft Skill"),
      ),
    [safeResources, filter],
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
        <p>{error}</p>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="p-8">
        <p>Upload and analyze your CV first.</p>
        <Link to="/onboarding">
          <Button className="mt-4">Go to Onboarding</Button>
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
                { t: "This Week", items: weekItems },
                { t: "Next 30 Days", items: monthItems },
                { t: "Next 3 Months", items: quarterItems },
              ].map((s) => (
                <div key={s.t}>
                  <h3 className="font-semibold">{s.t}</h3>
                  <div className="space-y-2">
                    {s.items.map((r) => (
                      <div key={r.id} className="rounded border p-3">
                        <div>{r.title}</div>
                        <div className="text-sm">{r.skill}</div>
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
                              {started.includes(r.id) ? "In Progress" : "Start Learning"}
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
                <div key={r.id} className="flex justify-between rounded border p-3">
                  <div>
                    <div>{r.title}</div>
                    <div className="text-xs">
                      {r.level} • {r.type}
                    </div>
                  </div>
                  <a href={r.url} target="_blank" rel="noreferrer" className="underline">
                    Open
                  </a>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <p>
            Current score: <b>{analysis.overall_score ?? "N/A"}</b>
          </p>
          <p>
            Estimated score: <b>{est ?? "N/A"}</b>
          </p>
          <p>
            Domain focus: <b>{domain?.domain ?? "N/A"}</b>
          </p>
          <p>
            Top missing skill: <b>{topGap?.skill ?? "N/A"}</b>
          </p>
          <div className="mt-3 space-y-2">
            <Badge>Platform Onboarding</Badge>
            <Badge>{started.length ? "First Resource Started" : "First Resource Started (Locked)"}</Badge>
            <Badge>Domain Focus</Badge>
            <Badge>{started.length >= 2 ? "Skill Builder" : "Skill Builder (Locked)"}</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
};
