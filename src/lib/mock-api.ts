import { 
  APPLICATIONS, POSTINGS, STUDENTS, 
  NOTIFICATIONS, CONVERSATIONS, MESSAGES 
} from './mock-data';
import { Application, InternshipPosting, Message, Notification } from './types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  getPostings: async (): Promise<InternshipPosting[]> => {
    await delay(300);
    return POSTINGS;
  },

  getPosting: async (id: string): Promise<InternshipPosting | undefined> => {
    await delay(200);
    return POSTINGS.find(p => p.posting_id === id);
  },

  applyToPosting: async (studentId: string, postingId: string, coverNote: string): Promise<Application> => {
    await delay(800);
    const newApp: Application = {
      application_id: `app_${Math.random().toString(36).substr(2, 9)}`,
      student_id: studentId,
      posting_id: postingId,
      match_score: Math.floor(Math.random() * 40) + 60, // 60-100
      status: 'pending',
      cover_note: coverNote,
      applied_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    // In a real app we'd push to state/db
    return newApp;
  },

  getNotifications: async (personId: string): Promise<Notification[]> => {
    await delay(300);
    return (NOTIFICATIONS as any[] || []).filter(n => n.person_id === personId);
  },

  analyzeSkills: async (cvText: string) => {
    const response = await fetch('/api/ai/analyze-skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cvText })
    });
    return response.json();
  }
};
