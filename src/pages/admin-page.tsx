import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Briefcase, 
  Building2, 
  TrendingUp,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from "recharts";

const data = [
  { name: 'Mon', apps: 45 },
  { name: 'Tue', apps: 52 },
  { name: 'Wed', apps: 38 },
  { name: 'Thu', apps: 65 },
  { name: 'Fri', apps: 48 },
  { name: 'Sat', apps: 24 },
  { name: 'Sun', apps: 18 },
];

const pieData = [
  { name: 'ITU', value: 400 },
  { name: 'Boğaziçi', value: 300 },
  { name: 'METU', value: 300 },
  { name: 'Koç', value: 200 },
];

export const AdminPage = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between px-2">
        <div>
          <Badge variant="indigo" className="mb-4">System Shield</Badge>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Nexus Console</h1>
          <p className="text-slate-500 font-medium mt-2">Real-time statistics and moderation queues.</p>
        </div>
        <div className="flex items-center space-x-2">
           <span className="flex items-center text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100">
             <ShieldCheck className="w-3 h-3 mr-1.5" />
             Live Sync Active
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MiniStat title="Total Users" value="12,408" icon={Users} trend="+8% Pulse" />
        <MiniStat title="Nodes" value="542" icon={Building2} trend="+12 Core" />
        <MiniStat title="Streams" value="1,850" icon={Briefcase} trend="+154" />
        <MiniStat title="Pending" value="24" icon={AlertCircle} trend="Action" trendColor="text-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
             <CardTitle className="text-lg">Applications Volume</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="apps" fill="#2563eb" radius={[4, 4, 0, 0]} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
             <CardTitle className="text-lg">Top Universities</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#0f172a', '#2563eb', '#3b82f6', '#60a5fa'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip />
                   </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-4 mt-4">
                   {pieData.map((d, i) => (
                     <div key={d.name} className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#0f172a', '#2563eb', '#3b82f6', '#60a5fa'][i] }}></div>
                        <span className="text-xs font-medium text-slate-600">{d.name}</span>
                     </div>
                   ))}
                </div>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <Card className="lg:col-span-2">
            <CardHeader>
               <CardTitle className="text-lg">Pending Company Verifications</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 flex items-center justify-between">
                       <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-500">C</div>
                          <div>
                             <p className="text-sm font-bold">TechSolutions s.r.o</p>
                             <p className="text-xs text-slate-500">Submitted 2 hours ago</p>
                          </div>
                       </div>
                       <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" className="text-red-600">Reject</Button>
                          <Button size="sm" className="bg-slate-900">Approve</Button>
                       </div>
                    </div>
                  ))}
               </div>
            </CardContent>
         </Card>
         
         <Card>
            <CardHeader>
               <CardTitle className="text-lg">System Logs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <LogItem icon={TrendingUp} text="New high score: 98% match detected" time="10m ago" />
               <LogItem icon={Building2} text="Garanti BBVA updated their profile" time="1h ago" />
               <LogItem icon={Users} text="50 new student signups in Boğaziçi" time="3h ago" />
            </CardContent>
         </Card>
      </div>
    </div>
  );
};

const MiniStat = ({ title, value, icon: Icon, trend, trendColor = "text-emerald-500" }: any) => (
  <Card className="p-8">
     <div className="flex items-center justify-between mb-8">
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
           <Icon className="w-5 h-5 text-slate-800" />
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest ${trendColor}`}>{trend}</span>
     </div>
     <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</h3>
        <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
     </div>
  </Card>
);

const LogItem = ({ icon: Icon, text, time }: any) => (
  <div className="flex space-x-3 border-b border-dashed pb-3 last:border-0 last:pb-0">
     <div className="p-1.5 bg-slate-50 rounded-lg h-fit">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
     </div>
     <div className="flex-1">
        <p className="text-xs text-slate-700 leading-tight">{text}</p>
        <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase">{time}</p>
     </div>
  </div>
);
