import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type StudentCvAnalysis = {
  extracted_skills: string[];
  suggested_roles: string[];
  strengths: string[];
  weaknesses: string[];
  improvement_suggestions: string[];
  overall_score: number | null;
  created_at: string;
  updated_at: string;
};

type Resource = {
  title: string;
  provider: string;
  url: string;
  skill?: string;
  type?: "Technical" | "Soft Skill";
  level: "Beginner" | "Intermediate" | "Advanced";
  cost_type: "Free" | "Freemium" | "Paid" | "Audit available";
  description: string;
};
type DomainTemplate = { domain: string; keywords: string[]; requiredSkills: string[]; roles: string[]; resources: Resource[] };

const safe = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const l = (v: string) => v.toLowerCase();
const R = (resource: Resource): Resource => resource;
const norm = (v: string) => l(v).replace(/[^\p{L}\p{N}\s+/.-]/gu, " ").replace(/\s+/g, " ").trim();
const includesLoose = (text: string, token: string) => text.includes(norm(token));
const overlaps = (a: string, b: string) => includesLoose(norm(a), b) || includesLoose(norm(b), a);

const DOMAIN_TEMPLATES: DomainTemplate[] = [
  // Expanded deterministic templates for major departments/domains
  { domain: "Software / Computer Engineering / Web Development", keywords: ["software","computer engineering","computer science","developer","software developer","frontend","front-end","backend","back-end","full stack","full-stack","web development","react","javascript","typescript","node","node.js","express","api","rest api","database","sql","git","github","html","css","programming","coding","yazılım","bilgisayar mühendisliği","geliştirici"], requiredSkills: ["JavaScript","TypeScript","React","Node.js","REST API","SQL","Git","Testing","HTML","CSS"], roles: ["Software Developer Intern","Frontend Developer Intern","Backend Developer Intern","Full Stack Developer Intern","Web Developer Intern","QA/Test Intern"], resources: [R({ title: "freeCodeCamp Learn", provider: "freeCodeCamp", url: "https://www.freecodecamp.org/learn/", type: "Technical", level: "Beginner", cost_type: "Free", description: "Hands-on web development modules may help build practical coding skills." }), R({ title: "MDN Web Docs", provider: "MDN", url: "https://developer.mozilla.org/en-US/docs/Learn", type: "Technical", level: "Beginner", cost_type: "Free", description: "Official web platform guides can support HTML, CSS, and JavaScript learning." }), R({ title: "React Official Learn", provider: "React", url: "https://react.dev/learn", type: "Technical", level: "Intermediate", cost_type: "Free", description: "React tutorials may help strengthen frontend component development." }), R({ title: "Node.js Learn", provider: "Node.js", url: "https://nodejs.org/en/learn", type: "Technical", level: "Beginner", cost_type: "Free", description: "Node.js resources can support backend fundamentals and API work." }), R({ title: "SQLBolt", provider: "SQLBolt", url: "https://sqlbolt.com/", type: "Technical", level: "Beginner", cost_type: "Free", description: "Interactive SQL practice is useful for database fundamentals." }), R({ title: "GitHub Skills", provider: "GitHub", url: "https://skills.github.com/", type: "Technical", level: "Beginner", cost_type: "Free", description: "GitHub Skills may help improve version-control collaboration." })] },
  { domain: "Data Science / AI / Statistics / Analytics", keywords: ["data science","artificial intelligence","machine learning","ai","ml","data analyst","analytics","data analysis","python","pandas","numpy","statistics","regression","classification","power bi","tableau","sql","visualization","model","dashboard","veri analizi","yapay zeka","makine öğrenmesi","istatistik"], requiredSkills: ["Python","SQL","Pandas","NumPy","Statistics","Machine Learning","Data Visualization","Power BI/Tableau","scikit-learn"], roles: ["Data Analyst Intern","Data Science Intern","AI Intern","Machine Learning Intern","Business Intelligence Intern"], resources: [R({ title: "Kaggle Learn", provider: "Kaggle", url: "https://www.kaggle.com/learn", type: "Technical", level: "Beginner", cost_type: "Free", description: "Practical notebooks may help with hands-on data analysis." }), R({ title: "Google Machine Learning Crash Course", provider: "Google", url: "https://developers.google.com/machine-learning/crash-course", type: "Technical", level: "Beginner", cost_type: "Free", description: "Core ML concepts can support model-building fundamentals." }), R({ title: "scikit-learn Tutorials", provider: "scikit-learn", url: "https://scikit-learn.org/stable/tutorial/index.html", type: "Technical", level: "Intermediate", cost_type: "Free", description: "Official tutorials are useful for classical ML pipelines." }), R({ title: "Mode SQL Tutorial", provider: "Mode", url: "https://mode.com/sql-tutorial/", type: "Technical", level: "Beginner", cost_type: "Free", description: "SQL exercises may help analytics querying workflows." }), R({ title: "Microsoft Power BI Learning", provider: "Microsoft", url: "https://learn.microsoft.com/en-us/training/powerplatform/power-bi/", type: "Technical", level: "Intermediate", cost_type: "Free", description: "Power BI paths can support dashboard and reporting skills." })] },
  { domain: "Law / Policy / International Relations", keywords: ["law","legal","lawyer","legal intern","legal research","legal writing","contract","contract review","compliance","regulation","policy","policy analysis","corporate law","commercial law","labor law","employment law","data protection","kvkk","gdpr","case analysis","court","litigation","dispute resolution","international law","political science","international relations","public affairs","diplomacy","legal memo","hukuk","avukat","sözleşme","uyum","mevzuat","dava","politika","uluslararası ilişkiler","siyaset bilimi"], requiredSkills: ["Legal Research","Contract Review","Legal Writing","Case Analysis","Compliance","Policy Analysis","Corporate Law","Commercial Law","Labor Law","Data Protection","KVKK","GDPR","Critical Thinking","Academic Writing","Client Communication"], roles: ["Legal Intern","Compliance Intern","Policy Research Intern","Corporate Law Intern","Data Protection Intern","Public Affairs Intern","International Relations Intern"], resources: [R({ title: "United Nations Resources", provider: "UN", url: "https://www.un.org/en/our-work", type: "Soft Skill", level: "Beginner", cost_type: "Free", description: "UN content may help with global policy and governance context." }), R({ title: "EU Learning Corner", provider: "European Union", url: "https://learning-corner.learning.europa.eu/index_en", type: "Soft Skill", level: "Beginner", cost_type: "Free", description: "EU materials can support policy awareness and institutional literacy." }), R({ title: "Coursera Law", provider: "Coursera", url: "https://www.coursera.org/browse/social-sciences/law", type: "Soft Skill", level: "Intermediate", cost_type: "Audit available", description: "Law catalog courses may help strengthen legal foundations." }), R({ title: "Purdue OWL", provider: "Purdue OWL", url: "https://owl.purdue.edu/", type: "Soft Skill", level: "Beginner", cost_type: "Free", description: "Academic writing guidance is useful for legal writing practice." })] },
  { domain: "General / Early Career", keywords: [], requiredSkills: ["Communication","Excel","Research","Presentation","Teamwork","Time Management","Problem Solving","Reporting"], roles: ["General Intern","Project Intern","Operations Intern","Research Intern"], resources: [R({ title: "Google Digital Garage", provider: "Google", url: "https://learndigital.withgoogle.com/digitalgarage", type: "Soft Skill", level: "Beginner", cost_type: "Free", description: "General digital and professional skill modules for early career learners." }), R({ title: "Coursera Career Success", provider: "Coursera", url: "https://www.coursera.org/learn/career-success", type: "Soft Skill", level: "Beginner", cost_type: "Audit available", description: "Career development course focused on communication and employability skills." }), R({ title: "Microsoft Excel Support", provider: "Microsoft", url: "https://support.microsoft.com/excel", type: "Technical", level: "Beginner", cost_type: "Free", description: "Official tutorials and help pages for practical spreadsheet skills." })] },
];
const GENERAL_TEMPLATE = DOMAIN_TEMPLATES.find((t) => t.domain === "General / Early Career") ?? DOMAIN_TEMPLATES[DOMAIN_TEMPLATES.length - 1];

