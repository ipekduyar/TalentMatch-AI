import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { AIThinking } from "@/components/ai-thinking";
import { formatCvFileSize } from "@/lib/mock-cv-storage";
import { getStoredCvMetadata, removeStoredCvMetadata, uploadStudentCv, type CvUploadStatus } from "@/lib/cv-upload-service";
import { analyzeCv, type CvAnalysisResult } from "@/lib/cv-analysis-service";
import { supabase } from "@/lib/supabase";

const DEPARTMENT_OPTIONS = ["Chemical Engineering","Mechanical Engineering","Electrical/Electronics Engineering","Computer Engineering","Industrial Engineering","Civil Engineering","Environmental Engineering","Biomedical Engineering","Materials/Metallurgical Engineering","Aerospace/Aeronautical Engineering","Mechatronics/Robotics","Management Engineering","Business Administration","Economics","Finance","Accounting","Marketing","Psychology","Human Resources","Law","Political Science","International Relations","Education","Guidance and Psychological Counseling","Communication","Journalism","Translation/Interpretation","Architecture","Interior Architecture","Design/UX","Nursing","Medicine/Health Sciences","Biology/Biotechnology","General / Other"];

const getDepartmentCareerGoals = (department: string) => {
  const value = department.toLowerCase();
  if (value.includes("chemical")) return ["R&D Intern", "Process Engineering Intern", "Quality Control Intern", "Laboratory Intern", "Production Intern"];
  if (value.includes("computer") || value.includes("software")) return ["Software Developer Intern", "Frontend Intern", "Backend Intern", "Data/AI Intern", "QA Intern"];
  if (value.includes("psychology") || value.includes("human resources")) return ["HR Intern", "Recruitment Intern", "Organizational Psychology Intern", "Research Intern", "People Analytics Intern"];
  if (value.includes("law") || value.includes("international relations") || value.includes("political")) return ["Legal Intern", "Compliance Intern", "Policy Research Intern", "International Relations Intern", "Public Affairs Intern"];
  if (value.includes("education") || value.includes("guidance")) return ["Teaching Intern", "Instructional Design Intern", "Guidance Intern", "Education Technology Intern"];
  if (value.includes("finance") || value.includes("economics") || value.includes("accounting")) return ["Finance Intern", "Financial Analyst Intern", "Risk Intern", "Accounting Intern", "Investment Research Intern"];
  if (value.includes("marketing") || value.includes("communication") || value.includes("journalism")) return ["Marketing Intern", "Brand Intern", "Social Media Intern", "Communications Intern", "Content Strategy Intern"];
  if (value.includes("design") || value.includes("architecture") || value.includes("interior")) return ["UX Intern", "UI Intern", "Product Design Intern", "Graphic Design Intern", "Visual Design Intern"];
  return ["Operations Intern", "Research Intern", "Project Intern", "Business Analyst Intern", "Program Management Intern"];
};

