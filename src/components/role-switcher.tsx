import { useCurrentUser } from "@/lib/auth-context";
import { Button } from "./ui/button";
import { User, Shield, Briefcase, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const RoleSwitcher = () => {
  const { switchRole, user } = useCurrentUser();
  const navigate = useNavigate();

  const options = [
    { label: 'İpek / Student', id: 'p1', icon: User, path: '/dashboard' },
    { label: 'Beyza / Student', id: 'p2', icon: User, path: '/dashboard' },
    { label: 'Garanti BBVA HR / Company Rep', id: 'p11', icon: Briefcase, path: '/company/dashboard' },
    { label: 'Trendyol HR / Company Rep', id: 'p12', icon: Briefcase, path: '/company/dashboard' },
    { label: 'Demo Admin', id: 'p_admin', icon: Shield, path: '/admin' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <div className="bg-white border shadow-2xl rounded-2xl p-4 w-72 space-y-3">
        <div className="pb-2 border-b">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dev Role Switcher</p>
          <p className="text-sm font-semibold truncate">Current: {user ? `${user.first_name} ${user.last_name}` : 'Logged out'}</p>
        </div>
        <div className="space-y-1">
          {options.map((opt) => (
            <button key={opt.id} onClick={() => { switchRole(opt.id); navigate(opt.path); }} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all ${user?.person_id === opt.id ? 'bg-blue-50 text-blue-700 font-bold border-blue-100 border' : 'hover:bg-slate-50 text-slate-600'}`}>
              <opt.icon className="w-4 h-4" />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => { switchRole(); navigate('/login'); }}>
          <LogOut className="w-3 h-3 mr-2" /> Logged out
        </Button>
      </div>
    </div>
  );
};
