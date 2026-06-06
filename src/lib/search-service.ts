import { POSTINGS } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { InternshipPosting } from "@/lib/types";

export type SearchCvAnalysis = {
  detected_domain?: string;
  extracted_skills: string[];
  strengths: string[];
  weaknesses: string[];
  suggested_roles: string[];
  overall_score: number | null;
  analysis_source?: "gemini" | "rule_based";
  created_at: string;
};

export type SearchPosting = InternshipPosting & {
  required_skills: string[];
  desired_skills: string[];
};

export type MatchBreakdown = {
  requiredSkills: number;
  domainAndRole: number;
  experienceRelevance: number;
  departmentCompatibility: number;
  locationFit: number;
  mismatchPenalty: number;
  capApplied?: number;
};

export type PostingMatchResult = {
  score: number;
  matchBreakdown: MatchBreakdown;
  matchedSkills: string[];
  missingSkills: string[];
  domainMatch: "Strong" | "Adjacent" | "Partial" | "Weak" | "Mismatch";
  matchReason: string;
};

type DomainKey =
  | "environmental"
  | "chemical"
  | "software"
  | "embedded"
  | "data"
  | "hr"
  | "law"
  | "finance"
  | "industrial"
  | "marketing"
  | "mechanical"
  | "electrical"
  | "general";

type DomainDefinition = {
  label: string;
  keywords: string[];
  roles: string[];
  adjacent: DomainKey[];
};

const GEMINI_ANALYSIS_METADATA_PREFIX = "__gemini_analysis_metadata__:";
const GENERIC_SKILLS = new Set(["communication", "teamwork", "problem solving", "excel", "microsoft excel", "ms excel"]);

const DOMAIN_DEFINITIONS: Record<DomainKey, DomainDefinition> = {
  environmental: {
    label: "Environmental / Sustainability",
    keywords: ["environmental", "sustainability", "esg", "water treatment", "water quality", "renewable", "energy", "carbon", "footprint", "climate", "waste", "impact assessment", "treatment plant"],
    roles: ["environmental engineering intern", "sustainability intern", "esg intern", "water treatment intern", "renewable energy intern", "carbon management intern"],
    adjacent: ["chemical", "industrial", "data"],
  },
  chemical: {
    label: "Chemical / Process Engineering / R&D",
    keywords: ["chemical", "process", "r&d", "laboratory", "lab", "hplc", "ftir", "quality control", "production", "pharmaceutical", "gmp", "formulation", "reaction", "plant", "aspen"],
    roles: ["process engineering intern", "r&d laboratory intern", "quality control intern", "production intern", "pharmaceutical r&d intern"],
    adjacent: ["environmental", "industrial", "mechanical"],
  },
  software: {
    label: "Software / Computer Engineering",
    keywords: ["software", "computer", "frontend", "backend", "full stack", "web", "javascript", "typescript", "react", "node", "api", "database", "sql", "qa", "test automation", "python", "java"],
    roles: ["frontend developer intern", "backend developer intern", "software intern", "qa intern", "test intern"],
    adjacent: ["data", "embedded", "industrial"],
  },
  embedded: {
    label: "Embedded Systems / Electronics",
    keywords: ["embedded", "firmware", "microcontroller", "iot", "c/c++", "c++", "c language", "arduino", "stm32", "rtos", "pcb", "electronics", "sensor", "control systems"],
    roles: ["embedded systems intern", "firmware intern", "electronics intern"],
    adjacent: ["software", "electrical", "mechanical"],
  },
  data: {
    label: "Data / AI / Analytics",
    keywords: ["data", "analytics", "science", "machine learning", "ai", "python", "sql", "statistics", "power bi", "tableau", "dashboard", "business intelligence", "predictive", "modeling"],
    roles: ["data science intern", "business intelligence intern", "analytics intern"],
    adjacent: ["software", "finance", "industrial", "marketing", "environmental"],
  },
  hr: {
    label: "Psychology / HR / People Operations",
    keywords: ["psychology", "hr", "human resources", "recruitment", "talent acquisition", "people operations", "organizational", "training", "development", "onboarding", "employee", "candidate"],
    roles: ["recruitment intern", "people operations intern", "organizational psychology intern", "training & development intern"],
    adjacent: ["industrial", "marketing"],
  },
  law: {
    label: "Law / Policy / Compliance",
    keywords: ["law", "legal", "compliance", "policy", "contract", "kvkk", "gdpr", "data protection", "regulation", "regulatory", "privacy", "legal research"],
    roles: ["legal intern", "compliance intern", "data protection intern", "policy research intern"],
    adjacent: ["finance", "hr"],
  },
  finance: {
    label: "Finance / Business",
    keywords: ["finance", "financial", "accounting", "economics", "risk", "audit", "valuation", "budget", "business", "banking", "investment", "marketing analytics"],
    roles: ["financial analyst intern", "risk intern", "business intern", "marketing analytics intern"],
    adjacent: ["data", "industrial", "law", "marketing"],
  },
  industrial: {
    label: "Industrial Engineering / Operations",
    keywords: ["industrial", "operations", "supply chain", "logistics", "lean", "six sigma", "optimization", "production planning", "process improvement", "kpi", "forecasting"],
    roles: ["supply chain intern", "operations intern", "business intelligence intern", "production planning intern"],
    adjacent: ["chemical", "data", "finance", "software", "environmental"],
  },
  marketing: {
    label: "Marketing / Analytics",
    keywords: ["marketing", "campaign", "seo", "google analytics", "consumer", "brand", "content", "social media", "crm", "market research"],
    roles: ["marketing analytics intern", "growth intern", "marketing intern"],
    adjacent: ["data", "finance", "hr"],
  },
  mechanical: {
    label: "Mechanical Engineering",
    keywords: ["mechanical", "cad", "solidworks", "ansys", "manufacturing", "thermal", "machining", "tolerance", "design engineering"],
    roles: ["mechanical engineering intern", "manufacturing intern"],
    adjacent: ["chemical", "industrial", "embedded", "electrical"],
  },
  electrical: {
    label: "Electrical / Electronics Engineering",
    keywords: ["electrical", "electronics", "circuit", "pcb", "power", "signal", "control", "microcontroller", "embedded", "sensor"],
    roles: ["electrical engineering intern", "electronics intern", "embedded systems intern"],
    adjacent: ["embedded", "software", "mechanical"],
  },
  general: { label: "General", keywords: [], roles: [], adjacent: [] },
};

