import React, { useState } from 'react';
import { useCurrentUser } from "../lib/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  Settings, 
  Bell, 
  ShieldCheck, 
  Moon, 
  User, 
  Trash2, 
  Globe, 
  Lock,
  ChevronRight,
  Eye,
  Mail,
  Smartphone
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";

export const SettingsPage = () => {
  const { user, logout } = useCurrentUser();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    matches: true,
    messages: true
  });

  const handleToggle = (key: string) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
    toast.success("Preferences updated");
  };

  const handleDeleteAccount = () => {
    toast.error("Security challenge required to delete account.");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-4">
          <Badge variant="indigo">System Preferences</Badge>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Settings</h1>
          <p className="text-slate-500 font-medium">Configure your account, privacy, and interface preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Account Section */}
          <Card className="p-10">
            <CardHeader className="p-0 mb-10 border-none">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
                  <User className="w-6 h-6 text-slate-800" />
                </div>
                <CardTitle>Account Security</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <SettingItem 
                icon={Lock} 
                title="Password" 
                description="Last changed 3 months ago" 
                action={<Button variant="outline" size="sm" className="rounded-full px-6">Change</Button>} 
              />
              <SettingItem 
                icon={Smartphone} 
                title="Two-Factor Authentication" 
                description="Secure your account with an extra layer" 
                action={<Badge variant="secondary">Recommended</Badge>} 
              />
              <SettingItem 
                icon={Globe} 
                title="Region & Language" 
                description="Set your preferred localization" 
                action={<span className="text-xs font-black uppercase text-indigo-600">English (US)</span>} 
              />
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card className="p-10">
            <CardHeader className="p-0 mb-10 border-none">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
                  <Bell className="w-6 h-6 text-slate-800" />
                </div>
                <CardTitle>Global Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <ToggleItem 
                title="Email Notifications" 
                description="Weekly digest and critical updates" 
                isActive={notifications.email} 
                onToggle={() => handleToggle('email')} 
              />
              <ToggleItem 
                title="Push Notifications" 
                description="Real-time alerts in browser" 
                isActive={notifications.push} 
                onToggle={() => handleToggle('push')} 
              />
              <ToggleItem 
                title="Match Alerts" 
                description="Notify when 90%+ match is found" 
                isActive={notifications.matches} 
                onToggle={() => handleToggle('matches')} 
              />
              <ToggleItem 
                title="Direct Messages" 
                description="Alerts for recruiter contact" 
                isActive={notifications.messages} 
                onToggle={() => handleToggle('messages')} 
              />
            </CardContent>
          </Card>

          {/* Privacy Zone */}
          <Card className="p-10">
            <CardHeader className="p-0 mb-10 border-none">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
                  <ShieldCheck className="w-6 h-6 text-slate-800" />
                </div>
                <CardTitle>Privacy / KVKK</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <SettingItem 
                icon={Eye} 
                title="Profile Visibility" 
                description="Who can see your profile details" 
                action={<span className="text-xs font-black uppercase text-slate-900">Premium Only</span>} 
              />
              <SettingItem 
                icon={ShieldCheck} 
                title="Data Processing Consent" 
                description="Manage your KVKK permissions" 
                action={<span className="text-xs font-black uppercase text-emerald-500">Authorized</span>} 
              />
            </CardContent>
          </Card>

          {/* Theme Preference */}
          <Card className="p-10">
            <CardHeader className="p-0 mb-10 border-none">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
                  <Moon className="w-6 h-6 text-slate-800" />
                </div>
                <CardTitle>Interface Mode</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex items-center gap-6">
               <button className="flex-1 p-6 rounded-[2rem] border-2 border-indigo-600 bg-white ring-8 ring-indigo-50/50">
                  <div className="w-full h-24 bg-slate-50 rounded-xl mb-4 border border-slate-100 shadow-inner"></div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-900">Light Nexus</span>
               </button>
               <button className="flex-1 p-6 rounded-[2rem] border-2 border-slate-100 bg-slate-50 hover:border-slate-300">
                  <div className="w-full h-24 bg-slate-900 rounded-xl mb-4 shadow-xl"></div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Deep Space</span>
               </button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="p-10 border-rose-100 bg-rose-50/20 shadow-none">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-rose-600 tracking-tight">Delete Account</h3>
                <p className="text-sm font-medium text-rose-500/70">This action is irreversible. All your data will be purged.</p>
              </div>
              <Button 
                onClick={handleDeleteAccount}
                variant="ghost" 
                className="text-rose-600 hover:bg-rose-100 font-black rounded-full px-10 h-14 border border-rose-100 shadow-sm"
              >
                Permanently Purge
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Info */}
        <div className="lg:col-span-4 space-y-8">
           <Card className="p-10 bg-indigo-600 border-none text-white relative overflow-hidden shadow-lg shadow-indigo-100">
             <div className="relative z-10 space-y-6">
                <Badge variant="indigo" className="bg-white/10 text-white border-transparent uppercase">Nexus Pro</Badge>
                <h3 className="text-4xl font-black leading-[1] tracking-tighter">Your Plan</h3>
                <p className="text-sm font-medium opacity-90 leading-relaxed">
                  You are currently on the <span className="font-black text-white underline decoration-white/30 decoration-2 underline-offset-4">Student Pro Plan</span>. Enjoy 99% match accuracy and early access to enterprise roles.
                </p>
                <div className="pt-4">
                  <Button className="w-full bg-white text-indigo-600 hover:bg-slate-100 font-black rounded-full h-14">
                    Manage Subscription
                  </Button>
                </div>
             </div>
             <div className="absolute right-[-20%] top-[-20%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
           </Card>

           <Card className="p-10 text-center space-y-6">
              <CardTitle>Help & Support</CardTitle>
              <div className="space-y-2">
                <Button variant="outline" className="w-full rounded-2xl h-14 border-slate-200 text-xs font-black uppercase tracking-widest text-slate-600">Documentation</Button>
                <Button variant="outline" className="w-full rounded-2xl h-14 border-slate-200 text-xs font-black uppercase tracking-widest text-slate-600">SecureChat Support</Button>
                <Button variant="outline" className="w-full rounded-2xl h-14 border-slate-200 text-xs font-black uppercase tracking-widest text-slate-600">Trust Center</Button>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};

const SettingItem = ({ icon: Icon, title, description, action }: any) => (
  <div className="flex items-center justify-between p-6 rounded-[1.5rem] border border-slate-50 bg-slate-50/30">
    <div className="flex items-center gap-6">
      <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <div>
        <h4 className="text-sm font-black text-slate-900 tracking-tight">{title}</h4>
        <p className="text-xs font-medium text-slate-400">{description}</p>
      </div>
    </div>
    {action}
  </div>
);

const ToggleItem = ({ title, description, isActive, onToggle }: any) => (
  <div className="flex items-center justify-between p-6 rounded-[1.5rem] border border-slate-50 bg-slate-50/30">
    <div className="space-y-1">
      <h4 className="text-sm font-black text-slate-900 tracking-tight">{title}</h4>
      <p className="text-xs font-medium text-slate-400">{description}</p>
    </div>
    <div 
      onClick={onToggle}
      className={cn(
        "w-12 h-7 rounded-full relative cursor-pointer transition-colors p-1",
        isActive ? "bg-indigo-600" : "bg-slate-200"
      )}
    >
      <div className={cn(
        "w-5 h-5 bg-white rounded-full transition-transform",
        isActive ? "translate-x-5" : "translate-x-0"
      )}></div>
    </div>
  </div>
);
