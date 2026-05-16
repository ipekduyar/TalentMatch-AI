import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  Sparkles, 
  BookOpen, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Target,
  Rocket,
  ShieldCheck,
  Zap,
  TrendingUp,
  Brain
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export const SkillGapPage = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <Badge variant="indigo" className="mb-4">Deep Vector Match</Badge>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Match Intelligence</h1>
          <p className="text-slate-500 font-medium mt-2">Analysis for Product Management Intern role at Garanti BBVA.</p>
        </div>
        <div className="flex items-center gap-4">
           <Badge className="bg-emerald-500 text-white px-6 py-2 rounded-full font-black uppercase tracking-widest text-xs border-none shadow-lg shadow-emerald-100">Top 5% Candidate</Badge>
        </div>
      </div>

      <Card variant="dark" className="relative overflow-hidden border-none p-12 min-h-[300px] flex flex-col justify-between">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                 </div>
                 <h2 className="text-2xl font-black tracking-tight">AI Insights</h2>
              </div>
              <p className="text-slate-300 text-xl font-medium leading-relaxed">
                İpek, your Industrial Engineering foundations and <span className="text-white font-black underline decoration-indigo-500 decoration-2 underline-offset-4">SQL mastery</span> put you in the upper echelon of applicants. Your core scores match <span className="text-indigo-400 font-black text-2xl tracking-tighter">85%</span> of this role's requirements. 
              </p>
              <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">
                Strategic focus on <span className="text-white font-bold">Agile Methodologies</span> and <span className="text-white font-bold">Advanced Excel</span> will unlock a direct interview pathway with the HR team.
              </p>
            </div>
            <div className="lg:col-span-4 flex justify-center">
               <div className="w-48 h-48 bg-indigo-600/20 rounded-[3rem] flex items-center justify-center border-4 border-indigo-600/30 relative">
                  <div className="text-center relative z-10">
                     <p className="text-6xl font-black text-white tracking-tighter">67<span className="text-2xl opacity-50 font-medium">th</span></p>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Percentile</p>
                  </div>
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-[3rem] animate-pulse"></div>
               </div>
            </div>
        </div>
        <div className="absolute right-[-10%] bottom-[-20%] w-[400px] h-[400px] bg-indigo-600/30 rounded-full blur-[100px]"></div>
      </Card>

      <div className="grid grid-cols-1 gap-8">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-rose-500" />
            Critical Growth Gaps (2)
          </h2>
          <Link to="/learning-path" className="text-xs font-black text-indigo-600 hover:underline uppercase tracking-widest flex items-center">
            Optimization Path <ChevronRight className="w-3 h-3 ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <GapItem 
             name="Agile Methodologies"
             studentLevel={2}
             requiredLevel={4}
             urgency="critical"
             resources={[
               { title: "Agile Project Management", provider: "Coursera", duration: "12h", cost: "Subscription" },
               { title: "Scrum Master Certification", provider: "Udemy", duration: "6h", cost: "400 TRY" }
             ]}
          />

          <GapItem 
             name="Product Lifecycle"
             studentLevel={1}
             requiredLevel={3}
             urgency="moderate"
             resources={[
               { title: "Product Foundation Plus", provider: "Coursera", duration: "40h", cost: "Free" }
             ]}
          />
        </div>
      </div>
    </div>
  );
};

const GapItem = ({ name, studentLevel, requiredLevel, urgency, resources }: any) => {
  return (
    <Card className={cn(
      "p-0 overflow-hidden border-none shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 transition-all",
    )}>
      <div className={cn(
        "h-1.5 w-full",
        urgency === 'critical' ? 'bg-rose-500' : 'bg-amber-500'
      )}></div>
      <CardContent className="p-10 space-y-10">
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="flex items-center gap-6">
               <div className={cn(
                 "w-16 h-16 rounded-[1.5rem] flex items-center justify-center border shrink-0",
                 urgency === 'critical' ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-amber-50 border-amber-100 text-amber-600"
               )}>
                  <Brain className="w-8 h-8" />
               </div>
               <div className="space-y-2">
                  <h3 className="font-black text-2xl text-slate-900 tracking-tight leading-none">{name}</h3>
                  <div className="flex items-center gap-2">
                     <div className={cn(
                       "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                       urgency === 'critical' ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                     )}>
                       {urgency}
                     </div>
                     <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Priority Alpha</span>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-12 bg-slate-50/50 px-8 py-6 rounded-[2rem] border border-slate-100">
               <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Index</p>
                  <p className="text-4xl font-black text-slate-900 tracking-tighter">{studentLevel}<span className="text-lg opacity-20">/5</span></p>
               </div>
               <div className="flex flex-col items-center gap-1">
                  <div className="w-[1px] h-10 bg-slate-200"></div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                  <div className="w-[1px] h-1 bg-slate-200"></div>
               </div>
               <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nexus Target</p>
                  <p className="text-4xl font-black text-indigo-600 tracking-tighter">{requiredLevel}<span className="text-lg opacity-20">/5</span></p>
               </div>
            </div>
         </div>

         <div className="space-y-6 pt-10 border-t border-slate-50">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center">
                <BookOpen className="w-4 h-4 mr-3 text-indigo-500" />
                Recommended Accelerator content
              </p>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {resources.map((res: any) => (
                 <div key={res.title} className="p-6 bg-white border border-slate-100 rounded-[1.5rem] hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/30 transition-all group flex flex-col justify-between cursor-pointer">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{res.provider}</span>
                        <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                      </div>
                      <p className="text-base font-black text-slate-900 leading-tight pr-4">{res.title}</p>
                    </div>
                    <div className="flex items-center justify-between mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                       <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-2" /> {res.duration}</span>
                       <span className="text-slate-900">{res.cost}</span>
                    </div>
                 </div>
               ))}
               <div className="p-6 border-2 border-dashed border-slate-100 rounded-[1.5rem] flex items-center justify-center group hover:border-indigo-200 transition-colors cursor-pointer">
                  <div className="text-center">
                    <Zap className="w-6 h-6 text-slate-200 mx-auto mb-2 group-hover:text-indigo-500 transition-colors" />
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">See more resources</span>
                  </div>
               </div>
            </div>
         </div>
      </CardContent>
    </Card>
  );
};
