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

const COMPANY_SIZE_OPTIONS = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501-1000 employees",
  "1000+ employees",
] as const;

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
    companyName: '',
    companyIndustry: '',
    companySize: '11-50 employees',
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
  const normalizeWebsite = (website: string) => {
    const trimmed = website.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
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
        form.companyName, form.companyIndustry, form.companySize, form.companyLocation,
      ];
      if (requiredCompany.some(v => !v.trim())) {
        toast.error('Please fill all required company fields.');
        return;
      }

      const normalizedCompanySize = form.companySize.trim();
      if (!COMPANY_SIZE_OPTIONS.includes(normalizedCompanySize as (typeof COMPANY_SIZE_OPTIONS)[number])) {
        toast.error('Please select a valid company size.');
        return;
      }

      const normalizedWebsite = normalizeWebsite(form.companyWebsite);

      const person = await signupMockUser({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        type: 'company',
        kvkkConsent: form.kvkkConsent,
        companyName: form.companyName,
        companyIndustry: form.companyIndustry,
        companySize: normalizedCompanySize,
        companyWebsite: normalizedWebsite,
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

    const person = await signupMockUser({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      type: 'student',
      kvkkConsent: form.kvkkConsent,
      password: form.password,
      termsConsent: form.termsConsent,
    });

    toast.success('Student account created successfully.');
    if (person.role === 'company_rep') navigate('/company/dashboard');
    else if (person.role === 'admin') navigate('/admin');
    else navigate('/onboarding');
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

            {type === 'student' ? null : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input required value={form.companyName} onChange={(e) => onChange('companyName', e.target.value)} className="h-11 border-slate-200 rounded-xl" placeholder="Company name" />
                  <Input required value={form.companyIndustry} onChange={(e) => onChange('companyIndustry', e.target.value)} className="h-11 border-slate-200 rounded-xl" placeholder="Company industry" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    required
                    value={form.companySize}
                    onChange={(e) => onChange('companySize', e.target.value)}
                    className="h-11 border border-slate-200 rounded-xl px-3 bg-white text-slate-900"
                  >
                    {COMPANY_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <Input value={form.companyWebsite} onChange={(e) => onChange('companyWebsite', e.target.value)} className="h-11 border-slate-200 rounded-xl" placeholder="Company website (optional)" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input required value={form.companyLocation} onChange={(e) => onChange('companyLocation', e.target.value)} className="h-11 border-slate-200 rounded-xl" placeholder="Company location" />
                  <Input value={form.representativeJobTitle} onChange={(e) => onChange('representativeJobTitle', e.target.value)} className="h-11 border-slate-200 rounded-xl" placeholder="Representative job title (optional)" />
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
