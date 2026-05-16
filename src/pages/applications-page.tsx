import React, { useState } from 'react';
import { useCurrentUser } from "../lib/auth-context";
import { APPLICATIONS, POSTINGS, COMPANIES } from "../lib/mock-data";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  Search, 
  MapPin, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock4, 
  ExternalLink,
  MoreVertical,
  MessageSquare,
  History,
  TrendingUp,
  CircleDollarSign
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock4, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
  reviewed: { label: 'Reviewed', icon: Search, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
  shortlisted: { label: 'Shortlisted', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  accepted: { label: 'Accepted', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
  withdrawn: { label: 'Withdrawn', icon: XCircle, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-100' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-100' },
};

const STAGES = ['Applied', 'Reviewed', 'Shortlisted', 'Interview', 'Final Result'];

export const MyApplicationsPage = () => {
  const { user } = useCurrentUser();
  const [filter, setFilter] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const studentApps = APPLICATIONS.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const getJobDetails = (postingId: string) => {
    const posting = POSTINGS.find(p => p.posting_id === postingId);
    if (!posting) return null;
    const company = COMPANIES.find(c => c.company_id === posting.company_id);
    return { ...posting, company };
  };

  const handleWithdraw = (id: string) => {
    toast.error("Application withdrawn. We've notified the recruiter.");
  };

  const handleMessage = () => {
    toast.info("Connecting to recruiter via SecureChat...");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <Badge variant="indigo" className="mb-4">My Portfolio</Badge>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Applications</h1>
          <p className="text-slate-500 font-medium mt-2">Track and manage your internship journey.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white p-1 rounded-full border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
          {['all', 'pending', 'reviewed', 'shortlisted', 'accepted', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                filter === s ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-400 hover:text-slate-900"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-6">
          {studentApps.length === 0 ? (
            <Card className="p-20 text-center flex flex-col items-center justify-center space-y-6">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center border border-slate-100 shadow-inner">
                <History className="w-10 h-10 text-slate-300" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">No applications found</h3>
                <p className="text-slate-400 font-medium">Start your journey by exploring available roles.</p>
              </div>
              <Button onClick={() => window.location.href = '/search'} className="rounded-full px-10">
                Explore Roles
              </Button>
            </Card>
          ) : (
            studentApps.map((app) => {
              const job = getJobDetails(app.posting_id);
              if (!job) return null;
              const status = STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG];
              const Icon = status.icon;

              return (
                <Card 
                  key={app.application_id} 
                  className={cn(
                    "p-0 overflow-hidden transition-all hover:translate-x-1 border-none shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 cursor-pointer",
                    selectedApp?.application_id === app.application_id && "ring-2 ring-indigo-500"
                  )}
                  onClick={() => setSelectedApp(app)}
                >
                  <div className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center space-x-6">
                      <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center p-4 border border-slate-100 shadow-inner overflow-hidden flex-shrink-0">
                         <img referrerPolicy="no-referrer" src={job.company?.logo_url || ''} alt="logo" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">{job.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 tracking-widest uppercase">
                          <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {job.location}</span>
                          <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(app.applied_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4">
                      <div className={cn("px-4 py-1.5 rounded-full flex items-center gap-2 border", status.bg, status.color, status.border)}>
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">{status.label}</span>
                      </div>
                      <div className="flex items-center gap-8">
                         <div className="text-right">
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Match</p>
                           <p className="text-3xl font-black text-emerald-500 tracking-tighter">{app.match_score}%</p>
                         </div>
                         <Button size="sm" variant="outline" className="rounded-full px-5 hidden md:flex border-slate-200">
                           Details
                         </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Info Column & Details */}
        <div className="lg:col-span-12 xl:col-span-4 space-y-8">
          {selectedApp ? (
            <Card className="p-10 sticky top-28 space-y-10 animate-in slide-in-from-right duration-500">
              <div className="flex items-center justify-between">
                <CardTitle>Timeline</CardTitle>
                <div className={cn("p-2 rounded-xl border border-slate-100", STATUS_CONFIG[selectedApp.status as keyof typeof STATUS_CONFIG].bg)}>
                  {React.createElement(STATUS_CONFIG[selectedApp.status as keyof typeof STATUS_CONFIG].icon, { className: STATUS_CONFIG[selectedApp.status as keyof typeof STATUS_CONFIG].color })}
                </div>
              </div>

              {/* Status Stepper */}
              <div className="space-y-4">
                {STAGES.map((stage, idx) => {
                  const currentIdx = STAGES.indexOf(selectedApp.status === 'pending' ? 'Applied' : selectedApp.status === 'shortlisted' ? 'Shortlisted' : 'Reviewed');
                  const isCompleted = idx <= currentIdx;
                  return (
                    <div key={stage} className="flex items-center gap-4 group">
                      <div className="relative flex flex-col items-center">
                        <div className={cn(
                          "w-4 h-4 rounded-full border-2 z-10 transition-colors",
                          isCompleted ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-200"
                        )}>
                          {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-white absolute -left-[1px] -top-[1px]" />}
                        </div>
                        {idx !== STAGES.length - 1 && (
                          <div className={cn(
                            "w-[2px] h-10 -mb-4 transition-colors",
                            isCompleted ? "bg-indigo-600" : "bg-slate-100"
                          )}></div>
                        )}
                      </div>
                      <div className="pb-4">
                        <p className={cn("text-xs font-black uppercase tracking-widest", isCompleted ? "text-slate-900" : "text-slate-300")}>{stage}</p>
                        {isCompleted && <p className="text-[10px] text-slate-400 font-medium">May 12, 2024</p>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-100">
                <Button onClick={handleMessage} className="w-full rounded-2xl h-14 font-black flex items-center justify-center gap-3">
                  <MessageSquare className="w-5 h-5" />
                  Recruiter Contact
                </Button>
                <Button variant="outline" className="w-full rounded-2xl h-14 border-slate-200 text-slate-400 hover:text-slate-900 flex items-center justify-center gap-3">
                   <ExternalLink className="w-4 h-4" />
                   View Full Posting
                </Button>
                <div className="pt-4 flex items-center justify-between">
                   <button 
                    onClick={() => handleWithdraw(selectedApp.application_id)}
                    className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 px-4 py-2 hover:bg-rose-50 rounded-full transition-colors"
                  >
                     Withdraw Application
                   </button>
                   <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900">
                     Report Issue
                   </button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-10 bg-slate-900 border-none text-white overflow-hidden relative shadow-lg shadow-slate-200">
               <div className="relative z-10 space-y-6">
                  <Badge variant="indigo" className="bg-white/10 text-white border-transparent">Career Pulse</Badge>
                  <h3 className="text-4xl font-black leading-[1] tracking-tighter">Selection is <br /> in progress</h3>
                  <p className="text-sm font-medium opacity-80 leading-relaxed">
                    Select an application to see detailed timeline, interviewer feedback, and next steps.
                  </p>
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Active Search</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10 opacity-50">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Waitlisting enabled</span>
                    </div>
                  </div>
               </div>
               <div className="absolute right-[-10%] bottom-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
