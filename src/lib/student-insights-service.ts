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

const DOMAIN_TEMPLATES: DomainTemplate[] = [
  { domain: "Software / Computer Engineering / Web Development", keywords: ["software","computer engineering","computer science","developer","react","javascript","typescript","node","backend","frontend","full stack","api","git","sql","database"], requiredSkills: ["JavaScript","TypeScript","React","Node.js","REST API","SQL","Git","Testing","HTML","CSS"], roles: ["Software Developer Intern","Frontend Intern","Backend Intern","Full Stack Intern","Web Developer Intern"], resources: [R({ title: "freeCodeCamp Learn", provider: "freeCodeCamp", url: "https://www.freecodecamp.org/learn/", type: "Technical", level: "Beginner", cost_type: "Free", description: "Hands-on coding modules for web development fundamentals." }), R({ title: "MDN Web Docs", provider: "MDN", url: "https://developer.mozilla.org/en-US/docs/Learn", type: "Technical", level: "Beginner", cost_type: "Free", description: "Reference and tutorials for HTML, CSS, JavaScript, and web APIs." }), R({ title: "React Official Learn", provider: "React", url: "https://react.dev/learn", type: "Technical", level: "Intermediate", cost_type: "Free", description: "Official React learning path for component and state fundamentals." }), R({ title: "Node.js Learn", provider: "Node.js", url: "https://nodejs.org/en/learn", type: "Technical", level: "Beginner", cost_type: "Free", description: "Core learning resources for backend JavaScript with Node.js." }), R({ title: "GitHub Skills", provider: "GitHub", url: "https://skills.github.com/", type: "Technical", level: "Beginner", cost_type: "Free", description: "Interactive exercises for Git, GitHub workflows, and collaboration." })] },
  { domain: "Data Science / AI / Statistics / Analytics", keywords: ["data science","artificial intelligence","machine learning","python","pandas","numpy","statistics","power bi","tableau","sql","analytics","model"], requiredSkills: ["Python","SQL","Pandas","NumPy","Statistics","Machine Learning","Data Visualization","Power BI/Tableau","scikit-learn"], roles: ["Data Analyst Intern","Data Science Intern","AI Intern","Machine Learning Intern","BI Intern"], resources: [R({ title: "Kaggle Learn", provider: "Kaggle", url: "https://www.kaggle.com/learn", type: "Technical", level: "Beginner", cost_type: "Free", description: "Short practical lessons on Python, ML, and data analysis." }), R({ title: "Google Machine Learning Crash Course", provider: "Google", url: "https://developers.google.com/machine-learning/crash-course", type: "Technical", level: "Beginner", cost_type: "Free", description: "Foundational machine learning concepts with guided exercises." }), R({ title: "scikit-learn Tutorials", provider: "scikit-learn", url: "https://scikit-learn.org/stable/tutorial/index.html", type: "Technical", level: "Intermediate", cost_type: "Free", description: "Official tutorials for classical ML workflows in Python." }), R({ title: "Mode SQL Tutorial", provider: "Mode", url: "https://mode.com/sql-tutorial/", type: "Technical", level: "Beginner", cost_type: "Free", description: "Step-by-step SQL practice for analytics workflows." }), R({ title: "Microsoft Power BI Learning", provider: "Microsoft", url: "https://learn.microsoft.com/en-us/training/powerplatform/power-bi/", type: "Technical", level: "Intermediate", cost_type: "Free", description: "Official learning paths for dashboarding and reporting in Power BI." })] },
  { domain: "Chemical Engineering / Chemistry / Process / R&D", keywords: ["chemical engineering","chemistry","process","laboratory","r&d","quality control","hplc","ftir","aspen","matlab","gmp","validation","thermodynamics","distillation"], requiredSkills: ["Process Engineering","Quality Control","R&D","Aspen Plus","MATLAB","HPLC","FTIR","Process Validation","GMP","Data Analysis","Laboratory Safety"], roles: ["R&D Intern","Process Engineering Intern","Quality Control Intern","Laboratory Intern","Production Intern"], resources: [R({ title: "MIT OpenCourseWare", provider: "MIT", url: "https://ocw.mit.edu/", type: "Technical", level: "Beginner", cost_type: "Free", description: "University-level chemical engineering and science course materials." }), R({ title: "AspenTech University", provider: "AspenTech", url: "https://www.aspentech.com/en/aspentech-university", type: "Technical", level: "Intermediate", cost_type: "Freemium", description: "Training resources for AspenTech tools and process modeling workflows." }), R({ title: "FDA cGMP Basics", provider: "U.S. FDA", url: "https://www.fda.gov/drugs/pharmaceutical-quality-resources/facts-about-current-good-manufacturing-practices-cgmps", type: "Technical", level: "Beginner", cost_type: "Free", description: "Regulatory overview of current good manufacturing practices." }), R({ title: "MATLAB Onramp", provider: "MathWorks", url: "https://matlabacademy.mathworks.com/details/matlab-onramp/gettingstarted", type: "Technical", level: "Beginner", cost_type: "Free", description: "Introductory MATLAB training for numerical analysis and modeling." }), R({ title: "Six Sigma Principles", provider: "Coursera", url: "https://www.coursera.org/learn/six-sigma-principles", type: "Soft Skill", level: "Intermediate", cost_type: "Audit available", description: "Structured introduction to process improvement fundamentals." })] },
  { domain: "Psychology / HR / People Operations", keywords: ["psychology","human resources","recruitment","organizational psychology","counseling","assessment","interview","employee","training"], requiredSkills: ["Interviewing","Recruitment","Communication","Psychological Assessment Awareness","HR Analytics","Excel","Employee Relations","Research Methods"], roles: ["HR Intern","Recruitment Intern","People Operations Intern","Organizational Psychology Intern","Training & Development Intern"], resources: [R({ title: "SHRM Resources", provider: "SHRM", url: "https://www.shrm.org/", type: "Soft Skill", level: "Beginner", cost_type: "Freemium", description: "HR knowledge articles and practical workplace guidance." }), R({ title: "APA Education & Career", provider: "APA", url: "https://www.apa.org/education-career", type: "Soft Skill", level: "Beginner", cost_type: "Free", description: "Career and education guidance related to psychology pathways." }), R({ title: "Coursera Leadership and Management", provider: "Coursera", url: "https://www.coursera.org/browse/business/leadership-and-management", type: "Soft Skill", level: "Intermediate", cost_type: "Audit available", description: "Broad leadership and management course catalog for people skills." })] },
  { domain: "General / Early Career", keywords: [], requiredSkills: ["Communication","Excel","Research","Presentation","Teamwork","Time Management","Problem Solving","Reporting"], roles: ["General Intern","Project Intern","Operations Intern","Research Intern"], resources: [R({ title: "Google Digital Garage", provider: "Google", url: "https://learndigital.withgoogle.com/digitalgarage", type: "Soft Skill", level: "Beginner", cost_type: "Free", description: "General digital and professional skill modules for early career learners." }), R({ title: "Coursera Career Success", provider: "Coursera", url: "https://www.coursera.org/learn/career-success", type: "Soft Skill", level: "Beginner", cost_type: "Audit available", description: "Career development course focused on communication and employability skills." }), R({ title: "Microsoft Excel Support", provider: "Microsoft", url: "https://support.microsoft.com/excel", type: "Technical", level: "Beginner", cost_type: "Free", description: "Official tutorials and help pages for practical spreadsheet skills." })] },
];

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
  const pool = [ ...safe(analysis?.extracted_skills), ...safe(analysis?.suggested_roles), ...safe(analysis?.strengths), ...safe(analysis?.weaknesses), ...safe(analysis?.improvement_suggestions)].map(l).join(" ");
  const scores = DOMAIN_TEMPLATES.map(d => ({ d, matched: d.keywords.filter(k => pool.includes(l(k))), score: d.keywords.filter(k => pool.includes(l(k))).length }));
  scores.sort((a,b)=>b.score-a.score);
  const top = scores[0]; const second = scores[1];
  let domain = top?.score ? top.d.domain : "General / Early Career";
  if (top && second && top.score>0 && second.score>0 && top.score-second.score<=1) {
    if ((top.d.domain.includes("Software") && second.d.domain.includes("Data")) || (second.d.domain.includes("Software") && top.d.domain.includes("Data"))) domain = "Software + Data/AI";
    else if ((top.d.domain.includes("Chemical") && second.d.domain.includes("Management")) || (second.d.domain.includes("Chemical") && top.d.domain.includes("Management"))) domain = "Chemical / Process + Business Operations";
    else if ((top.d.domain.includes("Psychology") && second.d.domain.includes("Psychology")) || top.d.domain.includes("Psychology") || second.d.domain.includes("Psychology")) domain = "Psychology / People Operations";
    else domain = `${top.d.domain} + ${second.d.domain}`;
  }
  const confidence = Math.min(98, top?.score ? 45 + top.score * 10 : 40);
  return { domain, confidence, matchedKeywords: top?.matched ?? [], suggestedRoles: analysis?.suggested_roles ?? [] };
};

