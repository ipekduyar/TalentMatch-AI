import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Briefcase, Building2, CheckCircle2, FileText, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminDashboardStats, type AdminDashboardStats } from "@/lib/admin-service";

const formatNumber = (value: number | null | undefined) => new Intl.NumberFormat("en-US").format(value ?? 0);
const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value)) : "—";

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getAdminDashboardStats();
        if (mounted) setStats(data);
      } catch (err: any) {
        if (mounted) setError(err?.message || "Could not load admin dashboard.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, []);

  if (isLoading) {
    return <AdminLoading title="Admin Dashboard" />;
  }

  if (error) {
    return <AdminError title="Admin Dashboard" message={error} />;
  }

  if (!stats) {
    return <AdminEmpty title="Admin Dashboard" message="No admin dashboard data is available yet." />;
  }

  const cards = [
    { title: "Total Students", value: stats.total_students, icon: Users },
    { title: "Total Companies", value: stats.total_companies, icon: Building2 },
    { title: "Active Postings", value: stats.total_active_postings, icon: Briefcase },
    { title: "Total Applications", value: stats.total_applications, icon: FileText },
    { title: "Accepted Applications", value: stats.accepted_applications, icon: CheckCircle2 },
    { title: "Average Match Score", value: stats.average_match_score === null ? "—" : `%${Math.round(stats.average_match_score)}`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600">Admin</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Platform Dashboard</h1>
          <p className="text-sm text-slate-500">Live Supabase-backed platform monitoring.</p>
        </div>
        {typeof stats.pending_company_verifications === "number" && (
          <Badge className="w-fit bg-amber-100 text-amber-800 hover:bg-amber-100">
            {stats.pending_company_verifications} pending company verifications
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{card.title}</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{typeof card.value === "number" ? formatNumber(card.value) : card.value}</p>
              </div>
              <div className="rounded-2xl bg-indigo-50 p-4 text-indigo-600"><card.icon className="h-6 w-6" /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Applications by Status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(stats.applications_by_status ?? {}).length === 0 ? (
              <p className="text-sm text-slate-500">No applications yet.</p>
            ) : Object.entries(stats.applications_by_status).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-bold capitalize text-slate-700">{status.replace('_', ' ')}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Newest Users</CardTitle><Link to="/admin/users" className="text-xs font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700">View all</Link></CardHeader>
          <CardContent className="space-y-3">
            {stats.newest_users.length === 0 ? <p className="text-sm text-slate-500">No users yet.</p> : stats.newest_users.map((user) => (
              <div key={user.person_id} className="rounded-xl border p-3">
                <p className="font-bold text-slate-900">{[user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || "Unnamed user"}</p>
                <p className="text-xs text-slate-500">{user.email} · {user.role} · {formatDate(user.created_at)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Newest Companies</CardTitle><Link to="/admin/companies" className="text-xs font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700">View all</Link></CardHeader>
          <CardContent className="space-y-3">
            {stats.newest_companies.length === 0 ? <p className="text-sm text-slate-500">No companies yet.</p> : stats.newest_companies.map((company) => (
              <div key={company.company_id} className="rounded-xl border p-3">
                <p className="font-bold text-slate-900">{company.name || "Unnamed company"}</p>
                <p className="text-xs text-slate-500">{company.industry || "No industry"} · {company.location || "No location"}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Newest Postings</CardTitle><Link to="/admin/postings" className="text-xs font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700">View all</Link></CardHeader>
        <CardContent>
          {stats.newest_postings.length === 0 ? <p className="text-sm text-slate-500">No postings yet.</p> : (
            <div className="grid gap-3 md:grid-cols-2">
              {stats.newest_postings.map((posting) => (
                <div key={posting.internship_posting_id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{posting.title || "Untitled posting"}</p>
                      <p className="text-xs text-slate-500">{posting.company_name || "Unknown company"} · {formatDate(posting.created_at)}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">{posting.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const AdminLoading = ({ title }: { title: string }) => (
  <div className="space-y-6"><h1 className="text-3xl font-black text-slate-950">{title}</h1><div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div></div>
);

const AdminError = ({ title, message }: { title: string; message: string }) => (
  <Card><CardContent className="flex gap-3 p-6 text-rose-700"><AlertCircle className="h-5 w-5" /><div><h1 className="font-black">{title}</h1><p className="text-sm">{message}</p></div></CardContent></Card>
);

const AdminEmpty = ({ title, message }: { title: string; message: string }) => (
  <Card><CardContent className="p-6"><h1 className="font-black text-slate-900">{title}</h1><p className="text-sm text-slate-500">{message}</p></CardContent></Card>
);
