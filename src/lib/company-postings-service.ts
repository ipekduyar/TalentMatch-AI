import {
  addCompanyPosting,
  closeCompanyPosting as closeLocalPosting,
  duplicateCompanyPosting as duplicateLocalPosting,
  getCompanyPostings as getLocalCompanyPostings,
  updateCompanyPosting as updateLocalPosting,
} from '@/lib/mock-postings-storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { InternshipPosting } from '@/lib/types';

const TABLE = 'internship_postings';

export type CreateCompanyPostingResult = {
  posting: InternshipPosting;
  source: 'supabase' | 'localStorage';
  error?: string;
};

const toPosting = (row: InternshipPosting): InternshipPosting => ({ ...row });

const resolveCurrentRepProfile = async () => {
  if (!supabase) throw new Error('Supabase not configured.');
  const { data: auth } = await supabase.auth.getUser();
  const authUserId = auth.user?.id;
  if (!authUserId) throw new Error('No authenticated user.');

  const { data: person, error: personError } = await supabase
    .from('persons')
    .select('person_id,role')
    .eq('auth_user_id', authUserId)
    .single();
  if (personError || !person) throw personError ?? new Error('Person profile not found.');
  if (person.role !== 'company_rep') throw new Error('Authenticated user is not a company representative.');

  const { data: rep, error: repError } = await supabase
    .from('company_representatives')
    .select('rep_id,company_id')
    .eq('person_id', person.person_id)
    .single();
  if (repError || !rep) throw repError ?? new Error('Company representative profile not found.');

  return rep;
};

export const getCompanyPostings = async (companyId: string): Promise<InternshipPosting[]> => {
  if (!isSupabaseConfigured || !supabase) return getLocalCompanyPostings(companyId);

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => toPosting(row as InternshipPosting));
};

export const createCompanyPosting = async (posting: InternshipPosting): Promise<CreateCompanyPostingResult> => {
  if (!isSupabaseConfigured || !supabase) {
    return { posting: addCompanyPosting(posting), source: 'localStorage' };
  }

  try {
    const rep = await resolveCurrentRepProfile();
    const insertPayload: InternshipPosting = { ...posting, company_id: rep.company_id, rep_id: rep.rep_id };

    const { data, error } = await supabase.from(TABLE).insert(insertPayload).select('*').single();
    if (error || !data) throw error ?? new Error('Insert failed');

    return { posting: toPosting(data as InternshipPosting), source: 'supabase' };
  } catch (error) {
    return {
      posting,
      source: 'supabase',
      error: error instanceof Error ? error.message : JSON.stringify(error),
    };
  }
};

export const updateCompanyPosting = async (postingId: string, updates: Partial<InternshipPosting>): Promise<InternshipPosting | null> => {
  if (!isSupabaseConfigured || !supabase) return updateLocalPosting(postingId, updates);

  const { data, error } = await supabase.from(TABLE).update(updates).eq('posting_id', postingId).select('*').single();
  if (error || !data) throw error ?? new Error('Update failed');
  return toPosting(data as InternshipPosting);
};

export const duplicateCompanyPosting = async (postingId: string): Promise<InternshipPosting | null> => {
  if (!isSupabaseConfigured || !supabase) return duplicateLocalPosting(postingId);

  const { data: source, error: sourceError } = await supabase.from(TABLE).select('*').eq('posting_id', postingId).single();
  if (sourceError || !source) throw sourceError ?? new Error('Source posting not found');

  const duplicate: InternshipPosting = {
    ...(source as InternshipPosting),
    posting_id: `post_local_${Date.now()}`,
    title: `${source.title} (Copy)`,
    status: 'draft',
    created_at: new Date().toISOString(),
  };

  const result = await createCompanyPosting(duplicate);
  return result.error ? null : result.posting;
};

export const closeCompanyPosting = async (postingId: string): Promise<InternshipPosting | null> => {
  if (!isSupabaseConfigured || !supabase) return closeLocalPosting(postingId);
  return updateCompanyPosting(postingId, { status: 'closed' });
};
