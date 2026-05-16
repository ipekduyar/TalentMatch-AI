import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/lib/auth-context";
import { APPLICATIONS, POSTINGS } from "@/lib/mock-data";
import { InternshipPosting } from "@/lib/types";
import { Copy, Eye, PencilLine, ShieldX } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export const CompanyPostingsPage = () => {
  const { company } = useCurrentUser();
  const [items, setItems] = useState<InternshipPosting[]>(POSTINGS.filter((p) => p.company_id === company?.company_id));

  const stats = useMemo(() => {
    const active = items.filter((p) => p.status === "active").length;
    const draft = items.filter((p) => p.status === "draft").length;
    const appCount = APPLICATIONS.filter((a) => items.some((p) => p.posting_id === a.posting_id)).length;
    const avg = APPLICATIONS.filter((a) => items.some((p) => p.posting_id === a.posting_id)).reduce((s, a) => s + a.match_score, 0);
    return { active, draft, appCount, avgScore: appCount ? Math.round(avg / appCount) : 0 };
  }, [items]);

  const postingApps = (postingId: string) => APPLICATIONS.filter((a) => a.posting_id === postingId);

  const onClose = (id: string) => {
    setItems((prev) => prev.map((p) => (p.posting_id === id ? { ...p, status: "closed" } : p)));
    toast.success("Posting closed");
  };

  const onDuplicate = (posting: InternshipPosting) => {
    const copy = { ...posting, posting_id: `${posting.posting_id}-copy-${Date.now()}`, title: `${posting.title} (Copy)`, status: "draft" as const };
    setItems((prev) => [copy, ...prev]);
    toast.success("Posting duplicated as draft");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Company Postings</h1>
          <p className="text-slate-500">Review and manage internship postings.</p>
        </div>
        <Link to="/company/postings/new"><Button className="bg-blue-600 hover:bg-blue-700">Create Posting</Button></Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi title="Active Postings" value={stats.active} />
        <Kpi title="Draft Postings" value={stats.draft} />
        <Kpi title="Total Applications" value={stats.appCount} />
        <Kpi title="Average Match Score" value={`${stats.avgScore}%`} />
      </div>

      <Card>
        <CardHeader><CardTitle>Posting Management</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {items.map((posting) => {
            const apps = postingApps(posting.posting_id);
            const avg = apps.length ? Math.round(apps.reduce((s, a) => s + a.match_score, 0) / apps.length) : 0;
            return (
              <div key={posting.posting_id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{posting.title}</h3>
                    <p className="text-sm text-slate-500">{posting.location} • {posting.duration_weeks} weeks • {posting.is_paid ? `Paid (${posting.monthly_stipend_try} TRY)` : "Unpaid"}</p>
                    <p className="text-xs text-slate-500 mt-1">Deadline: {new Date(posting.deadline).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={posting.status === "active" ? "success" : posting.status === "draft" ? "warning" : "outline"}>{posting.status.replace("_", " ")}</Badge>
                    <span className="text-xs text-slate-500">Applicants: {apps.length}</span>
                    <span className="text-xs text-slate-500">Avg match: {avg}%</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => toast.info("Applicants list opened")}> <Eye className="w-3 h-3 mr-1" /> View applicants</Button>
                  <Button variant="outline" size="sm" onClick={() => toast.info("Edit posting form opened")}> <PencilLine className="w-3 h-3 mr-1" /> Edit</Button>
                  <Button variant="outline" size="sm" onClick={() => onClose(posting.posting_id)}> <ShieldX className="w-3 h-3 mr-1" /> Close posting</Button>
                  <Button variant="outline" size="sm" onClick={() => onDuplicate(posting)}> <Copy className="w-3 h-3 mr-1" /> Duplicate</Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

const Kpi = ({ title, value }: { title: string; value: string | number }) => (
  <Card><CardContent className="p-5"><p className="text-sm text-slate-500">{title}</p><p className="text-2xl font-bold text-slate-900">{value}</p></CardContent></Card>
);
