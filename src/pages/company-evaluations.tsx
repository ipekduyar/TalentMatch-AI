import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APPLICATIONS, STUDENTS } from "@/lib/mock-data";
import { toast } from "sonner";

const evaluations = APPLICATIONS.map((a, i) => ({ id: a.application_id, student: STUDENTS.find((s) => s.student_id === a.student_id)?.department ?? "Student", technical: 70 + i * 8, communication: 75 + i * 5, professionalism: 80 + i * 3, overall: Math.round((70 + i * 8 + 75 + i * 5 + 80 + i * 3) / 3), comments: "Strong ownership and curiosity.", isAnonymous: i % 2 === 0, status: i % 3 === 0 ? "pending" : i % 3 === 1 ? "submitted" : "completed" }));

export const CompanyEvaluationsPage = () => {
  const [tab, setTab] = useState<"pending"|"submitted"|"completed">("pending");
  const filtered = evaluations.filter((e) => e.status === tab);
  const stats = useMemo(() => ({ completed: evaluations.filter((e) => e.status === "completed").length, pending: evaluations.filter((e) => e.status === "pending").length }), []);

  return <div className="max-w-7xl mx-auto space-y-6">
    <div><h1 className="text-3xl font-bold text-slate-900">Evaluations</h1><p className="text-slate-500">Review applicant evaluations and scorecards.</p></div>
    <div className="grid md:grid-cols-2 gap-4"><Stat title="Completed Internships" value={stats.completed} /><Stat title="Pending Evaluation Requests" value={stats.pending} /></div>
    <Card><CardHeader><CardTitle>Filter</CardTitle><div className="flex gap-2">{(["pending", "submitted", "completed"] as const).map((t)=><Button key={t} variant={tab===t?"default":"outline"} className={tab===t?"bg-blue-600 hover:bg-blue-700":""} onClick={()=>setTab(t)}>{t}</Button>)}</div></CardHeader></Card>
    <Card>
      <CardHeader><CardTitle>Student Performance Scorecards</CardTitle></CardHeader>
      <CardContent className="space-y-3">{filtered.map((e)=><div key={e.id} className="border rounded-xl p-4 space-y-2"><div className="flex items-center justify-between"><p className="font-semibold text-slate-900">{e.student}</p><Badge variant="outline">{e.isAnonymous ? "Anonymous" : "Public"}</Badge></div><p className="text-sm text-slate-600">Technical {e.technical} • Communication {e.communication} • Professionalism {e.professionalism} • Overall <span className="font-semibold">{e.overall}</span></p><p className="text-sm text-slate-500">{e.comments}</p></div>)}</CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>Quick Evaluation Form (Mock)</CardTitle></CardHeader>
      <CardContent className="space-y-3"><p className="text-sm text-slate-600">Use this quick form to submit a scorecard without backend submission.</p><Button className="bg-blue-600 hover:bg-blue-700" onClick={()=>toast.success("Evaluation submitted")}>Submit evaluation</Button></CardContent>
    </Card>
  </div>;
};

const Stat = ({ title, value }: { title: string; value: number }) => <Card><CardContent className="p-5"><p className="text-sm text-slate-500">{title}</p><p className="text-2xl font-bold text-slate-900">{value}</p></CardContent></Card>;