const SKILL_ALIASES: Record<string, string[]> = {
  react: ["react", "frontend", "front end", "javascript", "typescript", "web development", "ui"],
  javascript: ["javascript", "js", "frontend", "react", "web development"],
  postgresql: ["postgresql", "postgres", "sql", "database", "relational database"],
  sql: ["sql", "postgresql", "database", "data analysis", "business intelligence"],
  "carbon footprint": ["carbon footprint", "carbon management", "sustainability", "esg", "climate", "emissions"],
  sustainability: ["sustainability", "esg", "carbon footprint", "environmental", "impact assessment"],
  "water quality analysis": ["water quality analysis", "water treatment", "environmental engineering", "wastewater", "sampling"],
  hplc: ["hplc", "laboratory", "lab", "quality control", "analytical chemistry"],
  ftir: ["ftir", "laboratory", "lab", "quality control", "analytical chemistry"],
  recruitment: ["recruitment", "hr", "talent acquisition", "candidate screening", "interviewing"],
  "contract review": ["contract review", "legal", "compliance", "policy", "regulatory"],
  kvkk: ["kvkk", "gdpr", "data protection", "privacy", "compliance"],
  "quality control": ["quality control", "laboratory", "hplc", "ftir", "gmp", "statistical quality control"],
  embedded: ["embedded", "firmware", "microcontroller", "c++", "c/c++", "iot"],
};

