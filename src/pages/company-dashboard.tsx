import { useCurrentUser } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Briefcase, 
  ArrowUpRight, 
  MoreHorizontal,
  Plus,
  Send
} from "lucide-react";
import { Link } from "react-router-dom";
import { POSTINGS, APPLICATIONS, STUDENTS } from "@/lib/mock-data";

export const CompanyDashboard = () => {
  const { company } = useCurrentUser();
  
  const companyPostings = POSTINGS.filter(p => p.company_id === company?.company_id);
  const totalApps = APPLICATIONS.filter(a => companyPostings.some(cp => cp.posting_id === a.posting_id)).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Company Dashboard</h1>
          <p className="text-slate-500">Welcome back, {company?.name}</p>
        </div>
        <Link to="/company/postings/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Posting
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Active Postings" value={companyPostings.length} icon={Briefcase} />
        <StatsCard title="Total Applicants" value={totalApps} icon={Users} trend="+12% vs last month" />
        <StatsCard title="Avg Match Score" value="78%" icon={ArrowUpRight} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                 <CardTitle>Active Postings</CardTitle>
                 <Button variant="ghost" size="sm">View All</Button>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="divide-y divide-slate-100">
                    {companyPostings.map((p) => (
                      <div key={p.posting_id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                         <div className="space-y-1">
                            <h3 className="font-bold text-slate-900">{p.title}</h3>
                            <div className="flex items-center space-x-3 text-xs text-slate-500">
                               <span className="flex items-center"><Users className="w-3 h-3 mr-1" /> 8 applicants</span>
                               <span>Deadline: {new Date(p.deadline).toLocaleDateString('tr-TR')}</span>
                            </div>
                         </div>
                         <div className="flex items-center space-x-3">
                            <Badge variant="success">Active</Badge>
                            <Link to={`/company/postings/${p.posting_id}/applicants`}>
                               <Button variant="outline" size="sm">Review applicants</Button>
                            </Link>
                         </div>
                      </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </div>

        <div className="space-y-6">
           <Card>
              <CardHeader>
                 <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                 <ActionButton icon={Users} label="Manage Team" />
                 <ActionButton icon={Send} label="Message Templates" />
                 <ActionButton icon={Briefcase} label="Past Internships" />
              </CardContent>
           </Card>

           {!company?.is_premium && (
             <Card className="bg-slate-900 text-white">
                <CardContent className="p-6 space-y-4">
                   <div className="space-y-2 text-center">
                      <h3 className="font-bold text-lg">Unlimited Capacity</h3>
                      <p className="text-xs text-slate-400">Upgrade to Pro to see all 85th+ percentile candidates.</p>
                   </div>
                   <Button className="w-full bg-blue-600 hover:bg-blue-700 border-none">Upgrade Now</Button>
                </CardContent>
             </Card>
           )}
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, icon: Icon, trend }: any) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="flex items-baseline space-x-2">
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {trend && <span className="text-xs text-green-600 font-medium">{trend}</span>}
      </div>
    </CardContent>
  </Card>
);

const ActionButton = ({ icon: Icon, label }: any) => (
  <button className="flex items-center justify-between w-full px-4 py-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors group">
     <div className="flex items-center space-x-3 text-sm font-medium text-slate-600 group-hover:text-slate-900">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
     </div>
     <ArrowUpRight className="w-4 h-4 text-slate-300" />
  </button>
);
