import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type ApplicationStatus = "submitted" | "reviewed" | "shortlisted" | "interview" | "rejected" | "accepted";

export type DashboardData = {
  activePostings: number;
  totalApplications: number;
  shortlistedApplications: number;
  reviewedApplications: number;
  acceptedApplications: number;
  interviewApplications: number;
  avgMatchScore: number | null;
  postingPerformance: Array<{
    postingId: string;
    title: string;
    applications: number;
    avgScore: number | null;
  }>;
  topApplicants: Array<{
    applicationId: string;
    name: string;
    email: string;
    score: number | null;
    postingTitle: string;
    status: ApplicationStatus;
  }>;
  recentItems: Array<{
    id: string;
    name: string;
    postingTitle: string;
    date: string;
    status: ApplicationStatus;
  }>;
};

export type ApplicantItem = {
  applicationId: string;
  studentId: string;
  name: string;
  email: string;
  status: ApplicationStatus;
  matchScore: number | null;
  appliedDate: string;
  coverLetter: string | null;
};

const ensureSupabase = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured.");
  }
  return supabase;
};

export const getCurrentCompanyId = async (): Promise<string> => {
  const client = ensureSupabase();
  const { data: authData, error: authError } = await client.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("You must be logged in.");
  }

  const { data: person, error: personError } = await client
    .from("persons")
    .select("person_id")
    .eq("auth_user_id", authData.user.id)
    .single();

  if (personError || !person) {
    throw new Error("Could not find person record for this user.");
  }

  const { data: representative, error: representativeError } = await client
    .from("company_representatives")
    .select("company_id")
    .eq("person_id", person.person_id)
    .single();

  if (representativeError || !representative) {
    throw new Error("Could not find company representative profile for this user.");
  }

  return representative.company_id;
};


export type CompanyApplicationStatsByPosting = Record<string, {
  count: number;
  avgMatchScore: number | null;
}>;

export const getCompanyApplicationStatsByPosting = async (): Promise<CompanyApplicationStatsByPosting> => {
  const client = ensureSupabase();
  const companyId = await getCurrentCompanyId();

  const { data, error } = await client
    .from("applications")
    .select("internship_posting_id, match_score")
    .eq("company_id", companyId);

  if (error) throw new Error(error.message || "Could not load company application stats.");

  const aggregation = ((data ?? []) as Array<{ internship_posting_id: string; match_score: number | null }>).reduce<
    Record<string, { count: number; scoreSum: number; scoreCount: number }>
  >((acc, app) => {
    const postingId = app.internship_posting_id;
    if (!postingId) return acc;

    if (!acc[postingId]) {
      acc[postingId] = { count: 0, scoreSum: 0, scoreCount: 0 };
    }

    acc[postingId].count += 1;

    if (typeof app.match_score === "number" && app.match_score > 0) {
      acc[postingId].scoreSum += app.match_score;
      acc[postingId].scoreCount += 1;
    }

    return acc;
  }, {});

  return Object.fromEntries(
    Object.entries(aggregation).map(([postingId, value]) => [
      postingId,
      {
        count: value.count,
        avgMatchScore: value.scoreCount > 0 ? Math.round(value.scoreSum / value.scoreCount) : null,
      },
    ]),
  );
};

