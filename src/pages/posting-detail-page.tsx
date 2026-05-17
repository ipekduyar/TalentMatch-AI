import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { applyToPosting, getExistingApplication, getPostingById } from "@/lib/applications-service";
import type { InternshipPosting } from "@/lib/types";

export const PostingDetailPage = () => {
  const { postingId } = useParams<{ postingId: string }>();
  const [posting, setPosting] = useState<InternshipPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applied, setApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!postingId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [postingData, existing] = await Promise.all([
          getPostingById(postingId),
          getExistingApplication(postingId),
        ]);
        setPosting(postingData);
        setApplied(Boolean(existing));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load posting details.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [postingId]);

  const details = useMemo(() => {
    if (!posting) return [];
    return [
      ["Location", posting.location ?? "N/A"],
      ["Industry", posting.industry ?? "N/A"],
      ["Compensation", posting.is_paid ? "Paid" : "Unpaid"],
      ["Work Type", posting.is_remote ? "Remote" : "Onsite"],
      ["Duration", posting.duration_weeks ? `${posting.duration_weeks} weeks` : "N/A"],
      ["Monthly Stipend", posting.monthly_stipend_try ? `${posting.monthly_stipend_try} TRY` : "N/A"],
      ["Deadline", posting.deadline ? new Date(posting.deadline).toLocaleDateString("tr-TR") : "N/A"],
    ];
  }, [posting]);

  const handleApply = async () => {
    if (!postingId || applied) return;
    setSubmitting(true);
    try {
      await applyToPosting(postingId, coverLetter);
      setApplied(true);
      toast.success("Application submitted successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-sm text-slate-500">Loading posting details...</div>;
  if (!postingId || !posting) return <div className="text-sm text-slate-500">Posting not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/search" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to /search
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{posting.title}</CardTitle>
          <p className="text-slate-600">{posting.company_name ?? "Unknown Company"}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {details.map(([label, value]) => (
              <div key={label} className="rounded-lg border p-3">
                <p className="text-slate-500">{label}</p>
                <p className="font-semibold text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
            <p className="text-slate-700 whitespace-pre-wrap">{posting.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Required Skills</h3>
              <p className="text-slate-700">{posting.required_skills?.length ? posting.required_skills.join(", ") : "N/A"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Desired Skills</h3>
              <p className="text-slate-700">{posting.desired_skills?.length ? posting.desired_skills.join(", ") : "N/A"}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="cover-letter" className="text-sm font-medium text-slate-900">Cover letter</label>
            <textarea
              id="cover-letter"
              className="w-full min-h-[140px] rounded-lg border p-3 text-sm"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Write a short cover letter (optional)."
              disabled={applied || submitting}
            />
          </div>

          <Button onClick={handleApply} disabled={applied || submitting}>
            {applied ? "Applied" : submitting ? "Applying..." : "Apply"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
