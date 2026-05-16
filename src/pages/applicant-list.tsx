import { useParams, Link } from "react-router-dom";
import { APPLICATIONS, POSTINGS, STUDENTS, PERSONS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  MessageSquare, 
  CheckCircle, 
  XCircle,
  Clock,
  ShieldCheck
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export const ApplicantList = () => {
  const { id } = useParams();
  const posting = POSTINGS.find(p => p.posting_id === id);
  const applications = APPLICATIONS.filter(a => a.posting_id === id).sort((a, b) => b.match_score - a.match_score);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/company/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Applicants</h1>
            <p className="text-slate-500">{posting?.title}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
           <Button variant="outline">Export CSV</Button>
           <Button className="bg-blue-600 hover:bg-blue-700">Interview All</Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
           <input className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-white" placeholder="Search applicants..." />
        </div>
        <div className="flex items-center space-x-2">
           <Badge variant="outline" className="cursor-pointer">All (24)</Badge>
           <Badge variant="outline" className="cursor-pointer">Pending (12)</Badge>
           <Badge variant="outline" className="cursor-pointer">Reviewing (8)</Badge>
           <Badge className="bg-blue-600 cursor-pointer">Shortlisted (4)</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50/50 border-b text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                       <th className="px-6 py-4">Rank</th>
                       <th className="px-6 py-4">Student</th>
                       <th className="px-6 py-4">University</th>
                       <th className="px-6 py-4">Match Score</th>
                       <th className="px-6 py-4">Status</th>
                       <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {applications.map((app, index) => {
                       const student = STUDENTS.find(s => s.student_id === app.student_id);
                       const person = PERSONS.find(p => p.person_id === student?.person_id);
                       
                       return (
                          <tr key={app.application_id} className="hover:bg-slate-50/50 group transition-colors">
                             <td className="px-6 py-4 text-sm font-semibold text-slate-400">
                                # {index + 1}
                             </td>
                             <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                   <Avatar className="w-8 h-8 border">
                                      <AvatarImage src={person?.avatar_url || ''} />
                                      <AvatarFallback>{person?.first_name?.[0]}</AvatarFallback>
                                   </Avatar>
                                   <div>
                                      <p className="text-sm font-bold text-slate-900 flex items-center">
                                         {person?.first_name} {person?.last_name}
                                         {student?.is_edu_verified && <ShieldCheck className="w-3 h-3 ml-1 text-blue-500" />}
                                      </p>
                                      <p className="text-xs text-slate-500 leading-none mt-1">{student?.career_goal}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-4">
                                <p className="text-sm text-slate-700">{student?.university}</p>
                                <p className="text-[10px] uppercase font-bold text-slate-400">{student?.department}</p>
                             </td>
                             <td className="px-6 py-4">
                                <div className="flex items-center space-x-2">
                                   <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${app.match_score >= 80 ? 'border-green-100 bg-green-50 text-green-700' : 'border-amber-100 bg-amber-50 text-amber-700'}`}>
                                      {app.match_score}%
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-4">
                                <Badge variant={app.status === 'shortlisted' ? 'success' : 'secondary'} className="capitalize">
                                   {app.status}
                                </Badge>
                             </td>
                             <td className="px-6 py-4 text-right space-x-1">
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600">
                                   <MessageSquare className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-green-600">
                                   <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600">
                                   <XCircle className="w-4 h-4" />
                                </Button>
                             </td>
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
        </CardContent>
      </Card>
    </div>
  );
};