export const getDomainSkillTemplate = (domain: string) => DOMAIN_TEMPLATES.find(d => d.domain === domain) ?? DOMAIN_TEMPLATES[DOMAIN_TEMPLATES.length - 1];

export const generateSkillGaps = (analysis: StudentCvAnalysis | null) => {
  const det = detectStudentDomain(analysis); const template = det.confidence < 55 ? getDomainSkillTemplate("General / Early Career") : getDomainSkillTemplate(det.domain);
  const have = new Set(safe(analysis?.extracted_skills).map(l));
  const gaps = template.requiredSkills.filter(s => !have.has(l(s))).slice(0,8).map((skill,i)=>({ skill, currentLevel: Math.max(1, 3-i%3), targetLevel: 4, urgency: i<3?"High":i<6?"Medium":"Low", reason: safe(analysis?.weaknesses)[0] || `This is frequently required in ${det.domain}.`, relatedRoles: template.roles.slice(0,3), resources: template.resources.slice(0,3) }));
  return gaps.length ? gaps : template.requiredSkills.slice(0,3).map(skill=>({ skill,currentLevel:2,targetLevel:4,urgency:"Medium",reason:"Foundation building.",relatedRoles:template.roles.slice(0,2),resources:template.resources.slice(0,2)}));
};

export const generateLearningPath = (analysis: StudentCvAnalysis | null) => {
  const det = detectStudentDomain(analysis); const template = det.confidence < 55 ? getDomainSkillTemplate("General / Early Career") : getDomainSkillTemplate(det.domain); const gaps = generateSkillGaps(analysis);
  const resources = [...template.resources, ...getDomainSkillTemplate("General / Early Career").resources].slice(0,12).map((r, idx)=>({ id:`res-${idx}-${r.title}`,...r, skill: gaps[idx % gaps.length]?.skill ?? template.requiredSkills[0] }));
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
