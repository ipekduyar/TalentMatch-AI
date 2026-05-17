import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const getSupabaseUrl = () => process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const getSupabaseAnonKey = () => process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return res.status(500).json({ error: 'Missing Supabase environment configuration.' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
    }

    const accessToken = authHeader.slice('Bearer '.length).trim();
    if (!accessToken) {
      return res.status(401).json({ error: 'Missing access token.' });
    }

    const tokenClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { data: authData, error: authError } = await tokenClient.auth.getUser();
    if (authError || !authData.user) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: person, error: personError } = await adminClient
      .from('persons')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle();

    if (personError) {
      return res.status(500).json({ error: personError.message || 'Failed to load person profile.' });
    }

    if (!person) {
      return res.status(404).json({ error: 'No profile found for this account.' });
    }

    if (person.role === 'student') {
      const { data: student, error: studentError } = await adminClient
        .from('students')
        .select('*')
        .eq('person_id', person.person_id)
        .maybeSingle();

      if (studentError) {
        return res.status(500).json({ error: studentError.message || 'Failed to load student profile.' });
      }

      return res.status(200).json({ person, student: student ?? null, rep: null, company: null });
    }

    if (person.role === 'company_rep') {
      const { data: rep, error: repError } = await adminClient
        .from('company_representatives')
        .select('*')
        .eq('person_id', person.person_id)
        .maybeSingle();

      if (repError) {
        return res.status(500).json({ error: repError.message || 'Failed to load company representative profile.' });
      }

      const { data: company, error: companyError } = rep
        ? await adminClient.from('companies').select('*').eq('company_id', rep.company_id).maybeSingle()
        : { data: null, error: null };

      if (companyError) {
        return res.status(500).json({ error: companyError.message || 'Failed to load company profile.' });
      }

      return res.status(200).json({ person, student: null, rep: rep ?? null, company: company ?? null });
    }

    return res.status(200).json({ person, student: null, rep: null, company: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error while loading profile.';
    return res.status(500).json({ error: message });
  }
}
