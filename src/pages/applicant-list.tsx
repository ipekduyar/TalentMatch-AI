import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ApplicantItem,
  ApplicationStatus,
  getApplicantsForPosting,
  getPostingTitle,
  updateApplicationStatus,
} from "@/lib/company-applications-service";
import { getOrCreateConversationForApplication } from "@/lib/messages-service";
import { toast } from "sonner";

const statusLabel: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  reviewed: "Reviewed",
  shortlisted: "Shortlisted",
  interview: "Interview",
  accepted: "Accepted",
  rejected: "Rejected",
};

export const ApplicantList = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postingTitle, setPostingTitle] = useState("Posting");
  const [applications, setApplications] = useState<ApplicantItem[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openingCvId, setOpeningCvId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [title, applicantRows] = await Promise.all([getPostingTitle(id), getApplicantsForPosting(id)]);
      setPostingTitle(title);
      setApplications(applicantRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applicants.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCvForApplicant = async (app: ApplicantItem): Promise<boolean> => {
    if (!app.cvAvailable) {
      toast.error("No CV file is available.");
      return false;
    }

    if (app.cvAvailable && !app.cvUrl) {
      toast.error("CV link could not be generated. Please check storage permissions/path.");
      return false;
    }

    setOpeningCvId(app.applicationId);
    try {
      window.open(app.cvUrl, "_blank", "noopener,noreferrer");
      return true;
    } catch (_err) {
      toast.error("CV could not be opened.");
      return false;
    } finally {
      setOpeningCvId(null);
    }
  };

  const handleStatusUpdate = async (applicationId: string, status: ApplicationStatus) => {
    const currentApplicant = applications.find((app) => app.applicationId === applicationId);

    try {
      setUpdatingId(applicationId);
      await updateApplicationStatus(applicationId, status);
      await loadData();

      if (status === "reviewed") {
        if (currentApplicant?.cvAvailable && currentApplicant.cvUrl) {
          await openCvForApplicant(currentApplicant);
          toast.success("Application marked as reviewed.");
        } else {
          toast.success("Application marked as reviewed. No CV file is available.");
        }
        return;
      }

      toast.success("Application status updated.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status.";
      setError(message);
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMessageApplicant = async (applicationId: string) => {
    try {
      setUpdatingId(applicationId);
      const conversationId = await getOrCreateConversationForApplication(applicationId);
      toast.success("Conversation ready.");
      navigate(`/company/messages?conversation=${encodeURIComponent(conversationId)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start conversation.";
      toast.error(message);
      setError(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const sortedApplications = useMemo(
    () => applications.slice().sort((a, b) => b.matchScore - a.matchScore),
    [applications],
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/company/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div><h1 className="text-3xl font-bold text-slate-900">Applicants</h1><p className="text-slate-500">{postingTitle}</p></div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <p className="p-6 text-sm text-slate-600">Loading applicants...</p>
            ) : !sortedApplications.length ? (
              <p className="p-6 text-sm text-slate-500">No applicants yet.</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Applicant</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Match Score</th>
                    <th className="px-6 py-4">Applied</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">CV</th>
                    <th className="px-6 py-4">Cover Letter</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedApplications.map((app, index) => (
                    <tr key={app.applicationId} className="hover:bg-slate-50/50 group transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-400"># {index + 1}</td>
                      <td className="px-6 py-4"><div className="flex items-center space-x-3"><Avatar className="w-8 h-8 border"><AvatarFallback>{app.name.charAt(0)}</AvatarFallback></Avatar><p className="text-sm font-bold text-slate-900">{app.name}</p></div></td>
                      <td className="px-6 py-4 text-sm text-slate-700">{app.email || "-"}</td>
                      <td className="px-6 py-4"><Badge variant="secondary">{app.matchScore == null ? "--" : `${app.matchScore}%`}</Badge></td>
                      <td className="px-6 py-4 text-sm text-slate-700">{new Date(app.appliedDate).toLocaleDateString("en-US")}</td>
                      <td className="px-6 py-4"><Badge className="capitalize">{statusLabel[app.status]}</Badge></td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <p className="text-sm text-slate-700">{app.cvFileName || "No CV uploaded"}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!app.cvAvailable || openingCvId === app.applicationId}
                            onClick={() => openCvForApplicant(app)}
                          >
                            {openingCvId === app.applicationId ? "Opening..." : "View CV"}
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 max-w-xs">{app.coverLetter?.trim() || "-"}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updatingId === app.applicationId}
                            onClick={() => handleMessageApplicant(app.applicationId)}
                          >
                            Message
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updatingId === app.applicationId}
                            onClick={() => handleStatusUpdate(app.applicationId, "reviewed")}
                          >
                            Review
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updatingId === app.applicationId}
                            onClick={() => handleStatusUpdate(app.applicationId, "shortlisted")}
                          >
                            Shortlist
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updatingId === app.applicationId}
                            onClick={() => handleStatusUpdate(app.applicationId, "interview")}
                          >
                            Interview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updatingId === app.applicationId}
                            onClick={() => handleStatusUpdate(app.applicationId, "accepted")}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updatingId === app.applicationId}
                            onClick={() => handleStatusUpdate(app.applicationId, "rejected")}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