export const getCompanyDashboardData = async (): Promise<DashboardData> => {
  const client = ensureSupabase();
  const companyId = await getCurrentCompanyId();

  const [{ data: postings, error: postingsError }, { data: applications, error: applicationsError }] = await Promise.all([
    client
      .from("internship_postings")
      .select("internship_posting_id, title, status")
      .eq("company_id", companyId),
    client
      .from("applications")
      .select(`
        application_id,
        internship_posting_id,
        status,
        match_score,
        created_at,
        students(
          student_id,
          persons(first_name, last_name, email)
        ),
        internship_postings(title)
      `)
      .eq("company_id", companyId),
  ]);

  if (postingsError) throw new Error(postingsError.message || "Could not load company postings.");
  if (applicationsError) throw new Error(applicationsError.message || "Could not load company applications.");

  const postingRows = postings ?? [];
  const applicationRows = (applications ?? []) as any[];

  const activePostings = postingRows.filter((p) => p.status === "active").length;
  const totalApplications = applicationRows.length;
  const shortlistedApplications = applicationRows.filter((a) => a.status === "shortlisted").length;
  const reviewedApplications = applicationRows.filter((a) => a.status === "reviewed").length;
  const acceptedApplications = applicationRows.filter((a) => a.status === "accepted").length;
  const interviewApplications = applicationRows.filter((a) => a.status === "interview").length;

  const scoredApplications = applicationRows.filter((a) => typeof a.match_score === "number" && a.match_score > 0);
  const avgMatchScore = scoredApplications.length
    ? Math.round(scoredApplications.reduce((sum, app) => sum + app.match_score, 0) / scoredApplications.length)
        : null;

  const postingPerformance = postingRows.map((posting) => {
    const postingApplications = applicationRows.filter((app) => app.internship_posting_id === posting.internship_posting_id);
    const postingScores = postingApplications.filter((app) => typeof app.match_score === "number" && app.match_score > 0);
    const avgScore = postingScores.length
      ? Math.round(postingScores.reduce((sum, app) => sum + app.match_score, 0) / postingScores.length)
          : null;

    return {
      postingId: posting.internship_posting_id,
      title: posting.title,
      applications: postingApplications.length,
      avgScore,
    };
  });

  const topApplicants = applicationRows
    .slice()
    .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
    .slice(0, 5)
    .map((app) => {
      const student = Array.isArray(app.students) ? app.students[0] : app.students;
      const person = Array.isArray(student?.persons) ? student.persons[0] : student?.persons;
      const posting = Array.isArray(app.internship_postings) ? app.internship_postings[0] : app.internship_postings;

      return {
        applicationId: app.application_id,
        name: [person?.first_name, person?.last_name].filter(Boolean).join(" ") || "Candidate",
        email: person?.email ?? "",
        score: typeof app.match_score === "number" && app.match_score > 0 ? app.match_score : null,
        postingTitle: posting?.title ?? "Role",
        status: app.status as ApplicationStatus,
      };
    });

  const recentItems = applicationRows
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)
    .map((app) => {
      const student = Array.isArray(app.students) ? app.students[0] : app.students;
      const person = Array.isArray(student?.persons) ? student.persons[0] : student?.persons;
      const posting = Array.isArray(app.internship_postings) ? app.internship_postings[0] : app.internship_postings;

      return {
        id: app.application_id,
        name: [person?.first_name, person?.last_name].filter(Boolean).join(" ") || "Candidate",
        postingTitle: posting?.title ?? "Role",
        date: new Date(app.created_at).toLocaleDateString("en-US"),
        status: app.status as ApplicationStatus,
      };
    });

  return {
    activePostings,
    totalApplications,
    shortlistedApplications,
    reviewedApplications,
    acceptedApplications,
    interviewApplications,
    avgMatchScore,
    postingPerformance,
    topApplicants,
    recentItems,
  };
};

export const getApplicantsForPosting = async (postingId: string): Promise<ApplicantItem[]> => {
  const client = ensureSupabase();

  const { data, error } = await client
    .from("applications")
    .select(`
      application_id,
      student_id,
      status,
      match_score,
      cover_letter,
      created_at,
      students(
        student_id,
        persons(first_name, last_name, email)
      )
    `)
    .eq("internship_posting_id", postingId)
    .order("match_score", { ascending: false, nullsFirst: false });

  if (error) throw new Error(error.message || "Could not load applicants.");

  return ((data ?? []) as any[]).map((app) => {
    const student = Array.isArray(app.students) ? app.students[0] : app.students;
    const person = Array.isArray(student?.persons) ? student.persons[0] : student?.persons;

    return {
      applicationId: app.application_id,
      studentId: app.student_id,
      name: [person?.first_name, person?.last_name].filter(Boolean).join(" ") || "Candidate",
      email: person?.email ?? "",
      status: app.status as ApplicationStatus,
      matchScore: typeof app.match_score === "number" && app.match_score > 0 ? app.match_score : null,
      appliedDate: app.created_at,
      coverLetter: app.cover_letter,
    };
  });
};

export const getPostingTitle = async (postingId: string): Promise<string> => {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("internship_postings")
    .select("title")
    .eq("internship_posting_id", postingId)
    .maybeSingle();

  if (error) throw new Error(error.message || "Could not load posting title.");
  return data?.title ?? "Posting";
};

export const updateApplicationStatus = async (applicationId: string, status: ApplicationStatus): Promise<{ application_id: string; status: ApplicationStatus; updated_at: string | null }> => {
  const client = ensureSupabase();
  const allowedStatuses: ApplicationStatus[] = ["submitted", "reviewed", "shortlisted", "interview", "rejected", "accepted"];
  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid application status.");
  }

  const companyId = await getCurrentCompanyId();

  const { data, error } = await client
    .from("applications")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("application_id", applicationId)
    .eq("company_id", companyId)
    .select("application_id, status, updated_at")
    .maybeSingle();

  if (error) {
    console.error("Failed to update application status", { applicationId, status, error });
    throw new Error("Could not update application status. Please try again.");
  }

  if (!data) {
    throw new Error("Application status could not be updated. Please check company permissions.");
  }

  return {
    application_id: data.application_id,
    status: data.status as ApplicationStatus,
    updated_at: data.updated_at,
  };
};
