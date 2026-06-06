import { createClient } from "@supabase/supabase-js";
import mammoth from "mammoth";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

type SkillGapPriority = "High" | "Medium" | "Low";
type AnalysisSource = "gemini" | "rule_based";

type SkillGap = {
  skill: string;
  current_level: number;
  target_level: number;
  priority: SkillGapPriority;
  reason: string;
};

type LearningRecommendation = {
  title: string;
  provider: string;
  url: string;
  reason: string;
};

type AnalysisPayload = {
  detected_domain?: string;
  extracted_skills: string[];
  strengths: string[];
  weaknesses: string[];
  suggested_roles: string[];
  skill_gaps?: SkillGap[];
  learning_recommendations?: LearningRecommendation[];
  improvement_suggestions: string[];
  overall_score: number;
};

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_GENERATE_CONTENT_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const LOG_PREVIEW_LIMIT = 500;
const GEMINI_ANALYSIS_METADATA_PREFIX = "__gemini_analysis_metadata__:";


const TRUSTED_LEARNING_PROVIDER_DOMAINS = [
  "coursera.org",
  "edx.org",
  "learn.microsoft.com",
  "developers.google.com",
  "freecodecamp.org",
  "developer.mozilla.org",
  "kaggle.com",
  "shrm.org",
  "apa.org",
  "openlearn.open.ac.uk",
  "ocw.mit.edu",
  "skillsbuild.org",
] as const;

const TRUSTED_LEARNING_PROVIDER_HOME_URLS = [
  { domain: "coursera.org", provider: "Coursera", url: "https://www.coursera.org/search?query=" },
  { domain: "edx.org", provider: "edX", url: "https://www.edx.org/search?q=" },
  { domain: "learn.microsoft.com", provider: "Microsoft Learn", url: "https://learn.microsoft.com/en-us/training/browse/?terms=" },
  { domain: "developers.google.com", provider: "Google Developers", url: "https://developers.google.com/search?q=" },
  { domain: "freecodecamp.org", provider: "freeCodeCamp", url: "https://www.freecodecamp.org/news/search/?query=" },
  { domain: "developer.mozilla.org", provider: "MDN Web Docs", url: "https://developer.mozilla.org/en-US/search?q=" },
  { domain: "kaggle.com", provider: "Kaggle", url: "https://www.kaggle.com/learn" },
  { domain: "shrm.org", provider: "SHRM", url: "https://www.shrm.org/search#q=" },
  { domain: "apa.org", provider: "APA", url: "https://www.apa.org/search?query=" },
  { domain: "openlearn.open.ac.uk", provider: "OpenLearn", url: "https://openlearn.open.ac.uk/" },
  { domain: "ocw.mit.edu", provider: "MIT OpenCourseWare", url: "https://ocw.mit.edu/search/?q=" },
  { domain: "skillsbuild.org", provider: "IBM SkillsBuild", url: "https://skillsbuild.org/" },
] as const;

const LEARNING_PROVIDER_FALLBACKS = {
  software: TRUSTED_LEARNING_PROVIDER_HOME_URLS[0],
  data: TRUSTED_LEARNING_PROVIDER_HOME_URLS[6],
  hr: TRUSTED_LEARNING_PROVIDER_HOME_URLS[7],
  psychology: TRUSTED_LEARNING_PROVIDER_HOME_URLS[8],
  law: TRUSTED_LEARNING_PROVIDER_HOME_URLS[0],
  compliance: TRUSTED_LEARNING_PROVIDER_HOME_URLS[0],
  business: TRUSTED_LEARNING_PROVIDER_HOME_URLS[0],
  general: TRUSTED_LEARNING_PROVIDER_HOME_URLS[9],
} as const;

const isTrustedLearningUrl = (input: string): boolean => {
  try {
    const hostname = new URL(input).hostname.toLowerCase().replace(/^www\./, "");
    return TRUSTED_LEARNING_PROVIDER_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
};

const findTrustedProviderByText = (text: string) => {
  const normalized = text.toLowerCase();
  return TRUSTED_LEARNING_PROVIDER_HOME_URLS.find(
    ({ domain, provider }) => normalized.includes(provider.toLowerCase()) || normalized.includes(domain)
  );
};

const chooseTrustedProviderFallback = (recommendation: Record<string, unknown>) => {
  const text = `${recommendation.provider ?? ""} ${recommendation.title ?? ""} ${recommendation.reason ?? ""}`.toLowerCase();
  const explicitProvider = findTrustedProviderByText(text);
  if (explicitProvider) return explicitProvider;
  if (/human resources|\bhr\b|recruit|talent|employee|people operations/.test(text)) return LEARNING_PROVIDER_FALLBACKS.hr;
  if (/psychology|organizational|assessment|counsel/.test(text)) return LEARNING_PROVIDER_FALLBACKS.psychology;
  if (/law|legal|compliance|contract|policy|regulation/.test(text)) return LEARNING_PROVIDER_FALLBACKS.law;
  if (/data|machine learning|analytics|python|kaggle|statistics/.test(text)) return LEARNING_PROVIDER_FALLBACKS.data;
  if (/software|web|javascript|typescript|react|node|api|developer|programming/.test(text)) return LEARNING_PROVIDER_FALLBACKS.software;
  if (/business|finance|marketing|management|communication/.test(text)) return LEARNING_PROVIDER_FALLBACKS.business;
  return LEARNING_PROVIDER_FALLBACKS.general;
};

const buildTrustedLearningUrl = (fallback: (typeof TRUSTED_LEARNING_PROVIDER_HOME_URLS)[number], title: string): string => {
  if (fallback.url.endsWith("=") || fallback.url.endsWith("q=")) {
    return `${fallback.url}${encodeURIComponent(title)}`;
  }

  return fallback.url;
};

const truncateForLog = (value: string, limit = LOG_PREVIEW_LIMIT): string =>
  value.length > limit ? `${value.slice(0, limit)}…` : value;

const ANALYSIS_SCHEMA_FIELDS = [
  "detected_domain",
  "suggested_roles",
  "extracted_skills",
  "strengths",
  "weaknesses",
  "skill_gaps",
  "learning_recommendations",
  "overall_score",
] as const;

const clampNumber = (value: unknown, min: number, max: number, fallback: number): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(numeric)));
};