// rest unchanged
export const getCurrentStudentId = async (): Promise<string | null> => { /*...*/
  if (!isSupabaseConfigured || !supabase) return null;
  const { data: au } = await supabase.auth.getUser(); if (!au.user) return null;
  const { data: p } = await supabase.from("persons").select("person_id").eq("auth_user_id", au.user.id).maybeSingle(); if (!p?.person_id) return null;
  const { data: s } = await supabase.from("students").select("student_id").eq("person_id", p.person_id).maybeSingle();
  return s?.student_id ?? null;
};

export const getLatestStudentCvAnalysis = async (): Promise<StudentCvAnalysis | null> => {
  const studentId = await getCurrentStudentId(); if (!studentId || !supabase) return null;
  const { data } = await supabase.from("cv_analysis_reports").select("extracted_skills,suggested_roles,strengths,weaknesses,improvement_suggestions,overall_score,created_at,updated_at").eq("student_id", studentId).eq("analysis_status", "completed").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!data) return null;
  return { extracted_skills: safe(data.extracted_skills), suggested_roles: safe(data.suggested_roles), strengths: safe(data.strengths), weaknesses: safe(data.weaknesses), improvement_suggestions: safe(data.improvement_suggestions), overall_score: typeof data.overall_score === "number" ? data.overall_score : null, created_at: data.created_at ?? "", updated_at: data.updated_at ?? "" };
};

