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

type PostingRow = InternshipPosting & {
  internship_posting_id?: string;
  representative_id?: string | null;
  monthly_stipend?: number | null;
  required_skills?: string[] | null;
  desired_skills?: string[] | null;
  importance_score?: number | null;
  required_level?: string | null;
};

type PersonProfile = {
  person_id: string;
  auth_user_id: string;
  role: string;
};

type CompanyRepresentativeProfile = {
  representative_id: string;
  person_id: string;
  company_id: string;
};

type CompanyProfile = {
  company_id: string;
};

export const getCurrentCompanyRepresentativeContext = async (): Promise<{
  person: PersonProfile;
  representative: CompanyRepresentativeProfile;
  company: CompanyProfile;
  company_id: string;
  representative_id: string;
}> => {
  if (!supabase) {
    throw new Error('Supabase client not initialized.');
  }

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    throw new Error('No authenticated Supabase user found.');
  }

  console.log('Posting auth user', user.id);

  const { data: person, error: personError } = await supabase
    .from('persons')
    .select('person_id,auth_user_id,role')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (personError) {
    console.error('person lookup failed', personError);
    throw personError;
  }

  if (!person) {
    throw new Error('No person profile found for this account.');
  }

  console.log('Posting person profile', person);

  if (person.role !== 'company_rep') {
    throw new Error('No company representative profile found for this account.');
  }

  const { data: representative, error: representativeError } = await supabase
    .from('company_representatives')
    .select('representative_id,person_id,company_id')
    .eq('person_id', person.person_id)
    .maybeSingle();

  if (representativeError) {
    console.error('representative lookup failed', representativeError);
    throw representativeError;
  }

  if (!representative) {
    throw new Error('No company representative profile found for this account.');
  }

  console.log('Posting representative profile', representative);

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('company_id')
    .eq('company_id', representative.company_id)
    .maybeSingle();

  if (companyError) {
    console.error('company lookup failed', companyError);
    throw companyError;
  }

  if (!company) {
    throw new Error('No company profile found for this representative.');
  }

  console.log('Posting company profile', company);

  return {
    person,
    representative,
    company,
    company_id: representative.company_id,
    representative_id: representative.representative_id,
  };
};

const toPosting = (row: PostingRow): InternshipPosting => ({
  ...(row as InternshipPosting),
  posting_id: row.internship_posting_id ?? row.posting_id,
  rep_id: row.rep_id ?? row.representative_id ?? '',
  monthly_stipend_try: row.monthly_stipend_try ?? row.monthly_stipend ?? null,
});

const mapInsertPayload = (posting: InternshipPosting, overrides: { companyId: string; representativeId: string }) => ({
  company_id: overrides.companyId,
  representative_id: overrides.representativeId,
  title: posting.title,
  description: posting.description,
  location: posting.location,
  industry: posting.industry,
  start_date: posting.start_date,
  duration_weeks: posting.duration_weeks,
  is_paid: posting.is_paid,
  monthly_stipend: posting.monthly_stipend_try,
  is_remote: posting.is_remote,
  deadline: posting.deadline,
  status: posting.status,
  required_skills: (posting as PostingRow).required_skills ?? [],
  desired_skills: (posting as PostingRow).desired_skills ?? [],
  importance_score: (posting as PostingRow).importance_score ?? null,
  required_level: (posting as PostingRow).required_level ?? null,
});

export const getCompanyPostings = async (companyId: string): Promise<InternshipPosting[]> => {
  if (!isSupabaseConfigured || !supabase) return getLocalCompanyPostings(companyId);

  const context = await getCurrentCompanyRepresentativeContext();
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('company_id', context.company_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('posting select/update/duplicate failed', error);
    throw error;
  }

  return (data ?? []).map((row) => toPosting(row as PostingRow));
};

export const createCompanyPosting = async (posting: InternshipPosting): Promise<InternshipPosting> => {
  if (!isSupabaseConfigured || !supabase) {
    return addCompanyPosting(posting);
  }

  const context = await getCurrentCompanyRepresentativeContext();
  const payload = mapInsertPayload(posting, {
    companyId: context.company_id,
    representativeId: context.representative_id,
  });

  console.log('Creating internship posting payload', payload);

  const { data, error } = await supabase.from(TABLE).insert(payload).select('*').single();

  if (error || !data) {
    console.error('posting insert failed', error);
    throw error ?? new Error('Insert failed');
  }

  return toPosting(data as PostingRow);
};

export const updateCompanyPosting = async (postingId: string, updates: Partial<InternshipPosting>): Promise<InternshipPosting | null> => {
  if (!isSupabaseConfigured || !supabase) return updateLocalPosting(postingId, updates);

  const context = await getCurrentCompanyRepresentativeContext();
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('internship_posting_id', postingId)
    .eq('company_id', context.company_id)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    console.error('posting select/update/duplicate failed', error);
    throw error ?? new Error('Update failed');
  }
  return toPosting(data as PostingRow);
};

export const duplicateCompanyPosting = async (postingId: string): Promise<InternshipPosting | null> => {
  if (!isSupabaseConfigured || !supabase) return duplicateLocalPosting(postingId);

  const context = await getCurrentCompanyRepresentativeContext();
  const dbId = postingId;
  console.log('Duplicating posting using internship_posting_id', dbId);

  const { data: source, error: sourceError } = await supabase
    .from(TABLE)
    .select('*')
    .eq('internship_posting_id', dbId)
    .eq('company_id', context.company_id)
    .maybeSingle();

  if (sourceError || !source) {
    console.error('Failed to duplicate posting:', sourceError);
    throw sourceError ?? new Error('Source posting not found');
  }

  const sourcePosting = toPosting(source as PostingRow);
  const duplicate: InternshipPosting = {
    ...sourcePosting,
    title: `${sourcePosting.title} (Copy)`,
    status: 'draft',
    created_at: new Date().toISOString(),
  };

  return createCompanyPosting(duplicate);
};


export const activateCompanyPosting = async (postingId: string): Promise<InternshipPosting | null> => {
  if (!isSupabaseConfigured || !supabase) return updateLocalPosting(postingId, { status: 'active' });

  const dbId = postingId;
  console.log('Activating posting using internship_posting_id', dbId);

  try {
    return await updateCompanyPosting(dbId, { status: 'active' });
  } catch (error) {
    console.error('Failed to activate posting:', error);
    throw error;
  }
};

export const closeCompanyPosting = async (postingId: string): Promise<InternshipPosting | null> => {
  if (!isSupabaseConfigured || !supabase) return closeLocalPosting(postingId);

  const dbId = postingId;
  console.log('Closing posting using internship_posting_id', dbId);

  try {
    return await updateCompanyPosting(dbId, { status: 'closed' });
  } catch (error) {
    console.error('Failed to close posting:', error);
    throw error;
  }
};
