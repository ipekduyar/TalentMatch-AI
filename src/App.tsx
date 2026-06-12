import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate,
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";
import { AuthProvider, useCurrentUser } from "./lib/auth-context";
import { Toaster } from "sonner";
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  AlertCircle, 
  GraduationCap, 
  MessageSquare, 
  Bell, 
  User, 
  LogOut,
  Menu,
  X,
  Briefcase,
  Users,
  Settings,
  ShieldCheck
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./components/ui/avatar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./components/ui/card";
import { RoleSwitcher } from "./components/role-switcher";
import { getUnreadNotificationCount } from "./lib/notifications-service";
import { cn } from "./lib/utils";
import { assertCurrentUserIsAdmin } from "./lib/admin-service";

// Layouts
const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-white">
    <nav className="border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-900">TalentMatch <span className="text-indigo-600">AI</span></span>
        </Link>
        <div className="hidden md:flex items-center space-x-10">
          <Link to="/features" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Features</Link>
          <Link to="/pricing" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">Pricing</Link>
          <Link to="/about" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">About</Link>
          <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
            <Link to="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
    <main>{children}</main>
  </div>
);

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, role, logout } = useCurrentUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const location = useLocation();

  const studentNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Search Internships', href: '/search', icon: Search },
    { name: 'My Applications', href: '/applications', icon: FileText },
    { name: 'Evaluations', href: '/evaluations', icon: ShieldCheck },
    { name: 'Skill Gaps', href: '/skill-gaps', icon: AlertCircle },
    { name: 'Learning Path', href: '/learning-path', icon: GraduationCap },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Notifications', href: '/notifications', icon: Bell },
  ];

  const companyNav = [
    { name: 'Dashboard', href: '/company/dashboard', icon: LayoutDashboard },
    { name: 'My Postings', href: '/company/postings', icon: Briefcase },
    { name: 'New Posting', href: '/company/postings/new', icon: Briefcase },
    { name: 'Messages', href: '/company/messages', icon: MessageSquare },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Profile', href: '/company/profile', icon: Users },
    { name: 'Evaluations', href: '/company/evaluations', icon: ShieldCheck },
    { name: 'Billing', href: '/company/billing', icon: Settings },
  ];

  const adminNav = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: User },
    { name: 'Companies', href: '/admin/companies', icon: Briefcase },
    { name: 'Postings', href: '/admin/postings', icon: FileText },
  ];

  const navItems = role === 'student' ? studentNav : role === 'company_rep' ? companyNav : adminNav;

  useEffect(() => {
    if (role !== 'student' && role !== 'company_rep') {
      setUnreadNotificationCount(0);
      return;
    }

    let isMounted = true;
    const loadUnreadCount = async () => {
      try {
        const count = await getUnreadNotificationCount();
        if (isMounted) setUnreadNotificationCount(count);
      } catch (error) {
        if (isMounted) setUnreadNotificationCount(0);
        console.warn('Could not load unread notification count.', error);
      }
    };

    void loadUnreadCount();
    window.addEventListener('notifications-updated', loadUnreadCount);

    return () => {
      isMounted = false;
      window.removeEventListener('notifications-updated', loadUnreadCount);
    };
  }, [role, location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-40 fixed inset-y-0 left-0 lg:relative",
        isSidebarOpen ? "w-64 translate-x-0" : "w-20 lg:translate-x-0 -translate-x-full"
      )}>
        <div className="h-20 flex items-center px-6 border-b border-slate-200">
          <Link to="/" className={cn("flex items-center gap-2", !isSidebarOpen && "hidden")}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <span className="text-lg font-black tracking-tighter text-slate-900">TalentMatch</span>
          </Link>
          <div className={cn("w-full flex justify-center", isSidebarOpen && "hidden")}>
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
             </div>
          </div>
        </div>

        <nav className="flex-1 py-10 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const showNotificationBadge = item.name === 'Notifications' && unreadNotificationCount > 0;
            const unreadBadgeLabel = unreadNotificationCount > 99 ? '99+' : unreadNotificationCount > 9 ? '9+' : unreadNotificationCount;

            return (
              <Link 
                key={item.href} 
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm tracking-tight",
                  location.pathname === item.href 
                    ? "bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-50" 
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="relative flex-shrink-0">
                  <item.icon className="w-5 h-5" />
                  {showNotificationBadge && !isSidebarOpen && (
                    <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-rose-600 px-1 text-center text-[9px] font-black leading-4 text-white ring-2 ring-white">
                      {unreadBadgeLabel}
                    </span>
                  )}
                </div>
                <span className={cn("flex min-w-0 flex-1 items-center justify-between gap-2", !isSidebarOpen && "hidden")}>
                  <span className="truncate">{item.name}</span>
                  {showNotificationBadge && (
                    <span className="min-w-5 rounded-full bg-rose-600 px-1.5 py-0.5 text-center text-[10px] font-black leading-none text-white">
                      {unreadBadgeLabel}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <Button variant="ghost" size="sm" className="w-full justify-start text-slate-400 hover:text-rose-600" onClick={logout}>
            <LogOut className="w-5 h-5 mr-3" />
            <span className={cn(!isSidebarOpen && "hidden")}>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto bg-slate-50">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
               {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="h-4 w-[1px] bg-slate-200 hidden md:block"></div>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest hidden md:block">
              {navItems.find(i => i.href === location.pathname)?.name || 'NexusFlow'}
            </h2>
          </div>

          <div className="flex items-center space-x-6">
             <Link to="/notifications" className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 relative transition-colors" aria-label="Notifications">
               <Bell className="w-5 h-5" />
               {unreadNotificationCount > 0 && (
                 <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-indigo-600 px-1.5 py-0.5 text-center text-[10px] font-black leading-none text-white ring-2 ring-white">
                   {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                 </span>
               )}
             </Link>
             <div className="h-4 w-[1px] bg-slate-200"></div>
             <Link to="/account" className="flex items-center space-x-3 group cursor-pointer">
               <div className="text-right hidden sm:block">
                 <p className="text-[10px] font-black text-slate-900 leading-none mb-1 uppercase tracking-wider">{user?.first_name} {user?.last_name}</p>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{role?.replace('_', ' ')} · Pro Plan</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white shadow-sm flex items-center justify-center text-indigo-700 font-bold text-xs ring-offset-2 group-hover:ring-2 ring-indigo-500 transition-all">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
               </div>
             </Link>
          </div>
        </header>

        <main className="p-8 flex-1 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

// Pages
const LandingPage = () => (
  <div className="container mx-auto px-4 py-24">
    <div className="max-w-4xl mx-auto text-center space-y-10">
      <div className="flex items-center justify-center gap-3 mb-4">
        <span className="px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">Next-Gen Talent</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
      </div>
      <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-slate-900 leading-[0.9]">
        Find match <br /> <span className="text-indigo-600">Actually hub</span>
      </h1>
      <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
        TalentMatch AI uses advanced embeddings and skill gap analysis to connect university students with their dream careers through deep vector matching.
      </p>
      <div className="flex items-center justify-center gap-6 pt-8">
        <Link to="/signup">
          <Button size="lg" className="rounded-full">Launch Profile</Button>
        </Link>
        <Link to="/signup?type=company">
          <Button size="lg" variant="outline" className="rounded-full">Partner View</Button>
        </Link>
      </div>
    </div>
  </div>
);

const LegacyLoginPage = () => {
  const { login } = useCurrentUser();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('ipek@example.com');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Login</CardTitle>
          <CardDescription className="text-center">Enter your email to sign in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded-md" 
                placeholder="ipek@example.com" 
              />
            </div>
            <Button type="submit" className="w-full">Sign In</Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or continue with</span>
            </div>
          </div>
          <Button variant="outline" className="w-full">Google</Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Auth Guard
const getRoleDashboardPath = (role: string | null) => {
  if (role === 'company_rep') return '/company/dashboard';
  if (role === 'admin') return '/admin';
  return '/dashboard';
};

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, role, isLoading } = useCurrentUser();
  
  if (isLoading) return <div className="p-8 text-sm font-bold text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role || '')) {
    return <Navigate to={getRoleDashboardPath(role)} replace />;
  }
  
  return <AppLayout>{children}</AppLayout>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, isLoading } = useCurrentUser();
  const [isCheckingAdmin, setIsCheckingAdmin] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const verifyAdmin = async () => {
      if (isLoading) return;
      if (!user || role !== 'admin') {
        setIsAdmin(false);
        setIsCheckingAdmin(false);
        return;
      }

      try {
        const allowed = await assertCurrentUserIsAdmin();
        if (mounted) setIsAdmin(allowed);
      } catch (error) {
        console.error('Admin access check failed', error);
        if (mounted) setIsAdmin(false);
      } finally {
        if (mounted) setIsCheckingAdmin(false);
      }
    };

    void verifyAdmin();
    return () => { mounted = false; };
  }, [isLoading, role, user]);

  if (isLoading || isCheckingAdmin) return <div className="p-8 text-sm font-bold text-slate-500">Checking admin access...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to={getRoleDashboardPath(role)} replace />;

  return <AppLayout>{children}</AppLayout>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
          <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
          <Route path="/signup" element={<PublicLayout><SignupPage /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><div>About</div></PublicLayout>} />
          <Route path="/pricing" element={<PublicLayout><div>Pricing</div></PublicLayout>} />

          {/* Student Routes */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute allowedRoles={['student']}><SearchPage /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute allowedRoles={['student']}><OnboardingPage /></ProtectedRoute>} />
          <Route path="/postings/:postingId" element={<ProtectedRoute allowedRoles={['student']}><PostingDetailPage /></ProtectedRoute>} />
          <Route path="/skill-gaps" element={<ProtectedRoute allowedRoles={['student']}><SkillGapPage /></ProtectedRoute>} />
          <Route path="/skill-gaps/:id" element={<ProtectedRoute allowedRoles={['student']}><SkillGapPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute allowedRoles={['student']}><MessagesPage /></ProtectedRoute>} />
          <Route path="/messages/:id" element={<ProtectedRoute allowedRoles={['student']}><MessagesPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute allowedRoles={['student', 'company_rep']}><NotificationsPage /></ProtectedRoute>} />
          <Route path="/learning-path" element={<ProtectedRoute allowedRoles={['student']}><LearningPathPage /></ProtectedRoute>} />
          <Route path="/applications" element={<ProtectedRoute allowedRoles={['student']}><MyApplicationsPage /></ProtectedRoute>} />
          <Route path="/evaluations" element={<ProtectedRoute allowedRoles={['student']}><StudentEvaluationsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allowedRoles={['student']}><ProfilePage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={['student']}><SettingsPage /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          
          {/* Company Routes */}
          <Route path="/company/dashboard" element={<ProtectedRoute allowedRoles={['company_rep']}><CompanyDashboard /></ProtectedRoute>} />
          <Route path="/company/postings/:id/applicants" element={<ProtectedRoute allowedRoles={['company_rep']}><ApplicantList /></ProtectedRoute>} />
          <Route path="/company/messages" element={<ProtectedRoute allowedRoles={['company_rep']}><MessagesPage /></ProtectedRoute>} />
          <Route path="/company/messages/:id" element={<ProtectedRoute allowedRoles={['company_rep']}><MessagesPage /></ProtectedRoute>} />
          <Route path="/company/profile" element={<ProtectedRoute allowedRoles={['company_rep']}><CompanyProfilePage /></ProtectedRoute>} />
          <Route path="/company/postings" element={<ProtectedRoute allowedRoles={['company_rep']}><CompanyPostingsPage /></ProtectedRoute>} />
          <Route path="/company/postings/new" element={<ProtectedRoute allowedRoles={['company_rep']}><CompanyPostingsNewPage /></ProtectedRoute>} />
          <Route path="/company/evaluations" element={<ProtectedRoute allowedRoles={['company_rep']}><CompanyEvaluationsPage /></ProtectedRoute>} />
          <Route path="/company/billing" element={<ProtectedRoute allowedRoles={['company_rep']}><CompanyBillingPage /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
          <Route path="/admin/companies" element={<AdminRoute><AdminCompaniesPage /></AdminRoute>} />
          <Route path="/admin/postings" element={<AdminRoute><AdminPostingsPage /></AdminRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <RoleSwitcher />
      </Router>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

// Temporary page components to avoid build errors while constructing
import { StudentDashboard } from "./pages/student-dashboard";
import { SearchPage } from "./pages/search-page";
import { PostingDetailPage } from "./pages/posting-detail-page";
import { SkillGapPage } from "./pages/skill-gap";
import { CompanyDashboard } from "./pages/company-dashboard";
import { ApplicantList } from "./pages/applicant-list";
import { MessagesPage } from "./pages/messages-page";
import { AdminDashboardPage } from "./pages/admin-dashboard";
import { AdminUsersPage } from "./pages/admin-users";
import { AdminCompaniesPage } from "./pages/admin-companies";
import { AdminPostingsPage } from "./pages/admin-postings";
import { OnboardingPage } from "./pages/onboarding-page";
import { ProfilePage } from "./pages/profile-page";
import { MyApplicationsPage } from "./pages/applications-page";
import { LearningPathPage } from "./pages/learning-path";
import { NotificationsPage } from "./pages/notifications-page";
import { SettingsPage } from "./pages/settings-page";
import { SignupPage } from "./pages/signup-page";
import { LoginPage } from "./pages/login-page";
import { CompanyProfilePage } from "./pages/company-profile";
import { CompanyPostingsPage } from "./pages/company-postings";
import { CompanyPostingsNewPage } from "./pages/company-postings-new";
import { CompanyEvaluationsPage } from "./pages/company-evaluations";
import { StudentEvaluationsPage } from "./pages/student-evaluations";
import { CompanyBillingPage } from "./pages/company-billing";

