import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCompanyEvaluationCandidates } from "@/lib/company-evaluations-service";

export const CompanyEvaluationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Array<{ application_id: string; status: string; created_at: string; posting_title: string; student_name: string }>>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        setCandidates(await getCompanyEvaluationCandidates());
      } catch (err: any) {
        setError(err?.message || "Could not load evaluations module.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const pendingEvaluations = useMemo(() => candidates.length, [candidates]);

  if (loading) return <div className="max-w-7xl mx-auto text-slate-600">Loading evaluations...</div>;
  if (error) return <div className="max-w-7xl mx-auto text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Evaluations</h1>
        <p className="text-slate-500">Evaluation module is prepared for the next stage. No completed internships are available yet.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Completed Internships</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">0</p></CardContent></Card>
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Pending Evaluations</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">{pendingEvaluations}</p></CardContent></Card>
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Average Overall Score</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">--</p></CardContent></Card>
      </div>

      <Card className="bg-white rounded-xl">
        <CardHeader><CardTitle className="text-slate-900">Future Evaluation Queue</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {candidates.length === 0 ? <p className="text-sm text-slate-600">No accepted or interview applications yet.</p> : candidates.map((item) => (
            <div key={item.application_id} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700 flex items-center justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900">{item.student_name}</p>
                <p>{item.posting_title}</p>
              </div>
              <Badge variant="secondary">{item.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-white rounded-xl">
        <CardHeader><CardTitle className="text-slate-900">Quick Evaluation</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">Evaluation submission will be available after internship completion.</p>
          <Button disabled className="w-full bg-slate-300 text-slate-700">Submit Evaluation</Button>
        </CardContent>
      </Card>
    </div>
  );
};