const normalize = (value: string | null | undefined) =>
  (value ?? "")
    .toLowerCase()
    .replace(/[&/,_-]/g, " ")
    .replace(/[^\p{L}\p{N}+#.\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const safeArray = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);

const parsePersistedGeminiMetadata = (items: string[]) => {
  const marker = items.find((item) => item.startsWith(GEMINI_ANALYSIS_METADATA_PREFIX));
  if (!marker) return null;

  try {
    return JSON.parse(marker.slice(GEMINI_ANALYSIS_METADATA_PREFIX.length)) as Partial<SearchCvAnalysis>;
  } catch {
    return null;
  }
};

const skillTerms = (skill: string): string[] => {
  const normalized = normalize(skill);
  if (!normalized) return [];
  const aliasEntries = Object.entries(SKILL_ALIASES)
    .filter(([key, aliases]) => key === normalized || aliases.some((alias) => normalize(alias) === normalized))
    .flatMap(([key, aliases]) => [key, ...aliases]);
  return Array.from(new Set([normalized, ...aliasEntries.map(normalize)])).filter(Boolean);
};

const looseIncludes = (haystack: string, needle: string) => {
  const a = normalize(haystack);
  const b = normalize(needle);
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
};

const isGenericSkill = (skill: string) => GENERIC_SKILLS.has(normalize(skill));

const findMatchingSkill = (studentSkill: string, postingSkill: string) => {
  const studentTerms = skillTerms(studentSkill);
  const postingTerms = skillTerms(postingSkill);
  return studentTerms.some((studentTerm) => postingTerms.some((postingTerm) => looseIncludes(studentTerm, postingTerm)));
};

const scoreDomain = (text: string, domain: DomainDefinition) => {
  const haystack = normalize(text);
  return domain.keywords.reduce((score, keyword) => score + (haystack.includes(normalize(keyword)) ? 1 : 0), 0)
    + domain.roles.reduce((score, role) => score + (haystack.includes(normalize(role)) ? 2 : 0), 0);
};

const inferDomain = (signals: string[], preferredDomain?: string): DomainKey => {
  const preferred = normalize(preferredDomain);
  if (preferred) {
    const direct = (Object.entries(DOMAIN_DEFINITIONS) as [DomainKey, DomainDefinition][])
      .find(([, definition]) => normalize(definition.label).includes(preferred) || preferred.includes(normalize(definition.label)) || definition.keywords.some((keyword) => preferred.includes(normalize(keyword))));
    if (direct) return direct[0];
  }

  const text = signals.join(" ");
  const ranked = (Object.entries(DOMAIN_DEFINITIONS) as [DomainKey, DomainDefinition][])
    .filter(([key]) => key !== "general")
    .map(([key, definition]) => ({ key, score: scoreDomain(text, definition) }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.score > 0 ? ranked[0].key : "general";
};

const domainRelationship = (studentDomain: DomainKey, postingDomain: DomainKey) => {
  if (studentDomain === "general" || postingDomain === "general") return "Partial" as const;
  if (studentDomain === postingDomain) return "Strong" as const;
  if (DOMAIN_DEFINITIONS[studentDomain].adjacent.includes(postingDomain) || DOMAIN_DEFINITIONS[postingDomain].adjacent.includes(studentDomain)) return "Adjacent" as const;
  return "Mismatch" as const;
};

const getPostingSignals = (posting: SearchPosting | InternshipPosting) => [
  posting.title,
  posting.description,
  posting.industry,
  posting.location,
  ...((posting.required_skills ?? []) as string[]),
  ...((posting.desired_skills ?? []) as string[]),
].filter(Boolean) as string[];

const uniqueLabels = (items: string[]) => Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

export const calculatePostingMatch = (posting: SearchPosting | InternshipPosting, analysis: SearchCvAnalysis | null): PostingMatchResult => {
  if (!analysis) {
    return {
      score: 70,
      matchBreakdown: { requiredSkills: 20, domainAndRole: 15, experienceRelevance: 10, departmentCompatibility: 8, locationFit: 5, mismatchPenalty: 0 },
      matchedSkills: [],
      missingSkills: (posting.required_skills ?? []).slice(0, 4),
      domainMatch: "Partial",
      matchReason: "Upload and analyze a CV to calculate a personalized, domain-sensitive score.",
    };
  }

  const analysisIsGemini = analysis.analysis_source === "gemini";
  const studentSkills = uniqueLabels([
    ...(analysis.extracted_skills ?? []),
    ...(analysisIsGemini ? analysis.strengths ?? [] : []),
  ]);
  const roleSignals = uniqueLabels([...(analysis.suggested_roles ?? []), ...(analysisIsGemini ? analysis.strengths ?? [] : [])]);
  const studentDomain = inferDomain([...studentSkills, ...roleSignals, ...(analysis.weaknesses ?? [])], analysisIsGemini ? analysis.detected_domain : undefined);
  const postingSignals = getPostingSignals(posting);
  const postingDomain = inferDomain(postingSignals, posting.industry ?? undefined);
  const relationship = domainRelationship(studentDomain, postingDomain);

  const requiredSkills = uniqueLabels(posting.required_skills ?? []);
  const desiredSkills = uniqueLabels(posting.desired_skills ?? []);
  const nonGenericRequired = requiredSkills.filter((skill) => !isGenericSkill(skill));
  const skillsForRequiredScore = nonGenericRequired.length ? nonGenericRequired : requiredSkills;
  const matchedRequired = skillsForRequiredScore.filter((required) => studentSkills.some((skill) => findMatchingSkill(skill, required)));
  const matchedDesired = desiredSkills.filter((desired) => studentSkills.some((skill) => findMatchingSkill(skill, desired)));
  const textPool = normalize(postingSignals.join(" "));
  const contextualMatches = studentSkills.filter((skill) => !isGenericSkill(skill) && skillTerms(skill).some((term) => textPool.includes(term)));
  const matchedSkills = uniqueLabels([...matchedRequired, ...matchedDesired, ...contextualMatches]).slice(0, 8);
  const missingSkills = skillsForRequiredScore.filter((required) => !matchedRequired.includes(required)).slice(0, 6);

  const requiredRatio = skillsForRequiredScore.length ? matchedRequired.length / skillsForRequiredScore.length : 0.35;
  const requiredSkillsScore = Math.min(45, requiredRatio * 45 + Math.min(6, matchedDesired.length * 1.5));

  const roleMatches = roleSignals.filter((role) => {
    const roleText = normalize(role);
    return roleText && (textPool.includes(roleText) || normalize(posting.title).includes(roleText) || DOMAIN_DEFINITIONS[postingDomain].roles.some((postingRole) => looseIncludes(postingRole, roleText)));
  }).length;
  const domainBase = relationship === "Strong" ? 18 : relationship === "Adjacent" ? 14 : relationship === "Partial" ? 8 : 0;
  const domainAndRoleScore = Math.min(25, domainBase + Math.min(7, roleMatches * 3.5));

  const experienceTerms = uniqueLabels([...(analysis.strengths ?? []), ...(analysis.extracted_skills ?? [])]).filter((skill) => !isGenericSkill(skill));
  const experienceHits = experienceTerms.filter((term) => skillTerms(term).some((alias) => textPool.includes(alias))).length;
  const experienceScore = Math.min(15, experienceHits * 3 + (relationship === "Strong" ? 3 : relationship === "Adjacent" ? 2 : 0));

  const departmentScore = relationship === "Strong" ? 10 : relationship === "Adjacent" ? 7 : relationship === "Partial" ? 4 : 0;
  const locationScore = 5; // The app does not persist student location preferences yet, so active/remote/on-site roles receive neutral full credit.

  const mismatchPenalty = relationship === "Mismatch" ? (requiredRatio === 0 ? 55 : requiredRatio < 0.25 ? 45 : 35) : 0;
  let rawScore = requiredSkillsScore + domainAndRoleScore + experienceScore + departmentScore + locationScore - mismatchPenalty;

  let capApplied: number | undefined;
  if (relationship === "Mismatch") capApplied = 35;
  else if (relationship === "Partial" && requiredRatio < 0.35) capApplied = 55;
  else if (relationship === "Strong" && requiredRatio >= 0.45) capApplied = 95;
  else if (relationship === "Strong") capApplied = 80;
  else if (relationship === "Adjacent" && requiredRatio < 0.25) capApplied = 70;
  else if (relationship === "Adjacent") capApplied = 90;

  if (relationship === "Adjacent") rawScore = Math.max(rawScore, requiredRatio >= 0.25 ? 65 : 55);
  if (relationship === "Strong") rawScore = Math.max(rawScore, requiredRatio >= 0.35 ? 70 : 60);

  rawScore = Math.max(15, Math.min(capApplied ?? 95, rawScore));
  const score = Math.min(95, Math.round(rawScore));
  const domainMatch = relationship === "Mismatch" ? "Mismatch" : relationship;
  const studentLabel = DOMAIN_DEFINITIONS[studentDomain].label;
  const postingLabel = DOMAIN_DEFINITIONS[postingDomain].label;
  const matchReason = domainMatch === "Mismatch"
    ? `${studentLabel} is not closely related to ${postingLabel}, so the score is capped despite any generic skills.`
    : domainMatch === "Strong"
      ? `Strong alignment with ${postingLabel.toLowerCase()} plus ${matchedSkills.length} relevant skill match${matchedSkills.length === 1 ? "" : "es"}.`
      : domainMatch === "Adjacent"
        ? `${studentLabel} is adjacent to ${postingLabel}; score depends on specific technical skill overlap.`
        : `Some transferable signals exist, but stronger domain and required-skill evidence is needed.`;

  return {
    score,
    matchBreakdown: {
      requiredSkills: Math.round(requiredSkillsScore),
      domainAndRole: Math.round(domainAndRoleScore),
      experienceRelevance: Math.round(experienceScore),
      departmentCompatibility: Math.round(departmentScore),
      locationFit: locationScore,
      mismatchPenalty,
      capApplied,
    },
    matchedSkills,
    missingSkills,
    domainMatch,
    matchReason,
  };
};

export const getLatestSearchCvAnalysis = async (): Promise<SearchCvAnalysis | null> => {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    if (authError) console.error("Failed to resolve current user for search CV analysis", authError);
    return null;
  }

  const { data: person, error: personError } = await supabase
    .from("persons")
    .select("person_id")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();

  if (personError || !person?.person_id) {
    if (personError) console.error("Failed to resolve person for search CV analysis", personError);
    return null;
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("student_id")
    .eq("person_id", person.person_id)
    .maybeSingle();

  if (studentError || !student?.student_id) {
    if (studentError) console.error("Failed to resolve student for search CV analysis", studentError);
    return null;
  }

  const { data: analysis, error: analysisError } = await supabase
    .from("cv_analysis_reports")
    .select("extracted_skills, strengths, weaknesses, suggested_roles, improvement_suggestions, overall_score, created_at")
    .eq("student_id", student.student_id)
    .eq("analysis_status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (analysisError) {
    console.error("Failed to load latest completed CV analysis for search", analysisError);
    return null;
  }

  if (!analysis) return null;

  const improvementSuggestions = safeArray(analysis.improvement_suggestions);
  const geminiMetadata = parsePersistedGeminiMetadata(improvementSuggestions);

  return {
    detected_domain: typeof geminiMetadata?.detected_domain === "string" ? geminiMetadata.detected_domain : undefined,
    extracted_skills: safeArray(analysis.extracted_skills),
    strengths: safeArray(analysis.strengths),
    weaknesses: safeArray(analysis.weaknesses),
    suggested_roles: safeArray(analysis.suggested_roles),
    overall_score: typeof analysis.overall_score === "number" ? analysis.overall_score : null,
    analysis_source: geminiMetadata?.analysis_source === "gemini" ? "gemini" : geminiMetadata?.analysis_source === "rule_based" ? "rule_based" : undefined,
    created_at: typeof analysis.created_at === "string" ? analysis.created_at : "",
  };
};

export const getSearchActivePostings = async (): Promise<SearchPosting[]> => {
  if (!isSupabaseConfigured || !supabase) {
    return POSTINGS.map((posting) => ({ ...posting, required_skills: [], desired_skills: [] }));
  }

  const { data, error } = await supabase
    .from("internship_postings")
    .select("internship_posting_id, company_id, representative_id, title, description, location, industry, required_skills, desired_skills, start_date, duration_weeks, is_paid, monthly_stipend, is_remote, status, created_at, deadline, companies(name)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load active internship postings for search", error);
    return POSTINGS.map((posting) => ({ ...posting, required_skills: [], desired_skills: [] }));
  }

  if (!data || data.length === 0) return [];

  return data.map((posting) => ({
    posting_id: posting.internship_posting_id,
    company_id: posting.company_id,
    rep_id: posting.representative_id,
    title: posting.title,
    description: posting.description,
    location: posting.location,
    industry: posting.industry,
    required_skills: Array.isArray(posting.required_skills) ? posting.required_skills : [],
    desired_skills: Array.isArray(posting.desired_skills) ? posting.desired_skills : [],
    start_date: posting.start_date,
    duration_weeks: posting.duration_weeks,
    is_paid: posting.is_paid,
    monthly_stipend_try: posting.monthly_stipend ?? null,
    is_remote: posting.is_remote,
    status: posting.status,
    created_at: posting.created_at,
    deadline: posting.deadline,
    company_name: ((Array.isArray(posting.companies) ? posting.companies[0] : posting.companies) as { name?: string } | null | undefined)?.name ?? "Unknown Company",
  }));
};
