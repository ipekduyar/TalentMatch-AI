import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SKILLS } from "@/lib/mock-data";
import { useCurrentUser } from "@/lib/auth-context";
import { addCompanyPosting } from "@/lib/mock-postings-storage";
import { InternshipPosting } from "@/lib/types";

export const CompanyPostingsNewPage = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [industry, setIndustry] = useState("");
  const [startDate, setStartDate] = useState("");
  const [durationWeeks, setDurationWeeks] = useState("12");
  const [isPaid, setIsPaid] = useState(true);
  const [monthlyStipend, setMonthlyStipend] = useState("12000");
  const [isRemote, setIsRemote] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [desiredSkills, setDesiredSkills] = useState<string[]>([]);
  const [importanceScore, setImportanceScore] = useState("75");
  const [requiredLevel, setRequiredLevel] = useState("intermediate");

  const navigate = useNavigate();
  const { company, rep } = useCurrentUser();

  const buildPosting = (status: "draft" | "pending_review"): InternshipPosting | null => {
    if (!company?.company_id) {
      toast.error("No company profile found for this account.");
      return null;
    }

    return {
      posting_id: `post_local_${Date.now()}`,
      company_id: company.company_id,
      rep_id: rep?.rep_id ?? "rep_unknown",
      title: title || "Untitled Posting",
      description,
      location,
      industry,
      start_date: startDate || new Date().toISOString().slice(0, 10),
      duration_weeks: Number(durationWeeks) || 12,
      is_paid: isPaid,
      monthly_stipend_try: isPaid ? Number(monthlyStipend) || 0 : null,
      is_remote: isRemote,
      status,
      created_at: new Date().toISOString(),
      deadline: deadline || new Date().toISOString().slice(0, 10),
    };
  };

  const toggleRequiredSkill = (skillId: string) => {
    setRequiredSkills((prev) => (prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]));
  };

  const toggleDesiredSkill = (skillId: string) => {
    setDesiredSkills((prev) => (prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]));
  };

  const saveDraft = () => {
    const posting = buildPosting("draft");
    if (!posting) {
      return;
    }

    addCompanyPosting(posting);
    toast.success(`Draft saved: ${posting.title}`);
    navigate("/company/postings");
  };

  const submitForReview = () => {
    const posting = buildPosting("pending_review");
    if (!posting) {
      return;
    }

    addCompanyPosting(posting);
    toast.success(`Submitted for review: ${posting.title}`);
    navigate("/company/postings");
  };

  const previewPosting = () => {
    toast.success(`Preview ready for: ${title || "Untitled Posting"}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Create New Posting</h1>
          <p className="text-slate-500">Build a complete internship posting and prepare it for review.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/company/postings">Back to Postings</Link>
        </Button>
      </div>

      <Card className="bg-white rounded-xl">
        <CardHeader>
          <CardTitle className="text-slate-900">Posting Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Title</label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Internship title" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Location</label>
              <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City or region" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-32 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              placeholder="Describe responsibilities, expectations, and project scope"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Industry</label>
              <Input value={industry} onChange={(event) => setIndustry(event.target.value)} placeholder="Industry" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Start Date</label>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Duration Weeks</label>
              <Input type="number" min={1} value={durationWeeks} onChange={(event) => setDurationWeeks(event.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Paid / Unpaid</label>
              <div className="flex gap-2">
                <Button type="button" variant={isPaid ? "default" : "outline"} className={isPaid ? "bg-blue-600 hover:bg-blue-700 text-white" : ""} onClick={() => setIsPaid(true)}>Paid</Button>
                <Button type="button" variant={!isPaid ? "default" : "outline"} className={!isPaid ? "bg-blue-600 hover:bg-blue-700 text-white" : ""} onClick={() => setIsPaid(false)}>Unpaid</Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Remote / On-site</label>
              <div className="flex gap-2">
                <Button type="button" variant={isRemote ? "default" : "outline"} className={isRemote ? "bg-blue-600 hover:bg-blue-700 text-white" : ""} onClick={() => setIsRemote(true)}>Remote</Button>
                <Button type="button" variant={!isRemote ? "default" : "outline"} className={!isRemote ? "bg-blue-600 hover:bg-blue-700 text-white" : ""} onClick={() => setIsRemote(false)}>On-site</Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Monthly Stipend (TRY)</label>
              <Input type="number" min={0} value={monthlyStipend} onChange={(event) => setMonthlyStipend(event.target.value)} disabled={!isPaid} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Deadline</label>
              <Input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Importance Score</label>
              <Input type="number" min={0} max={100} value={importanceScore} onChange={(event) => setImportanceScore(event.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Required Level</label>
            <select
              value={requiredLevel}
              onChange={(event) => setRequiredLevel(event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Required Skills</label>
              <div className="flex flex-wrap gap-2 rounded-md border border-slate-200 p-3">
                {SKILLS.map((skill) => (
                  <Button
                    key={`required-${skill.skill_id}`}
                    type="button"
                    size="sm"
                    variant={requiredSkills.includes(skill.skill_id) ? "default" : "outline"}
                    className={requiredSkills.includes(skill.skill_id) ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                    onClick={() => toggleRequiredSkill(skill.skill_id)}
                  >
                    {skill.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Desired Skills</label>
              <div className="flex flex-wrap gap-2 rounded-md border border-slate-200 p-3">
                {SKILLS.map((skill) => (
                  <Button
                    key={`desired-${skill.skill_id}`}
                    type="button"
                    size="sm"
                    variant={desiredSkills.includes(skill.skill_id) ? "default" : "outline"}
                    className={desiredSkills.includes(skill.skill_id) ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                    onClick={() => toggleDesiredSkill(skill.skill_id)}
                  >
                    {skill.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" variant="outline" onClick={saveDraft}>Save as Draft</Button>
            <Button type="button" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={submitForReview}>Submit for Review</Button>
            <Button type="button" variant="outline" onClick={previewPosting}>Preview Posting</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
