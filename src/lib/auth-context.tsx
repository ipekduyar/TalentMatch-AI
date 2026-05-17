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
const withTimeout = async <T,>(promise: Promise<T>, timeoutMessage: string, ms = 10000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(timeoutMessage)), ms)),
  ]) as Promise<T>;
};


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
    console.log('Loading profile via RPC for auth_user_id', authUserId);
    const { data, error } = await withTimeout(
      supabase.rpc('get_my_profile'),
      'Timed out while loading profile via RPC.'
    );
    console.log('Profile RPC response', { data, error });
    if (error) {
      throw error;
    }
    if (!data?.person) {
      throw new Error('Account was created, but profile setup is not ready yet. Please try logging in again.');
    }

    const typedPerson = data.person as Person;
    setUser(typedPerson);
    setRole(typedPerson.role);
    setStudent((data.student as Student | null) ?? null);
    setRep((data.rep as CompanyRepresentative | null) ?? null);
    setCompany((data.company as Company | null) ?? null);
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
        if (isLoggingInRef.current) {
          console.log('Login in progress: skipping bootstrap hydration');
        } else if (isSigningUpRef.current) {
          console.log('Signup in progress: ignoring auth-state event');
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
      if (isLoggingInRef.current || isSigningUpRef.current) {
        console.log("Explicit auth flow in progress: skipping auth-state hydration");
        return;
      }
      if (!session?.user?.id) {
        setUser(null); setRole(null); setStudent(null); setRep(null); setCompany(null);
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
      const hydratedPerson = await withTimeout(
        loadSupabaseProfile(authUserId),
        'Timed out while hydrating login profile.'
      );
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
      localStorage.removeItem(STORAGE_KEY);
      isSigningUpRef.current = true;
      try {
        const { data: auth, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              first_name: data.firstName,
              last_name: data.lastName,
              role,
              kvkk_consent: data.kvkkConsent,
              terms_consent: data.termsConsent ?? false,
              university: data.university ?? null,
              department: data.department ?? null,
              student_number: data.studentNumber ?? null,
              academic_year: data.academicYear ?? null,
              gpa: data.gpa ?? null,
              career_goal: data.careerGoal ?? null,
              company_name: data.companyName ?? null,
              company_industry: data.companyIndustry ?? null,
              company_size: data.companySize ?? null,
              company_website: data.companyWebsite ?? null,
              company_location: data.companyLocation ?? null,
              representative_job_title: data.representativeJobTitle ?? null,
            },
          },
        });
        if (authError) {
          console.error('Auth signup failed', authError);
          throw authError;
        }

        const authUserId = auth.user?.id;
        if (!authUserId) {
          throw new Error('Supabase signUp succeeded but no auth user id was returned.');
        }
        console.log('Auth signup ok', auth.user?.id);

        const loadSupabaseProfileWithRetry = async (id: string): Promise<Person> => {
          const maxAttempts = 5;
          const waitMs = 300;

          for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            try {
              return await loadSupabaseProfile(id);
            } catch (error) {
              if (attempt === maxAttempts) {
                console.error('Profile hydration did not complete after signup retries', error);
                break;
              }
              await new Promise((resolve) => setTimeout(resolve, waitMs));
            }
          }

          throw new Error('Account was created, but profile setup is not ready yet. Please try logging in again.');
        };

        const hydratedPerson = await loadSupabaseProfileWithRetry(authUserId);
        if (!hydratedPerson) {
          throw new Error('Account was created, but profile setup is not ready yet. Please try logging in again.');
        }
        return hydratedPerson;
      } catch (profileError) {
        const message = formatErrorMessage(profileError);
        console.error('Signup profile setup failed after auth user creation', profileError);
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch (signOutError) {
          console.error('Signup cleanup signOut failed', signOutError);
        }
        throw new Error(message);
      } finally {
        isSigningUpRef.current = false;
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
