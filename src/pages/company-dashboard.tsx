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

  const companyPostings = POSTINGS.filter((posting) => posting.company_id === company?.company_id);
  const applications = APPLICATIONS.filter((application) =>
    companyPostings.some((posting) => posting.posting_id === application.posting_id),
  );

  const shortlisted = applications.filter((application) => application.status === "shortlisted").length;

  const topApplicants = useMemo(
    () =>
      [...applications]
        .sort((a, b) => b.match_score - a.match_score)
        .slice(0, 3)
        .map((application) => ({
          ...application,
          student: STUDENTS.find((student) => student.student_id === application.student_id),
        })),
    [applications],
  );

  const postingPerformance = useMemo(
    () =>
      companyPostings.map((posting) => ({
        title: posting.title,
        applicants: APPLICATIONS.filter((application) => application.posting_id === posting.posting_id).length,
      })),
    [companyPostings],
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Company Dashboard</h1>
          <p className="text-slate-500">Welcome back, {company?.name}</p>
        </div>
        <Link to="/company/postings/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Posting
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-5 text-sm text-slate-600">
          <span className="font-medium text-slate-900">Company summary:</span> {company?.industry} • {company?.location} • {company?.is_premium ? "Premium plan" : "Free plan"}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-4 gap-4">
        {[
          { title: "Active Postings", value: companyPostings.length },
          { title: "New Applications", value: applications.length },
          { title: "Shortlisted Candidates", value: shortlisted },
          { title: "Recent Messages", value: 6 },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">{item.title}</p>
              <p className="text-2xl font-bold text-slate-900">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Posting Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {postingPerformance.map((posting) => (
              <div key={posting.title}>
                <div className="flex justify-between text-sm">
                  <span>{posting.title}</span>
                  <span>{posting.applicants} applicants</span>
                </div>
                <div className="h-2 rounded bg-slate-100 mt-1">
                  <div className="h-2 rounded bg-blue-600" style={{ width: `${Math.min(100, posting.applicants * 20)}%` }} />
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
            {topApplicants.map((application) => (
              <div key={application.application_id} className="p-3 rounded-lg border">
                <p className="text-sm font-semibold text-slate-900">{application.student?.department ?? "Student"}</p>
                <p className="text-xs text-slate-500">Match score: {application.match_score}%</p>
                <Badge variant="success" className="mt-2">
                  High Match
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Postings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {companyPostings.map((posting) => (
              <div key={posting.posting_id} className="p-3 rounded-lg border text-sm text-slate-700">
                {posting.title} • Deadline {new Date(posting.deadline).toLocaleDateString()}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Applications & Messages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            {applications.slice(0, 4).map((application) => (
              <div key={application.application_id} className="p-3 rounded-lg border">
                Application {application.application_id.toUpperCase()} • Score {application.match_score}%
              </div>
            ))}
            <div className="p-3 rounded-lg border">Message from candidate: "Could we confirm interview time?"</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
