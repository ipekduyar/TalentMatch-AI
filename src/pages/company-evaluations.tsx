import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APPLICATIONS, STUDENTS } from "@/lib/mock-data";

type EvalTab = "pending" | "submitted" | "completed";

type EvaluationCard = {
  id: string;
  studentId: string;
  status: EvalTab;
  technical: number;
  communication: number;
  professionalism: number;
  comments: string;
  visibility: "anonymous" | "public";
};

export const CompanyEvaluationsPage = () => {
  const [activeTab, setActiveTab] = useState<EvalTab>("pending");
  const [cards, setCards] = useState<EvaluationCard[]>([
    { id: "ev1", studentId: "st1", status: "pending", technical: 78, communication: 82, professionalism: 85, comments: "Learns quickly and asks strong product questions.", visibility: "public" },
    { id: "ev2", studentId: "st2", status: "submitted", technical: 88, communication: 74, professionalism: 80, comments: "Very strong analytics execution with solid ownership.", visibility: "anonymous" },
    { id: "ev3", studentId: "st1", status: "completed", technical: 84, communication: 86, professionalism: 90, comments: "Consistently reliable and collaborative in team sprints.", visibility: "public" },
  ]);
  const [quickStudentId, setQuickStudentId] = useState("st1");
  const [quickTechnical, setQuickTechnical] = useState("80");
  const [quickCommunication, setQuickCommunication] = useState("80");
  const [quickProfessionalism, setQuickProfessionalism] = useState("80");
  const [quickComments, setQuickComments] = useState("");
  const [quickAnonymous, setQuickAnonymous] = useState(false);

  const metrics = useMemo(() => {
    const completedInternships = APPLICATIONS.filter((application) => application.status === "completed").length;
    const pendingEvaluations = cards.filter((card) => card.status === "pending").length;
    const averageOverallScore = cards.length
      ? Math.round(
          cards.reduce((sum, card) => sum + (card.technical + card.communication + card.professionalism) / 3, 0) / cards.length,
        )
      : 0;
    return { completedInternships, pendingEvaluations, averageOverallScore };
  }, [cards]);

  const visibleCards = useMemo(() => cards.filter((card) => card.status === activeTab), [activeTab, cards]);

  const submitQuickEvaluation = () => {
    const newCard: EvaluationCard = {
      id: `ev-${Date.now()}`,
      studentId: quickStudentId,
      status: "submitted",
      technical: Number(quickTechnical),
      communication: Number(quickCommunication),
      professionalism: Number(quickProfessionalism),
      comments: quickComments || "Submitted via quick evaluation form.",
      visibility: quickAnonymous ? "anonymous" : "public",
    };
    setCards((prev) => [newCard, ...prev]);
    toast.success("Evaluation submitted successfully.");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Evaluations</h1>
        <p className="text-slate-500">Review intern performance and submit structured evaluation scorecards.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Completed Internships</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">{metrics.completedInternships}</p></CardContent></Card>
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Pending Evaluations</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">{metrics.pendingEvaluations}</p></CardContent></Card>
        <Card className="bg-white rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Average Overall Score</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-slate-900">{metrics.averageOverallScore}/100</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={activeTab === "pending" ? "default" : "outline"} className={activeTab === "pending" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""} onClick={() => setActiveTab("pending")}>Pending</Button>
        <Button variant={activeTab === "submitted" ? "default" : "outline"} className={activeTab === "submitted" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""} onClick={() => setActiveTab("submitted")}>Submitted</Button>
        <Button variant={activeTab === "completed" ? "default" : "outline"} className={activeTab === "completed" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""} onClick={() => setActiveTab("completed")}>Completed</Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          {visibleCards.map((card) => {
            const student = STUDENTS.find((item) => item.student_id === card.studentId);
            const overall = Math.round((card.technical + card.communication + card.professionalism) / 3);
            return (
              <Card key={card.id} className="bg-white rounded-xl">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-slate-900">{student ? `${student.university} • ${student.department}` : "Student Evaluation"}</CardTitle>
                    <Badge variant={card.visibility === "anonymous" ? "secondary" : "default"}>{card.visibility === "anonymous" ? "Anonymous" : "Public"}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <p><span className="font-medium text-slate-900">Technical:</span> {card.technical}</p>
                    <p><span className="font-medium text-slate-900">Communication:</span> {card.communication}</p>
                    <p><span className="font-medium text-slate-900">Professionalism:</span> {card.professionalism}</p>
                    <p><span className="font-medium text-slate-900">Overall:</span> {overall}</p>
                  </div>
                  <p><span className="font-medium text-slate-900">Comments:</span> {card.comments}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-white rounded-xl h-fit">
          <CardHeader><CardTitle className="text-slate-900">Quick Evaluation</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Student</label>
              <select value={quickStudentId} onChange={(event) => setQuickStudentId(event.target.value)} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900">
                {STUDENTS.map((student) => <option key={student.student_id} value={student.student_id}>{student.university} - {student.department}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <label className="text-sm text-slate-700">Technical Skill Score</label>
              <input type="number" min={0} max={100} value={quickTechnical} onChange={(event) => setQuickTechnical(event.target.value)} className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900" />
              <label className="text-sm text-slate-700">Communication Score</label>
              <input type="number" min={0} max={100} value={quickCommunication} onChange={(event) => setQuickCommunication(event.target.value)} className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900" />
              <label className="text-sm text-slate-700">Professionalism Score</label>
              <input type="number" min={0} max={100} value={quickProfessionalism} onChange={(event) => setQuickProfessionalism(event.target.value)} className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Comments</label>
              <textarea value={quickComments} onChange={(event) => setQuickComments(event.target.value)} className="min-h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900" />
            </div>
            <Button type="button" variant={quickAnonymous ? "default" : "outline"} className={quickAnonymous ? "bg-blue-600 hover:bg-blue-700 text-white" : ""} onClick={() => setQuickAnonymous((prev) => !prev)}>
              {quickAnonymous ? "Anonymous" : "Public"}
            </Button>
            <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={submitQuickEvaluation}>Submit Evaluation</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
