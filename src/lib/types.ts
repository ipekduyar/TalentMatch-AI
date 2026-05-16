// src/lib/types.ts

export type UserRole = "student" | "company_rep" | "admin";

export type Person = {
  person_id: string;       // uuid
  auth_user_id: string;    // matches Supabase Auth
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  kvkk_consent: boolean;
  kvkk_consent_at: string | null;
  created_at: string;
  is_active: boolean;
  avatar_url: string | null;
};

export type Student = {
  student_id: string;
  person_id: string;
  university: string;
  department: string;
  student_number: string;
  gpa: number | null;
  academic_year: 1 | 2 | 3 | 4 | 5;  // 5 = graduate
  graduation_date: string | null;
  career_goal: string | null;        // "Data Science", "Product Management", etc.
  cv_file_path: string | null;
  cv_parsed_text: string | null;
  is_edu_verified: boolean;
  profile_complete: boolean;
};

export type Company = {
  company_id: string;
  name: string;
  industry: string;
  size: "startup" | "sme" | "enterprise" | null;
  website: string | null;
  location: string | null;
  description: string | null;
  logo_url: string | null;
  is_premium: boolean;
  is_approved: boolean;
  avg_evaluation_score: number | null; // 1.00 – 5.00
  created_at: string;
};

export type CompanyRepresentative = {
  rep_id: string;
  person_id: string;
  company_id: string;
  job_title: string | null;
  is_verified: boolean;
};

export type Skill = {
  skill_id: string;
  name: string;
  category: "technical" | "soft" | "domain" | "language";
  description: string | null;
};

export type StudentSkill = {
  student_skill_id: string;
  student_id: string;
  skill_id: string;
  proficiency: 1 | 2 | 3 | 4 | 5;
  verified: boolean;
  added_at: string;
};

export type InternshipPosting = {
  posting_id: string;
  company_id: string;
  rep_id: string;
  title: string;
  description: string;
  location: string | null;
  industry: string | null;
  start_date: string | null;
  duration_weeks: number | null;
  is_paid: boolean;
  monthly_stipend_try: number | null;
  is_remote: boolean;
  status: "active" | "closed" | "draft" | "pending_review";
  created_at: string;
  deadline: string;
};

export type PostingSkill = {
  posting_skill_id: string;
  posting_id: string;
  skill_id: string;
  is_required: boolean;
  importance_score: 1 | 2 | 3 | 4 | 5;
  required_level: 1 | 2 | 3 | 4 | 5;
};

export type ApplicationStatus =
  | "pending" | "reviewed" | "shortlisted"
  | "accepted" | "rejected" | "withdrawn" | "completed";

export type Application = {
  application_id: string;
  student_id: string;
  posting_id: string;
  match_score: number;        // 0–100, decimal allowed
  status: ApplicationStatus;
  cover_note: string | null;
  applied_at: string;
  updated_at: string;
};

export type SkillGapReport = {
  report_id: string;
  student_id: string;
  posting_id: string | null;  // null = generic career-goal report
  generated_at: string;
  summary_text: string;
  percentile_rank: number;    // 0–100
};

export type Urgency = "critical" | "moderate" | "low";

export type SkillGapDetail = {
  gap_detail_id: string;
  report_id: string;
  skill_id: string;
  student_level: number;      // 0–5 (0 = absent)
  required_level: number;     // 1–5
  gap_score: number;          // required - student
  urgency: Urgency;
};

export type LearningResource = {
  resource_id: string;
  skill_id: string;
  title: string;
  provider: "Coursera" | "Udemy" | "edX" | "freeCodeCamp" | "Khan Academy" | "ITU" | "Other";
  url: string;
  duration_hours: number;
  cost_type: "free" | "paid" | "subscription";
  cost_amount_try: number | null;
  avg_rating: number;         // 1.00–5.00
  level: "beginner" | "intermediate" | "advanced";
};

export type InternshipEvaluation = {
  evaluation_id: string;
  application_id: string;
  evaluator_type: "student" | "company";
  mentorship_q: number | null;       // student → company
  task_relevance: number | null;     // student → company
  tech_skill_q: number | null;       // company → student
  comm_skill_q: number | null;       // company → student
  professionalism_q: number | null;  // company → student
  overall_score: number;
  comments: string | null;
  submitted_at: string;
  is_anonymous: boolean;
};

export type Notification = {
  notification_id: string;
  person_id: string;
  type: "new_match" | "status_update" | "deadline" | "skill_alert" | "new_message" | "evaluation_request" | "new_application";
  title: string;
  message: string;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
};

export type Conversation = {
  conversation_id: string;
  application_id: string;
  created_at: string;
};

export type Message = {
  message_id: string;
  conversation_id: string;
  sender_person_id: string;
  content: string;
  sent_at: string;
  read_at: string | null;
};
