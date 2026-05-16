import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/lib/auth-context";
import { APPLICATIONS } from "@/lib/mock-data";
import {
  closeCompanyPosting,
  duplicateCompanyPosting,
  getCompanyPostings,
} from "@/lib/company-postings-service";
import { InternshipPosting } from "@/lib/types";

type PostingState = InternshipPosting;

export const CompanyPostingsPage = () => {
  const { company } = useCurrentUser();
  const [postings, setPostings] = useState<PostingState[]>([]);

  useEffect(() => {
    if (!company?.company_id) {
      setPostings([]);
      return;
    }
    void getCompanyPostings(company.company_id).then(setPostings);
  }, [company?.company_id]);

  const companyPostings = useMemo(
    () => postings.filter((posting) => posting.company_id === company?.company_id),
    [company?.company_id, postings],
  );

  const metrics = useMemo(() => {
    const activeCount = companyPostings.filter((posting) => posting.status === "active").length;
    const draftCount = companyPostings.filter((posting) => posting.status === "draft").length;

    const totalApplications = companyPostings.reduce(
      (sum, posting) => sum + APPLICATIONS.filter((application) => application.posting_id === posting.posting_id).length,
      0,
    );

    const allScores = companyPostings.flatMap((posting) =>
      APPLICATIONS.filter((application) => application.posting_id === posting.posting_id).map((application) => application.match_score),
    );

    const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length) : 0;

    return { activeCount, draftCount, totalApplications, avgScore };
  }, [companyPostings]);

  const getApplicationsForPosting = (postingId: string) =>
    APPLICATIONS.filter((application) => application.posting_id === postingId);

  const closePosting = async (postingId: string) => {
    const updated = await closeCompanyPosting(postingId);
    if (!updated) {
      toast.error("Posting could not be closed.");
      return;
    }

    setPostings((prev) => prev.map((posting) => (posting.posting_id === postingId ? updated : posting)));
    toast.success("Posting closed successfully.");
  };

  const duplicatePosting = async (postingId: string) => {
    const duplicate = await duplicateCompanyPosting(postingId);
    if (!duplicate) {
      toast.error("Posting could not be duplicated.");
      return;
    }

    setPostings((prev) => [duplicate, ...prev]);
    toast.success("Posting duplicated as draft.");
  };

  const statusBadgeVariant = (status: PostingState["status"]) => (status === "active" ? "default" : status === "draft" ? "secondary" : "outline");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Company Postings</h1>
          <p className="text-slate-500">Review, manage, and optimize your internship postings.</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link to="/company/postings/new">Create Posting</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-600">Active Postings</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">{metrics.activeCount}</p></CardContent></Card>
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-600">Draft Postings</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">{metrics.draftCount}</p></CardContent></Card>
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-600">Total Applications</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">{metrics.totalApplications}</p></CardContent></Card>
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-600">Average Match Score</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">%{metrics.avgScore}</p></CardContent></Card>
      </div>

      <div className="space-y-4">
        {companyPostings.map((posting) => {
          const postingApplications = getApplicationsForPosting(posting.posting_id);
          const postingAverageScore = postingApplications.length
            ? Math.round(postingApplications.reduce((sum, application) => sum + application.match_score, 0) / postingApplications.length)
            : 0;
          return (
            <Card key={posting.posting_id} className="bg-white rounded-xl">
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-xl text-slate-900">{posting.title}</CardTitle>
                  <Badge variant={statusBadgeVariant(posting.status)} className="capitalize">{posting.status}</Badge>
                </div>
                <p className="text-sm text-slate-600">
                  {posting.location} • {posting.duration_weeks} weeks • {posting.is_paid ? "Paid" : "Unpaid"}
                  {posting.is_paid && posting.monthly_stipend_try ? ` • ₺${posting.monthly_stipend_try.toLocaleString()} / month` : ""}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-700">
                  <p><span className="font-medium text-slate-900">Deadline:</span> {new Date(posting.deadline).toLocaleDateString()}</p>
                  <p><span className="font-medium text-slate-900">Applicants:</span> {postingApplications.length}</p>
                  <p><span className="font-medium text-slate-900">Avg Match:</span> %{postingAverageScore}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => toast.success(`Viewing applicants for ${posting.title}.`)}>View applicants</Button>
                  <Button variant="outline" onClick={() => toast.success(`Edit mode opened for ${posting.title}.`)}>Edit</Button>
                  <Button variant="outline" onClick={() => closePosting(posting.posting_id)} disabled={posting.status === "closed"}>Close posting</Button>
                  <Button variant="outline" onClick={() => duplicatePosting(posting.posting_id)}>Duplicate</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {companyPostings.length === 0 && (
          <Card className="bg-white rounded-xl">
            <CardContent className="py-10 text-center text-slate-600">No postings found for your company profile.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
