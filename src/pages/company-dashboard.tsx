import { useCurrentUser } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MessageSquare, Plus, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { APPLICATIONS, POSTINGS, STUDENTS } from "@/lib/mock-data";

export const CompanyDashboard = () => {
  const { company } = useCurrentUser();
  const companyId = company?.company_id;
  const companyName = company?.name ?? "Company";
  const companyPostings = POSTINGS.filter((posting) => posting.company_id === companyId);
  const activePostings = companyPostings.filter((posting) => posting.status === "active");
  const postingIds = new Set(companyPostings.map((posting) => posting.posting_id));
  const companyApplications = APPLICATIONS.filter((application) => postingIds.has(application.posting_id));
  const totalApplications = companyApplications.length;
  const shortlistedApplications = companyApplications.filter((application) => application.status === "shortlisted").length;
  const interviewsScheduled = companyApplications.filter((application) => application.status === "interview").length;
  const topApplicants = companyApplications
    .slice()
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 5)
    .map((application) => {
      const student = STUDENTS.find((candidate) => candidate.student_id === application.student_id);
      const posting = companyPostings.find((job) => job.posting_id === application.posting_id);
      return {
        applicationId: application.application_id,
        name: student?.name ?? "Candidate",
        score: application.match_score,
        postingTitle: posting?.title ?? "Role",
        status: application.status,
      };
    });
  const postingPerformance = companyPostings.slice(0, 5).map((posting) => {
    const postingApplications = companyApplications.filter((application) => application.posting_id === posting.posting_id);
    const avgScore = postingApplications.length
      ? Math.round(postingApplications.reduce((sum, application) => sum + application.match_score, 0) / postingApplications.length)
      : 0;
    return {
      postingId: posting.posting_id,
      title: posting.title,
      applications: postingApplications.length,
      avgScore,
    };
  });
  const recentItems = companyApplications
    .slice()
    .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
    .slice(0, 6)
    .map((application) => {
      const student = STUDENTS.find((candidate) => candidate.student_id === application.student_id);
      const posting = companyPostings.find((job) => job.posting_id === application.posting_id);
      return {
        id: application.application_id,
        name: student?.name ?? "Candidate",
        postingTitle: posting?.title ?? "Role",
        date: new Date(application.applied_at).toLocaleDateString("en-US"),
      };
    });

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
          <p className="text-sm text-slate-600">
            You currently have {activePostings.length} active postings and {totalApplications} applications under review.
          </p>
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-slate-500">Active Postings</p>
              <p className="text-2xl font-bold text-slate-900">{activePostings.length}</p>
            </div>
            <Briefcase className="h-5 w-5 text-slate-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-slate-500">Total Applications</p>
              <p className="text-2xl font-bold text-slate-900">{totalApplications}</p>
            </div>
            <Users className="h-5 w-5 text-slate-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-slate-500">Shortlisted</p>
              <p className="text-2xl font-bold text-slate-900">{shortlistedApplications}</p>
            </div>
            <TrendingUp className="h-5 w-5 text-slate-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-slate-500">Interviews Scheduled</p>
              <p className="text-2xl font-bold text-slate-900">{interviewsScheduled}</p>
            </div>
            <MessageSquare className="h-5 w-5 text-slate-400" />
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Posting Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {postingPerformance.map((entry) => (
              <div key={entry.postingId} className="rounded-md border border-slate-200 p-4">
                <p className="font-medium text-slate-900">{entry.title}</p>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                  <span>{entry.applications} applicants</span>
                  <span>Avg match {entry.avgScore}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Applicants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topApplicants.map((candidate) => (
              <div key={candidate.applicationId} className="flex items-center justify-between rounded-md border border-slate-200 p-4">
                <div>
                  <p className="font-medium text-slate-900">{candidate.name}</p>
                  <p className="text-sm text-slate-600">{candidate.postingTitle}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{candidate.score}%</Badge>
                  <Badge>{candidate.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active Postings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activePostings.map((posting) => (
              <div key={posting.posting_id} className="rounded-md border border-slate-200 p-4">
                <p className="font-medium text-slate-900">{posting.title}</p>
                <p className="mt-1 text-sm text-slate-600">Deadline: {new Date(posting.deadline).toLocaleDateString("en-US")}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Applications & Messages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentItems.map((item) => (
              <div key={item.id} className="rounded-md border border-slate-200 p-4">
                <p className="font-medium text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-600">{item.postingTitle}</p>
                <p className="mt-1 text-xs text-slate-500">Updated on {item.date}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};
