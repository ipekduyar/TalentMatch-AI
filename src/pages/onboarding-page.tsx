import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  GraduationCap, 
  Upload, 
  Target, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  FileText,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { AIThinking } from "@/components/ai-thinking";
import { formatCvFileSize } from "@/lib/mock-cv-storage";
import { getStoredCvMetadata, removeStoredCvMetadata, uploadStudentCv, type CvUploadStatus } from "@/lib/cv-upload-service";
import { analyzeCv, type CvAnalysisResult } from "@/lib/cv-analysis-service";
import { supabase } from "@/lib/supabase";

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
  const navigate = useNavigate();
  const step3Skills = useMemo(() => {
    const extractedSkills =
      analysisResult?.extracted_skills?.filter((skill) => skill.trim().length > 0) ?? [];
    return extractedSkills.slice(0, 8);
  }, [analysisResult]);
  const step4CareerGoals = useMemo(() => {
    const suggestedRoles =
      analysisResult?.suggested_roles?.filter((role) => role.trim().length > 0) ?? [];
    if (suggestedRoles.length > 0) {
      return suggestedRoles.slice(0, 6);
    }
    return [
      "Product Management",
      "Data Science",
      "Software Engineering",
      "Marketing",
      "Finance",
      "Supply Chain",
    ].slice(0, 6);
  }, [analysisResult]);
  const uploadTimestamp = useMemo(
    () => (cvMetadata ? new Date(cvMetadata.uploadedAtIso).toLocaleString() : ""),
    [cvMetadata]
  );

  useEffect(() => {
    setSkillLevels((currentLevels) => {
      const nextLevels = { ...currentLevels };
      let changed = false;

      step3Skills.forEach((skill) => {
        if (!nextLevels[skill]) {
          nextLevels[skill] = 3;
          changed = true;
        }
      });

      return changed ? nextLevels : currentLevels;
    });
  }, [step3Skills]);

  const refreshLatestDocumentId = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("student_documents")
      .select("document_id")
      .order("created_at", { ascending: false })
      .limit(1);
    if (!error && data?.[0]?.document_id) {
      setDocumentId(data[0].document_id);
    }
  };

  const handleCvFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("CV file selected", { name: file.name, size: file.size, type: file.type });
    setCvMetadata({
      fileName: file.name,
      fileSizeBytes: file.size,
      uploadedAtIso: new Date().toISOString(),
    });
    setUploadStatus("uploading");
    setAnalysisResult(null);
    setAnalysisError(null);
    setSelectedCareerGoal(null);
    setSkillLevels({});
    setDocumentId(null);

    try {
      const result = await uploadStudentCv(file);
      setCvMetadata({
        fileName: result.fileName,
        fileSizeBytes: result.fileSizeBytes,
        uploadedAtIso: result.uploadedAtIso,
      });
      setUploadStatus("uploaded");
      if (result.documentId) {
        setDocumentId(result.documentId);
      } else {
        await refreshLatestDocumentId();
      }
      toast.success("CV uploaded successfully");
    } catch (error) {
      setUploadStatus("failed");
      const message = error instanceof Error ? error.message : String(error);
      setAnalysisError(message);
      console.error("CV upload failed", error);
      toast.error(message);
    } finally {
      event.target.value = "";
    }
  };

  const handleRemoveCv = () => {
    removeStoredCvMetadata();
    setUploadStatus("idle");
    setCvMetadata(null);
    setDocumentId(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setSelectedCareerGoal(null);
    setSkillLevels({});
    toast.success("CV removed");
  };

  const handleAnalyzeCv = async () => {
    if (!documentId) {
      setAnalysisError("No uploaded CV document found to analyze.");
      return;
    }
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const result = await analyzeCv(documentId);
      setAnalysisResult(result);
      setSelectedCareerGoal(null);
      const extractedSkills = result.extracted_skills?.filter((skill) => skill.trim().length > 0) ?? [];
      setSkillLevels(
        extractedSkills.reduce<Record<string, number>>((acc, skill) => {
          acc[skill] = 3;
          return acc;
        }, {})
      );
      setUploadStatus("uploaded");
      toast.success("CV analysis completed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setAnalysisError(message);
      toast.error(message);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 2) {
      setIsParsing(true);
      setTimeout(() => {
        setIsParsing(false);
        setStep(3);
      }, 3000);
    } else if (step === 4) {
      if (!selectedCareerGoal) {
        toast.error("Please select a career goal to continue.");
        return;
      }
      toast.success("Profile completed!");
      navigate('/dashboard');
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => setStep(step - 1);
  const uploadStatusText = useMemo(() => {
    switch (uploadStatus) {
      case "uploading":
        return "Uploading...";
      case "uploaded":
        return "Uploaded";
      case "failed":
        return "Upload failed";
      case "idle":
      default:
        return "Ready";
    }
  }, [uploadStatus]);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={`flex-1 h-2 rounded-full mx-1 transition-all ${s <= step ? 'bg-blue-600' : 'bg-slate-200'}`}
            ></div>
          ))}
        </div>
        <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Step {step} of 4</p>
      </div>

      <AnimatePresence mode="wait">
        {isParsing ? (
           <motion.div 
             key="parsing"
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
           >
             <AIThinking message="Scanning your CV to extract skills and match them to our taxonomy..." />
           </motion.div>
        ) : (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                   <h1 className="text-3xl font-bold text-slate-900">Academic Background</h1>
                   <p className="text-slate-500">Tell us where you are studying and what you've achieved.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-sm font-semibold">University</label>
                      <Input placeholder="Istanbul Technical University" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-semibold">Department</label>
                      <Input placeholder="Industrial Engineering" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-semibold">Academic Year</label>
                      <select className="w-full p-2 border rounded-md">
                        <option>Year 1</option>
                        <option>Year 2</option>
                        <option>Year 3</option>
                        <option>Year 4</option>
                        <option>Year 5+</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-semibold">GPA</label>
                      <Input placeholder="3.50" type="number" step="0.01" />
                   </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                   <h1 className="text-3xl font-bold text-slate-900">Upload your CV</h1>
                   <p className="text-slate-500">Our AI will automatically extract your skills to build your profile.</p>
                </div>
                <label className="block border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group">
                   <input type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={handleCvFileChange} />
                   <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-blue-600" />
                   </div>
                   <h3 className="font-bold text-lg">{cvMetadata ? "Replace your CV" : "Click or drag PDF here"}</h3>
                   <p className="text-sm text-slate-400">PDF up to 10MB</p>
                </label>
                {cvMetadata && (
                  <Card className="border-blue-100">
                    <CardContent className="pt-6 space-y-3 text-sm">
                      <p><span className="font-semibold">File:</span> {cvMetadata.fileName}</p>
                      <p><span className="font-semibold">Size:</span> {formatCvFileSize(cvMetadata.fileSizeBytes)}</p>
                      <p><span className="font-semibold">Selected:</span> {uploadTimestamp}</p>
                      <p><span className="font-semibold">Status:</span> {uploadStatusText}</p>
                      {uploadStatus === "uploading" && (
                        <p className="text-slate-500">Uploading your CV, please wait...</p>
                      )}
                      <div>
                        <p className="font-semibold mb-2">Parsed skills summary:</p>
                        {analysisResult?.extracted_skills?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.extracted_skills.map((skill) => (
                              <span key={skill} className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">{skill}</span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500">Analyze your CV to extract skills.</p>
                        )}
                      </div>
                      {uploadStatus === "uploaded" && documentId && (
                        <Button type="button" onClick={handleAnalyzeCv} disabled={analysisLoading}>
                          {analysisLoading ? "Analyzing CV..." : "Analyze CV"}
                        </Button>
                      )}
                      {analysisError && <p className="text-sm text-red-600">{analysisError}</p>}
                      {analysisResult && (
                        <div className="space-y-2">
                          <p><span className="font-semibold">Overall score:</span> {analysisResult.overall_score}</p>
                          <p><span className="font-semibold">Extracted skills:</span> {analysisResult.extracted_skills.join(", ")}</p>
                          <p><span className="font-semibold">Strengths:</span> {analysisResult.strengths.join(", ")}</p>
                          <p><span className="font-semibold">Weaknesses:</span> {analysisResult.weaknesses.join(", ")}</p>
                          <p><span className="font-semibold">Suggested roles:</span> {analysisResult.suggested_roles.join(", ")}</p>
                          <p><span className="font-semibold">Improvement suggestions:</span> {analysisResult.improvement_suggestions.join(", ")}</p>
                        </div>
                      )}
                      <Button type="button" variant="outline" onClick={handleRemoveCv}>Remove CV</Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                   <h1 className="text-3xl font-bold text-slate-900">Verify your skills</h1>
                   <p className="text-slate-500">We found {step3Skills.length} skills in your CV. Adjust your proficiency levels.</p>
                </div>
                <div className="space-y-4">
                   {step3Skills.map((skill) => (
                     <div key={skill} className="p-4 border rounded-xl flex items-center justify-between">
                        <span className="font-bold">{skill}</span>
                        <div className="flex items-center space-x-2">
                           {[1,2,3,4,5].map(i => (
                             <button
                               type="button"
                               key={i}
                               onClick={() => setSkillLevels((prev) => ({ ...prev, [skill]: i }))}
                               className={`w-3 h-3 rounded-full transition-colors ${i <= (skillLevels[skill] ?? 3) ? 'bg-blue-600' : 'bg-slate-100'}`}
                               aria-label={`Set ${skill} proficiency to ${i}`}
                             ></button>
                           ))}
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                   <h1 className="text-3xl font-bold text-slate-900">Your career goal</h1>
                   <p className="text-slate-500">
                    {analysisResult
                      ? "Based on your CV, these internship tracks may fit you."
                      : "What kind of internships are you looking for?"}
                   </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {step4CareerGoals.map((goal) => (
                     <button
                       type="button"
                       key={goal}
                       onClick={() => setSelectedCareerGoal(goal)}
                       className={`p-6 border rounded-2xl text-left transition-all active:scale-95 ${
                        selectedCareerGoal === goal
                          ? "border-blue-600 bg-blue-50"
                          : "hover:border-blue-600 hover:bg-blue-50"
                       }`}
                     >
                        <p className="font-bold text-slate-900">{goal}</p>
                     </button>
                   ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-8 border-t">
              <Button 
                variant="ghost" 
                onClick={handleBack} 
                className={step === 1 ? 'invisible' : ''}
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 px-8"
                disabled={(step === 2 && uploadStatus === "uploading") || (step === 4 && !selectedCareerGoal)}
              >
                {step === 4 ? 'Finish' : 'Continue'} <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
