import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SKILLS } from "@/lib/mock-data";
import { toast } from "sonner";

export const CompanyPostingsNewPage = () => {
  const [form, setForm] = useState({ title: "", description: "", location: "Istanbul", industry: "Technology", start_date: "", duration_weeks: 12, is_paid: true, monthly_stipend_try: 12000, is_remote: false, deadline: "", required_level: 3, importance: 4 });
  const [requiredSkills, setRequiredSkills] = useState<string[]>(["Python"]);
  const [desiredSkills, setDesiredSkills] = useState<string[]>(["Communication"]);

  const toggleSkill = (name: string, isRequired: boolean) => {
    const updater = isRequired ? setRequiredSkills : setDesiredSkills;
    const list = isRequired ? requiredSkills : desiredSkills;
    updater(list.includes(name) ? list.filter((s) => s !== name) : [...list, name]);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div><h1 className="text-3xl font-bold text-slate-900">Create New Posting</h1><p className="text-slate-500">Draft a new internship posting.</p></div>
      <Card>
        <CardHeader><CardTitle>Internship Posting Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(form).map(([k,v]) => (typeof v !== "boolean" ? <div key={k}><label className="text-xs text-slate-500 capitalize">{k.replaceAll("_", " ")}</label><Input className="mt-1" value={String(v)} onChange={(e)=>setForm((p)=>({ ...p, [k]: k.includes("weeks") || k.includes("stipend") || k.includes("level") || k.includes("importance") ? Number(e.target.value) : e.target.value }))} /></div> : null))}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <button className={`rounded-lg border p-3 text-left ${form.is_paid ? "border-blue-500 bg-blue-50" : "border-slate-200"}`} onClick={() => setForm((p)=>({ ...p, is_paid: !p.is_paid }))}>Paid / Unpaid: <span className="font-semibold">{form.is_paid ? "Paid" : "Unpaid"}</span></button>
            <button className={`rounded-lg border p-3 text-left ${form.is_remote ? "border-blue-500 bg-blue-50" : "border-slate-200"}`} onClick={() => setForm((p)=>({ ...p, is_remote: !p.is_remote }))}>Remote toggle: <span className="font-semibold">{form.is_remote ? "Remote" : "On-site"}</span></button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <SkillSelect title="Required skills" selected={requiredSkills} onToggle={(s)=>toggleSkill(s,true)} />
            <SkillSelect title="Desired skills" selected={desiredSkills} onToggle={(s)=>toggleSkill(s,false)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={()=>toast.info("Posting preview generated")}>Preview Posting</Button>
            <Button variant="outline" onClick={()=>toast.success("Draft saved locally")}>Save as Draft</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={()=>toast.success("Posting submitted for review")}>Submit for Review</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SkillSelect = ({ title, selected, onToggle }: { title: string; selected: string[]; onToggle: (skill: string) => void }) => (
  <div className="rounded-xl border p-3">
    <p className="text-sm font-medium text-slate-900 mb-2">{title}</p>
    <div className="flex flex-wrap gap-2">{SKILLS.map((skill) => <button key={skill.skill_id} onClick={() => onToggle(skill.name)} className={`px-2 py-1 text-xs rounded-full border ${selected.includes(skill.name) ? "bg-blue-600 text-white border-blue-600" : "border-slate-300 text-slate-600"}`}>{skill.name}</button>)}</div>
  </div>
);
