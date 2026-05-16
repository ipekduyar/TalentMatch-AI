import React, { createContext, useContext, useState, useEffect } from 'react';
import { Person, Student, CompanyRepresentative, Company, UserRole } from './types';
import { PERSONS, STUDENTS, REPS, COMPANIES } from './mock-data';

interface SignupMockData {
  firstName: string;
  lastName: string;
  email: string;
  type: 'student' | 'company';
  kvkkConsent: boolean;
  university?: string;
  department?: string;
  studentNumber?: string;
  academicYear?: 1 | 2 | 3 | 4 | 5;
  gpa?: number | null;
  careerGoal?: string;
  companyName?: string;
  companyIndustry?: string;
  companySize?: "startup" | "sme" | "enterprise" | null;
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
  loginAsDemoUser: (userId: string) => void;
  signupMockUser: (data: SignupMockData) => Person;
  logout: () => void;
  switchRole: (userId?: string) => void;
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

  const hydrate = (person: Person | null) => {
    setUser(person);
    setRole(person?.role ?? null);
    if (!person) {
      setStudent(null); setRep(null); setCompany(null); return;
    }
    if (person.role === 'student') {
      setStudent(students.find(st => st.person_id === person.person_id) || null);
      setRep(null); setCompany(null);
      return;
    }
    if (person.role === 'company_rep') {
      const foundRep = reps.find(rp => rp.person_id === person.person_id) || null;
      setRep(foundRep);
      setCompany(foundRep ? companies.find(c => c.company_id === foundRep.company_id) || null : null);
      setStudent(null);
      return;
    }
    setStudent(null); setRep(null); setCompany(null);
  };

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    hydrate(savedId ? users.find(p => p.person_id === savedId) || null : null);
    setIsLoading(false);
  }, [users, students, reps, companies]);

  const loginAsDemoUser = (userId: string) => {
    const found = users.find(p => p.person_id === userId);
    if (!found) return;
    localStorage.setItem(STORAGE_KEY, userId);
    hydrate(found);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    hydrate(null);
  };

  const switchRole = (userId?: string) => {
    if (!userId) {
      logout();
      return;
    }
    loginAsDemoUser(userId);
  };

  const signupMockUser = (data: SignupMockData): Person => {
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

    if (data.type === 'student') {
      const createdStudent: Student = {
        student_id: `st_mock_${now}`,
        person_id: created.person_id,
        university: data.university || 'Unknown University',
        department: data.department || 'Undeclared',
        student_number: data.studentNumber || `S${now}`,
        gpa: data.gpa ?? null,
        academic_year: data.academicYear || 1,
        graduation_date: null,
        career_goal: data.careerGoal || null,
        cv_file_path: null,
        cv_parsed_text: null,
        is_edu_verified: false,
        profile_complete: false,
      };
      setStudents(prev => [...prev, createdStudent]);
    }

    if (data.type === 'company') {
      const matchedCompany = companies.find(
        company => company.name.toLowerCase() === (data.companyName || '').trim().toLowerCase()
      );
      const companyId = matchedCompany?.company_id || `c_mock_${now}`;

      if (!matchedCompany) {
        const createdCompany: Company = {
          company_id: companyId,
          name: data.companyName || 'New Company',
          industry: data.companyIndustry || 'Other',
          size: data.companySize || 'sme',
          website: data.companyWebsite || null,
          location: data.companyLocation || null,
          description: 'Pending verification company profile.',
          logo_url: null,
          is_premium: false,
          is_approved: false,
          avg_evaluation_score: null,
          created_at: new Date().toISOString(),
        };
        setCompanies(prev => [...prev, createdCompany]);
      }

      const createdRep: CompanyRepresentative = {
        rep_id: `rep_mock_${now}`,
        person_id: created.person_id,
        company_id: companyId,
        job_title: data.representativeJobTitle || 'Representative',
        is_verified: false,
      };
      setReps(prev => [...prev, createdRep]);
    }

    setUsers(prev => [...prev, created]);
    localStorage.setItem(STORAGE_KEY, created.person_id);
    hydrate(created);
    return created;
  };

  return (
    <AuthContext.Provider value={{ currentUser: user, user, student, rep, company, role, loginAsDemoUser, signupMockUser, logout, switchRole, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useCurrentUser = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useCurrentUser must be used within an AuthProvider');
  return context;
};
