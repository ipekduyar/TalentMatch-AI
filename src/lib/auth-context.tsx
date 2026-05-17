import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  const isSigningUpRef = useRef(false);
  const isLoggingInRef = useRef(false);
  const formatErrorMessage = useCallback((error: unknown) => {
    if (error instanceof Error && error.message) return error.message;
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }, []);

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
    console.log('Loading person by auth_user_id', authUserId);
    const { data: person, error } = await supabase.from('persons').select('*').eq('auth_user_id', authUserId).maybeSingle();
    if (error) {
      console.error('person profile not found', error);
      throw error;
    }
    if (!person) {
      const personError = new Error('Login succeeded, but no student/company profile was found for this account. Please delete this test account or sign up again with a new email.');
      console.error('person profile not found', personError);
      throw personError;
    }
    console.log('Person loaded', person);

    const typedPerson = person as Person;
    setUser(typedPerson);
    setRole(typedPerson.role);

    if (typedPerson.role === 'student') {
      const { data: studentRow, error: studentError } = await supabase.from('students').select('*').eq('person_id', typedPerson.person_id).maybeSingle();
      if (studentError) {
        console.error('student profile load failed', studentError);
        throw studentError;
      }
      if (!studentRow) throw new Error('Login succeeded, but no student/company profile was found for this account. Please delete this test account or sign up again with a new email.');
      console.log('Student profile loaded', studentRow);
      setStudent((studentRow as Student) ?? null);
      setRep(null);
      setCompany(null);
      return typedPerson;
    }

    if (typedPerson.role === 'company_rep') {
      const { data: repRow, error: repError } = await supabase.from('company_representatives').select('*').eq('person_id', typedPerson.person_id).maybeSingle();
      if (repError) {
        console.error('company representative profile load failed', repError);
        throw repError;
      }
      if (!repRow) throw new Error('Login succeeded, but no student/company profile was found for this account. Please delete this test account or sign up again with a new email.');
      const typedRep = (repRow as CompanyRepresentative) ?? null;
      console.log('Company representative profile loaded', typedRep);
      setRep(typedRep);
      if (typedRep) {
        const { data: companyRow, error: companyError } = await supabase.from('companies').select('*').eq('company_id', typedRep.company_id).maybeSingle();
        if (companyError) {
          console.error('company profile load failed', companyError);
          throw companyError;
        }
        if (!companyRow) throw new Error('Login succeeded, but no company profile was found for this user.');
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

      localStorage.removeItem(STORAGE_KEY);
      console.log("Supabase mode active: cleared stale mock auth keys and disabled role switcher");

      const { data } = await supabase.auth.getSession();
      const authUserId = data.session?.user?.id;
      if (authUserId) {
        if (isSigningUpRef.current) {
          console.log('Signup in progress: skipping auth-state hydration');
        } else {
          try {
            await loadSupabaseProfile(authUserId);
          } catch (error) {
            console.error('Auth bootstrap profile hydration failed', error);
            await supabase.auth.signOut();
            setUser(null); setRole(null); setStudent(null); setRep(null); setCompany(null);
          }
        }
      }
      if (mounted) setIsLoading(false);
    };
    init();

    if (!isSupabaseConfigured || !supabase) return;
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (isLoggingInRef.current) {
        console.log("Login in progress: skipping auth-state hydration");
        return;
      }
      if (!session?.user?.id) {
        setUser(null); setRole(null); setStudent(null); setRep(null); setCompany(null);
        return;
      }
      if (isSigningUpRef.current) {
        console.log('Signup in progress: skipping auth-state hydration');
        return;
      }
      try {
        await loadSupabaseProfile(session.user.id);
      } catch (error) {
        console.error('Auth state profile hydration failed', error);
        await supabase.auth.signOut();
        setUser(null); setRole(null); setStudent(null); setRep(null); setCompany(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [users, hydrateMock, loadSupabaseProfile]);

  const loginAsDemoUser = useCallback(async (userId: string) => {
    if (isSupabaseConfigured && supabase) {
      console.log("Mock role switching is disabled in Supabase mode.");
      return;
    }
    const found = users.find((p) => p.person_id === userId);
    if (!found) return;
    localStorage.setItem(STORAGE_KEY, userId);
    hydrateMock(found);
  }, [users, hydrateMock]);


  const loginWithPassword = useCallback(async (email: string, password: string): Promise<Person> => {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');
    isLoggingInRef.current = true;
    localStorage.removeItem(STORAGE_KEY);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('login auth failed', error);
        throw error;
      }
      const authUserId = data.user?.id;
      console.log('Login auth ok', authUserId);
      if (!authUserId) throw new Error('Login succeeded but no auth user id was returned.');
      const hydratedPerson = await loadSupabaseProfile(authUserId);
      console.log("Login profile hydration complete");
      isLoggingInRef.current = false;
      return hydratedPerson;
    } catch (error) {
      console.error("Login profile hydration failed", error);
      const message = formatErrorMessage(error);
      isLoggingInRef.current = false;
      await supabase.auth.signOut({ scope: 'local' });
      throw new Error(message);
    }
  }, [loadSupabaseProfile, formatErrorMessage]);

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
    if (isSupabaseConfigured && supabase) {
      console.log("Mock role switching is disabled in Supabase mode.");
      return;
    }
    if (!userId) return logout();
    return loginAsDemoUser(userId);
  }, [loginAsDemoUser, logout]);

  const signupMockUser = useCallback(async (data: SignupMockData): Promise<Person> => {
    console.log('Signup type', data.type);
    console.log('Supabase configured', isSupabaseConfigured);

    if (isSupabaseConfigured) {
      if (!supabase || !data.password) throw new Error('Supabase is configured but client is unavailable.');

      const role: UserRole = data.type === 'company' ? 'company_rep' : 'student';
      isSigningUpRef.current = true;
      const { data: auth, error } = await supabase.auth.signUp({ email: data.email, password: data.password });
      if (error) {
        isSigningUpRef.current = false;
        console.error('Auth signup failed', error);
        throw error;
      }

      const authUserId = auth.user?.id;
      if (!authUserId) {
        isSigningUpRef.current = false;
        throw new Error('Supabase signUp succeeded but no auth user id was returned.');
      }
      console.log('Auth signup ok', auth.user?.id);

      try {
        const nowIso = new Date().toISOString();
        const personPayload = {
          auth_user_id: authUserId,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          role,
          kvkk_consent: data.kvkkConsent,
          terms_consent: data.termsConsent ?? false,
          consent_given_at: nowIso,
        };
        console.log('Creating person profile payload', personPayload);
        const { data: personRow, error } = await supabase.from('persons').insert(personPayload).select('*').single();
        if (error || !personRow) {
          console.error('Person insert failed', error);
          throw error ?? new Error('Unable to create person profile.');
        }
        const person = personRow as Person;
        console.log('Person created', person);

        if (role === 'student') {
          const studentPayload = {
            person_id: person.person_id,
            university: data.university,
            department: data.department,
            student_number: data.studentNumber,
            gpa: data.gpa ?? null,
            academic_year: data.academicYear,
            career_goal: data.careerGoal ?? null,
          };
          console.log('Creating student profile payload', studentPayload);
          const { data: studentRow, error } = await supabase.from('students').insert(studentPayload).select('*').single();
          if (error || !studentRow) {
            console.error('Student insert failed', error);
            throw error ?? new Error('Unable to create student profile.');
          }
          const student = studentRow as Student;
          console.log('Student created', student);
        } else {
          const companyPayload = {
            name: data.companyName,
            industry: data.companyIndustry,
            size: data.companySize ?? 'sme',
            website: data.companyWebsite ?? null,
            location: data.companyLocation ?? null,
          };
          console.log('Creating company payload', companyPayload);

          let company: Company | null = null;
          const { data: existingCompany, error: findCompanyError } = await supabase.from('companies').select('*').ilike('name', (data.companyName || '').trim()).maybeSingle();
          if (findCompanyError) {
            console.error('company find failed', findCompanyError);
            throw findCompanyError;
          }

          if (existingCompany) {
            company = existingCompany as Company;
          } else {
            const { data: createdCompany, error } = await supabase.from('companies').insert(companyPayload).select('*').single();
            if (error || !createdCompany) {
              console.error('company insert failed', error);
              throw error ?? new Error('Unable to create company profile.');
            }
            company = createdCompany as Company;
          }

          console.log('Company created/found', company);

          const repPayload = {
            person_id: person.person_id,
            company_id: company.company_id,
            job_title: data.representativeJobTitle ?? null,
          };
          console.log('Creating company representative payload', repPayload);
          const { data: repRow, error } = await supabase.from('company_representatives').insert(repPayload).select('*').single();
          if (error || !repRow) {
            console.error('Company representative insert failed', error);
            throw error ?? new Error('Unable to create company representative profile.');
          }
          const rep = repRow as CompanyRepresentative;
          console.log('Representative created', rep);
        }

        console.log('Signup profile creation complete; hydrating profile');
        const hydratedPerson = await loadSupabaseProfile(authUserId);
        isSigningUpRef.current = false;
        return hydratedPerson ?? person;
      } catch (profileError) {
        isSigningUpRef.current = false;
        console.error('Signup profile setup failed after auth user creation', profileError);
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch (signOutError) {
          console.error('Signup cleanup signOut failed', signOutError);
        }
        throw new Error('Account was created, but profile setup failed. Please delete this test user in Supabase Authentication or sign up again with a new email.');
      }
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
  }, [formatErrorMessage, hydrateMock, loadSupabaseProfile]);

  const value = useMemo(() => ({ currentUser: user, user, student, rep, company, role, loginAsDemoUser, loginWithPassword, signupMockUser, logout, switchRole, isLoading }), [user, student, rep, company, role, loginAsDemoUser, loginWithPassword, signupMockUser, logout, switchRole, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useCurrentUser = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useCurrentUser must be used within an AuthProvider');
  return context;
};
