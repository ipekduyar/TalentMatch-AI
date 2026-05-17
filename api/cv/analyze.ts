import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import mammoth from "mammoth";

type AnalysisPayload = {
  extracted_skills: string[];
  strengths: string[];
  weaknesses: string[];
  suggested_roles: string[];
  improvement_suggestions: string[];
  overall_score: number;
};

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const ensureStringArray = (input: unknown, fieldName: string): string[] => {
  if (!Array.isArray(input) || input.some((item) => typeof item !== "string")) {
    throw new Error(`Invalid AI output: ${fieldName} must be an array of strings.`);
  }

  return input.map((item) => item.trim()).filter(Boolean);
};

const parseStrictAnalysisJson = (raw: string): AnalysisPayload => {
  const normalized = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(normalized) as Record<string, unknown>;
  } catch {
    throw new Error("Failed to parse AI response as strict JSON.");
  }

  const overallScore = Number(parsed.overall_score);
  if (!Number.isFinite(overallScore) || overallScore < 0 || overallScore > 100) {
    throw new Error("Invalid AI output: overall_score must be a number between 0 and 100.");
  }

  return {
    extracted_skills: ensureStringArray(parsed.extracted_skills, "extracted_skills"),
    strengths: ensureStringArray(parsed.strengths, "strengths"),
    weaknesses: ensureStringArray(parsed.weaknesses, "weaknesses"),
    suggested_roles: ensureStringArray(parsed.suggested_roles, "suggested_roles"),
    improvement_suggestions: ensureStringArray(parsed.improvement_suggestions, "improvement_suggestions"),
    overall_score: overallScore,
  };
};


const ensurePdfNodePolyfills = async (): Promise<void> => {
  try {
    const canvasModule = await import("@napi-rs/canvas");
    const candidates: Array<["DOMMatrix" | "ImageData" | "Path2D", unknown]> = [
      ["DOMMatrix", (canvasModule as { DOMMatrix?: unknown }).DOMMatrix],
      ["ImageData", (canvasModule as { ImageData?: unknown }).ImageData],
      ["Path2D", (canvasModule as { Path2D?: unknown }).Path2D],
    ];

    for (const [key, value] of candidates) {
      if (typeof value !== "undefined" && typeof globalThis[key] === "undefined") {
        (globalThis as Record<string, unknown>)[key] = value;
      }
    }

    if (typeof globalThis.DOMMatrix === "undefined") {
      throw new Error("Missing DOMMatrix polyfill");
    }
  } catch {
    throw new Error("PDF parsing is not available on this server. Please upload a DOCX file or try again later.");
  }
};

