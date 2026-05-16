import {
  APPLICATIONS,
  COMPANIES,
  CONVERSATIONS,
  LEARNING_RESOURCES,
  MESSAGES,
  NOTIFICATIONS,
  PERSONS,
  POSTINGS,
  REPS,
  SKILLS,
  STUDENTS,
} from './mock-data';
import { isSupabaseConfigured, supabase } from './supabase';

const currentPerson = PERSONS[0];
const currentStudent = STUDENTS.find((s) => s.person_id === currentPerson.person_id) ?? STUDENTS[0];

export async function getCurrentUserProfile() {
  if (!isSupabaseConfigured || !supabase) {
    return { person: currentPerson, student: currentStudent };
  }

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) {
    return null;
  }

  const { data: person } = await supabase.from('persons').select('*').eq('auth_user_id', userId).single();
  if (!person) return null;

  const { data: student } = await supabase.from('students').select('*').eq('person_id', person.person_id).maybeSingle();
  return { person, student };
}

export async function getStudentDashboardData() {
  if (!isSupabaseConfigured || !supabase) {
    const applications = APPLICATIONS.filter((a) => a.student_id === currentStudent.student_id);
    return { profile: { person: currentPerson, student: currentStudent }, applications, postings: POSTINGS, skills: SKILLS };
  }

  const profile = await getCurrentUserProfile();
  const studentId = profile?.student?.student_id;
  if (!studentId) return { profile, applications: [], postings: [], skills: [] };

  const [{ data: applications }, { data: postings }, { data: skills }] = await Promise.all([
    supabase.from('applications').select('*').eq('student_id', studentId),
    supabase.from('internship_postings').select('*').eq('status', 'active'),
    supabase.from('skills').select('*'),
  ]);

  return { profile, applications: applications ?? [], postings: postings ?? [], skills: skills ?? [] };
}

export async function getInternshipPostings() {
  if (!isSupabaseConfigured || !supabase) return POSTINGS;
  const { data } = await supabase.from('internship_postings').select('*').eq('status', 'active');
  return data ?? [];
}

export async function getApplicationsForStudent() {
  if (!isSupabaseConfigured || !supabase) {
    return APPLICATIONS.filter((a) => a.student_id === currentStudent.student_id);
  }
  const profile = await getCurrentUserProfile();
  if (!profile?.student?.student_id) return [];
  const { data } = await supabase.from('applications').select('*').eq('student_id', profile.student.student_id);
  return data ?? [];
}

export async function getSkillGapReports() {
  if (!isSupabaseConfigured || !supabase) return [];
  const profile = await getCurrentUserProfile();
  if (!profile?.student?.student_id) return [];
  const { data } = await supabase.from('skill_gap_reports').select('*, skill_gap_details(*)').eq('student_id', profile.student.student_id);
  return data ?? [];
}

export async function getLearningResources() {
  if (!isSupabaseConfigured || !supabase) return LEARNING_RESOURCES;
  const { data } = await supabase.from('learning_resources').select('*');
  return data ?? [];
}

export async function getNotifications() {
  if (!isSupabaseConfigured || !supabase) {
    return NOTIFICATIONS.filter((n) => n.person_id === currentPerson.person_id);
  }
  const profile = await getCurrentUserProfile();
  if (!profile?.person?.person_id) return [];
  const { data } = await supabase.from('notifications').select('*').eq('person_id', profile.person.person_id).order('created_at', { ascending: false });
  return data ?? [];
}

export async function getMessages() {
  if (!isSupabaseConfigured || !supabase) {
    return { conversations: CONVERSATIONS, messages: MESSAGES };
  }
  const { data: conversations } = await supabase.from('conversations').select('*').order('created_at', { ascending: false });
  const ids = (conversations ?? []).map((c) => c.conversation_id);
  const { data: messages } = await supabase.from('messages').select('*').in('conversation_id', ids);
  return { conversations: conversations ?? [], messages: messages ?? [] };
}

export async function getCompanyPostings() {
  if (!isSupabaseConfigured || !supabase) {
    const rep = REPS[0];
    return POSTINGS.filter((p) => p.company_id === rep.company_id);
  }

  const profile = await getCurrentUserProfile();
  if (!profile?.person?.person_id) return [];

  const { data: rep } = await supabase
    .from('company_representatives')
    .select('*')
    .eq('person_id', profile.person.person_id)
    .single();

  if (!rep) return [];
  const { data } = await supabase.from('internship_postings').select('*').eq('company_id', rep.company_id);
  return data ?? [];
}

export async function getApplicantsForPosting(postingId: string) {
  if (!isSupabaseConfigured || !supabase) {
    return APPLICATIONS.filter((a) => a.posting_id === postingId);
  }

  const { data } = await supabase
    .from('applications')
    .select('*, students(*, persons(*))')
    .eq('posting_id', postingId);

  return data ?? [];
}
