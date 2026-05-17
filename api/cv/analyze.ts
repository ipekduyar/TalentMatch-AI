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

const stringifyErrorForDetection = (error: unknown): string => {
  if (error instanceof Error) {
    return `${error.name} ${error.message} ${error.stack ?? ""}`;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

const isGeminiQuotaError = (error: unknown): boolean => {
  const message = stringifyErrorForDetection(error).toLowerCase();
  return (
    message.includes("429") ||
    message.includes("resource_exhausted") ||
    message.includes("quota") ||
    message.includes("billing") ||
    message.includes("rate-limit") ||
    message.includes("rate limit")
  );
};

const uniquePush = (items: string[], value: string) => {
  if (!items.some((item) => item.toLowerCase() === value.toLowerCase())) {
    items.push(value);
  }
};

const normalizeText = (input: string): string =>
  ` ${input.toLowerCase().replace(/\s+/g, " ").trim()} `;

type FallbackCategory = {
  name: string;
  skills: string[];
  roles: string[];
};

const buildFallbackAnalysis = (cvText: string): AnalysisPayload => {
  const text = normalizeText(cvText);
  const categories: FallbackCategory[] = [
    { name: "Software", skills: ["React","Vue","Angular","JavaScript","TypeScript","HTML","CSS","Tailwind","Bootstrap","Node.js","Express","Flask","Django","FastAPI","REST API","GraphQL","JWT","OAuth","SQL","PostgreSQL","MySQL","MongoDB","Supabase","Firebase","Prisma","Sequelize","Docker","Kubernetes","Git","GitHub","GitLab","CI/CD","Testing","Debugging","Next.js","Vite","Redux","Zustand"], roles: ["Software Developer Intern","Full-Stack Developer Intern","Backend Developer Intern","Frontend Developer Intern","Web Developer Intern"] },
    { name: "Data/AI", skills: ["Data Analysis","Data Science","Machine Learning","Artificial Intelligence","Deep Learning","Neural Network","Classification","Regression","Clustering","Python","Pandas","NumPy","scikit-learn","TensorFlow","PyTorch","Jupyter","SQL","Power BI","Tableau","Data Visualization","Statistics","EDA","Feature Engineering","NLP","Computer Vision","Prompt Engineering","Generative AI","LLM","Chatbot"], roles: ["Data Analyst Intern","Data Science Intern","AI Intern","Machine Learning Intern","Business Intelligence Intern"] },
    { name: "Chemical", skills: ["Chemical Engineering","Process Engineering","Process Optimization","Thermodynamics","Fluid Mechanics","Heat Transfer","Mass Transfer","Distillation","Extraction","Chromatography","Titration","Laboratory","Experimental Design","Quality Control","Quality Assurance","R&D","Aspen Plus","Aspen HYSYS","MATLAB","Simulink","Process Simulation","Material Balance","Energy Balance","Reactor Design","Sustainability","Renewable Energy","Hydrogen","Battery","Electrochemistry","Polymer","Nanotechnology","Pharmaceutical Formulation"], roles: ["R&D Intern","Process Engineering Intern","Quality Control Intern","Laboratory Intern","Sustainability Intern","Production Intern"] },
    { name: "Industrial/Operations", skills: ["Industrial Engineering","Operations Research","Optimization","Linear Programming","Integer Programming","Simulation","Supply Chain","Production Planning","Scheduling","Inventory","Forecasting","Process Improvement","Lean","Six Sigma","Kaizen","KPI","Excel Solver","Python","MATLAB","Gurobi","CPLEX","Arena"], roles: ["Operations Intern","Industrial Engineering Intern","Process Improvement Intern","Planning Intern","Business Analyst Intern"] },
    { name: "Business/Strategy", skills: ["Management","Business Administration","Business Analysis","Business Development","Strategy","Market Analysis","Product Management","Product Owner","Roadmap","User Research","Stakeholder Management","Presentation","Reporting","KPI","OKR","Excel","PowerPoint","Project Management","Agile","Scrum","Entrepreneurship","Innovation","Consulting"], roles: ["Business Analyst Intern","Product Management Intern","Strategy Intern","Project Management Intern","Business Development Intern"] },
  ];
  const matchMap: Record<string, string[]> = {
    "Software":[ "software","software engineering","computer engineering","web development","full-stack","full stack","frontend","front-end","backend","back-end","developer","programming","coding","application development","web application","mobile application","react","vue","angular","javascript","typescript","html","css","tailwind","bootstrap","node.js","express","flask","django","fastapi","rest api","graphql","api integration","authentication","authorization","jwt","oauth","sql","postgresql","mysql","mongodb","supabase","firebase","prisma","sequelize","docker","kubernetes","git","github","gitlab","ci/cd","testing","unit testing","debugging","clean code","responsive design","ui","ux","next.js","vite","redux","zustand"],
    "Data/AI":[ "data analysis","data analytics","data science","machine learning","artificial intelligence"," ai "," ml ","deep learning","neural network","classification","regression","clustering","predictive modeling","model evaluation","python","pandas","numpy","scikit-learn","tensorflow","pytorch","jupyter","sql","power bi","tableau","data visualization","dashboard","statistics","statistical analysis","eda","exploratory data analysis","data preprocessing","feature engineering","nlp","computer vision","prompt engineering","generative ai","llm","chatbot","recommendation system"],
    "Chemical":[ "chemical engineering","chemistry","process engineering","process design","process optimization","reaction engineering","thermodynamics","fluid mechanics","heat transfer","mass transfer","separation processes","distillation","steam distillation","azeotropic distillation","extraction","absorption","adsorption","chromatography","tlc","titration","organic chemistry","physical chemistry","analytical chemistry","laboratory"," lab ","experiment","experimental design","sample preparation","safety","msds","quality control","quality assurance","r&d","research and development","aspen","aspen plus","aspen hysys","matlab","simulink","process simulation","material balance","energy balance","reactor","cstr","pfr","batch reactor","sustainability","renewable energy","hydrogen","battery","electrochemistry","aluminum-air battery","iodine clock","polymer","nanotechnology","pharmaceutical","pharma","formulation","kimya mühendisliği","proses","laboratuvar","deney","damıtma","distilasyon","ekstraksiyon","kalite kontrol","ar-ge","sürdürülebilirlik","enerji"],
    "Industrial/Operations":[ "industrial engineering","operations research","optimization","linear programming","integer programming","simplex","simulation","supply chain","production planning","scheduling","inventory","forecasting","demand planning","process improvement","lean","six sigma","kaizen","continuous improvement","efficiency","kpi","operations","workflow","system analysis","decision making","data-driven","excel solver","python","matlab","gurobi","cplex","arena","discrete event simulation","endüstri mühendisliği","optimizasyon","üretim planlama","çizelgeleme","stok","tahminleme","yalın üretim","süreç iyileştirme"],
    "Business/Strategy":[ "management","business administration","business analysis","business development","strategy","strategic planning","market analysis","competitor analysis","product management","product owner","roadmap","user research","customer journey","stakeholder management","presentation","reporting","kpi","okr","excel","powerpoint","project management","agile","scrum","coordination","planning","entrepreneurship","startup","innovation","consulting","problem solving","işletme","yönetim","strateji","ürün yönetimi","proje yönetimi","girişimcilik","raporlama"]
  };
  const contains = (term: string) => text.includes(` ${term.toLowerCase()} `);
  const scores = categories.map((category) => {
    const matchedTerms = matchMap[category.name].filter((term) => contains(term));
    const matchedSkills = category.skills.filter((skill) => contains(skill.toLowerCase()));
    return { ...category, score: matchedTerms.length, matchedSkills };
  }).sort((a, b) => b.score - a.score);

  const top = scores[0];
  const second = scores[1];
  const isMixed = top && second && top.score > 0 && second.score > 0 && top.score - second.score <= 2;

  const extractedSkills: string[] = [];
  const pushSkills = (skills: string[]) => skills.forEach((skill) => uniquePush(extractedSkills, skill));
  if (top) pushSkills(top.matchedSkills);
  if (isMixed && second) pushSkills(second.matchedSkills);
  pushSkills(["Communication", "Teamwork", "Problem Solving", "Time Management"].filter((skill) => contains(skill.toLowerCase())));
  if (extractedSkills.length === 0) {
    extractedSkills.push("Communication", "Teamwork", "Problem Solving", "Time Management");
  }
  const trimmedSkills = extractedSkills.slice(0, 12);

  const suggested_roles = top ? [...top.roles] : ["General Intern"];
  if (isMixed && second) second.roles.forEach((role) => uniquePush(suggested_roles, role));
  const roleList = suggested_roles.slice(0, 6);

  const hasProjectExperience = ["project","internship","experience","academic project","capstone","thesis","volunteer"].some((term) => contains(term));
  const hasToolKeywords = ["excel","python","sql","matlab","figma","autocad","sap","docker","git","power bi","tableau","solidworks","revit","arduino","tensorflow"].some((term) => contains(term));
  const hasMeasurableOutcome = /(\b\d+%|\b\d{1,2}\s*(month|months|year|years)\b|\b20\d{2}\b|\b\d+\+?\b)/i.test(text);
  const skillScore = Math.min(20, trimmedSkills.length * 2);
  const overall_score = Math.min(90, 60 + skillScore + (hasProjectExperience ? 5 : 0) + (hasToolKeywords ? 5 : 0));

  const primaryCategory = top?.name ?? "General";
  const topSkillPreview = trimmedSkills.slice(0, 4).join(", ");

  return {
    extracted_skills: trimmedSkills,
    strengths: [
      `Your CV shows strong alignment with ${primaryCategory} pathways, with clear signals in ${topSkillPreview || "core professional competencies"}.`,
      hasProjectExperience ? "Project and experience indicators are present, which improves internship readiness and practical credibility." : "The profile has potential and would benefit from clearer project and internship evidence.",
      hasToolKeywords ? "Tool and software references are visible, helping recruiters quickly map your profile to role requirements." : "Adding a clearer tools section would improve recruiter scanability and role matching.",
    ],
    weaknesses: [
      hasMeasurableOutcome ? "Some bullets still lack consistent measurable outcomes; keep quantifying impact across all major experiences." : "Add measurable outcomes (percentages, counts, durations, before/after impact) to make achievements more credible.",
      "Role targeting can be sharper by repeating internship-specific keywords in the summary and experience bullets.",
      hasToolKeywords ? "Project impact can be clearer by tying used tools to results (speed, quality, cost, or user impact)." : "Add a dedicated tools/technologies section to improve ATS matching and recruiter readability.",
    ],
    suggested_roles: roleList,
    improvement_suggestions: [
      "Quantify outcomes in experience bullets using percentages, numeric impact, and timeline context.",
      "Create a clear tools and technologies section grouped by domain (technical, analytics, design, etc.).",
      "Explain project impact with problem-action-result structure, not only task descriptions.",
      "Use role-specific keywords from target internship listings in your summary, projects, and skills sections.",
      "Improve formatting readability with concise bullets, consistent tense, and clearer section hierarchy.",
      "Generated using demo fallback because Gemini quota is unavailable.",
    ],
    overall_score,
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

    let parsed: AnalysisPayload;
    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await genAI.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      const rawText = response.text?.trim();
      if (!rawText) {
        throw new Error("AI returned an empty response.");
      }

      parsed = parseStrictAnalysisJson(rawText);
    } catch (geminiError) {
      if (!isGeminiQuotaError(geminiError)) {
        throw geminiError;
      }

      console.error("Gemini quota unavailable, using fallback CV analysis", geminiError);
      parsed = buildFallbackAnalysis(extractedText);
    }

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