export const detectStudentDomain = (analysis: StudentCvAnalysis | null) => {
  if (!DOMAIN_TEMPLATES.length) {
    return { domain: "General / Early Career", confidence: 40, matchedKeywords: [], suggestedRoles: [] };
  }
  const roles = safe(analysis?.suggested_roles);
  const skills = safe(analysis?.extracted_skills);
  const rolesText = norm(roles.join(" "));
  const skillsText = norm(skills.join(" "));
  const contextText = norm([...safe(analysis?.strengths), ...safe(analysis?.weaknesses), ...safe(analysis?.improvement_suggestions)].join(" "));
  const allText = norm([rolesText, skillsText, contextText].join(" "));
  const generic = ["data","analysis","research","project","communication","excel","reporting","management","internship","intern","student"];
  const strongSoftware = ["software","developer","frontend","backend","full stack","react","javascript","typescript","node","html","css","api","git","database","computer engineering","programming","coding"];
  const strongData = ["python","machine learning","ai","artificial intelligence","pandas","numpy","statistics","power bi","tableau","data science","data analyst","sql","model","visualization"];
  const scores = DOMAIN_TEMPLATES.map((d) => {
    let score = 0;
    const matched = new Set<string>();
    roles.forEach((r) => d.roles.forEach((dr) => { if (overlaps(r, dr)) { score += 8; matched.add(dr); } }));
    skills.forEach((s) => d.requiredSkills.forEach((rs) => { if (overlaps(s, rs)) { score += 5; matched.add(rs); } }));
    d.keywords.forEach((k) => {
      const isGeneric = generic.includes(norm(k));
      if (includesLoose(rolesText, k) || includesLoose(skillsText, k)) score += isGeneric ? 0 : 2;
      else if (includesLoose(contextText, k)) score += isGeneric ? 0 : 1;
      if (includesLoose(allText, k)) matched.add(k);
    });
    return { d, score, matched: [...matched] };
  });
  scores.sort((a,b)=>b.score-a.score);
  const top = scores[0]; const second = scores[1];
  let domain = top?.score ? top.d.domain : "General / Early Career";
  const overrideMap: [string[], string][] = [
    [["legal intern","compliance intern","policy research intern","corporate law intern","data protection intern"],"Law / Policy / International Relations"],
    [["hr intern","recruitment intern","people operations intern"],"Psychology / HR / People Operations"],
    [["finance intern","financial analyst intern","accounting intern"],"Finance / Economics / Accounting"],
  ];
  const joinedRoles = rolesText;
  for (const [needles, forced] of overrideMap) if (needles.some((n) => includesLoose(joinedRoles, n))) domain = forced;
  if (domain.includes("Software") && !strongSoftware.some((k) => includesLoose(allText, k))) domain = "General / Early Career";
  if (domain.includes("Data Science") && !strongData.some((k) => includesLoose(allText, k))) domain = "General / Early Career";
  const scoreGap = (top?.score ?? 0) - (second?.score ?? 0);
  const confidence = top?.score ? (top.score < 10 ? 55 : scoreGap >= 10 ? Math.min(98, 80 + Math.floor(scoreGap / 2)) : 55 + Math.min(20, scoreGap * 3)) : 50;
  return { domain, confidence, matchedKeywords: top?.matched ?? [], suggestedRoles: analysis?.suggested_roles ?? [] };
};

