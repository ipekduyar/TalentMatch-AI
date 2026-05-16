import { 
  Person, Student, Company, CompanyRepresentative, Skill, 
  InternshipPosting, Application, SkillGapReport, 
  LearningResource, Notification, Conversation, Message 
} from './types';

export const SKILLS: Skill[] = [
  { skill_id: 's1', name: 'Python', category: 'technical', description: null },
  { skill_id: 's2', name: 'JavaScript', category: 'technical', description: null },
  { skill_id: 's3', name: 'TypeScript', category: 'technical', description: null },
  { skill_id: 's4', name: 'SQL', category: 'technical', description: null },
  { skill_id: 's5', name: 'React', category: 'technical', description: null },
  { skill_id: 's6', name: 'Node.js', category: 'technical', description: null },
  { skill_id: 's7', name: 'Pandas', category: 'technical', description: null },
  { skill_id: 's8', name: 'Agile', category: 'domain', description: null },
  { skill_id: 's9', name: 'Product Management', category: 'domain', description: null },
  { skill_id: 's10', name: 'Communication', category: 'soft', description: null },
  // ... adding more as requested in the masterprompt
];

export const PERSONS: Person[] = [
  {
    person_id: 'p1', auth_user_id: 'auth1', first_name: 'İpek', last_name: 'Duyar',
    email: 'ipek@example.com', role: 'student', kvkk_consent: true, kvkk_consent_at: '2024-01-01',
    created_at: '2024-01-01', is_active: true, avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ipek'
  },
  {
    person_id: 'p2', auth_user_id: 'auth2', first_name: 'Beyza', last_name: 'Dönmez',
    email: 'beyza@example.com', role: 'student', kvkk_consent: true, kvkk_consent_at: '2024-01-01',
    created_at: '2024-01-01', is_active: true, avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Beyza'
  },
  {
    person_id: 'p11', auth_user_id: 'auth11', first_name: 'Ahmet', last_name: 'HR',
    email: 'ahmet@garanti.com', role: 'company_rep', kvkk_consent: true, kvkk_consent_at: '2024-01-01',
    created_at: '2024-01-01', is_active: true, avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmet'
  },
  {
     person_id: 'p_admin', auth_user_id: 'auth_admin', first_name: 'Admin', last_name: 'User',
     email: 'admin@talentmatch.ai', role: 'admin', kvkk_consent: true, kvkk_consent_at: '2024-01-01',
     created_at: '2024-01-01', is_active: true, avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
  }
];

export const STUDENTS: Student[] = [
  {
    student_id: 'st1', person_id: 'p1', university: 'ITU', department: 'Industrial Engineering',
    student_number: '123456789', gpa: 3.45, academic_year: 4, graduation_date: '2024-06-30',
    career_goal: 'Product Management', cv_file_path: '/cvs/ipek.pdf', cv_parsed_text: null,
    is_edu_verified: true, profile_complete: true
  },
  {
    student_id: 'st2', person_id: 'p2', university: 'ITU', department: 'Computer Engineering',
    student_number: '987654321', gpa: 3.21, academic_year: 4, graduation_date: '2024-06-30',
    career_goal: 'Data Science', cv_file_path: '/cvs/beyza.pdf', cv_parsed_text: null,
    is_edu_verified: true, profile_complete: true
  }
];

export const COMPANIES: Company[] = [
  {
    company_id: 'c1', name: 'Garanti BBVA', industry: 'Finance', size: 'enterprise',
    website: 'https://www.garantibbva.com.tr', location: 'Istanbul', description: 'Leading bank in Turkey.',
    logo_url: 'https://api.dicebear.com/7.x/initials/svg?seed=GB', is_premium: true, is_approved: true,
    avg_evaluation_score: 4.3, created_at: '2024-01-01'
  },
  {
    company_id: 'c2', name: 'Trendyol', industry: 'Technology', size: 'enterprise',
    website: 'https://www.trendyol.com', location: 'Istanbul', description: 'Biggest e-commerce platform.',
    logo_url: 'https://api.dicebear.com/7.x/initials/svg?seed=TY', is_premium: true, is_approved: true,
    avg_evaluation_score: 4.1, created_at: '2024-01-01'
  }
];