const ensureString = (input: unknown, fieldName: string): string => {
  if (typeof input !== "string" || !input.trim()) {
    throw new Error(`Invalid AI output: ${fieldName} must be a non-empty string.`);
  }

  return input.trim();
};

const ensureStringArray = (input: unknown, fieldName: string): string[] => {
  if (!Array.isArray(input) || input.some((item) => typeof item !== "string")) {
    throw new Error(`Invalid AI output: ${fieldName} must be an array of strings.`);
  }

  return input.map((item) => item.trim()).filter(Boolean);
};

const extractJsonObject = (raw: string): string => {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI response did not contain a JSON object.");
  }

  return trimmed.slice(start, end + 1);
};

const parseSkillGaps = (input: unknown): SkillGap[] => {
  if (!Array.isArray(input)) {
    throw new Error("Invalid AI output: skill_gaps must be an array.");
  }

  return input.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Invalid AI output: skill_gaps[${index}] must be an object.`);
    }

    const gap = item as Record<string, unknown>;
    const priority: SkillGapPriority =
      gap.priority === "High" || gap.priority === "Medium" || gap.priority === "Low" ? gap.priority : "Medium";

    return {
      skill: ensureString(gap.skill, `skill_gaps[${index}].skill`),
      current_level: clampNumber(gap.current_level, 1, 5, 1),
      target_level: clampNumber(gap.target_level, 1, 5, 3),
      priority,
      reason: ensureString(gap.reason, `skill_gaps[${index}].reason`),
    };
  }).filter((gap) => gap.skill && gap.reason);
};

const isValidHttpUrl = (input: string): boolean => {
  try {
    const url = new URL(input);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const parseLearningRecommendations = (input: unknown): LearningRecommendation[] => {
  if (!Array.isArray(input)) {
    throw new Error("Invalid AI output: learning_recommendations must be an array.");
  }

  return input
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        throw new Error(`Invalid AI output: learning_recommendations[${index}] must be an object.`);
      }

      const recommendation = item as Record<string, unknown>;
      const title = ensureString(recommendation.title, `learning_recommendations[${index}].title`);
      const provider = ensureString(recommendation.provider, `learning_recommendations[${index}].provider`);
      const reason = ensureString(recommendation.reason, `learning_recommendations[${index}].reason`);
      const rawUrl = typeof recommendation.url === "string" ? recommendation.url.trim() : "";
      const fallbackProvider = chooseTrustedProviderFallback({ ...recommendation, title, provider, reason });
      const url = rawUrl && isValidHttpUrl(rawUrl) && isTrustedLearningUrl(rawUrl)
        ? rawUrl
        : buildTrustedLearningUrl(fallbackProvider, title);

      return {
        title,
        provider,
        url,
        reason,
      };
    })
    .filter((recommendation) => recommendation.title && recommendation.provider && recommendation.url && isTrustedLearningUrl(recommendation.url));
};


const uniqueStrings = (items: string[]): string[] =>
  items.reduce<string[]>((uniqueItems, item) => {
    const trimmed = item.trim();
    if (trimmed && !uniqueItems.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())) {
      uniqueItems.push(trimmed);
    }
    return uniqueItems;
  }, []);

const isNonEmptyString = (input: unknown): input is string =>
  typeof input === "string" && Boolean(input.trim());

const isNonEmptyStringArray = (input: unknown): input is string[] =>
  Array.isArray(input) && input.length > 0 && input.every(isNonEmptyString);

const isValidSkillGapInput = (input: unknown): boolean => {
  if (!Array.isArray(input)) {
    return false;
  }

  return input.every((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const gap = item as Record<string, unknown>;
    const currentLevel = Number(gap.current_level);
    const targetLevel = Number(gap.target_level);

    return (
      isNonEmptyString(gap.skill) &&
      Number.isFinite(currentLevel) &&
      currentLevel >= 1 &&
      currentLevel <= 5 &&
      Number.isFinite(targetLevel) &&
      targetLevel >= 1 &&
      targetLevel <= 5 &&
      (gap.priority === "High" || gap.priority === "Medium" || gap.priority === "Low") &&
      isNonEmptyString(gap.reason)
    );
  });
};

const isValidLearningRecommendationInput = (input: unknown): boolean => {
  if (!Array.isArray(input)) {
    return false;
  }

  return input.every((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const recommendation = item as Record<string, unknown>;
    return (
      isNonEmptyString(recommendation.title) &&
      isNonEmptyString(recommendation.provider) &&
      isNonEmptyString(recommendation.url) &&
      isValidHttpUrl(recommendation.url.trim()) &&
      isNonEmptyString(recommendation.reason)
    );
  });
};

const collectInvalidAnalysisFields = (parsed: Record<string, unknown>): string[] =>
  ANALYSIS_SCHEMA_FIELDS.filter((field) => {
    switch (field) {
      case "detected_domain":
        return !isNonEmptyString(parsed.detected_domain);
      case "suggested_roles":
        return !isNonEmptyStringArray(parsed.suggested_roles);
      case "extracted_skills":
        return !isNonEmptyStringArray(parsed.extracted_skills);
      case "strengths":
        return !isNonEmptyStringArray(parsed.strengths);
      case "weaknesses":
        return !isNonEmptyStringArray(parsed.weaknesses);
      case "skill_gaps":
        return !isValidSkillGapInput(parsed.skill_gaps);
      case "learning_recommendations":
        return !isValidLearningRecommendationInput(parsed.learning_recommendations);
      case "overall_score": {
        const score = Number(parsed.overall_score);
        return !Number.isFinite(score) || score < 0 || score > 100;
      }
      default:
        return true;
    }
  });

const buildImprovementSuggestions = (skillGaps: SkillGap[], recommendations: LearningRecommendation[]): string[] => {
  const suggestions: string[] = [];

  skillGaps.slice(0, 4).forEach((gap) => {
    suggestions.push(`${gap.priority} priority: improve ${gap.skill} from level ${gap.current_level} toward level ${gap.target_level}. ${gap.reason}`);
  });

  recommendations.slice(0, 3).forEach((recommendation) => {
    suggestions.push(`Consider ${recommendation.title} from ${recommendation.provider}: ${recommendation.reason}`);
  });

  return suggestions;
};

const buildPersistedImprovementSuggestions = (
  suggestions: string[],
  analysisSource: AnalysisSource,
  fallbackReason: string,
  parsed: AnalysisPayload
): string[] => {
  const cleanSuggestions = suggestions.filter((item) => typeof item === "string" && item.trim());

  if (analysisSource !== "gemini") {
    return cleanSuggestions;
  }

  return [
    ...cleanSuggestions,
    `${GEMINI_ANALYSIS_METADATA_PREFIX}${JSON.stringify({
      analysis_source: analysisSource,
      analysis_model: GEMINI_MODEL,
      fallback_reason: fallbackReason,
      detected_domain: parsed.detected_domain,
      skill_gaps: parsed.skill_gaps ?? [],
      learning_recommendations: parsed.learning_recommendations ?? [],
      career_goal_source: analysisSource === "gemini" && (parsed.suggested_roles?.length ?? 0) > 0 ? "gemini" : "department_fallback",
      learning_recommendation_source: analysisSource === "gemini" && (parsed.learning_recommendations?.length ?? 0) > 0 ? "gemini" : "template_fallback",
    })}`,
  ];
};

const parseStrictAnalysisJson = (raw: string): AnalysisPayload => {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(extractJsonObject(raw)) as Record<string, unknown>;
  } catch {
    console.warn("Gemini JSON parsing failed");
    throw new Error("Failed to parse Gemini response as strict JSON.");
  }

  const invalidFields = collectInvalidAnalysisFields(parsed);
  if (invalidFields.length) {
    console.warn("Gemini schema validation failed", {
      invalidFields,
    });
    throw new Error("Gemini response failed schema validation.");
  }

  const extractedSkills = ensureStringArray(parsed.extracted_skills, "extracted_skills");
  const strengths = ensureStringArray(parsed.strengths, "strengths");
  const weaknesses = ensureStringArray(parsed.weaknesses, "weaknesses");
  const suggestedRoles = uniqueStrings(ensureStringArray(parsed.suggested_roles, "suggested_roles"));
  const skillGaps = parseSkillGaps(parsed.skill_gaps);
  const learningRecommendations = parseLearningRecommendations(parsed.learning_recommendations);

  if (!extractedSkills.length || !suggestedRoles.length || !strengths.length || !weaknesses.length) {
    throw new Error("Invalid AI output: required analysis arrays must not be empty.");
  }

  return {
    detected_domain: ensureString(parsed.detected_domain, "detected_domain"),
    extracted_skills: extractedSkills.slice(0, 16),
    strengths: strengths.slice(0, 6),
    weaknesses: weaknesses.slice(0, 6),
    suggested_roles: suggestedRoles.slice(0, 8),
    skill_gaps: skillGaps.slice(0, 8),
    learning_recommendations: learningRecommendations.slice(0, 6),
    improvement_suggestions: buildImprovementSuggestions(skillGaps, learningRecommendations),
    overall_score: clampNumber(parsed.overall_score, 0, 100, 60),
  };
};

const stringifyErrorForDetection = (error: unknown): string => {
  if (error instanceof Error) {
    return `${error.name} ${error.message}`;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

const getSafeFallbackReason = (error: unknown): string => {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes("429") || message.includes("quota") || message.includes("rate limit")) {
    return "gemini_quota_or_rate_limit";
  }

  if (message.includes("json")) {
    return "gemini_invalid_json";
  }

  if (message.includes("schema validation") || message.includes("invalid ai output")) {
    return "gemini_validation_failed";
  }

  return "gemini_failed";
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

const extractGeminiCandidateText = (responseJson: GeminiGenerateContentResponse): string =>
  responseJson.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text)
    .filter((text): text is string => typeof text === "string")
    .join("\n")
    .trim() ?? "";

const requestGeminiAnalysis = async (prompt: string, apiKey: string): Promise<string> => {
  const response = await fetch(GEMINI_GENERATE_CONTENT_URL, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    console.warn("Gemini request failed", {
      status: response.status,
      statusText: response.statusText,
      responseBody: truncateForLog(responseBody),
    });
    throw new Error(`Gemini request failed with status ${response.status}.`);
  }

  const responseJson = (await response.json()) as GeminiGenerateContentResponse;
  const rawText = extractGeminiCandidateText(responseJson);

  if (!rawText) {
    console.warn("Gemini response did not contain candidate text.");
    throw new Error("Gemini response did not contain candidate text.");
  }

  return rawText;
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
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

const buildFallbackAnalysis = (cvText: string): AnalysisPayload => {
  const text = normalizeText(cvText);
  const categories: FallbackCategory[] = [
    { name: "Software", skills: ["React","Vue","Angular","JavaScript","TypeScript","HTML","CSS","Tailwind","Bootstrap","Node.js","Express","Flask","Django","FastAPI","REST API","GraphQL","JWT","OAuth","SQL","PostgreSQL","MySQL","MongoDB","Supabase","Firebase","Prisma","Sequelize","Docker","Kubernetes","Git","GitHub","GitLab","CI/CD","Testing","Debugging","Next.js","Vite","Redux","Zustand"], roles: ["Software Developer Intern","Full-Stack Developer Intern","Backend Developer Intern","Frontend Developer Intern","Web Developer Intern"], strengths: ["software engineering and modern development stack alignment"], weaknesses: ["add measurable software delivery outcomes and clearer architecture decisions"], suggestions: ["Add one end-to-end software project with measurable impact and deployment details.","Show how your technical decisions improved performance, reliability, or user experience."] },
    { name: "Data/AI", skills: ["Data Analysis","Data Science","Machine Learning","Artificial Intelligence","Deep Learning","Neural Network","Classification","Regression","Clustering","Python","Pandas","NumPy","scikit-learn","TensorFlow","PyTorch","Jupyter","SQL","Power BI","Tableau","Data Visualization","Statistics","EDA","Feature Engineering","NLP","Computer Vision","Prompt Engineering","Generative AI","LLM","Chatbot"], roles: ["Data Analyst Intern","Data Science Intern","AI Intern","Machine Learning Intern","Business Intelligence Intern"], strengths: ["analytics, modeling, and data storytelling alignment"], weaknesses: ["add business impact metrics and model evaluation depth"], suggestions: ["Include a project that connects model quality metrics to business outcomes.","Show dashboard/reporting outputs and key decisions driven by data insights."] },
    { name: "Chemical", skills: ["Chemical Engineering","Process Engineering","Process Optimization","Thermodynamics","Fluid Mechanics","Heat Transfer","Mass Transfer","Distillation","Extraction","Chromatography","Titration","Laboratory","Experimental Design","Quality Control","Quality Assurance","R&D","Aspen Plus","Aspen HYSYS","MATLAB","Simulink","Process Simulation","Material Balance","Energy Balance","Reactor Design","Sustainability","Renewable Energy","Hydrogen","Battery","Electrochemistry","Polymer","Nanotechnology","Pharmaceutical Formulation"], roles: ["R&D Intern","Process Engineering Intern","Quality Control Intern","Laboratory Intern","Sustainability Intern","Production Intern"], strengths: ["chemical process and laboratory fundamentals alignment"], weaknesses: ["add quantified process improvements and documented experimental outcomes"], suggestions: ["Add a process optimization or lab project with yield/efficiency results.","Highlight safety, quality, and scale-up considerations in technical experiences."] },
    { name: "Industrial/Operations", skills: ["Industrial Engineering","Operations Research","Optimization","Linear Programming","Integer Programming","Simulation","Supply Chain","Production Planning","Scheduling","Inventory","Forecasting","Process Improvement","Lean","Six Sigma","Kaizen","KPI","Excel Solver","Python","MATLAB","Gurobi","CPLEX","Arena"], roles: ["Operations Intern","Industrial Engineering Intern","Process Improvement Intern","Planning Intern","Business Analyst Intern"], strengths: ["operations optimization and planning alignment"], weaknesses: ["add before/after metrics for efficiency and process gains"], suggestions: ["Present one operations case with baseline, intervention, and measurable outcome.","Show tool-based optimization outputs (solver/simulation) and decisions taken."] },
    { name: "Business/Strategy", skills: ["Management","Business Administration","Business Analysis","Business Development","Strategy","Market Analysis","Product Management","Product Owner","Roadmap","User Research","Stakeholder Management","Presentation","Reporting","KPI","OKR","Excel","PowerPoint","Project Management","Agile","Scrum","Entrepreneurship","Innovation","Consulting"], roles: ["Business Analyst Intern","Product Management Intern","Strategy Intern","Project Management Intern","Business Development Intern"], strengths: ["business planning and stakeholder communication alignment"], weaknesses: ["add quantified strategy outcomes and clearer prioritization rationale"], suggestions: ["Add a market or strategy project with assumptions, analysis, and quantified recommendation.","Document stakeholder outcomes and KPI improvements from initiatives."] },
    { name: "Law/Policy", skills: ["Legal Research","Contract Review","Legal Writing","Case Analysis","Compliance","Policy Analysis","Corporate Law","Commercial Law","Labor Law","Data Protection","KVKK","GDPR","Critical Thinking","Academic Writing","Client Communication"], roles: ["Legal Intern","Compliance Intern","Policy Research Intern","Corporate Law Intern","Data Protection Intern","Public Affairs Intern","International Relations Intern"], strengths: ["legal research, contract, and compliance alignment"], weaknesses: ["add measurable legal research outputs, sample memos, and compliance checklist evidence"], suggestions: ["Add a short legal writing or contract review project to demonstrate practical legal analysis.","Mention specific regulation/compliance areas such as KVKK, GDPR, labor law, or commercial law when relevant."] },
    { name: "Psychology/HR", skills: ["Recruitment","Interviewing","Communication","Psychological Assessment Awareness","HR Analytics","Employee Relations","Research Methods","Training & Development","Organizational Psychology","Excel"], roles: ["HR Intern","Recruitment Intern","People Operations Intern","Organizational Psychology Intern","Training & Development Intern","Talent Acquisition Intern"], strengths: ["communication, recruitment, and research alignment"], weaknesses: ["add HR analytics depth and concrete interview process examples"], suggestions: ["Include examples of interview coordination, assessment notes, or hiring funnel improvements.","Add HR analytics or Excel-based reporting that supports recruitment decisions."] },
    { name: "Finance/Economics/Accounting", skills: ["Financial Analysis","Excel","Accounting","Valuation","Budgeting","Reporting","Risk Analysis","Power BI","Financial Modeling","Audit"], roles: ["Finance Intern","Financial Analyst Intern","Accounting Intern","Risk Intern","Audit Intern","Reporting Intern"], strengths: ["Excel, reporting, and financial analysis alignment"], weaknesses: ["add financial modeling, Power BI, or valuation evidence with measurable outcomes"], suggestions: ["Add a financial modeling or valuation mini-project with assumptions and outputs.","Show budgeting/reporting impact using quantified variance, cost, or risk metrics."] },
    { name: "Marketing/Communication/Media", skills: ["Market Research","Social Media","SEO","Campaign Management","Copywriting","Content Strategy","Communication","Reporting","Google Analytics","Brand Management"], roles: ["Marketing Intern","Brand Intern","Social Media Intern","Communications Intern","Content Intern","Growth Intern"], strengths: ["content, communication, and campaign alignment"], weaknesses: ["add channel-level performance metrics and audience growth evidence"], suggestions: ["Include campaign results (CTR, engagement, conversion) to demonstrate impact.","Show content strategy choices linked to brand or growth outcomes."] },
    { name: "Education/Teaching", skills: ["Lesson Planning","Communication","Curriculum Design","Educational Technology","Assessment","Classroom Management","Guidance","Instructional Design"], roles: ["Teaching Intern","Education Intern","Instructional Design Intern","Guidance Intern","Curriculum Intern"], strengths: ["teaching, guidance, and instructional planning alignment"], weaknesses: ["add measurable learning outcomes and assessment design examples"], suggestions: ["Provide one lesson/curriculum sample with objectives, methods, and outcomes.","Show student support or guidance cases with structured interventions."] },
    { name: "Design/UX", skills: ["Figma","Wireframing","Prototyping","User Research","UI Design","UX Writing","Design Systems","Adobe Tools","Visual Communication"], roles: ["UX Intern","UI Designer Intern","Product Design Intern","Graphic Design Intern","Visual Communication Intern"], strengths: ["user-centered design and visual communication alignment"], weaknesses: ["add usability findings and design decision rationale"], suggestions: ["Add a case study showing user research, iterations, and final design impact.","Present design system and handoff artifacts to demonstrate production readiness."] },
    { name: "Mechanical Engineering", skills: ["CAD","SolidWorks","ANSYS","Technical Drawing","Manufacturing","Thermodynamics","Fluid Mechanics","Machine Design","MATLAB"], roles: ["Mechanical Design Intern","Manufacturing Intern","R&D Engineering Intern","Production Intern","CAD/CAE Intern"], strengths: ["mechanical design and manufacturing fundamentals alignment"], weaknesses: ["add quantified design validation and test result evidence"], suggestions: ["Include CAD/CAE project outcomes with constraints, simulations, and revisions.","Show production or design improvements with measurable quality/efficiency impact."] },
    { name: "Electrical/Electronics Engineering", skills: ["Circuit Analysis","PCB Design","Embedded Systems","C/C++","MATLAB","Simulink","Control Systems","Power Electronics","Signal Processing"], roles: ["Electronics Intern","Embedded Systems Intern","Hardware Intern","Control Systems Intern","Power Systems Intern"], strengths: ["electronics, embedded, and control systems alignment"], weaknesses: ["add hardware validation results and clearer system integration evidence"], suggestions: ["Document one circuit/embedded project with test setup and performance metrics.","Show PCB, firmware, or control tuning decisions and resulting improvements."] },
    { name: "Civil/Architecture", skills: ["AutoCAD","Revit","BIM","Structural Analysis","Construction Management","Project Planning","Technical Drawing","Site Safety"], roles: ["Site Engineer Intern","Structural Engineering Intern","BIM Intern","Construction Management Intern","Architecture Intern"], strengths: ["construction planning and technical drafting alignment"], weaknesses: ["add project delivery metrics and site coordination evidence"], suggestions: ["Add a project timeline/BOQ/planning sample with measurable milestones.","Highlight BIM/Revit outputs and site safety or quality contributions."] },
    { name: "Biomedical/Biotechnology/Life Sciences", skills: ["Laboratory Techniques","Data Analysis","Biomedical Devices","Biology","Quality Systems","Regulatory Awareness","MATLAB","Python"], roles: ["Biomedical Intern","Biotechnology Intern","Clinical Research Intern","R&D Intern","Laboratory Intern"], strengths: ["laboratory and life sciences research alignment"], weaknesses: ["add validated experiment outputs and regulatory-context details"], suggestions: ["Include a lab or clinical research example with protocol and findings.","Mention device/biological quality and compliance awareness in project summaries."] },
    { name: "Environmental/Sustainability/Energy", skills: ["Sustainability","Environmental Impact","Water Treatment","Wastewater Treatment","Carbon Footprint","ESG Reporting","Renewable Energy","Data Analysis"], roles: ["Sustainability Intern","Environmental Engineering Intern","Energy Intern","ESG Intern","Water/Wastewater Intern"], strengths: ["sustainability and environmental systems alignment"], weaknesses: ["add quantified impact indicators and reporting outputs"], suggestions: ["Provide one ESG/sustainability analysis with carbon, water, or energy metrics.","Show environmental project recommendations tied to measurable outcomes."] },
    { name: "Mechatronics/Robotics/Automation", skills: ["ROS","Control Systems","Embedded Systems","Sensors","Actuators","Python","C++","MATLAB","PLC","Simulation"], roles: ["Robotics Intern","Automation Intern","Mechatronics Intern","Control Systems Intern","Embedded Systems Intern"], strengths: ["robotics, automation, and control integration alignment"], weaknesses: ["add end-to-end system validation and deployment context"], suggestions: ["Add a robotics/automation project including sensing, control, and integration results.","Mention simulation-to-hardware transition steps and performance evidence."] },
  ];
  const matchMap: Record<string, string[]> = {
    "Software":[ "software","software engineering","computer engineering","web development","full-stack","full stack","frontend","front-end","backend","back-end","developer","programming","coding","application development","web application","mobile application","react","vue","angular","javascript","typescript","html","css","tailwind","bootstrap","node.js","express","flask","django","fastapi","rest api","graphql","api integration","authentication","authorization","jwt","oauth","sql","postgresql","mysql","mongodb","supabase","firebase","prisma","sequelize","docker","kubernetes","git","github","gitlab","ci/cd","testing","unit testing","debugging","clean code","responsive design","ui","ux","next.js","vite","redux","zustand"],
    "Data/AI":[ "data analysis","data analytics","data science","machine learning","artificial intelligence"," ai "," ml ","deep learning","neural network","classification","regression","clustering","predictive modeling","model evaluation","python","pandas","numpy","scikit-learn","tensorflow","pytorch","jupyter","sql","power bi","tableau","data visualization","dashboard","statistics","statistical analysis","eda","exploratory data analysis","data preprocessing","feature engineering","nlp","computer vision","prompt engineering","generative ai","llm","chatbot","recommendation system"],
    "Chemical":[ "chemical engineering","chemistry","process engineering","process design","process optimization","reaction engineering","thermodynamics","fluid mechanics","heat transfer","mass transfer","separation processes","distillation","steam distillation","azeotropic distillation","extraction","absorption","adsorption","chromatography","tlc","titration","organic chemistry","physical chemistry","analytical chemistry","laboratory"," lab ","experiment","experimental design","sample preparation","safety","msds","quality control","quality assurance","r&d","research and development","aspen","aspen plus","aspen hysys","matlab","simulink","process simulation","material balance","energy balance","reactor","cstr","pfr","batch reactor","sustainability","renewable energy","hydrogen","battery","electrochemistry","aluminum-air battery","iodine clock","polymer","nanotechnology","pharmaceutical","pharma","formulation","kimya mühendisliği","proses","laboratuvar","deney","damıtma","distilasyon","ekstraksiyon","kalite kontrol","ar-ge","sürdürülebilirlik","enerji"],
    "Industrial/Operations":[ "industrial engineering","operations research","optimization","linear programming","integer programming","simplex","simulation","supply chain","production planning","scheduling","inventory","forecasting","demand planning","process improvement","lean","six sigma","kaizen","continuous improvement","efficiency","kpi","operations","workflow","system analysis","decision making","data-driven","excel solver","python","matlab","gurobi","cplex","arena","discrete event simulation","endüstri mühendisliği","optimizasyon","üretim planlama","çizelgeleme","stok","tahminleme","yalın üretim","süreç iyileştirme"],
    "Business/Strategy":[ "management","business administration","business analysis","business development","strategy","strategic planning","market analysis","competitor analysis","product management","product owner","roadmap","user research","customer journey","stakeholder management","presentation","reporting","kpi","okr","excel","powerpoint","project management","agile","scrum","coordination","planning","entrepreneurship","startup","innovation","consulting","problem solving","işletme","yönetim","strateji","ürün yönetimi","proje yönetimi","girişimcilik","raporlama"],
    "Law/Policy":[ "law","legal","lawyer","legal intern","legal research","legal writing","contract","contract review","compliance","regulation","policy","policy analysis","corporate law","commercial law","labor law","employment law","data protection","kvkk","gdpr","case analysis","court","litigation","dispute resolution","international law","political science","international relations","public affairs","diplomacy","legal memo","hukuk","avukat","sözleşme","uyum","mevzuat","dava","politika" ],
    "Psychology/HR":[ "psychology","psychological","human resources","hr","recruitment","recruiter","interview","organizational psychology","counseling","assessment","employee relations","training","talent acquisition","people operations","psychometric","research methods","psikoloji","insan kaynakları","işe alım","mülakat" ],
    "Finance/Economics/Accounting":[ "finance","economics","accounting","financial analysis","valuation","budgeting","budget","investment","risk","reporting","audit","excel","power bi","financial modeling","balance sheet","income statement","finans","ekonomi","muhasebe" ],
    "Marketing/Communication/Media":[ "marketing","brand","advertising","social media","content","seo","campaign","google analytics","communication","public relations","pr","journalism","media","copywriting","editing","pazarlama","iletişim" ],
    "Education/Teaching":[ "education","teaching","teacher","pedagogy","curriculum","classroom","guidance","counseling","instructional design","tutoring","assessment","eğitim","öğretmenlik" ],
    "Design/UX":[ "design","ux","ui","figma","adobe","wireframe","prototype","user research","visual communication","graphic design","design system" ],
    "Mechanical Engineering":[ "mechanical engineering","solidworks","cad","ansys","manufacturing","thermodynamics","fluid mechanics","mechanics","machine design","production","technical drawing","makine" ],
    "Electrical/Electronics Engineering":[ "electrical engineering","electronics","circuit","pcb","embedded","arduino","stm32","fpga","control systems","power electronics","signal processing","elektrik","elektronik" ],
    "Civil/Architecture":[ "civil engineering","architecture","construction","structural","autocad","revit","bim","geotechnical","transportation","site engineering","mimarlık","inşaat" ],
    "Biomedical/Biotechnology/Life Sciences":[ "biomedical","biotechnology","biology","molecular biology","cell culture","medical device","clinical","bioinformatics","laboratory","life sciences" ],
    "Environmental/Sustainability/Energy":[ "environmental","sustainability","renewable energy","water treatment","wastewater","carbon footprint","esg","energy efficiency","climate","hydrogen","solar","wind","çevre","sürdürülebilirlik" ],
    "Mechatronics/Robotics/Automation":[ "mechatronics","robotics","automation","ros","gazebo","control systems","embedded","sensors","actuators","plc","arduino" ]
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
  if (isMixed && second) {
    const mixed: string[] = [];
    top.roles.forEach((role) => uniquePush(mixed, role));
    second.roles.forEach((role) => uniquePush(mixed, role));
    suggested_roles.length = 0;
    mixed.forEach((role) => suggested_roles.push(role));
  }
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
      `Your CV shows strong alignment with ${primaryCategory} pathways, with clear signals in ${topSkillPreview || "core professional competencies"} and ${top?.strengths[0] ?? "relevant domain competencies"}.`,
      hasProjectExperience ? "Project and experience indicators are present, which improves internship readiness and practical credibility." : "The profile has potential and would benefit from clearer project and internship evidence.",
      hasToolKeywords ? "Tool and software references are visible, helping recruiters quickly map your profile to role requirements." : "Adding a clearer tools section would improve recruiter scanability and role matching.",
    ],
    weaknesses: [
      hasMeasurableOutcome ? `Some bullets still lack consistent measurable outcomes; keep quantifying impact across all major experiences and ${top?.weaknesses[0] ?? "domain outputs"}.` : `Add measurable outcomes (percentages, counts, durations, before/after impact) to make achievements more credible and ${top?.weaknesses[0] ?? "domain-relevant deliverables"}.`,
      "Role targeting can be sharper by repeating internship-specific keywords in the summary and experience bullets.",
      hasToolKeywords ? "Project impact can be clearer by tying used tools to results (speed, quality, cost, or user impact)." : "Add a dedicated tools/technologies section to improve ATS matching and recruiter readability.",
    ],
    suggested_roles: roleList,
    improvement_suggestions: [
      top?.suggestions[0] ?? "Quantify outcomes in experience bullets using percentages, numeric impact, and timeline context.",
      top?.suggestions[1] ?? "Create a clear tools and technologies section grouped by domain (technical, analytics, design, etc.).",
      "Explain project impact with problem-action-result structure, not only task descriptions.",
      "Use role-specific keywords from target internship listings in your summary, projects, and skills sections.",
      "Improve formatting readability with concise bullets, consistent tense, and clearer section hierarchy.",
      "Generated using demo fallback because Gemini quota is unavailable.",
    ],
    overall_score,
  };
};

const MIN_READABLE_PDF_TEXT_LENGTH = 100;

const normalizeExtractedPdfText = (input: string): string =>
  input
    .replace(/\u0000/g, "")
    .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]/g, " ")
    .replace(/[\u00AD\u2010\u2011\u2212]/g, "-")
    .replace(/\r\n/g, "\n")
    .replace(/[\t\f\v]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ {2,}/g, " ")
    .trim();


const execFileAsync = promisify(execFile);

const decodePdfEscapes = (value: string): string =>
  value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")");

const extractPdfTextWithPdftotext = async (buffer: Buffer): Promise<string> => {
  const tempPath = join(tmpdir(), `cv-${Date.now()}-${Math.random().toString(16).slice(2)}.pdf`);

  await fs.writeFile(tempPath, buffer);
  try {
    const { stdout } = await execFileAsync("pdftotext", ["-layout", tempPath, "-"]);
    return stdout ?? "";
  } finally {
    await fs.unlink(tempPath).catch(() => undefined);
  }
};

const extractPdfTextWithRawHeuristic = async (buffer: Buffer): Promise<string> => {
  const content = buffer.toString("latin1");
  const matches = content.match(/\((?:\\.|[^\\)])*\)/g) ?? [];

  const decoded = matches
    .map((match) => match.slice(1, -1))
    .map((value) => decodePdfEscapes(value))
    .join(" ");

  return decoded;
};

const extractPdfTextWithPdfJs = async (buffer: Buffer): Promise<string> => {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  });
  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
      .join(" ")
      .trim();

    if (pageText) {
      pageTexts.push(pageText);
    }
  }

  return pageTexts.join("\n");
};

const extractPdfTextWithPdfParse = async (buffer: Buffer): Promise<string> => {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  try {
    const parsed = await parser.getText();
    return parsed.text ?? "";
  } finally {
    await parser.destroy().catch(() => undefined);
  }
};

const extractPdfText = async (buffer: Buffer): Promise<string> => {
  const extractors: Array<{ name: string; run: () => Promise<string> }> = [
    { name: "pdftotext", run: () => extractPdfTextWithPdftotext(buffer) },
    { name: "pdfjs", run: () => extractPdfTextWithPdfJs(buffer) },
    { name: "pdf-parse", run: () => extractPdfTextWithPdfParse(buffer) },
    { name: "raw-heuristic", run: () => extractPdfTextWithRawHeuristic(buffer) },
  ];

  for (const extractor of extractors) {
    try {
      console.log("Trying PDF extractor", extractor.name);
      const extractedText = await extractor.run();
      const normalizedText = normalizeExtractedPdfText(extractedText);

      if (normalizedText.length >= MIN_READABLE_PDF_TEXT_LENGTH) {
        console.log("PDF extraction succeeded", { method: extractor.name, length: normalizedText.length });
        return normalizedText;
      }

      console.warn("PDF extractor returned short text", {
        method: extractor.name,
        length: normalizedText.length,
        preview: normalizedText.slice(0, 160),
      });
    } catch (error) {
      console.error("PDF extractor failed", {
        method: extractor.name,
        error: stringifyErrorForDetection(error),
      });
    }
  }

  throw new Error("No readable text found in this PDF. Please upload a text-based PDF or DOCX file.");
};

const extractCvText = async (fileName: string, mimeType: string | null, buffer: Buffer): Promise<string> => {
  const lowerName = fileName.toLowerCase();

  if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
    return extractPdfText(buffer);
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

    const prompt = `You are a strict JSON API. Analyze the CV for internship readiness.
Detect the student’s career domain from the CV evidence. Do not force every CV into software.
Support different domains such as software, chemical engineering, psychology/HR, law, finance, marketing, design, education, engineering, and health.
Return realistic skill gaps based on the CV. Use conservative wording. Do not invent fake certificates or fake websites.
For learning_recommendations, prefer real resources from these trusted domains only: coursera.org, edx.org, learn.microsoft.com, developers.google.com, freecodecamp.org, developer.mozilla.org, kaggle.com, shrm.org, apa.org, openlearn.open.ac.uk, ocw.mit.edu, skillsbuild.org.
Return only JSON, no markdown. Use this exact structure and keys:
{
  "detected_domain": string,
  "suggested_roles": string[],
  "extracted_skills": string[],
  "strengths": string[],
  "weaknesses": string[],
  "skill_gaps": [
    {
      "skill": string,
      "current_level": number,
      "target_level": number,
      "priority": "High" | "Medium" | "Low",
      "reason": string
    }
  ],
  "learning_recommendations": [
    {
      "title": string,
      "provider": string,
      "url": string,
      "reason": string
    }
  ],
  "overall_score": number
}
Levels must be 1 to 5. overall_score must be 0 to 100.
CV text:
${extractedText}`;

    let parsed: AnalysisPayload = buildFallbackAnalysis(extractedText);
    let analysisSource: AnalysisSource = "rule_based";
    let fallbackReason = "gemini_api_key_missing";

    if (process.env.GEMINI_API_KEY) {
      fallbackReason = "gemini_failed";

      try {
        const rawText = await requestGeminiAnalysis(prompt, process.env.GEMINI_API_KEY);
        parsed = parseStrictAnalysisJson(rawText);
        analysisSource = "gemini";
        fallbackReason = "not_applicable";
      } catch (error) {
        fallbackReason = getSafeFallbackReason(error);
        console.error("Gemini analysis failed, using fallback.", {
          error: stringifyErrorForDetection(error),
          model: GEMINI_MODEL,
        });
      }
    }

    if (analysisSource === "gemini") {
      console.info("CV analysis completed", {
        source: "gemini",
        model: GEMINI_MODEL,
      });
    } else {
      console.info("CV analysis completed", {
        source: "rule_based",
        reason: fallbackReason,
      });
    }

    const persistedImprovementSuggestions = buildPersistedImprovementSuggestions(
      parsed.improvement_suggestions,
      analysisSource,
      fallbackReason,
      parsed
    );

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

    const persistedReportPayload = {
      ...reportPayload,
      improvement_suggestions: persistedImprovementSuggestions,
    };

    try {
      await persistCvAnalysisReport(persistedReportPayload);
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

    const responsePayload = {
      document_id: reportPayload.document_id,
      student_id: reportPayload.student_id,
      extracted_skills: reportPayload.extracted_skills,
      strengths: reportPayload.strengths,
      weaknesses: reportPayload.weaknesses,
      suggested_roles: reportPayload.suggested_roles,
      improvement_suggestions: reportPayload.improvement_suggestions,
      overall_score: reportPayload.overall_score,
      analysis_status: reportPayload.analysis_status,
      error_message: reportPayload.error_message,
    };
    const careerGoalSource = analysisSource === "gemini" && parsed.suggested_roles.length > 0 ? "gemini" : "department_fallback";
    const learningRecommendationSource = analysisSource === "gemini" && (parsed.learning_recommendations?.length ?? 0) > 0 ? "gemini" : "template_fallback";

    return res.status(200).json({
      ...responsePayload,
      detected_domain: parsed.detected_domain,
      skill_gaps: parsed.skill_gaps,
      learning_recommendations: parsed.learning_recommendations,
      gemini_skill_gaps: analysisSource === "gemini" ? parsed.skill_gaps : [],
      gemini_learning_recommendations: analysisSource === "gemini" ? parsed.learning_recommendations : [],
      analysis_source: analysisSource,
      analysis_model: analysisSource === "gemini" ? GEMINI_MODEL : null,
      career_goal_source: careerGoalSource,
      learning_recommendation_source: learningRecommendationSource,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("CV analyze failed", error);
    await markFailure(message);
    return res.status(500).json({ error: message });
  }
}
