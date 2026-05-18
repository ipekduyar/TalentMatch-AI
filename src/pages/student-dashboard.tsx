import { useEffect, useMemo, useState } from "react";
import { useCurrentUser } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Target, ArrowRight, TrendingUp, Clock, History, AlertCircle, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getActiveInternshipPostings, getLatestCompletedCvAnalysis, getStudentDashboardActivityData, LatestCvAnalysis, StudentDashboardActivityData } from "@/lib/student-dashboard-service";
import { InternshipPosting } from "@/lib/types";
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  Radar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from "recharts";

export const StudentDashboard = () => {
  const { user, student } = useCurrentUser();
  const [analysis, setAnalysis] = useState<LatestCvAnalysis | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(true);
  const [postings, setPostings] = useState<InternshipPosting[]>([]);
  const [activityData, setActivityData] = useState<StudentDashboardActivityData | null>(null);


  const fallbackSkillData = [
    { name: 'Python', value: 85 },
    { name: 'SQL', value: 70 },
    { name: 'React', value: 90 },
    { name: 'Agile', value: 65 },
    { name: 'PM', value: 80 },
    { name: 'Design', value: 50 },
  ];


  useEffect(() => {
    const loadDashboardInsights = async () => {
      setIsInsightLoading(true);
      try {
        const [latestAnalysis, activePostings, dashboardActivity] = await Promise.all([
          getLatestCompletedCvAnalysis(),
          getActiveInternshipPostings(),
          getStudentDashboardActivityData(),
        ]);
        setAnalysis(latestAnalysis);
        setPostings(activePostings);
        setActivityData(dashboardActivity);
      } catch (error) {
        console.error("Failed to load student dashboard insights", error);
      } finally {
        setIsInsightLoading(false);
      }
    };

    void loadDashboardInsights();
  }, []);

  const skillData = useMemo(() => {
    if (!analysis?.extracted_skills?.length) return fallbackSkillData;
    return analysis.extracted_skills.slice(0, 6).map((skill, index) => ({
      name: skill,
      value: Math.max(60, 85 - index * 4),
    }));
  }, [analysis]);

  const avgMatchScore = typeof analysis?.overall_score === "number" ? `${Math.round(analysis.overall_score)}%` : "0%";
  const skillGapCount = analysis?.weaknesses?.length ? String(analysis.weaknesses.length) : "0";
  const skillGapTrend = analysis?.weaknesses?.length ? "From CV analysis" : "Action required";
  const bridgeSuggestion = analysis?.improvement_suggestions?.[0] || analysis?.weaknesses?.[0] || null;

  const topMatches = useMemo(() => {
    if (!analysis) return postings.slice(0, 3).map((p, i) => ({ ...p, score: [80, 76, 72][i] ?? 70 }));

    const roleKeywords = analysis.suggested_roles.map((r) => r.toLowerCase());
    const skillKeywords = analysis.extracted_skills.map((s) => s.toLowerCase());

    return postings
      .map((posting) => {
        let score = 60;
        const titleText = (posting.title ?? "").toLowerCase();
        const textPool = `${posting.title ?? ""} ${posting.description ?? ""} ${posting.industry ?? ""}`.toLowerCase();
        const requiredSkills = (posting.required_skills ?? []).map((skill) => skill.toLowerCase());
        const desiredSkills = (posting.desired_skills ?? []).map((skill) => skill.toLowerCase());

        roleKeywords.forEach((keyword) => {
          if (!keyword) return;
          if (titleText.includes(keyword)) {
            score += 10;
            return;
          }
          if (textPool.includes(keyword)) {
            score += 6;
          }
        });

        skillKeywords.forEach((keyword) => {
          if (!keyword) return;
          if (requiredSkills.some((skill) => skill.includes(keyword) || keyword.includes(skill))) {
            score += 5;
            return;
          }
          if (desiredSkills.some((skill) => skill.includes(keyword) || keyword.includes(skill))) {
            score += 3;
            return;
          }
          if (textPool.includes(keyword)) {
            score += 2;
          }
        });

        const clampedScore = Math.max(60, Math.min(98, score));
        return { ...posting, score: clampedScore };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [analysis, postings]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Banner */}
      <Card variant="dark" className="relative overflow-hidden border-none min-h-[340px] flex flex-col justify-between p-12">
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <Badge variant="indigo" className="bg-white/10 text-white border-none py-1">Daily Pulse</Badge>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <div className="space-y-2">
            <h2 className="text-slate-400 text-sm font-black uppercase tracking-[0.3em]">Talent Explorer</h2>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
              Welcome back, <br /> {user?.first_name}
            </h1>
          </div>
          <p className="text-slate-400 max-w-xl text-lg font-medium leading-relaxed">
            Your profile is <span className="text-white font-black">90% complete</span>. You are currently outperforming 85% of applicants in {student?.career_goal}.
          </p>
        </div>
        <div className="pt-10 relative z-10">
           <Link to="/search">
             <Button size="lg" className="rounded-full bg-white text-slate-900 hover:bg-slate-100 px-10 h-14 font-black">
               Explore Matches
             </Button>
           </Link>
        </div>
        <div className="absolute right-[-10%] bottom-[-20%] w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[120px]"></div>
        <div className="absolute top-[10%] right-[10%] w-64 h-64 bg-indigo-400/10 rounded-full blur-[80px]"></div>
      </Card>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Avg Match Score" 
          value={avgMatchScore}
          icon={Target} 
          trend="+5.2% vs last month" 
          trendColor="text-emerald-500"
        />
        <StatCard 
          title="Active Apps" 
          value={activityData?.applications.length ?? 0} 
          icon={Briefcase} 
          trend={(activityData?.applications.filter((app) => app.status === "submitted" || app.status === "pending").length ?? 0) > 0
            ? `${activityData?.applications.filter((app) => app.status === "submitted" || app.status === "pending").length} awaiting review`
            : "No pending applications"}
          trendColor="text-amber-500"
        />
        <StatCard 
          title="Skill Gaps" 
          value={skillGapCount}
          icon={AlertCircle} 
          trend={skillGapTrend}
          trendColor="text-rose-500"
        />
        <StatCard 
          title="Learning Path" 
          value={`${Math.min(100, Math.max(20, Math.round((analysis?.overall_score ?? 0) - ((analysis?.weaknesses?.length ?? 0) * 5))))}%`} 
          icon={TrendingUp} 
          trend={analysis ? "Next focus ready" : "Open roadmap"} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-8">
          {/* Visual Analytics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <Card className="p-10">
                <CardHeader className="p-0 mb-8">
                  <CardTitle>Skill Snapshot</CardTitle>
                </CardHeader>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                      <PolarGrid stroke="#f1f5f9" />
                      <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                      <Radar
                        name="İpek"
                        dataKey="value"
                        stroke="#4f46e5"
                        fill="#6366f1"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
             </Card>

             <Card className="p-10">
                <CardHeader className="p-0 mb-8">
                  <CardTitle>Learning progress</CardTitle>
                </CardHeader>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData?.learningProgress ?? []}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b", fontWeight: 700 }} />
                      <YAxis hide domain={[0, 100]} />
                      <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </Card>
          </div>

          {/* Recommended Internships */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommended for you</h2>
              <Link to="/search" className="text-xs font-black text-indigo-600 hover:underline flex items-center uppercase tracking-widest">
                Explore All <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
               {topMatches.map((posting) => (
                 <Card key={posting.posting_id} className="p-8 transition-all hover:translate-x-1 border-none shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 group">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-8">
                       <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center p-4 border border-slate-100 shadow-inner overflow-hidden group-hover:scale-105 transition-transform">
                          <img referrerPolicy="no-referrer" src={`https://api.dicebear.com/7.x/initials/svg?seed=${posting.company_name || posting.title}`} alt="logo" className="w-full h-full object-contain" />
                       </div>
                       <div>
                         <h3 className="text-2xl font-black tracking-tight text-slate-900 leading-none mb-2">{posting.title}</h3>
                         <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{posting.company_name || "Unknown Company"} • {posting.location}</p>
                       </div>
                     </div>
                     <div className="text-right flex items-center space-x-10">
                        <div className="hidden sm:block">
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Match Score</p>
                           <p className="text-4xl font-black text-emerald-500 tracking-tighter">{posting.score}%</p>
                        </div>
                        <Link to={`/postings/${posting.posting_id}`}><Button size="sm" variant="outline" className="rounded-full px-8 h-12">Details</Button></Link>
                     </div>
                   </div>
                 </Card>
               ))}
            </div>
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="lg:col-span-4 space-y-8">
           {/* Skill Gap Alert */}
           <Card className="bg-indigo-600 border-none text-white p-10 overflow-hidden relative shadow-lg shadow-indigo-100">
             <div className="relative z-10 space-y-6">
                <Badge variant="indigo" className="bg-white/10 text-white border-none py-1 uppercase">Accelerator</Badge>
                <h3 className="text-4xl font-black leading-tight tracking-tighter">Bridge the gap</h3>
                <p className="text-sm font-medium opacity-90 leading-relaxed">
                  {bridgeSuggestion ? (
                    <>Your CV can be improved by: <span className="font-black underline underline-offset-4 decoration-white/30 truncate">{bridgeSuggestion}</span>.</>
                  ) : (
                    <>You are missing <span className="font-black underline underline-offset-4 decoration-white/30 truncate">Advanced Excel</span> required by 18 top roles in your area.</>
                  )}
                </p>
                <Link to="/learning-path">
                  <Button className="w-full bg-white text-indigo-600 hover:bg-slate-100 border-none font-black rounded-full h-14">
                    Open Learning Path
                  </Button>
                </Link>
             </div>
             <div className="absolute right-[-20%] top-[-20%] w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
           </Card>

           {/* Activity Log */}
           <Card className="p-10">
             <CardHeader className="p-0 mb-8 border-none flex flex-row items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <History className="w-5 h-5 text-slate-300" />
             </CardHeader>
             <CardContent className="p-0 space-y-10">
                {(activityData?.recentActivities ?? []).map((activity, idx) => (
                  <ActivityItem key={`${activity.status}-${idx}`} text={activity.text} time={activity.time} status={activity.status} />
                ))}
             </CardContent>
           </Card>
           {isInsightLoading && (
             <Card className="p-8 border border-slate-200 bg-slate-50/50">
               <CardTitle className="text-lg mb-2">Loading your personalized insights</CardTitle>
               <CardDescription>
                 We are fetching your latest CV analysis and active internship postings.
               </CardDescription>
             </Card>
           )}
           {!isInsightLoading && !analysis && (
             <Card className="p-8 border-dashed border-2 border-indigo-200 bg-indigo-50/40">
               <CardTitle className="text-lg mb-2">Personalize your dashboard</CardTitle>
               <CardDescription className="mb-6">
                 Upload and analyze your CV to personalize recommendations.
               </CardDescription>
               <Link to="/onboarding">
                 <Button className="rounded-full">Go to onboarding</Button>
               </Link>
             </Card>
           )}

           {/* Upcoming Deadlines */}
           <Card className="p-10">
             <CardHeader className="p-0 mb-8 border-none flex flex-row items-center justify-between">
                <CardTitle>Upcoming Deadlines</CardTitle>
                <Clock className="w-5 h-5 text-slate-300" />
             </CardHeader>
             <CardContent className="p-0 space-y-8">
                {activityData?.upcomingDeadlines?.length ? activityData.upcomingDeadlines.map((deadline) => (
                  <Link key={deadline.posting_id} to={`/postings/${deadline.posting_id}`} className="flex items-center justify-between group cursor-pointer">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{deadline.title}</p>
                      <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">{deadline.company_name} • Ends in {deadline.ends_in_days} days</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-200" />
                  </Link>
                )) : <p className="text-sm text-slate-500">No upcoming deadlines.</p>}             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, trendColor = "text-slate-400" }: any) => (
  <Card className="p-10 transition-all hover:translate-y-[-4px] border-none shadow-sm group">
    <div className="flex items-center justify-between mb-10">
      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center p-3 border border-slate-100 shadow-inner group-hover:scale-110 transition-transform">
        <Icon className="w-7 h-7 text-slate-800" />
      </div>
      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${trendColor}`}>{trend}</span>
    </div>
    <div>
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{title}</h3>
      <p className="text-5xl font-black text-slate-900 tracking-tighter">{value}</p>
    </div>
  </Card>
);

const ActivityItem = ({ text, time, status }: any) => (
  <div className="flex gap-6 group">
    <div className="relative flex flex-col items-center">
      <div className="w-3 h-3 rounded-full bg-indigo-600 ring-8 ring-indigo-50 z-10 transition-transform group-hover:scale-125"></div>
      <div className="w-[1px] h-20 -mb-10 bg-slate-100"></div>
    </div>
    <div className="space-y-1 pb-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{status}</p>
      <p className="text-sm font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{text}</p>
      <p className="text-[10px] text-slate-400 font-medium">{time}</p>
    </div>
  </div>
);
