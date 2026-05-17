import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Person, Student, CompanyRepresentative, Company, UserRole } from './types';
import { PERSONS, STUDENTS, REPS, COMPANIES } from './mock-data';
import { isSupabaseConfigured, supabase } from './supabase';

interface SignupMockData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  type: 'student' | 'company';
  kvkkConsent: boolean;
  termsConsent?: boolean;
  university?: string;
  department?: string;
  studentNumber?: string;
  academicYear?: 1 | 2 | 3 | 4 | 5;
  gpa?: number | null;
  careerGoal?: string;
  companyName?: string;
  companyIndustry?: string;
  companySize?: 'startup' | 'sme' | 'enterprise' | null;
  companyWebsite?: string;
  companyLocation?: string;
  representativeJobTitle?: string;
}

interface AuthContextType {
  currentUser: Person | null;
  user: Person | null;
  student: Student | null;
  rep: CompanyRepresentative | null;
  company: Company | null;
  role: UserRole | null;
  loginAsDemoUser: (userId: string) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<Person>;
  signupMockUser: (data: SignupMockData) => Promise<Person>;
  logout: () => Promise<void>;
  switchRole: (userId?: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = 'talentmatch_user_id';


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<Person[]>(PERSONS);
  const [students, setStudents] = useState<Student[]>(STUDENTS);
  const [reps, setReps] = useState<CompanyRepresentative[]>(REPS);
  const [companies, setCompanies] = useState<Company[]>(COMPANIES);
  const [user, setUser] = useState<Person | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [rep, setRep] = useState<CompanyRepresentative | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrateMock = useCallback((person: Person | null) => {
    setUser(person);
    setRole(person?.role ?? null);
    if (!person) return setStudent(null), setRep(null), void setCompany(null);
    if (person.role === 'student') {
      setStudent(students.find((st) => st.person_id === person.person_id) || null);
      setRep(null);
      setCompany(null);
      return;
    }
    if (person.role === 'company_rep') {
      const foundRep = reps.find((rp) => rp.person_id === person.person_id) || null;
      setRep(foundRep);
      setCompany(foundRep ? companies.find((c) => c.company_id === foundRep.company_id) || null : null);
      setStudent(null);
      return;
    }
    setStudent(null);
    setRep(null);
    setCompany(null);
  }, [students, reps, companies]);

  const loadSupabaseProfile = useCallback(async (authUserId: string) => {
    if (!supabase) return;
    const { data: person, error } = await supabase.from('persons').select('*').eq('auth_user_id', authUserId).single();
    if (error || !person) throw error ?? new Error('Person profile not found');

    const typedPerson = person as Person;
    setUser(typedPerson);
    setRole(typedPerson.role);

    if (typedPerson.role === 'student') {
      const { data: studentRow } = await supabase.from('students').select('*').eq('person_id', typedPerson.person_id).single();
      setStudent((studentRow as Student) ?? null);
      setRep(null);
      setCompany(null);
      return typedPerson;
    }

    if (typedPerson.role === 'company_rep') {
      const { data: repRow } = await supabase.from('company_representatives').select('*').eq('person_id', typedPerson.person_id).single();
      const typedRep = (repRow as CompanyRepresentative) ?? null;
      setRep(typedRep);
      if (typedRep) {
        const { data: companyRow } = await supabase.from('companies').select('*').eq('company_id', typedRep.company_id).single();
        setCompany((companyRow as Company) ?? null);
      } else {
        setCompany(null);
      }
      setStudent(null);
      return typedPerson;
    }

    setStudent(null);
    setRep(null);
    setCompany(null);
    return typedPerson;
  }, []);


  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!isSupabaseConfigured || !supabase) {
        const savedId = localStorage.getItem(STORAGE_KEY);
        hydrateMock(savedId ? users.find((p) => p.person_id === savedId) || null : null);
        if (mounted) setIsLoading(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      const authUserId = data.session?.user?.id;
      if (authUserId) {
        try { await loadSupabaseProfile(authUserId); } catch { setUser(null); }
      }
      if (mounted) setIsLoading(false);
    };
    init();

    if (!isSupabaseConfigured || !supabase) return;
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user?.id) {
        setUser(null); setRole(null); setStudent(null); setRep(null); setCompany(null);
        return;
      }
      try { await loadSupabaseProfile(session.user.id); } catch { /* no-op */ }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [users, hydrateMock, loadSupabaseProfile]);

  const loginAsDemoUser = useCallback(async (userId: string) => {
    if (isSupabaseConfigured && supabase) throw new Error('Demo login is only available when Supabase is not configured.');
    const found = users.find((p) => p.person_id === userId);
    if (!found) return;
    localStorage.setItem(STORAGE_KEY, userId);
    hydrateMock(found);
  }, [users, hydrateMock]);


  const loginWithPassword = useCallback(async (email: string, password: string): Promise<Person> => {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Supabase login failed:', error);
      throw error;
    }
    const authUserId = data.user?.id;
    if (!authUserId) throw new Error('Login succeeded but no auth user id was returned.');
    try {
      return await loadSupabaseProfile(authUserId);
    } catch (profileError) {
      console.error('Profile loading failed after login:', profileError);
      throw profileError instanceof Error ? profileError : new Error('Failed to load profile after login.');
    }
  }, [loadSupabaseProfile]);

  const logout = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
      setUser(null); setRole(null); setStudent(null); setRep(null); setCompany(null);
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    hydrateMock(null);
  }, [hydrateMock]);

  const switchRole = useCallback(async (userId?: string) => {
    if (!userId) return logout();
    return loginAsDemoUser(userId);
  }, [loginAsDemoUser, logout]);

  const signupMockUser = useCallback(async (data: SignupMockData): Promise<Person> => {
    if (isSupabaseConfigured && supabase && data.password) {
      const { data: auth, error: authError } = await supabase.auth.signUp({ email: data.email, password: data.password });
      if (authError) throw authError;
      const authUserId = auth.user?.id;
      if (!authUserId) throw new Error('Supabase signUp succeeded but no auth user id was returned.');

      const nowIso = new Date().toISOString();
      const { data: personRow, error: personError } = await supabase.from('persons').insert({
        auth_user_id: authUserId,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        role: data.type === 'company' ? 'company_rep' : 'student',
        kvkk_consent: data.kvkkConsent,
        terms_consent: data.termsConsent ?? false,
        consent_given_at: data.kvkkConsent || data.termsConsent ? nowIso : null,
      }).select('*').single();
      if (personError || !personRow) {
        console.error('Person insert failed during signup:', personError);
        throw personError ?? new Error('Unable to create person');
      }
      const person = personRow as Person;

      if (data.type === 'student') {
        const { error } = await supabase.from('students').upsert({
          person_id: person.person_id,
          university: data.university,
          department: data.department,
          student_number: data.studentNumber,
          gpa: data.gpa ?? null,
          academic_year: data.academicYear,
          career_goal: data.careerGoal ?? null,
        }, { onConflict: 'person_id' });
        if (error) { console.error('Student profile insert failed:', error); throw error; }
      } else {
        let companyId: string | null = null;
        const { data: existingCompany } = await supabase.from('companies').select('company_id').ilike('name', (data.companyName || '').trim()).maybeSingle();
        companyId = existingCompany?.company_id ?? null;
        if (!companyId) {
          const { data: createdCompany, error: companyError } = await supabase.from('companies').insert({
            name: data.companyName,
            industry: data.companyIndustry,
            size: data.companySize ?? 'sme',
            website: data.companyWebsite ?? null,
            location: data.companyLocation ?? null,
          }).select('company_id').single();
          if (companyError || !createdCompany) { console.error('Company insert failed:', companyError); throw companyError ?? new Error('Unable to create company'); }
          companyId = createdCompany.company_id;
        }

        const { error: repError } = await supabase.from('company_representatives').upsert({
          person_id: person.person_id,
          company_id: companyId,
          job_title: data.representativeJobTitle ?? null,
        }, { onConflict: 'person_id' });
        if (repError) { console.error('Company representative insert failed:', repError); throw repError; }
      }

      await loadSupabaseProfile(authUserId);
      return person;
    }

    const now = Date.now();
    const created: Person = {
      person_id: `p_mock_${now}`,
      auth_user_id: `auth_mock_${now}`,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      role: data.type === 'company' ? 'company_rep' : 'student',
      kvkk_consent: data.kvkkConsent,
      kvkk_consent_at: data.kvkkConsent ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      is_active: true,
      avatar_url: null,
    };
    setUsers((prev) => [...prev, created]);
    localStorage.setItem(STORAGE_KEY, created.person_id);
    hydrateMock(created);
    return created;
  }, [hydrateMock, loadSupabaseProfile]);

  const value = useMemo(() => ({ currentUser: user, user, student, rep, company, role, loginAsDemoUser, loginWithPassword, signupMockUser, logout, switchRole, isLoading }), [user, student, rep, company, role, loginAsDemoUser, loginWithPassword, signupMockUser, logout, switchRole, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useCurrentUser = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useCurrentUser must be used within an AuthProvider');
  return context;
};
