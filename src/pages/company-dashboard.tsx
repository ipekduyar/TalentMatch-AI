import { useMemo } from "react";
import { useCurrentUser } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { POSTINGS, APPLICATIONS, STUDENTS } from "@/lib/mock-data";

export const CompanyDashboard = () => {
  const { company } = useCurrentUser();
  const companyPostings = POSTINGS.filter((p) => p.company_id === company?.company_id);
  const apps = APPLICATIONS.filter((a) => companyPostings.some((p) => p.posting_id === a.posting_id));
  const shortlisted = apps.filter((a) => a.status === "shortlisted").length;
  const topApplicants = apps.sort((a,b)=>b.match_score-a.match_score).slice(0,3).map((a)=>({ ...a, student: STUDENTS.find((s)=>s.student_id===a.student_id) }));
  const perf = useMemo(()=>companyPostings.map((p)=>({ title: p.title, apps: APPLICATIONS.filter((a)=>a.posting_id===p.posting_id).length })), [companyPostings]);

  return <div className="space-y-6 max-w-7xl mx-auto">
    <div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold text-slate-900">Company Dashboard</h1><p className="text-slate-500">Welcome back, {company?.name}</p></div><Link to="/company/postings/new"><Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />New Posting</Button></Link></div>
    <div className="grid md:grid-cols-4 gap-4">{[{t:"Active postings",v:companyPostings.length},{t:"New applications",v:apps.length},{t:"Shortlisted candidates",v:shortlisted},{t:"Recent messages",v:6}].map((s)=><Card key={s.t}><CardContent className="p-5"><p className="text-sm text-slate-500">{s.t}</p><p className="text-2xl font-bold text-slate-900">{s.v}</p></CardContent></Card>)}</div>
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2"><CardHeader><CardTitle>Posting Performance</CardTitle></CardHeader><CardContent className="space-y-3">{perf.map((p)=><div key={p.title}><div className="flex justify-between text-sm"><span>{p.title}</span><span>{p.apps} applicants</span></div><div className="h-2 rounded bg-slate-100 mt-1"><div className="h-2 rounded bg-blue-600" style={{width:`${Math.min(100,p.apps*20)}%`}} /></div></div>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Top Applicants</CardTitle></CardHeader><CardContent className="space-y-3">{topApplicants.map((a)=><div key={a.application_id} className="p-3 rounded-lg border"><p className="text-sm font-semibold text-slate-900">{a.student?.department}</p><p className="text-xs text-slate-500">Score {a.match_score}%</p><Badge variant="success" className="mt-2">High Match</Badge></div>)}</CardContent></Card>
    </div>
  </div>;
};
