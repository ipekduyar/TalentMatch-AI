import React, { createContext, useContext, useState, useEffect } from 'react';
import { Person, Student, CompanyRepresentative, Company, UserRole } from './types';
import { PERSONS, STUDENTS, REPS, COMPANIES } from './mock-data';

interface AuthContextType {
  user: Person | null;
  student: Student | null;
  rep: CompanyRepresentative | null;
  company: Company | null;
  role: UserRole | null;
  login: (email: string) => void;
  logout: () => void;
  switchRole: (role: UserRole, personId?: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Person | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [rep, setRep] = useState<CompanyRepresentative | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserData = (person: Person) => {
    setUser(person);
    setRole(person.role);
    
    if (person.role === 'student') {
      const s = STUDENTS.find(st => st.person_id === person.person_id) || null;
      setStudent(s);
      setRep(null);
      setCompany(null);
    } else if (person.role === 'company_rep') {
      const r = REPS.find(rp => rp.person_id === person.person_id) || null;
      setRep(r);
      if (r) {
        const c = COMPANIES.find(com => com.company_id === r.company_id) || null;
        setCompany(c);
      }
      setStudent(null);
    } else {
      setStudent(null);
      setRep(null);
      setCompany(null);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('talentmatch_user_id');
    if (savedUser) {
      const person = PERSONS.find(p => p.person_id === savedUser);
      if (person) {
        loadUserData(person);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (email: string) => {
    const person = PERSONS.find(p => p.email === email);
    if (person) {
      localStorage.setItem('talentmatch_user_id', person.person_id);
      loadUserData(person);
    }
  };

  const logout = () => {
    localStorage.removeItem('talentmatch_user_id');
    setUser(null);
    setStudent(null);
    setRep(null);
    setCompany(null);
    setRole(null);
  };

  const switchRole = (newRole: UserRole, personId?: string) => {
    let person: Person | undefined;
    if (personId) {
       person = PERSONS.find(p => p.person_id === personId);
    } else {
       person = PERSONS.find(p => p.role === newRole);
    }
    
    if (person) {
      localStorage.setItem('talentmatch_user_id', person.person_id);
      loadUserData(person);
    }
  };

  return (
    <AuthContext.Provider value={{ user, student, rep, company, role, login, logout, switchRole, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useCurrentUser = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within an AuthProvider');
  }
  return context;
};
