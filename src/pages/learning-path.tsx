import React, { useState } from 'react';
import { useCurrentUser } from "../lib/auth-context";
import { LEARNING_RESOURCES, SKILLS, STUDENTS } from "../lib/mock-data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  GraduationCap, 
  Clock, 
  Star, 
  TrendingUp, 
  Search, 
  ExternalLink,
  BookOpen,
  Trophy,
  Target,
  CircleDollarSign,
  Bookmark
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";

export const LearningPathPage = () => {
  const { user } = useCurrentUser();
  const student = STUDENTS.find(s => s.person_id === user?.person_id);
  const [activeTab, setActiveTab ] = useState('roadmap');
  const [savedCourses, setSavedCourses] = useState<string[]>([]);
  const [startedCourses, setStartedCourses] = useState<string[]>([]);

  const toggleSave = (id: string) => {
    if (savedCourses.includes(id)) {
      setSavedCourses(prev => prev.filter(c => c !== id));
      toast.info("Removed from bookmarks");
    } else {
      setSavedCourses(prev => [...prev, id]);
      toast.success("Added to bookmarks");
    }
  };

  const handleStart = (id: string) => {
    if (!startedCourses.includes(id)) {
      setStartedCourses(prev => [...prev, id]);
      toast.success("Course started! Good luck on your journey.");
    } else {
      toast.info("Continuing course...");
    }
  };

  const roadmaps = [
    { 
      title: 'This Week: Core Foundations', 
      items: LEARNING_RESOURCES.slice(0, 1), 
      status: 'In Focus',
      description: 'Strengthen your understanding of modern internship workflows.'
    },
    { 
      title: 'Next 30 Days: Technical mastery', 
      items: LEARNING_RESOURCES.slice(1, 4), 
      status: 'Upcoming',
      description: 'Deep dive into specialized skills requested by target companies.'
    },
    { 
      title: 'Next 3 Months: Leadership & Domain', 
      items: [], 
      status: 'Future',
      description: 'Prepare for long-term career growth with senior-level attributes.'
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-4">
          <Badge variant="indigo">Skill Multiplier</Badge>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Learning Path</h1>
          <p className="text-slate-500 font-medium">A prioritized roadmap based on your target roles and current skill gaps.</p>
        </div>
        <div className="flex bg-white p-1 rounded-full border border-slate-200">
          <button 
            onClick={() => setActiveTab('roadmap')}
            className={cn(
              "px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'roadmap' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-400"
            )}
          >
            Roadmap
          </button>
          <button 
            onClick={() => setActiveTab('library')}
            className={cn(
              "px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'library' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-400"
            )}
          >
            Library
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Roadmaps */}
        <div className="lg:col-span-8 space-y-12">
          {roadmaps.map((section, sIdx) => (
            <div key={section.title} className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{section.title}</h2>
                  <p className="text-xs text-slate-400 font-medium">{section.description}</p>
                </div>
                <Badge variant={section.status === 'In Focus' ? 'indigo' : 'secondary'} className="rounded-full px-4">
                  {section.status}
                </Badge>
              </div>

              {section.items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {section.items.map((course) => {
                    const skill = SKILLS.find(s => s.skill_id === course.skill_id);
                    const isStarted = startedCourses.includes(course.resource_id);
                    const isSaved = savedCourses.includes(course.resource_id);

                    return (
                      <Card key={course.resource_id} className="p-8 group hover:shadow-xl hover:shadow-indigo-50/50 transition-all">
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner group-hover:scale-110 transition-transform">
                            <BookOpen className="w-6 h-6 text-slate-800" />
                          </div>
                          <button onClick={() => toggleSave(course.resource_id)} className={cn(
                            "p-2 rounded-xl border border-slate-100 transition-colors",
                            isSaved ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-white text-slate-300 hover:text-slate-900"
                          )}>
                             <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
                          </button>
                        </div>
                        
                        <div className="space-y-1 mb-6">
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{course.provider}</p>
                          <h3 className="text-xl font-black text-slate-900 leading-tight min-h-[3rem]">{course.title}</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <Clock className="w-3 h-3" /> {course.duration_hours}h
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <Star className="w-3 h-3 text-amber-400" /> {course.avg_rating}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <Target className="w-3 h-3 text-indigo-400" /> {course.level}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <CircleDollarSign className="w-3 h-3 text-emerald-400" /> {course.cost_type}
                          </div>
                        </div>

                        <Button 
                          onClick={() => handleStart(course.resource_id)}
                          className={cn(
                            "w-full rounded-2xl h-12 font-black tracking-tight",
                            isStarted ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : ""
                          )}
                          variant={isStarted ? "ghost" : "primary"}
                        >
                          {isStarted ? "In Progress" : "Start Learning"}
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center">
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Phase in construction</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right: Insights */}
        <div className="lg:col-span-4 space-y-8">
          <Card variant="dark" className="p-10 relative overflow-hidden shadow-xl shadow-slate-200 min-h-[400px] flex flex-col justify-between">
            <div className="space-y-6 relative z-10">
              <Badge variant="indigo" className="bg-white/10 text-white border-none">Success Forecast</Badge>
              <h3 className="text-4xl font-black leading-tight tracking-tighter">Skill Jump Prediction</h3>
              <p className="text-lg font-medium opacity-80 leading-relaxed">
                Completing your "This Week" goals will increase your match score for <span className="text-indigo-400 font-black">Trendyol</span> roles by 12%.
              </p>
            </div>
            
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Current Match Rate</span>
                <span className="text-3xl font-black text-indigo-400 tracking-tighter">85%</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full w-[85%]"></div>
              </div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Next Month Est.</span>
                <span className="text-3xl font-black text-emerald-400 tracking-tighter">97%</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[97%]"></div>
              </div>
            </div>
            <div className="absolute right-[-20%] bottom-[-10%] w-64 h-64 bg-indigo-600/30 rounded-full blur-[100px]"></div>
          </Card>

          <Card className="p-10">
            <CardHeader className="p-0 mb-8 border-none flex flex-row items-center justify-between">
              <CardTitle>Badges & Certs</CardTitle>
              <Trophy className="w-5 h-5 text-amber-400" />
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 opacity-40">
                  <BookOpen className="w-6 h-6 text-slate-800" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Locked</p>
                  <p className="text-xs font-bold text-slate-400">Agile Fundamentals</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center p-2">
                  <Trophy className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Earned</p>
                  <p className="text-xs font-bold text-slate-900">Platform Onboarding</p>
                </div>
              </div>
              <Button variant="ghost" className="w-full rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 border border-slate-100 mt-4">
                View Proof of Skills
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
