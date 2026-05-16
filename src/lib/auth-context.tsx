import React, { createContext, useContext, useState, useEffect } from 'react';
import { Person, Student, CompanyRepresentative, Company, UserRole } from './types';
import { PERSONS, STUDENTS, REPS, COMPANIES } from './mock-data';

interface SignupMockData {
  firstName: string;
  lastName: string;
  email: string;
  type: 'student' | 'company';
  kvkkConsent: boolean;
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
      setStudent(STUDENTS.find(st => st.person_id === person.person_id) || null);
      setRep(null); setCompany(null);
      return;
    }
    if (person.role === 'company_rep') {
      const foundRep = REPS.find(rp => rp.person_id === person.person_id) || null;
      setRep(foundRep);
      setCompany(foundRep ? COMPANIES.find(c => c.company_id === foundRep.company_id) || null : null);
      setStudent(null);
      return;
    }
    setStudent(null); setRep(null); setCompany(null);
  };

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    hydrate(savedId ? users.find(p => p.person_id === savedId) || null : null);
    setIsLoading(false);
  }, [users]);

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
    const created: Person = {
      person_id: `p_mock_${Date.now()}`,
      auth_user_id: `auth_mock_${Date.now()}`,
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
