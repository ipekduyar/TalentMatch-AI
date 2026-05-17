import { supabase } from "@/lib/supabase";

export type CvAnalysisResult = {
  extracted_skills: string[];
  strengths: string[];
  weaknesses: string[];
  suggested_roles: string[];
  improvement_suggestions: string[];
  overall_score: number;
  analysis_status?: string;
};

export const analyzeCv = async (documentId: string): Promise<CvAnalysisResult> => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error("You must be logged in to analyze CV.");
  }

  const response = await fetch("/api/cv/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ documentId }),
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    const errorMessage = typeof payload.error === "string" ? payload.error : "CV analysis failed";
    throw new Error(errorMessage);
  }

  return payload as CvAnalysisResult;
};
