import { useParams, Link, useNavigate } from "react-router-dom";
import { POSTINGS, COMPANIES, SKILLS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Clock, 
  CircleDollarSign, 
  ArrowLeft, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AIThinking } from "@/components/ai-thinking";

export const PostingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isApplying, setIsApplying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const posting = POSTINGS.find(p => p.posting_id === id);
  const company = COMPANIES.find(c => c.company_id === posting?.company_id);

  if (!posting) return <div>Posting not found</div>;

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      toast.success("Application submitted successfully!");
    }, 1500);
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      navigate(`/skill-gaps/new`);
    }, 2500);
  };

  if (isAnalyzing) return <AIThinking message="Analyzing your CV against this role's requirements..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link to="/search" className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to search
      </Link>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-white rounded-2xl border border-slate-100 flex items-center justify-center p-4">
             <img referrerPolicy="no-referrer" src={company?.logo_url || ''} alt="logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{posting.title}</h1>
            <p className="text-xl text-slate-600 font-medium">{company?.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
           <Button onClick={handleApply} disabled={isApplying} size="lg">
             {isApplying ? "Applying..." : "Apply Now"}
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
           <Card>
             <CardHeader>
                <CardTitle>About the Internship</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Badge variant="outline" className="px-3 py-1">
                    <MapPin className="w-3 h-3 mr-1" /> {posting.location}
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    <Clock className="w-3 h-3 mr-1" /> {posting.duration_weeks} weeks
                  </Badge>
                  {posting.is_paid && (
                    <Badge variant="success" className="px-3 py-1">
                      <CircleDollarSign className="w-3 h-3 mr-1" /> Paid Internship
                    </Badge>
                  )}
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {posting.description}
                </p>
                <p className="text-slate-700 leading-relaxed">
                  You will work closely with our Engineering and Product teams to ship features that impact millions of users. This is a hands-on role where you will be expected to contribute to real projects.
                </p>
             </CardContent>
           </Card>

           <Card>
             <CardHeader>
                <CardTitle>Required Skills</CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <SkillItem name="Product Management" requiredLevel={4} studentLevel={3} />
                   <SkillItem name="SQL" requiredLevel={3} studentLevel={4} />
                   <SkillItem name="Agile/Scrum" requiredLevel={4} studentLevel={2} />
                   <SkillItem name="Communication" requiredLevel={5} studentLevel={4} />
                </div>
             </CardContent>
           </Card>
        </div>

        <div className="space-y-6">
           <Card className="bg-slate-900 text-white overflow-hidden relative">
             <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-blue-400" />
                  AI Fit Analysis
                </CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
                <div className="flex justify-center">
                   <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="364" strokeDashoffset={364 - (364 * 85) / 100} className="text-blue-500" strokeLinecap="round" />
                      </svg>
                      <span className="absolute text-3xl font-bold">85%</span>
                   </div>
                </div>
                <div className="space-y-2">
                   <p className="text-sm text-center text-slate-300">You are in the <strong>Top 5%</strong> of candidates for this role.</p>
                   <Button onClick={handleAnalyze} className="w-full bg-blue-600 hover:bg-blue-700 border-none">Analyze My Gaps</Button>
                </div>
             </CardContent>
             <div className="absolute right-[-20%] bottom-[-20%] w-48 h-48 bg-blue-600/10 rounded-full blur-3xl"></div>
           </Card>

           <Card>
             <CardHeader>
                <CardTitle className="text-lg">About {company?.name}</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">{company?.description}</p>
                <div className="flex items-center text-sm text-slate-500">
                   <Badge variant="secondary" className="mr-2">Premium Member</Badge>
                   <span>★ 4.3 (12 reviews)</span>
                </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
};

const SkillItem = ({ name, requiredLevel, studentLevel }: any) => {
  const diff = studentLevel >= requiredLevel;
  return (
    <div className="p-3 border rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900">{name}</span>
        {diff ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
      </div>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= studentLevel ? 'bg-blue-600' : 'bg-slate-100'} ${i > requiredLevel && 'opacity-50'}`}></div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
         <span>Req: {requiredLevel}</span>
         <span>You: {studentLevel}</span>
      </div>
    </div>
  );
};