const extractCvText = async (fileName: string, mimeType: string | null, buffer: Buffer): Promise<string> => {
  const lowerName = fileName.toLowerCase();

  if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
    await ensurePdfNodePolyfills();
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy?.();
    return parsed.text?.trim() ?? "";
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".docx")
  ) {
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value?.trim() ?? "";
  }

  if (mimeType === "application/msword" || lowerName.endsWith(".doc")) {
    throw new Error("DOC files are not supported for AI analysis yet. Please upload PDF or DOCX.");
  }

  throw new Error("Unsupported CV file type. Please upload PDF or DOCX.");
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  const { documentId } = (req.body ?? {}) as { documentId?: string };

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization header is required." });
  }

  if (!documentId || typeof documentId !== "string") {
    return res.status(400).json({ error: "documentId is required." });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: "Supabase environment variables are missing." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not set." });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  let studentId = "";

  const persistCvAnalysisReport = async (reportPayload: Record<string, unknown>) => {
    const { data: existingReport, error: reportLookupError } = await supabase
      .from("cv_analysis_reports")
      .select("analysis_id")
      .eq("document_id", documentId)
      .eq("student_id", studentId)
      .maybeSingle();

    if (reportLookupError) {
      throw new Error(reportLookupError.message);
    }

    if (existingReport?.analysis_id) {
      const { error: updateError } = await supabase
        .from("cv_analysis_reports")
        .update(reportPayload)
        .eq("analysis_id", existingReport.analysis_id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      return;
    }

    const { error: insertError } = await supabase.from("cv_analysis_reports").insert(reportPayload);
    if (insertError) {
      throw new Error(insertError.message);
    }
  };

  const markFailure = async (message: string) => {
    if (!studentId) {
      return;
    }

    const failurePayload = {
      document_id: documentId,
      student_id: studentId,
      analysis_status: "failed",
      error_message: message,
    };

    try {
      await persistCvAnalysisReport(failurePayload);

      const { error: documentUpdateError } = await supabase
        .from("student_documents")
        .update({ upload_status: "failed" })
        .eq("document_id", documentId)
        .eq("student_id", studentId);

      if (documentUpdateError) {
        throw new Error(documentUpdateError.message);
      }
    } catch (persistError) {
      console.error("Failed to persist CV analysis failure state", persistError);
    }
  };

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error(userError.message);
    if (!userData.user) throw new Error("Unauthorized user.");

    const { data: person, error: personError } = await supabase
      .from("persons")
      .select("person_id")
      .eq("auth_user_id", userData.user.id)
      .maybeSingle();

    if (personError) throw new Error(personError.message);
    if (!person?.person_id) throw new Error("No person profile found for authenticated user.");

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("student_id")
      .eq("person_id", person.person_id)
      .maybeSingle();

    if (studentError) throw new Error(studentError.message);
    if (!student?.student_id) throw new Error("No student profile found for authenticated user.");

    studentId = student.student_id;

    const { data: documentRow, error: documentError } = await supabase
      .from("student_documents")
      .select("document_id, student_id, file_path, file_name, mime_type")
      .eq("document_id", documentId)
      .eq("student_id", studentId)
      .maybeSingle();

    if (documentError) throw new Error(documentError.message);
    if (!documentRow) throw new Error("Document not found for this student.");

    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("student-cvs")
      .download(documentRow.file_path);

    if (downloadError || !fileBlob) {
      throw new Error(downloadError?.message || "Unable to download CV from storage.");
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    const extractedText = await extractCvText(
      documentRow.file_name || documentRow.file_path,
      documentRow.mime_type,
      Buffer.from(arrayBuffer)
    );

    if (!extractedText.trim()) {
      throw new Error("No readable text could be extracted from the CV.");
    }

    const prompt = `You are a strict JSON API. Analyze the CV text below and return JSON only with this exact shape and keys:\n{
  "extracted_skills": string[],
  "strengths": string[],
  "weaknesses": string[],
  "suggested_roles": string[],
  "improvement_suggestions": string[],
  "overall_score": number
}\nDo not include markdown, prose, or code fences. CV text:\n${extractedText}`;

    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await genAI.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const rawText = response.text?.trim();
    if (!rawText) {
      throw new Error("AI returned an empty response.");
    }

    const parsed = parseStrictAnalysisJson(rawText);

    const reportPayload = {
      document_id: documentId,
      student_id: studentId,
      extracted_text: extractedText,
      extracted_skills: parsed.extracted_skills,
      strengths: parsed.strengths,
      weaknesses: parsed.weaknesses,
      suggested_roles: parsed.suggested_roles,
      improvement_suggestions: parsed.improvement_suggestions,
      overall_score: parsed.overall_score,
      analysis_status: "completed",
      error_message: null,
    };

    try {
      await persistCvAnalysisReport(reportPayload);
    } catch (persistError) {
      console.error("Failed to persist CV analysis success state", persistError);
      throw persistError;
    }

    const { error: docUpdateError } = await supabase
      .from("student_documents")
      .update({ upload_status: "analyzed" })
      .eq("document_id", documentId)
      .eq("student_id", studentId);

    if (docUpdateError) throw new Error(docUpdateError.message);

    return res.status(200).json(reportPayload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("CV analyze failed", error);
    await markFailure(message);
    return res.status(500).json({ error: message });
  }
}