const findTemplateByDomainContains = (needle: string) =>
  DOMAIN_TEMPLATES.find((d) => norm(d.domain).includes(norm(needle)));

export const getDomainSkillTemplate = (domain: string | null | undefined) => {
  if (!DOMAIN_TEMPLATES.length) return GENERAL_TEMPLATE;
  if (!domain) return GENERAL_TEMPLATE;
  const exact = DOMAIN_TEMPLATES.find((d) => d.domain === domain);
  if (exact) return exact;
  const v = norm(domain);
  const fromKeywords = (keywords: string[], templateNeedles: string[]) =>
    keywords.some((k) => v.includes(k))
      ? templateNeedles.map((needle) => findTemplateByDomainContains(needle)).find(Boolean)
      : null;

  return (
    fromKeywords(["law", "policy", "international relations"], ["law"]) ??
    fromKeywords(["psychology", "hr", "people"], ["psychology", "hr", "people"]) ??
    fromKeywords(["finance", "economics", "accounting"], ["finance", "economics", "accounting"]) ??
    fromKeywords(["marketing", "communication", "media"], ["marketing", "communication", "media"]) ??
    fromKeywords(["education", "teaching", "guidance"], ["education", "teaching", "guidance"]) ??
    fromKeywords(["design", "ux", "visual"], ["design", "ux", "visual"]) ??
    fromKeywords(["mechanical"], ["mechanical"]) ??
    fromKeywords(["electrical", "electronics"], ["electrical", "electronics"]) ??
    fromKeywords(["civil", "architecture", "construction"], ["civil", "architecture", "construction"]) ??
    fromKeywords(["biomedical", "biotechnology", "life sciences"], ["biomedical", "biotechnology", "life sciences"]) ??
    fromKeywords(["environmental", "sustainability", "energy"], ["environmental", "sustainability", "energy"]) ??
    fromKeywords(["mechatronics", "robotics", "automation"], ["mechatronics", "robotics", "automation"]) ??
    fromKeywords(["chemical", "process", "r&d"], ["chemical", "process", "r&d"]) ??
    fromKeywords(["industrial", "operations", "supply chain"], ["industrial", "operations", "supply chain"]) ??
    fromKeywords(["business", "strategy", "product"], ["business", "strategy", "product"]) ??
    fromKeywords(["data", "ai", "analytics"], ["data science", "ai", "analytics"]) ??
    fromKeywords(["software", "computer", "web"], ["software", "computer", "web"]) ??
    GENERAL_TEMPLATE
  );
};
const getSafeTemplate = (domain: string | null | undefined) => getDomainSkillTemplate(domain) ?? GENERAL_TEMPLATE;

