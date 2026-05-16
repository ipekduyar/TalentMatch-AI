import React, { useState } from 'react';
import { useCurrentUser } from "../lib/auth-context";
import { NOTIFICATIONS } from "../lib/mock-data";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  Bell, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  MoreVertical,
  Trash2,
  Check,
  Briefcase,
  Settings,
  Mail,
  Zap,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";

const ICON_MAP = {
  new_match: Zap,
  status_update: Briefcase,
  deadline: Clock,
  skill_alert: AlertCircle,
  new_message: MessageSquare,
  evaluation_request: CheckCircle2,
  new_application: Briefcase,
};

const COLOR_MAP = {
  new_match: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  status_update: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  deadline: 'text-amber-600 bg-amber-50 border-amber-100',
  skill_alert: 'text-rose-600 bg-rose-50 border-rose-100',
  new_message: 'text-blue-600 bg-blue-50 border-blue-100',
  evaluation_request: 'text-cyan-600 bg-cyan-50 border-cyan-100',
  new_application: 'text-indigo-600 bg-indigo-50 border-indigo-100',
};

export const NotificationsPage = () => {
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab ] = useState('all');
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.is_read;
    if (activeTab === 'applications') return ['new_match', 'status_update', 'new_application'].includes(n.type);
    if (activeTab === 'deadlines') return n.type === 'deadline';
    if (activeTab === 'skills') return n.type === 'skill_alert';
    if (activeTab === 'messages') return n.type === 'new_message';
    return true;
  });

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success("All notifications marked as read");
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.notification_id !== id));
    toast.info("Notification deleted");
  };

  const toggleRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.notification_id === id ? { ...n, is_read: !n.is_read } : n
    ));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-4">
          <Badge variant="indigo">Nexus Comms</Badge>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Notifications</h1>
          <p className="text-slate-500 font-medium">Real-time updates on your applications and career pulse.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" onClick={markAllRead} size="sm" className="rounded-full border-slate-200 text-[10px] font-black uppercase tracking-widest px-8 h-12">
            <Check className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full border border-slate-100 text-[10px] font-black uppercase tracking-widest px-8 h-12">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3">
          <Card className="p-6 space-y-2 border-none shadow-sm bg-white overflow-hidden">
             {[
               { id: 'all', label: 'All Activity', icon: Bell },
               { id: 'unread', label: 'Unread', icon: Zap },
               { id: 'applications', label: 'Applications', icon: Briefcase },
               { id: 'deadlines', label: 'Deadlines', icon: Clock },
               { id: 'skills', label: 'Skill Alerts', icon: AlertCircle },
               { id: 'messages', label: 'Messages', icon: Mail }
             ].map((tab) => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={cn(
                   "w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all",
                   activeTab === tab.id 
                    ? "bg-indigo-50 text-indigo-600 font-black shadow-sm" 
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-900 font-bold"
                 )}
               >
                 <div className="flex items-center gap-4">
                   <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-indigo-600" : "text-slate-300")} />
                   <span className="text-xs uppercase tracking-widest">{tab.label}</span>
                 </div>
                 {tab.id === 'unread' && notifications.filter(n => !n.is_read).length > 0 && (
                   <span className="w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">
                     {notifications.filter(n => !n.is_read).length}
                   </span>
                 )}
               </button>
             ))}
          </Card>
        </div>

        {/* Notification List */}
        <div className="lg:col-span-9">
           {filteredNotifications.length === 0 ? (
             <Card className="p-20 text-center flex flex-col items-center justify-center space-y-6">
                <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center border border-slate-100 shadow-inner">
                   <Filter className="w-8 h-8 text-slate-200" />
                </div>
                <div className="space-y-1">
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">System clear</h3>
                   <p className="text-slate-400 font-medium">No new notifications in this category.</p>
                </div>
             </Card>
           ) : (
             <div className="space-y-4">
               {filteredNotifications.map((n) => {
                 const Icon = ICON_MAP[n.type];
                 const colors = COLOR_MAP[n.type];
                 
                 return (
                   <Card 
                     key={n.notification_id} 
                     className={cn(
                       "p-8 transition-all border-none hover:shadow-xl hover:shadow-indigo-50/50 group relative",
                       !n.is_read && "bg-white shadow-md border-l-[6px] border-indigo-600"
                     )}
                   >
                     <div className="flex items-start md:items-center justify-between gap-6">
                        <div className="flex items-start md:items-center gap-6 flex-1">
                          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0", colors)}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="space-y-1 pr-10">
                            <div className="flex items-center gap-3">
                               <h3 className={cn("text-lg tracking-tight leading-none", n.is_read ? "font-bold text-slate-500" : "font-black text-slate-900")}>
                                 {n.title}
                               </h3>
                               {!n.is_read && <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>}
                            </div>
                            <p className="text-sm font-medium text-slate-400 leading-relaxed max-w-2xl">{n.message}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 pt-2">{new Date(n.created_at).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                           <button 
                            onClick={(e) => { e.stopPropagation(); toggleRead(n.notification_id); }}
                            className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-slate-900 transition-colors"
                            title={n.is_read ? "Mark as unread" : "Mark as read"}
                           >
                             {n.is_read ? <Mail className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                           </button>
                           <button 
                            onClick={(e) => { e.stopPropagation(); deleteNotification(n.notification_id); }}
                            className="p-2 hover:bg-rose-50 rounded-xl text-slate-300 hover:text-rose-600 transition-colors"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     </div>
                     
                     {n.link_url && (
                        <div className="mt-6 pt-6 border-t border-slate-50 flex justify-end">
                           <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-indigo-600 hover:bg-indigo-50 font-black rounded-full text-[10px] uppercase tracking-widest px-6"
                            onClick={() => window.location.href = n.link_url!}
                          >
                             Take Action
                           </Button>
                        </div>
                     )}
                   </Card>
                 );
               })}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
