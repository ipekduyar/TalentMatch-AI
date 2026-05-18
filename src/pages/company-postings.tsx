import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/lib/auth-context";
import {
  activateCompanyPosting,
  closeCompanyPosting,
  duplicateCompanyPosting,
  getCompanyPostings,
} from "@/lib/company-postings-service";
import { InternshipPosting } from "@/lib/types";
import { getCompanyApplicationStatsByPosting, type CompanyApplicationStatsByPosting } from "@/lib/company-applications-service";

type PostingState = InternshipPosting;

export const CompanyPostingsPage = () => {
  const { company, currentUser } = useCurrentUser();
  const navigate = useNavigate();
  const [postings, setPostings] = useState<PostingState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [applicationStats, setApplicationStats] = useState<CompanyApplicationStatsByPosting>({});

  const getErrorMessage = (error: unknown) => {
    if (typeof error === "object" && error !== null && "message" in error) return String((error as { message: string }).message);
    return String(error);
  };

  const loadPostings = async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [nextPostings, nextApplicationStats] = await Promise.all([
        getCompanyPostings(),
        getCompanyApplicationStatsByPosting(),
      ]);
      setPostings(nextPostings);
      setApplicationStats(nextApplicationStats);
    } catch (error) {
      console.error("Failed to load company postings", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPostings();
  }, [currentUser?.id]);

  const companyPostings = useMemo(
    () => postings.filter((posting) => posting.company_id === company?.company_id),
    [company?.company_id, postings],
  );

  const metrics = useMemo(() => {
    const activeCount = companyPostings.filter((posting) => posting.status === "active").length;
    const draftCount = companyPostings.filter((posting) => posting.status === "draft").length;

    const postingStats = companyPostings.map((posting) => applicationStats[posting.posting_id]).filter(Boolean);

    const totalApplications = postingStats.reduce((sum, stats) => sum + stats.count, 0);

    const weightedScore = postingStats.reduce(
      (sum, stats) => sum + stats.avgMatchScore * stats.count,
      0,
    );

    const avgScore = totalApplications > 0 ? Math.round(weightedScore / totalApplications) : 0;

    return { activeCount, draftCount, totalApplications, avgScore };
  }, [applicationStats, companyPostings]);

  const closePosting = async (postingId: string) => {
    try {
      const updated = await closeCompanyPosting(postingId);
      if (!updated) {
        toast.error("Posting could not be closed.");
        return;
      }

      await loadPostings();
      toast.success("Posting closed successfully.");
    } catch (error) {
      console.error("Supabase close posting error:", error);
      toast.error(`Failed to close posting: ${getErrorMessage(error)}`);
    }
  };


  const activatePosting = async (postingId: string) => {
    try {
      const updated = await activateCompanyPosting(postingId);
      if (!updated) {
        toast.error("Posting could not be activated.");
        return;
      }

      await loadPostings();
      toast.success("Posting activated successfully.");
    } catch (error) {
      console.error("Supabase activate posting error:", error);
      toast.error(getErrorMessage(error));
    }
  };

  const duplicatePosting = async (postingId: string) => {
    try {
      const duplicate = await duplicateCompanyPosting(postingId);
      if (!duplicate) {
        toast.error("Posting could not be duplicated.");
        return;
      }

      await loadPostings();
      toast.success("Posting duplicated as draft.");
    } catch (error) {
      console.error("Supabase duplicate posting error:", error);
      toast.error(`Failed to duplicate posting: ${getErrorMessage(error)}`);
    }
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
        <Button variant="outline" onClick={() => void loadPostings()} disabled={isLoading}>
          {isLoading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-600">Active Postings</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">{metrics.activeCount}</p></CardContent></Card>
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-600">Draft Postings</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">{metrics.draftCount}</p></CardContent></Card>
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-600">Total Applications</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">{metrics.totalApplications}</p></CardContent></Card>
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-600">Average Match Score</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">%{metrics.avgScore}</p></CardContent></Card>
      </div>

      <div className="space-y-4">
        {isLoading && (
          <Card className="bg-white rounded-xl">
            <CardContent className="py-10 text-center text-slate-600">Loading postings...</CardContent>
          </Card>
        )}
        {!isLoading && companyPostings.map((posting) => {
          return (
            <Card key={posting.posting_id} className="bg-white rounded-xl">
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-xl text-slate-900">{posting.title}</CardTitle>
                  <Badge variant={statusBadgeVariant(posting.status)} className="capitalize">{posting.status}</Badge>
                </div>
                <p className="text-sm text-slate-600">
                  {posting.location} • {posting.duration_weeks} weeks • {posting.is_paid ? "Paid" : "Unpaid"}
                  {posting.is_paid && (posting.monthly_stipend_try ?? (posting as { monthly_stipend?: number | null }).monthly_stipend)
                    ? ` • ₺${(posting.monthly_stipend_try ?? (posting as { monthly_stipend?: number | null }).monthly_stipend)?.toLocaleString()} / month`
                    : ""}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-700">
                  <p><span className="font-medium text-slate-900">Deadline:</span> {new Date(posting.deadline).toLocaleDateString()}</p>
                  <p><span className="font-medium text-slate-900">Applicants:</span> {applicationStats[posting.posting_id]?.count ?? 0}</p>
                  <p><span className="font-medium text-slate-900">Avg Match:</span> %{applicationStats[posting.posting_id]?.avgMatchScore ?? 0}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => navigate(`/company/postings/${posting.posting_id}/applicants`)}>View applicants</Button>
                  <Button variant="outline" onClick={() => toast.success(`Edit mode opened for ${posting.title}.`)}>Edit</Button>
                  <Button variant="outline" onClick={() => closePosting(posting.posting_id)} disabled={posting.status === "closed"}>Close posting</Button>
                  {(posting.status === "draft" || posting.status === "pending_review") && (
                    <Button variant="default" onClick={() => activatePosting(posting.posting_id)}>
                      {posting.status === "draft" ? "Publish" : "Activate"}
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => duplicatePosting(posting.posting_id)}>Duplicate</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!isLoading && companyPostings.length === 0 && (
          <Card className="bg-white rounded-xl">
            <CardContent className="py-10 text-center text-slate-600">No postings found for your company profile.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
