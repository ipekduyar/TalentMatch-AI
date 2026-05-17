import React from 'react';
import { useCurrentUser } from "@/lib/auth-context";
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { User, Building2, ArrowRight, ShieldCheck, Zap, Globe } from "lucide-react";
import { cn } from "../lib/utils";
import { toast } from "sonner";

export const SignupPage = () => {
  const [searchParams] = useSearchParams();
  const rawType = searchParams.get('type');
  const type: 'student' | 'company' = rawType === 'company' ? 'company' : 'student';
  const navigate = useNavigate();
  const { signupMockUser } = useCurrentUser();

  const [form, setForm] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    university: '',
    department: '',
    studentNumber: '',
    academicYear: '',
    gpa: '',
    careerGoal: '',
    companyName: '',
    companyIndustry: '',
    companySize: '',
    companyWebsite: '',
    companyLocation: '',
    representativeJobTitle: '',
    kvkkConsent: false,
    termsConsent: false,
  });

  const onChange = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };
  const formatErrorMessage = (error: unknown) => {
    if (error instanceof Error && error.message) return error.message;
    try { return JSON.stringify(error); } catch { return String(error); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
    if (!form.kvkkConsent || !form.termsConsent) {
      toast.error('Please accept KVKK and Terms consents to continue.');
      return;
    }

    const common = [form.firstName, form.lastName, form.email, form.password];
    if (common.some(v => !v.trim())) {
      toast.error('Please fill all required fields.');
      return;
    }

    if (type === 'company') {
      const requiredCompany = [
        form.companyName, form.companyIndustry, form.companySize, form.companyWebsite, form.companyLocation, form.representativeJobTitle,
      ];
      if (requiredCompany.some(v => !v.trim())) {
        toast.error('Please fill all company representative fields.');
        return;
      }

      const person = await signupMockUser({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        type: 'company',
        kvkkConsent: form.kvkkConsent,
        companyName: form.companyName,
        companyIndustry: form.companyIndustry,
        companySize: (form.companySize as "startup" | "sme" | "enterprise") || 'sme',
        companyWebsite: form.companyWebsite,
        companyLocation: form.companyLocation,
        representativeJobTitle: form.representativeJobTitle,
        password: form.password,
        termsConsent: form.termsConsent,
      });
      toast.success('Company representative account created. Verification pending.');
      if (person.role === 'company_rep') navigate('/company/dashboard');
      else if (person.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
      return;
    }

    const requiredStudent = [
      form.university, form.department, form.studentNumber, form.academicYear, form.gpa, form.careerGoal,
    ];
    if (requiredStudent.some(v => !v.trim())) {
      toast.error('Please fill all student fields.');
      return;
    }

    const person = await signupMockUser({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      type: 'student',
      kvkkConsent: form.kvkkConsent,
      university: form.university,
      department: form.department,
      studentNumber: form.studentNumber,
      academicYear: Number(form.academicYear) as 1 | 2 | 3 | 4 | 5,
      gpa: Number(form.gpa),
      careerGoal: form.careerGoal,
      password: form.password,
      termsConsent: form.termsConsent,
    });

    toast.success('Student account created successfully.');
    if (person.role === 'company_rep') navigate('/company/dashboard');
    else if (person.role === 'admin') navigate('/admin');
    else navigate('/dashboard');
    } catch (error) {
      toast.error(formatErrorMessage(error));
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 bg-slate-50/50">
      <div className="w-full max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4">
          <Badge variant="indigo" className="uppercase tracking-[0.2em] font-black py-1">Identity Gateway</Badge>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Join the Nexus</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
          <button onClick={() => navigate('/signup?type=student')} className={cn("p-8 rounded-[2.5rem] border-2 transition-all text-left flex flex-col justify-between h-[220px] group", type === 'student' ? "bg-white border-indigo-600 shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50/50" : "bg-white border-slate-100 hover:border-slate-300")}>
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-110", type === 'student' ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-slate-50 border-slate-100 text-slate-400")}><User className="w-6 h-6" /></div>
            <div><h3 className={cn("text-xl font-black tracking-tight", type === 'student' ? "text-slate-900" : "text-slate-400")}>Student</h3></div>
          </button>

          <button onClick={() => navigate('/signup?type=company')} className={cn("p-8 rounded-[2.5rem] border-2 transition-all text-left flex flex-col justify-between h-[220px] group", type === 'company' ? "bg-white border-indigo-600 shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50/50" : "bg-white border-slate-100 hover:border-slate-300")}>
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-110", type === 'company' ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-slate-50 border-slate-100 text-slate-400")}><Building2 className="w-6 h-6" /></div>
            <div><h3 className={cn("text-xl font-black tracking-tight", type === 'company' ? "text-slate-900" : "text-slate-400")}>Company representative</h3></div>
          </button>
        </div>

        <Card className="p-8 border-none shadow-xl bg-white rounded-3xl">
          <form onSubmit={handleSignup} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input required value={form.firstName} onChange={(e) => onChange('firstName', e.target.value)} className="h-11 border-slate-200 rounded-xl" placeholder="First name" />
              <Input required value={form.lastName} onChange={(e) => onChange('lastName', e.target.value)} className="h-11 border-slate-200 rounded-xl" placeholder="Last name" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input required type="email" value={form.email} onChange={(e) => onChange('email', e.target.value)} className="h-11 border-slate-200 rounded-xl" placeholder={type === 'company' ? 'Work email' : 'Email'} />
              <Input required type="password" value={form.password} onChange={(e) => onChange('password', e.target.value)} className="h-11 border-slate-200 rounded-xl" placeholder="Password" />
            </div>

            {type === 'student' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input required value={form.university} onChange={(e) => onChange('university', e.target.value)} className="h-11 border-slate-200 rounded-xl" placeholder="University" />
                  <Input required value={form.department} onChange={(e) => onChange('department', e.target.value)} className="h-11 border-slate-200 rounded-xl" placeholder="Department" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input required value={form.studentNumber} onChange={(e) => onChange('studentNumber', e.target.value)} className="h-11 border-slate-200 rounded-xl" placeholder="Student number" />
                  <Input required type="number" min="1" max="5" value={form.academicYear} onChange={(e) => onChange('academicYear', e.target.value)} className="h-11 border-slate-200 rounded-xl" placeholder="Academic year (1-5)" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input required type="number" min="0" max="4" step="0.01" value={form.gpa} onChange={(e) => onChange('gpa', e.target.value)} className="h-11 border-slate-200 rounded-xl" placeholder="GPA" />
                  <Input required value={form.careerGoal} onChange={(e) => onChange('careerGoal', e.target.value)} className="h-11 border-slate-200 rounded-xl" placeholder="Career goal" />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input required value={form.companyName} onChange={(e) => onChange('companyName', e.target.value)} className="h-11 border-slate-200 rounded-xl" placeholder="Company name" />
                  <Input required value={form.companyIndustry} onChange={(e) => onChange('companyIndustry', e.target.value)} className="h-11 border-slate-200 rounded-xl" placeholder="Company industry" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input required value={form.companySize} onChange={(e) => onChange('companySize', e.target.value)} className="h-11 border-slate-200 rounded-xl" placeholder="Company size (startup/sme/enterprise)" />
                  <Input required type="url" value={form.companyWebsite} onChange={(e) => onChange('companyWebsite', e.target.value)} className="h-11 border-slate-200 rounded-xl" placeholder="Company website" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input required value={form.companyLocation} onChange={(e) => onChange('companyLocation', e.target.value)} className="h-11 border-slate-200 rounded-xl" placeholder="Company location" />
                  <Input required value={form.representativeJobTitle} onChange={(e) => onChange('representativeJobTitle', e.target.value)} className="h-11 border-slate-200 rounded-xl" placeholder="Representative job title" />
                </div>
              </>
            )}

            <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={form.kvkkConsent} onChange={(e) => onChange('kvkkConsent', e.target.checked)} /> I accept KVKK consent.</label>
            <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={form.termsConsent} onChange={(e) => onChange('termsConsent', e.target.checked)} /> I accept Terms and Conditions.</label>

            <Button type="submit" className="w-full h-12 rounded-full font-bold text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Create My Account <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm font-medium text-slate-400">Already a member? <Link to="/login" className="text-indigo-600 font-black hover:underline">Nexus Login</Link></p>
          </div>
        </Card>

        <div className="flex items-center justify-center gap-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">
          <span className="flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> KVKK Compliant</span>
          <span className="flex items-center gap-2"><Globe className="w-3 h-3" /> ISO 27001</span>
          <span className="flex items-center gap-2"><Zap className="w-3 h-3" /> Instant Sync</span>
        </div>
      </div>
    </div>
  );
};
