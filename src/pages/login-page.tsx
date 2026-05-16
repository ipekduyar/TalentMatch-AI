import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";

const DEMO_USERS = [
  { id: 'p1', label: 'Continue as İpek / Student', path: '/dashboard' },
  { id: 'p2', label: 'Continue as Beyza / Student', path: '/dashboard' },
  { id: 'p11', label: 'Continue as Garanti BBVA HR / Company Rep', path: '/company/dashboard' },
  { id: 'p12', label: 'Continue as Trendyol HR / Company Rep', path: '/company/dashboard' },
  { id: 'p_admin', label: 'Continue as Demo Admin', path: '/admin' },
];

export const LoginPage = () => {
  const { loginAsDemoUser } = useCurrentUser();
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
          <CardDescription className="text-center">Pick a demo user to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {DEMO_USERS.map((demo) => (
            <Button key={demo.id} variant="outline" className="w-full" onClick={() => { loginAsDemoUser(demo.id); navigate(demo.path); }}>
              {demo.label}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
