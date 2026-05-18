import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { generateNotifications, getLatestStudentCvAnalysis, type StudentCvAnalysis } from "@/lib/student-insights-service";

export const NotificationsPage = () => {
  const [analysis, setAnalysis] = useState<StudentCvAnalysis | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  useEffect(() => { void getLatestStudentCvAnalysis().then((a) => { setAnalysis(a); setNotifications(generateNotifications(a)); }); }, []);
  return <div className="space-y-4"><h1 className="text-3xl font-bold">Notifications</h1>{notifications.map(n => <Card key={n.id} className="p-4"><p className="text-xs uppercase text-slate-500">{n.type}</p><h3 className="font-semibold">{n.title}</h3><p>{n.message}</p>{n.link && <Link to={n.link} className="underline text-indigo-600">Take action</Link>}</Card>)}{!analysis && <Link to="/onboarding"><Button>Go to onboarding</Button></Link>}</div>;
};