export const REPS: CompanyRepresentative[] = [
  { rep_id: 'rep1', person_id: 'p11', company_id: 'c1', job_title: 'HR Manager', is_verified: true }
];

export const POSTINGS: InternshipPosting[] = [
  {
    posting_id: 'post1', company_id: 'c1', rep_id: 'rep1', title: 'Product Management Intern',
    description: 'Join our digital banking team focused on UX and product lifecycle.',
    location: 'Istanbul', industry: 'Finance', start_date: '2024-07-01', duration_weeks: 12,
    is_paid: true, monthly_stipend_try: 12000, is_remote: false, status: 'active',
    created_at: '2024-04-01', deadline: '2024-06-01'
  },
  {
    posting_id: 'post2', company_id: 'c2', rep_id: 'rep1', title: 'Data Science Intern',
    description: 'Engage with massive datasets and build predictive models.',
    location: 'Istanbul', industry: 'Technology', start_date: '2024-07-15', duration_weeks: 16,
    is_paid: true, monthly_stipend_try: 15000, is_remote: true, status: 'active',
    created_at: '2024-04-05', deadline: '2024-06-15'
  }
];

export const APPLICATIONS: Application[] = [
  {
    application_id: 'app1', student_id: 'st1', posting_id: 'post1', match_score: 85,
    status: 'shortlisted', cover_note: 'I am very interested in this role.',
    applied_at: '2024-05-01', updated_at: '2024-05-10'
  },
  {
    application_id: 'app2', student_id: 'st1', posting_id: 'post2', match_score: 72,
    status: 'pending', cover_note: 'Looking to expand my data skills.',
    applied_at: '2024-05-12', updated_at: '2024-05-12'
  }
];

export const LEARNING_RESOURCES: LearningResource[] = [
  {
    resource_id: 'lr1', skill_id: 's8', title: 'Agile Project Management',
    provider: 'Coursera', url: '#', duration_hours: 20, cost_type: 'paid',
    cost_amount_try: 800, avg_rating: 4.8, level: 'beginner'
  },
  {
    resource_id: 'lr2', skill_id: 's9', title: 'Product Lifecycle Fundamentals',
    provider: 'Udemy', url: '#', duration_hours: 15, cost_type: 'paid',
    cost_amount_try: 250, avg_rating: 4.6, level: 'intermediate'
  },
  {
    resource_id: 'lr3', skill_id: 's4', title: 'SQL for Data Analysis',
    provider: 'edX', url: '#', duration_hours: 45, cost_type: 'free',
    cost_amount_try: null, avg_rating: 4.9, level: 'beginner'
  },
  {
    resource_id: 'lr4', skill_id: 's10', title: 'Communication for Leaders',
    provider: 'Coursera', url: '#', duration_hours: 10, cost_type: 'paid',
    cost_amount_try: 500, avg_rating: 4.7, level: 'intermediate'
  }
];

export const NOTIFICATIONS: Notification[] = [
  {
    notification_id: 'n1', person_id: 'p1', type: 'new_match',
    title: 'High Match Found!', message: 'A new Product Intern at Trendyol matches 92% of your profile.',
    link_url: '/postings/post2', is_read: false, created_at: '2024-05-15T10:00:00Z'
  },
  {
    notification_id: 'n2', person_id: 'p1', type: 'status_update',
    title: 'Application Shortlisted', message: 'Garanti BBVA has shortlisted you for the Product Intern role.',
    link_url: '/applications', is_read: true, created_at: '2024-05-10T14:30:00Z'
  },
  {
    notification_id: 'n3', person_id: 'p1', type: 'skill_alert',
    title: 'Skill Gap Warning', message: 'You are missing "Advanced Excel" required for 80% of your saved jobs.',
    link_url: '/skill-gaps', is_read: false, created_at: '2024-05-14T09:15:00Z'
  },
  {
    notification_id: 'n4', person_id: 'p1', type: 'deadline',
    title: 'Deadline Approaching', message: 'Trendyol application closes in 48 hours.',
    link_url: '/postings/post2', is_read: false, created_at: '2024-05-13T16:00:00Z'
  }
];
export const CONVERSATIONS: Conversation[] = [];
export const MESSAGES: Message[] = [];
