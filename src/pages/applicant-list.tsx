import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ApplicantItem,
  ApplicationStatus,
  getApplicantsForPosting,
  getPostingTitle,
  updateApplicationStatus,
} from "@/lib/company-applications-service";

const statusLabel: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  reviewed: "Reviewed",
  shortlisted: "Shortlisted",
  accepted: "Accepted",
  rejected: "Rejected",
};

export const ApplicantList = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postingTitle, setPostingTitle] = useState("Posting");
  const [applications, setApplications] = useState<ApplicantItem[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const handleStatusUpdate = async (applicationId: string, status: ApplicationStatus) => {
    try {
      setUpdatingId(applicationId);
      await updateApplicationStatus(applicationId, status);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
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
                      <td className="px-6 py-4"><Badge variant="secondary">{app.matchScore}%</Badge></td>
                      <td className="px-6 py-4 text-sm text-slate-700">{new Date(app.appliedDate).toLocaleDateString("en-US")}</td>
                      <td className="px-6 py-4"><Badge className="capitalize">{statusLabel[app.status]}</Badge></td>
                      <td className="px-6 py-4 text-sm text-slate-700 max-w-xs">{app.coverLetter?.trim() || "-"}</td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-amber-600"
                          disabled={updatingId === app.applicationId}
                          onClick={() => handleStatusUpdate(app.applicationId, "reviewed")}
                        ><Clock className="w-4 h-4" /></Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-green-600"
                          disabled={updatingId === app.applicationId}
                          onClick={() => handleStatusUpdate(app.applicationId, "shortlisted")}
                        ><CheckCircle className="w-4 h-4" /></Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-red-600"
                          disabled={updatingId === app.applicationId}
                          onClick={() => handleStatusUpdate(app.applicationId, "rejected")}
                        ><XCircle className="w-4 h-4" /></Button>
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
