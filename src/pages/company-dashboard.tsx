import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, CalendarCheck2, Plus, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { ApplicationStatus, DashboardData, getCompanyDashboardData } from "@/lib/company-applications-service";

const statusLabel: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  reviewed: "Reviewed",
  shortlisted: "Shortlisted",
  interview: "Interview",
  accepted: "Accepted",
  rejected: "Rejected",
};

export const CompanyDashboard = () => {
  const { company } = useCurrentUser();
  const companyName = company?.name ?? "Company";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCompanyDashboardData();
        if (!cancelled) setDashboardData(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const data = dashboardData;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900">Welcome, {companyName}</h1>
          <p className="text-slate-600">Here is your company summary and current hiring momentum.</p>
        </div>
        <Link to="/company/postings/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            New Posting
          </Button>
        </Link>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Company Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-600">Loading dashboard...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <p className="text-sm text-slate-600">
              You currently have {data?.activePostings ?? 0} active postings and {data?.totalApplications ?? 0} applications under review.
            </p>
          )}
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="flex items-center justify-between p-6"><div><p className="text-sm text-slate-500">Active Postings</p><p className="text-2xl font-bold text-slate-900">{data?.activePostings ?? 0}</p></div><Briefcase className="h-5 w-5 text-slate-400" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-6"><div><p className="text-sm text-slate-500">Total Applications</p><p className="text-2xl font-bold text-slate-900">{data?.totalApplications ?? 0}</p></div><Users className="h-5 w-5 text-slate-400" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-6"><div><p className="text-sm text-slate-500">Shortlisted</p><p className="text-2xl font-bold text-slate-900">{data?.shortlistedApplications ?? 0}</p></div><TrendingUp className="h-5 w-5 text-slate-400" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-6"><div><p className="text-sm text-slate-500">Interviews Scheduled</p><p className="text-2xl font-bold text-slate-900">{data?.interviewApplications ?? 0}</p></div><CalendarCheck2 className="h-5 w-5 text-slate-400" /></CardContent></Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Posting Performance</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!data?.postingPerformance?.length ? <p className="text-sm text-slate-500">No data yet.</p> : data.postingPerformance.map((entry) => (
              <div key={entry.postingId} className="rounded-md border border-slate-200 p-4">
                <p className="font-medium text-slate-900">{entry.title}</p>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                  <span>{entry.applications} applicants</span>
                  <span>Avg match {entry.avgScore == null ? "--" : `${entry.avgScore}%`}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Applicants</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!data?.topApplicants?.length ? <p className="text-sm text-slate-500">No data yet.</p> : data.topApplicants.map((candidate) => (
              <div key={candidate.applicationId} className="flex items-center justify-between rounded-md border border-slate-200 p-4">
                <div>
                  <p className="font-medium text-slate-900">{candidate.name}</p>
                  <p className="text-sm text-slate-600">{candidate.postingTitle}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{candidate.score == null ? "--" : `${candidate.score}%`}</Badge>
                  <Badge>{statusLabel[candidate.status]}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Average Match Score</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{data?.avgMatchScore == null ? "--" : `${data.avgMatchScore}%`}</p>
            <p className="mt-1 text-sm text-slate-600">Across all scored applications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Applications & Messages</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!data?.recentItems?.length ? <p className="text-sm text-slate-500">No data yet.</p> : data.recentItems.map((item) => (
              <div key={item.id} className="rounded-md border border-slate-200 p-4">
                <p className="font-medium text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-600">{item.postingTitle}</p>
                <p className="mt-1 text-xs text-slate-500">Updated on {item.date} • {statusLabel[item.status]}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};
