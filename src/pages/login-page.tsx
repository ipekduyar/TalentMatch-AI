import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/lib/auth-context";
import { isSupabaseConfigured } from '@/lib/supabase';
import { useNavigate } from "react-router-dom";
import { toast } from 'sonner';

const DEMO_USERS = [
  { id: 'p1', label: 'Continue as İpek / Student', path: '/dashboard' },
  { id: 'p2', label: 'Continue as Beyza / Student', path: '/dashboard' },
  { id: 'p11', label: 'Continue as Garanti BBVA HR / Company Rep', path: '/company/dashboard' },
  { id: 'p12', label: 'Continue as Trendyol HR / Company Rep', path: '/company/dashboard' },
  { id: 'p_admin', label: 'Continue as Demo Admin', path: '/admin' },
];

export const LoginPage = () => {
  const { loginAsDemoUser, loginWithPassword } = useCurrentUser();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const formatErrorMessage = (error: unknown) => {
    if (error instanceof Error && error.message) return error.message;
    try { return JSON.stringify(error); } catch { return String(error); }
  };

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      const person = await loginWithPassword(email, password);
      toast.success('Logged in successfully.');
      if (person.role === 'company_rep') navigate('/company/dashboard');
      else if (person.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      toast.error(formatErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
          <CardDescription className="text-center">
            {isSupabaseConfigured ? 'Login with your account' : 'Pick a demo user to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isSupabaseConfigured && (
            <form onSubmit={handleSupabaseLogin} className="space-y-3 pb-2">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
              <Button disabled={loading} className="w-full" type="submit">{loading ? 'Logging in...' : 'Login'}</Button>
            </form>
          )}
          {!isSupabaseConfigured && (
            <div className="space-y-2 pt-1">
              {DEMO_USERS.map((demo) => (
                <Button key={demo.id} variant="outline" className="w-full" onClick={async () => { await loginAsDemoUser(demo.id); navigate(demo.path); }}>
                  {demo.label}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
