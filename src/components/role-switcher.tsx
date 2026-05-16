import { useCurrentUser } from "@/lib/auth-context";
import { Button } from "./ui/button";
import { User, Shield, Briefcase, LogOut } from "lucide-react";
import { UserRole } from "@/lib/types";

export const RoleSwitcher = () => {
  const { switchRole, role, user, logout } = useCurrentUser();

  const options: { label: string; role: UserRole; id?: string; icon: any }[] = [
    { label: 'İpek (Student)', role: 'student', id: 'p1', icon: User },
    { label: 'Beyza (Student)', role: 'student', id: 'p2', icon: User },
    { label: 'Garanti HR (Rep)', role: 'company_rep', id: 'p11', icon: Briefcase },
    { label: 'Admin', role: 'admin', id: 'p_admin', icon: Shield },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <div className="bg-white border shadow-2xl rounded-2xl p-4 w-64 space-y-3">
        <div className="pb-2 border-b">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dev Role Switcher</p>
          <p className="text-sm font-semibold truncate">Current: {user?.first_name || 'Guest'}</p>
        </div>
        
        <div className="space-y-1">
          {options.map((opt) => (
            <button
              key={opt.id || opt.label}
              onClick={() => switchRole(opt.role, opt.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all ${
                user?.person_id === opt.id 
                  ? 'bg-blue-50 text-blue-700 font-bold border-blue-100 border' 
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <opt.icon className="w-4 h-4" />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>

        {user && (
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={logout}>
            <LogOut className="w-3 h-3 mr-2" />
            Logout
          </Button>
        )}
      </div>
    </div>
  );
};
