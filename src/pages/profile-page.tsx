import React from 'react';
import { useCurrentUser } from "../lib/auth-context";
import { STUDENTS, PERSONS, SKILLS } from "../lib/mock-data";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  MapPin, 
  GraduationCap, 
  Target, 
  FileUp, 
  Plus, 
  CheckCircle2,
  Brain,
  Rocket
} from "lucide-react";

export const ProfilePage = () => {
  const { user } = useCurrentUser();
  const student = STUDENTS.find(s => s.person_id === user?.person_id);
  const person = PERSONS.find(p => p.person_id === user?.person_id);

  const handleSave = () => {
    toast.success("Profile updated successfully!");
  };

  const handleFileUpload = () => {
    toast.info("CV analysis started. This will take a moment.");
  };

  if (!student || !person) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Badge variant="indigo" className="mb-4">Student Profile</Badge>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
            {person.first_name} {person.last_name}
          </h1>
          <p className="text-slate-500 font-medium mt-2">Manage your professional presence and data.</p>
        </div>
        <Button onClick={handleSave} size="lg" className="rounded-full px-10">
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-8 space-y-8">
          {/* Identity & Contact */}
          <Card className="p-10">
            <CardHeader className="p-0 mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
                  <User className="w-6 h-6 text-slate-800" />
                </div>
                <CardTitle>Personal Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">First Name</label>
                <Input defaultValue={person.first_name} className="h-12 rounded-xl focus:ring-indigo-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Name</label>
                <Input defaultValue={person.last_name} className="h-12 rounded-xl focus:ring-indigo-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <Input defaultValue={person.email} disabled className="h-12 rounded-xl bg-slate-50" />
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-4 top-4" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                <Input defaultValue="+90 532 000 00 00" className="h-12 rounded-xl focus:ring-indigo-500" />
              </div>
            </CardContent>
          </Card>

          {/* Academic Info */}
          <Card className="p-10">
            <CardHeader className="p-0 mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
                  <GraduationCap className="w-6 h-6 text-slate-800" />
                </div>
                <CardTitle>Academic Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">University</label>
                <Input defaultValue={student.university} className="h-12 rounded-xl focus:ring-indigo-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</label>
                <Input defaultValue={student.department} className="h-12 rounded-xl focus:ring-indigo-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GPA</label>
                <Input defaultValue={student.gpa || ""} className="h-12 rounded-xl focus:ring-indigo-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected Graduation</label>
                <Input defaultValue={student.graduation_date || ""} type="date" className="h-12 rounded-xl focus:ring-indigo-500" />
              </div>
            </CardContent>
          </Card>

          {/* Career Goals */}
          <Card className="p-10">
            <CardHeader className="p-0 mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
                  <Target className="w-6 h-6 text-slate-800" />
                </div>
                <CardTitle>Career Ambitions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Career Goal</label>
                <Input defaultValue={student.career_goal || ""} placeholder="e.g. Product Management, Data Science..." className="h-12 rounded-xl focus:ring-indigo-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KVKK Consent & Privacy</label>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Consent for processing sensitive data</span>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Skills & Document */}
        <div className="lg:col-span-4 space-y-8">
          {/* CV Section */}
          <Card className="bg-indigo-600 border-none text-white p-10 overflow-hidden relative shadow-lg shadow-indigo-100">
             <div className="relative z-10 space-y-6">
                <h3 className="text-3xl font-black leading-none tracking-tighter">Your Resume</h3>
                <p className="text-sm font-medium opacity-90 leading-relaxed">
                  Upload your CV to let our AI extract your latest skills and experiences.
                </p>
                <Button 
                  onClick={handleFileUpload}
                  className="w-full bg-white text-indigo-600 hover:bg-slate-100 border-none font-black rounded-full"
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  Upload PDF
                </Button>
                {student.cv_file_path && (
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 text-center">
                    Current: resume_final_v2.pdf
                  </p>
                )}
             </div>
             <div className="absolute right-[-20%] bottom-[-20%] w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          </Card>

          {/* Skill Snapshot */}
          <Card className="p-10">
            <CardHeader className="p-0 mb-8 border-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-slate-800" />
                  <CardTitle>Skills</CardTitle>
                </div>
                <button className="text-indigo-600 hover:text-indigo-700">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              {/* Strongest Skills */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Strength Hub</p>
                <div className="space-y-3">
                  {SKILLS.slice(0, 3).map((skill, idx) => (
                    <div key={skill.skill_id} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{skill.name}</span>
                        <span>{[90, 85, 75][idx]}%</span>
                      </div>
                      <Progress value={[90, 85, 75][idx]} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Development Areas */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Growth Engine</p>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.slice(5, 8).map(skill => (
                    <Badge key={skill.skill_id} variant="secondary" className="rounded-full px-3">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button variant="ghost" className="w-full text-indigo-600 font-bold text-xs uppercase tracking-widest border border-indigo-100 rounded-full">
                  Full Analytics <Rocket className="w-3 h-3 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
