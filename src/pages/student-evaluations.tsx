import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getStudentEvaluationInternships,
  StudentCompanyEvaluationInput,
  StudentEvaluationInternship,
  submitStudentCompanyEvaluation,
} from "@/lib/student-evaluations-service";

const initialForm = (applicationId: string, existing?: StudentEvaluationInternship["student_evaluation"]): StudentCompanyEvaluationInput => ({
  application_id: applicationId,
  mentorship_quality: existing?.mentorship_quality ?? 3,
  learning_opportunity: existing?.learning_opportunity ?? 3,
  work_environment: existing?.work_environment ?? 3,
  task_relevance: existing?.task_relevance ?? 3,
  overall_score: existing?.overall_score ?? 3,
  positive_feedback: existing?.positive_feedback ?? "",
  improvement_feedback: existing?.improvement_feedback ?? "",
  would_recommend: existing?.would_recommend ?? null,
});

const ScoreField = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
  <label className="space-y-2 text-sm font-bold text-slate-700">
    <span>{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
    >
      {[1, 2, 3, 4, 5].map((score) => (
        <option key={score} value={score}>{score}</option>
      ))}
    </select>
  </label>
);

const RecommendationSelect = ({ value, onChange }: { value: boolean | null; onChange: (value: boolean | null) => void }) => (
  <label className="space-y-2 text-sm font-bold text-slate-700">
    <span>Would Recommend</span>
    <select
      value={value === null ? "" : value ? "yes" : "no"}
      onChange={(event) => onChange(event.target.value === "" ? null : event.target.value === "yes")}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
    >
      <option value="">Not selected</option>
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
  </label>
);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const StudentEvaluationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internships, setInternships] = useState<StudentEvaluationInternship[]>([]);
  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(null);
  const [form, setForm] = useState<StudentCompanyEvaluationInput | null>(null);

  const loadInternships = async () => {
    try {
      setLoading(true);
      setError(null);
      setInternships(await getStudentEvaluationInternships());
    } catch (err: any) {
      setError(err?.message || "Could not load evaluations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInternships();
  }, []);

  const stats = useMemo(() => {
    const completed = internships.filter((item) => item.student_evaluation).length;
    return {
      accepted: internships.length,
      pending: internships.length - completed,
      completed,
    };
  }, [internships]);

  const openForm = (internship: StudentEvaluationInternship) => {
    setActiveApplicationId(internship.application_id);
    setForm(initialForm(internship.application_id, internship.student_evaluation));
  };

  const updateForm = <K extends keyof StudentCompanyEvaluationInput>(key: K, value: StudentCompanyEvaluationInput[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const handleSubmit = async () => {
    if (!form) return;
    try {
      setSaving(true);
      await submitStudentCompanyEvaluation(form);
      toast.success("Company evaluation saved.");
      setActiveApplicationId(null);
      setForm(null);
      await loadInternships();
    } catch (err: any) {
      toast.error(err?.message || "Could not save evaluation.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto text-slate-600">Loading evaluations...</div>;
  if (error) return <div className="max-w-7xl mx-auto text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Evaluations</h1>
        <p className="text-slate-500">Evaluate companies for accepted internships and view company feedback about you.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Accepted Internships</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">{stats.accepted}</p></CardContent></Card>
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Pending Evaluations</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">{stats.pending}</p></CardContent></Card>
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Completed Evaluations</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">{stats.completed}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
        <Card className="bg-white rounded-xl">
          <CardHeader><CardTitle className="text-slate-900">Accepted Internships</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {internships.length === 0 ? (
              <p className="text-sm text-slate-600">No accepted internships are ready for evaluation yet.</p>
            ) : internships.map((item) => (
              <div key={item.application_id} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700 space-y-3">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <p className="font-bold text-slate-900">{item.company_name}</p>
                    <p>{item.posting_title}</p>
                    <p className="text-xs text-slate-400">Accepted application from {formatDate(item.created_at)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={item.student_evaluation ? "default" : "secondary"}>{item.student_evaluation ? "Completed" : "Pending"}</Badge>
                    <Button size="sm" onClick={() => openForm(item)}>{item.student_evaluation ? "Edit Evaluation" : "Evaluate"}</Button>
                  </div>
                </div>

                {item.company_evaluation ? (
                  <div className="rounded-xl bg-indigo-50 p-3 text-slate-700">
                    <p className="font-bold text-indigo-900">Company feedback about you</p>
                    <p className="text-xs text-indigo-700">Overall score: {item.company_evaluation.overall_score}/5 · Recommend: {item.company_evaluation.would_recommend === null ? "Not selected" : item.company_evaluation.would_recommend ? "Yes" : "No"}</p>
                    {item.company_evaluation.strengths && <p className="mt-2">Strengths: {item.company_evaluation.strengths}</p>}
                    {item.company_evaluation.improvement_feedback && <p>Improve: {item.company_evaluation.improvement_feedback}</p>}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Company feedback has not been submitted yet.</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl">
          <CardHeader><CardTitle className="text-slate-900">Company Evaluation Form</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!form || !activeApplicationId ? (
              <p className="text-sm text-slate-600">Select an accepted internship to submit or edit your company evaluation.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ScoreField label="Mentorship Quality" value={form.mentorship_quality} onChange={(value) => updateForm("mentorship_quality", value)} />
                  <ScoreField label="Learning Opportunity" value={form.learning_opportunity} onChange={(value) => updateForm("learning_opportunity", value)} />
                  <ScoreField label="Work Environment" value={form.work_environment} onChange={(value) => updateForm("work_environment", value)} />
                  <ScoreField label="Task Relevance" value={form.task_relevance} onChange={(value) => updateForm("task_relevance", value)} />
                  <ScoreField label="Overall Score" value={form.overall_score} onChange={(value) => updateForm("overall_score", value)} />
                  <RecommendationSelect value={form.would_recommend} onChange={(value) => updateForm("would_recommend", value)} />
                </div>
                <label className="space-y-2 text-sm font-bold text-slate-700 block">
                  <span>Positive Feedback</span>
                  <textarea value={form.positive_feedback} onChange={(event) => updateForm("positive_feedback", event.target.value)} className="min-h-24 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                </label>
                <label className="space-y-2 text-sm font-bold text-slate-700 block">
                  <span>Improvement Feedback</span>
                  <textarea value={form.improvement_feedback} onChange={(event) => updateForm("improvement_feedback", event.target.value)} className="min-h-24 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                </label>
                <Button disabled={saving} onClick={handleSubmit} className="w-full bg-indigo-600 text-white hover:bg-indigo-700">
                  {saving ? "Saving..." : "Save Evaluation"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