export const generateSkillGaps = (analysis: StudentCvAnalysis | null) => {
  const det = detectStudentDomain(analysis); const template = getSafeTemplate(det.confidence < 55 ? "General / Early Career" : det.domain);
  const requiredSkills = template.requiredSkills?.length ? template.requiredSkills : (GENERAL_TEMPLATE?.requiredSkills ?? []);
  const roles = template.roles ?? [];
  const resources = template.resources ?? [];
  const have = new Set(safe(analysis?.extracted_skills).map(l));
  const gaps = requiredSkills.filter(s => !have.has(l(s))).slice(0,8).map((skill,i)=>({ skill, currentLevel: Math.max(1, 3-i%3), targetLevel: 4, urgency: i<3?"High":i<6?"Medium":"Low", reason: safe(analysis?.weaknesses)[0] || `This is frequently required in ${det.domain}.`, relatedRoles: roles.slice(0,3), resources: resources.slice(0,3) }));
  return gaps.length ? gaps : requiredSkills.slice(0,3).map(skill=>({ skill,currentLevel:2,targetLevel:4,urgency:"Medium",reason:"Foundation building.",relatedRoles:roles.slice(0,2),resources:resources.slice(0,2)}));
};

export const generateLearningPath = (analysis: StudentCvAnalysis | null) => {
  const det = detectStudentDomain(analysis);
  const template = getSafeTemplate(det.confidence < 55 ? "General / Early Career" : det.domain);
  const templateResources = template.resources ?? [];
  const generalResources = GENERAL_TEMPLATE?.resources ?? [];
  const gaps = generateSkillGaps(analysis) ?? [];
  const fallbackSkill = template.requiredSkills?.[0] ?? "Communication";
  const resources = [...templateResources, ...generalResources].slice(0,12).map((r, idx)=>({ id:`res-${idx}-${r.title}`,...r, skill: gaps.length ? gaps[idx % gaps.length]?.skill ?? fallbackSkill : fallbackSkill }));
  return { domain: det.domain, resources, roadmap: { week: resources.slice(0,3), month: resources.slice(3,7), quarter: resources.slice(7,12) } };
};
export const generateProjectSuggestions = (analysis: StudentCvAnalysis | null) => generateSkillGaps(analysis).slice(0,4).map((g, i) => `${i + 1}. Build a portfolio project that demonstrates ${g.skill} for ${g.relatedRoles[0]}.`);
export const generateInterviewPreparation = (analysis: StudentCvAnalysis | null) => generateSkillGaps(analysis).slice(0,4).map((g) => `Prepare STAR examples for ${g.skill} and explain how you improved it.`);
export const generateNotifications = (analysis: StudentCvAnalysis | null) => {
  if (!analysis) return [{ id: "onboarding", type: "cv improvement reminder", title: "Upload and analyze your CV", message: "Complete onboarding to unlock personalized insights.", link: "/onboarding" }];
  const det = detectStudentDomain(analysis); const gap = generateSkillGaps(analysis)[0];
  return [
    { id: "gap", type: "skill gap alert", title: `${gap.skill} needs attention`, message: gap.reason, link: "/skill-gap" },
    { id: "learn", type: "learning recommendation", title: `Start your ${det.domain} learning path`, message: "Your roadmap is ready.", link: "/learning-path" },
    { id: "role", type: "suggested role insight", title: "Suggested roles updated", message: (analysis.suggested_roles[0] ?? "General Intern") + " is a strong next step.", link: "/profile" },
    { id: "cv", type: "cv improvement reminder", title: "Improve your CV clarity", message: analysis.improvement_suggestions[0] ?? "Add measurable achievements.", link: "/profile" },
    { id: "project", type: "project suggestion", title: "New project idea", message: generateProjectSuggestions(analysis)[0], link: "/profile" },
    { id: "interview", type: "interview preparation reminder", title: "Interview prep task", message: generateInterviewPreparation(analysis)[0], link: "/learning-path" },
  ];
};
export const generateProfileInsights = (analysis: StudentCvAnalysis | null) => ({ domain: detectStudentDomain(analysis), skillGaps: generateSkillGaps(analysis), projects: generateProjectSuggestions(analysis), interviewPrep: generateInterviewPreparation(analysis) });
