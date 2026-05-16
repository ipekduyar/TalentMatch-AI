import React from 'react';
import { useCurrentUser } from "@/lib/auth-context";
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { 
  User, 
  Building2, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe
} from "lucide-react";
import { cn } from "../lib/utils";

export const SignupPage = () => {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'student';
  const navigate = useNavigate();
  const { signupMockUser } = useCurrentUser();
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [kvkkConsent, setKvkkConsent] = React.useState(true);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    signupMockUser({ firstName, lastName, email, type: type === 'company' ? 'company' : 'student', kvkkConsent });
    navigate(type === 'company' ? '/company/dashboard' : '/onboarding');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 bg-slate-50/50">
      <div className="w-full max-w-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4">
          <Badge variant="indigo" className="uppercase tracking-[0.2em] font-black py-1">Identity Gateway</Badge>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Join the Nexus</h1>
          <p className="text-slate-500 font-medium max-w-md mx-auto">
            Choose your account type to begin your journey in the TalentMatch ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
          <button 
            onClick={() => navigate('/signup?type=student')}
            className={cn(
              "p-8 rounded-[2.5rem] border-2 transition-all text-left flex flex-col justify-between h-[240px] group",
              type === 'student' ? "bg-white border-indigo-600 shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50/50" : "bg-white border-slate-100 hover:border-slate-300"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-110",
              type === 'student' ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-slate-50 border-slate-100 text-slate-400"
            )}>
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className={cn("text-xl font-black tracking-tight", type === 'student' ? "text-slate-900" : "text-slate-400")}>Student</h3>
              <p className="text-xs font-medium text-slate-400 mt-1">For interns & graduates</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/signup?type=company')}
            className={cn(
              "p-8 rounded-[2.5rem] border-2 transition-all text-left flex flex-col justify-between h-[240px] group",
              type === 'company' ? "bg-white border-indigo-600 shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50/50" : "bg-white border-slate-100 hover:border-slate-300"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-110",
              type === 'company' ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-slate-50 border-slate-100 text-slate-400"
            )}>
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className={cn("text-xl font-black tracking-tight", type === 'company' ? "text-slate-900" : "text-slate-400")}>Partner</h3>
              <p className="text-xs font-medium text-slate-400 mt-1">For companies & HR</p>
            </div>
          </button>
        </div>

        <Card className="p-10 border-none shadow-xl">
          <form onSubmit={handleSignup} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">First Name</label>
                 <Input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-12 border-slate-200 rounded-xl" placeholder="İpek" />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Name</label>
                 <Input required value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-12 border-slate-200 rounded-xl" placeholder="Duyar" />
               </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
              <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 border-slate-200 rounded-xl" placeholder="ipek@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Password</label>
              <Input required type="password" className="h-12 border-slate-200 rounded-xl" placeholder="••••••••" />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-500">
              <input type="checkbox" checked={kvkkConsent} onChange={(e) => setKvkkConsent(e.target.checked)} /> KVKK consent
            </label>
            <Button type="submit" className="w-full h-14 rounded-full font-black tracking-tight text-lg">
              Create My Account <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm font-medium text-slate-400">
              Already a member? <Link to="/login" className="text-indigo-600 font-black hover:underline">Nexus Login</Link>
            </p>
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
