import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { detectStudentDomain, generateSkillGaps, getLatestStudentCvAnalysis, type StudentCvAnalysis } from "@/lib/student-insights-service";

export const SkillGapPage = () => {
  const [analysis, setAnalysis] = useState<StudentCvAnalysis | null>(null);
  useEffect(() => { void getLatestStudentCvAnalysis().then(setAnalysis); }, []);
  if (!analysis) return <Card className="p-8"><p>No completed CV analysis found.</p><Link to="/onboarding"><Button className="mt-4">Upload & Analyze CV</Button></Link></Card>;
  const domain = detectStudentDomain(analysis); const gaps = generateSkillGaps(analysis);
  return <div className="space-y-6"><h1 className="text-3xl font-bold">Skill Gaps</h1><Card className="p-6 space-y-2"><p>Detected domain: <b>{domain.domain}</b> ({domain.confidence}%)</p><p>Overall score: <b>{analysis.overall_score ?? "N/A"}</b></p><p>Suggested roles: {analysis.suggested_roles.join(", ") || "N/A"}</p><p>Extracted skills: {analysis.extracted_skills.join(", ") || "N/A"}</p><p>Strengths: {analysis.strengths.join(", ") || "N/A"}</p><p>These focus areas are based on your latest CV analysis. These resources may help strengthen your profile for similar roles.</p></Card>{gaps.slice(0,8).map((gap) => <Card key={gap.skill}><CardHeader><CardTitle>{gap.skill} <Badge>{gap.urgency}</Badge></CardTitle></CardHeader><CardContent><p>Current: {gap.currentLevel}/5 • Target: {gap.targetLevel}/5</p><p>{gap.reason}</p><p>Related roles: {gap.relatedRoles.join(", ")}</p><div className="flex flex-wrap gap-2 mt-2">{gap.resources.map((r) => <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="underline text-indigo-600">{r.title} ({r.provider})</a>)}</div><Link to="/learning-path" className="underline text-sm mt-3 inline-block">See more resources</Link></CardContent></Card>)}</div>;
};