export const OnboardingPage = () => {
  const [step, setStep] = useState(1);
  const [isParsing, setIsParsing] = useState(false);
  const [cvMetadata, setCvMetadata] = useState(() => getStoredCvMetadata());
  const [uploadStatus, setUploadStatus] = useState<CvUploadStatus>(cvMetadata ? "uploaded" : "idle");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<CvAnalysisResult | null>(null);
  const [skillLevels, setSkillLevels] = useState<Record<string, number>>({});
  const [selectedCareerGoal, setSelectedCareerGoal] = useState<string | null>(null);
  const [savingAcademic, setSavingAcademic] = useState(false);
  const [academicInfo, setAcademicInfo] = useState({ university: "", department: "", studentNumber: "", academicYear: "", gpa: "" });
  const navigate = useNavigate();

  const step3Skills = useMemo(() => analysisResult?.extracted_skills?.filter((s) => s.trim().length > 0).slice(0, 8) ?? [], [analysisResult]);
  const step4CareerGoals = useMemo(() => {
    const suggestedRoles = analysisResult?.suggested_roles?.filter((role) => role.trim().length > 0) ?? [];
    if (suggestedRoles.length > 0) return suggestedRoles.slice(0, 8);
    return getDepartmentCareerGoals(academicInfo.department).slice(0, 8);
  }, [analysisResult, academicInfo.department]);
  const uploadTimestamp = useMemo(() => (cvMetadata ? new Date(cvMetadata.uploadedAtIso).toLocaleString() : ""), [cvMetadata]);

  useEffect(() => {
    const loadStudentProfile = async () => {
      if (!supabase) return;
      const { data: authData } = await supabase.auth.getUser();
      const authUserId = authData.user?.id;
      if (!authUserId) return;
      const { data: person } = await supabase.from("persons").select("person_id").eq("auth_user_id", authUserId).maybeSingle();
      if (!person?.person_id) return;
      const { data } = await supabase.from("students").select("university, department, student_number, academic_year, gpa, career_goal").eq("person_id", person.person_id).maybeSingle();
      if (!data) return;
      setAcademicInfo({ university: data.university ?? "", department: data.department ?? "", studentNumber: data.student_number ?? "", academicYear: data.academic_year ? String(data.academic_year) : "", gpa: typeof data.gpa === "number" ? String(data.gpa) : "" });
      if (data.career_goal) setSelectedCareerGoal(data.career_goal);
    };
    loadStudentProfile();
  }, []);

  useEffect(() => {
    setSkillLevels((currentLevels) => {
      const nextLevels = { ...currentLevels };
      let changed = false;
      step3Skills.forEach((skill) => { if (!nextLevels[skill]) { nextLevels[skill] = 3; changed = true; } });
      return changed ? nextLevels : currentLevels;
    });
  }, [step3Skills]);

  const refreshLatestDocumentId = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("student_documents").select("document_id").order("created_at", { ascending: false }).limit(1);
    if (!error && data?.[0]?.document_id) setDocumentId(data[0].document_id);
  };

  const handleCvFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCvMetadata({ fileName: file.name, fileSizeBytes: file.size, uploadedAtIso: new Date().toISOString() });
    setUploadStatus("uploading");
    setAnalysisResult(null);
    setAnalysisError(null);
    setSelectedCareerGoal(null);
    setSkillLevels({});
    setDocumentId(null);
    try {
      const result = await uploadStudentCv(file);
      setCvMetadata({ fileName: result.fileName, fileSizeBytes: result.fileSizeBytes, uploadedAtIso: result.uploadedAtIso });
      setUploadStatus("uploaded");
      if (result.documentId) setDocumentId(result.documentId); else await refreshLatestDocumentId();
      toast.success("CV uploaded successfully");
    } catch (error) {
      setUploadStatus("failed");
      const message = error instanceof Error ? error.message : String(error);
      setAnalysisError(message);
      toast.error(message);
    } finally { event.target.value = ""; }
  };

  const handleRemoveCv = () => { removeStoredCvMetadata(); setUploadStatus("idle"); setCvMetadata(null); setDocumentId(null); setAnalysisResult(null); setAnalysisError(null); setSelectedCareerGoal(null); setSkillLevels({}); toast.success("CV removed"); };

  const handleAnalyzeCv = async () => {
    if (!documentId) { setAnalysisError("No uploaded CV document found to analyze."); return; }
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const result = await analyzeCv(documentId);
      setAnalysisResult(result);
      setSelectedCareerGoal(null);
      const extractedSkills = result.extracted_skills?.filter((skill) => skill.trim().length > 0) ?? [];
      setSkillLevels(extractedSkills.reduce<Record<string, number>>((acc, skill) => { acc[skill] = 3; return acc; }, {}));
      setUploadStatus("uploaded");
      toast.success("CV analysis completed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setAnalysisError(message);
      toast.error(message);
    } finally { setAnalysisLoading(false); }
  };

  const saveAcademicInfo = async () => {
    if (!supabase) return true;
    const { data: authData } = await supabase.auth.getUser();
    const authUserId = authData.user?.id;
    if (!authUserId) return false;

    const { data: person } = await supabase
      .from("persons")
      .select("person_id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (!person?.person_id) {
      toast.error("Student profile could not be found.");
      return false;
    }

    const gpaNumber = academicInfo.gpa.trim() ? Number(academicInfo.gpa) : null;
    const { data: updatedStudent, error } = await supabase
      .from("students")
      .update({
        university: academicInfo.university.trim(),
        department: academicInfo.department.trim(),
        student_number: academicInfo.studentNumber.trim() || null,
        academic_year: Number(academicInfo.academicYear),
        gpa: Number.isFinite(gpaNumber as number) ? gpaNumber : null,
        updated_at: new Date().toISOString(),
      })
      .eq("person_id", person.person_id)
      .select("person_id")
      .maybeSingle();

    if (error) {
      toast.error(error.message);
      return false;
    }

    if (!updatedStudent) {
      toast.error("Student record could not be updated.");
      return false;
    }

    return true;
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!academicInfo.university.trim() || !academicInfo.department.trim() || !academicInfo.academicYear.trim()) { toast.error("University, department, and academic year are required."); return; }
      if (academicInfo.gpa.trim()) { const gpaValue = Number(academicInfo.gpa); if (Number.isNaN(gpaValue) || gpaValue < 0 || gpaValue > 4) { toast.error("GPA must be between 0 and 4."); return; } }
      setSavingAcademic(true);
      const saved = await saveAcademicInfo();
      setSavingAcademic(false);
      if (!saved) return;
      setStep(2);
      return;
    }
    if (step === 2) { setIsParsing(true); setTimeout(() => { setIsParsing(false); setStep(3); }, 3000); return; }
    if (step === 4) {
      if (!selectedCareerGoal) { toast.error("Please select a career goal to continue."); return; }
      if (supabase) {
        const { data: authData } = await supabase.auth.getUser();
        const authUserId = authData.user?.id;
        if (authUserId) {
          const { data: person } = await supabase.from("persons").select("person_id").eq("auth_user_id", authUserId).maybeSingle();
          if (person?.person_id) {
            await supabase.from("students").update({ career_goal: selectedCareerGoal, updated_at: new Date().toISOString() }).eq("person_id", person.person_id);
          }
        }
      }
      toast.success("Profile completed!");
      navigate('/dashboard');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);
  const uploadStatusText = useMemo(() => uploadStatus === "uploading" ? "Uploading..." : uploadStatus === "uploaded" ? "Uploaded" : uploadStatus === "failed" ? "Upload failed" : "Ready", [uploadStatus]);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="mb-12"><div className="flex items-center justify-between mb-4">{[1, 2, 3, 4].map((s) => (<div key={s} className={`flex-1 h-2 rounded-full mx-1 transition-all ${s <= step ? 'bg-blue-600' : 'bg-slate-200'}`}></div>))}</div><p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Step {step} of 4</p></div>
      <AnimatePresence mode="wait">
        {isParsing ? <motion.div key="parsing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><AIThinking message="Scanning your CV to extract skills and match them to our taxonomy..." /></motion.div> :
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            {step === 1 && <div className="space-y-6"><div className="text-center space-y-2"><h1 className="text-3xl font-bold text-slate-900">Academic Background</h1><p className="text-slate-500">Tell us where you are studying and what you've achieved.</p></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><label className="text-sm font-semibold">University *</label><Input value={academicInfo.university} onChange={(e) => setAcademicInfo((p) => ({ ...p, university: e.target.value }))} placeholder="Istanbul Technical University" /></div><div className="space-y-2"><label className="text-sm font-semibold">Department *</label><Input value={academicInfo.department} list="department-options" onChange={(e) => setAcademicInfo((p) => ({ ...p, department: e.target.value }))} placeholder="Industrial Engineering" /><datalist id="department-options">{DEPARTMENT_OPTIONS.map((option) => <option key={option} value={option} />)}</datalist></div><div className="space-y-2"><label className="text-sm font-semibold">Academic Year *</label><select value={academicInfo.academicYear} onChange={(e) => setAcademicInfo((p) => ({ ...p, academicYear: e.target.value }))} className="w-full p-2 border rounded-md"><option value="">Select year</option><option value="1">Year 1</option><option value="2">Year 2</option><option value="3">Year 3</option><option value="4">Year 4</option><option value="5">Year 5+</option></select></div><div className="space-y-2"><label className="text-sm font-semibold">GPA (optional)</label><Input value={academicInfo.gpa} onChange={(e) => setAcademicInfo((p) => ({ ...p, gpa: e.target.value }))} placeholder="3.50" type="number" min="0" max="4" step="0.01" /></div><div className="space-y-2 md:col-span-2"><label className="text-sm font-semibold">Student Number (optional)</label><Input value={academicInfo.studentNumber} onChange={(e) => setAcademicInfo((p) => ({ ...p, studentNumber: e.target.value }))} placeholder="Student number" /></div></div></div>}
            {step === 2 && <div className="space-y-6"><div className="text-center space-y-2"><h1 className="text-3xl font-bold text-slate-900">Upload your CV</h1><p className="text-slate-500">Our AI will automatically extract your skills to build your profile.</p></div><label className="block border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group"><input type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={handleCvFileChange} /><div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform"><Upload className="w-8 h-8 text-blue-600" /></div><h3 className="font-bold text-lg">{cvMetadata ? "Replace your CV" : "Click or drag PDF here"}</h3><p className="text-sm text-slate-400">PDF up to 10MB</p></label>{cvMetadata && <Card className="border-blue-100"><CardContent className="pt-6 space-y-3 text-sm"><p><span className="font-semibold">File:</span> {cvMetadata.fileName}</p><p><span className="font-semibold">Size:</span> {formatCvFileSize(cvMetadata.fileSizeBytes)}</p><p><span className="font-semibold">Selected:</span> {uploadTimestamp}</p><p><span className="font-semibold">Status:</span> {uploadStatusText}</p><div><p className="font-semibold mb-2">Parsed skills summary:</p>{analysisResult?.extracted_skills?.length ? <div className="flex flex-wrap gap-2">{analysisResult.extracted_skills.map((skill) => <span key={skill} className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">{skill}</span>)}</div> : <p className="text-slate-500">Analyze your CV to verify extracted skills.</p>}</div>{uploadStatus === "uploaded" && documentId && <Button type="button" onClick={handleAnalyzeCv} disabled={analysisLoading}>{analysisLoading ? "Analyzing CV..." : "Analyze CV"}</Button>}{analysisError && <p className="text-sm text-red-600">{analysisError}</p>}<Button type="button" variant="outline" onClick={handleRemoveCv}>Remove CV</Button></CardContent></Card>}</div>}
            {step === 3 && <div className="space-y-6"><div className="text-center space-y-2"><h1 className="text-3xl font-bold text-slate-900">Verify your skills</h1><p className="text-slate-500">{step3Skills.length > 0 ? `We found ${step3Skills.length} skills in your CV. Adjust your proficiency levels.` : "Analyze your CV to verify extracted skills."}</p></div><div className="space-y-4">{step3Skills.map((skill) => <div key={skill} className="p-4 border rounded-xl flex items-center justify-between"><span className="font-bold">{skill}</span><div className="flex items-center space-x-2">{[1,2,3,4,5].map(i => <button type="button" key={i} onClick={() => setSkillLevels((prev) => ({ ...prev, [skill]: i }))} className={`w-3 h-3 rounded-full transition-colors ${i <= (skillLevels[skill] ?? 3) ? 'bg-blue-600' : 'bg-slate-100'}`}></button>)}</div></div>)}</div></div>}
            {step === 4 && <div className="space-y-6"><div className="text-center space-y-2"><h1 className="text-3xl font-bold text-slate-900">Your career goal</h1><p className="text-slate-500">{analysisResult ? "Based on your CV, these internship tracks may fit you." : "Suggestions based on your department and profile."}</p></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{step4CareerGoals.map((goal) => <button type="button" key={goal} onClick={() => setSelectedCareerGoal(goal)} className={`p-6 border rounded-2xl text-left transition-all active:scale-95 ${selectedCareerGoal === goal ? "border-blue-600 bg-blue-50" : "hover:border-blue-600 hover:bg-blue-50"}`}><p className="font-bold text-slate-900">{goal}</p></button>)}</div></div>}
            <div className="flex items-center justify-between pt-8 border-t"><Button variant="ghost" onClick={handleBack} className={step === 1 ? 'invisible' : ''}><ChevronLeft className="w-4 h-4 mr-2" /> Back</Button><Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 px-8" disabled={(step===1&&savingAcademic)||(step===2&&uploadStatus==="uploading")||(step===4&&!selectedCareerGoal)}>{step === 4 ? 'Finish' : 'Continue'} <ChevronRight className="w-4 h-4 ml-2" /></Button></div>
          </motion.div>}
      </AnimatePresence>
    </div>
  );
};
