import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Person, Student, CompanyRepresentative, Company, UserRole } from './types';
import { PERSONS, STUDENTS, REPS, COMPANIES } from './mock-data';
import { isSupabaseConfigured, supabase } from './supabase';
import { User as SupabaseAuthUser } from '@supabase/supabase-js';

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

const CONSENT_VERSION = 'v1.0';

const buildConsentPersistencePayload = () => {
  const consentedAt = new Date().toISOString();
  return {
    kvkk_consent: true,
    kvkk_consent_at: consentedAt,
    terms_consent: true,
    terms_consent_at: consentedAt,
    consent_version: CONSENT_VERSION,
  };
};

const LEGACY_MOCK_AUTH_KEYS = [
  STORAGE_KEY,
  'talentmatch_mock_user_id',
  'talentmatch_mock_role',
  'talentmatch_demo_user_id',
  'talentmatch_role_switch_user_id',
  'talentmatch_role_switcher_user_id',
] as const;

const cleanupLegacyAuthState = () => {
  LEGACY_MOCK_AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
  console.log('Legacy mock auth state cleaned');
};

const withTimeout = async <T,>(promise: Promise<T>, timeoutMessage: string, ms = 10000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(timeoutMessage)), ms)),
  ]) as Promise<T>;
};

const buildPersonFromAuthUser = (authUser: SupabaseAuthUser, fallbackRole?: UserRole): Person => {
  const metadata = authUser.user_metadata ?? {};
  const email = authUser.email ?? '';
  const emailPrefix = email.split('@')[0] || 'user';
  const roleFromMetadata = metadata.role as UserRole | undefined;
  return {
    person_id: `auth_${authUser.id}`,
    auth_user_id: authUser.id,
    first_name: (metadata.first_name as string | undefined) ?? emailPrefix,
    last_name: (metadata.last_name as string | undefined) ?? '',
    email,
    role: roleFromMetadata ?? fallbackRole ?? 'student',
    kvkk_consent: (metadata.kvkk_consent as boolean | undefined) ?? true,
    created_at: authUser.created_at ?? new Date().toISOString(),
    is_active: true,
    avatar_url: null,
  };
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

      cleanupLegacyAuthState();

      const { data } = await supabase.auth.getSession();
      const authUserId = data.session?.user?.id;
      if (authUserId) {
        const immediatePerson = buildPersonFromAuthUser(data.session.user);
        setUser(immediatePerson);
        setRole(immediatePerson.role);
        setStudent(null);
        setRep(null);
        setCompany(null);
        if (isLoggingInRef.current) {
          console.log('Login in progress: skipping bootstrap hydration');
        } else if (isSigningUpRef.current) {
          console.log('Signup in progress: ignoring auth-state event');
        } else {
          void loadSupabaseProfile(authUserId).catch((error) => {
            console.error('Auth bootstrap profile hydration failed', error);
          });
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
      const immediatePerson = buildPersonFromAuthUser(session.user);
      setUser(immediatePerson);
      setRole(immediatePerson.role);
      setStudent(null);
      setRep(null);
      setCompany(null);
      void loadSupabaseProfile(session.user.id).catch((error) => {
        console.error('Auth state profile hydration failed', error);
      });
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
      const authUser = data.user;
      const authUserId = authUser?.id;
      console.log('Login auth ok', authUserId);
      if (!authUser || !authUserId) throw new Error('Login succeeded but no auth user id was returned.');
      const immediatePerson = buildPersonFromAuthUser(authUser);
      setUser(immediatePerson);
      setRole(immediatePerson.role);
      setStudent(null);
      setRep(null);
      setCompany(null);
      isLoggingInRef.current = false;
      void loadSupabaseProfile(authUserId).catch((profileError) => {
        console.error("Login background profile hydration failed", profileError);
      });
      return immediatePerson;
    } catch (error) {
      console.error("Login failed", error);
      const message = formatErrorMessage(error);
      isLoggingInRef.current = false;
      await supabase.auth.signOut({ scope: 'local' });
      throw new Error(message);
    }
  }, [loadSupabaseProfile, formatErrorMessage]);

  const logout = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
      localStorage.removeItem(STORAGE_KEY);
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

    if (data.kvkkConsent !== true || data.termsConsent !== true) {
      throw new Error('KVKK consent and Terms & Conditions consent are required to create an account.');
    }

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

        const authUser = auth.user;
        const authUserId = authUser?.id;
        if (!authUser || !authUserId) {
          throw new Error('Supabase signUp succeeded but no auth user id was returned.');
        }
        console.log('Auth signup ok', auth.user?.id);

        const consentPayload = buildConsentPersistencePayload();
        const { data: persistedConsentPerson, error: consentError } = await supabase
          .from('persons')
          .update(consentPayload)
          .eq('auth_user_id', authUserId)
          .select('person_id, auth_user_id, kvkk_consent, kvkk_consent_at, terms_consent, terms_consent_at, consent_version')
          .maybeSingle();

        if (consentError) {
          console.error('Consent persistence failed', consentError);
          throw new Error(`Account was created, but required consent could not be saved. Please contact support before continuing. ${formatErrorMessage(consentError)}`);
        }

        if (!persistedConsentPerson) {
          throw new Error('Account was created, but required consent could not be saved because the profile row was not found. Please contact support before continuing.');
        }

        if (
          persistedConsentPerson.kvkk_consent !== true ||
          !persistedConsentPerson.kvkk_consent_at ||
          persistedConsentPerson.terms_consent !== true ||
          !persistedConsentPerson.terms_consent_at ||
          persistedConsentPerson.consent_version !== CONSENT_VERSION
        ) {
          throw new Error('Account was created, but required consent verification failed. Please contact support before continuing.');
        }

        const immediatePerson = buildPersonFromAuthUser(authUser, role);
        setUser(immediatePerson);
        setRole(role);
        setStudent(null);
        setRep(null);
        setCompany(null);
        isSigningUpRef.current = false;
        void loadSupabaseProfile(authUserId).catch((profileError) => {
          console.error('Signup background profile hydration failed', profileError);
        });
        return immediatePerson;
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
      kvkk_consent: true,
      kvkk_consent_at: new Date().toISOString(),
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
