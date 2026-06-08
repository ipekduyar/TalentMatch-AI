import { createMessageNotification } from "@/lib/notifications-service";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { UserRole } from "@/lib/types";

type PersonContext = {
  authUser: { id: string };
  person: {
    person_id: string;
    role: UserRole;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  studentId?: string;
  companyId?: string;
  role: UserRole;
};

export type ConversationListItem = {
  conversationId: string;
  studentId: string;
  companyId: string;
  applicationId: string | null;
  title: string;
  subtitle: string;
  updatedAt: string;
  latestMessage: { body: string; createdAt: string } | null;
};

export type ConversationMessage = {
  messageId: string;
  senderPersonId: string;
  senderName: string;
  senderRole: UserRole | null;
  body: string;
  createdAt: string;
  readAt: string | null;
};

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export async function getCurrentPersonContext(): Promise<PersonContext> {
  const client = ensureClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) throw new Error(authError.message || "Could not load authenticated user.");
  if (!authData.user) throw new Error("You must be signed in to use messaging.");

  const { data: person, error: personError } = await client
    .from("persons")
    .select("person_id,role,first_name,last_name,email")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();

  if (personError) throw new Error(personError.message || "Could not load profile.");
  if (!person) throw new Error("Person profile not found.");

  const context: PersonContext = {
    authUser: { id: authData.user.id },
    person: {
      person_id: person.person_id,
      role: person.role,
      first_name: person.first_name,
      last_name: person.last_name,
      email: person.email,
    },
    role: person.role,
  };

  if (person.role === "student") {
    const { data: student, error } = await client
      .from("students")
      .select("student_id")
      .eq("person_id", person.person_id)
      .maybeSingle();
    if (error) throw new Error(error.message || "Could not load student profile.");
    if (!student?.student_id) throw new Error("Student profile not found.");
    context.studentId = student.student_id;
  }

  if (person.role === "company_rep") {
    const { data: rep, error } = await client
      .from("company_representatives")
      .select("company_id")
      .eq("person_id", person.person_id)
      .maybeSingle();
    if (error) throw new Error(error.message || "Could not load company profile.");
    if (!rep?.company_id) throw new Error("Company representative profile not found.");
    context.companyId = rep.company_id;
  }

  return context;
}

export async function getStudentConversations(): Promise<ConversationListItem[]> {
  const client = ensureClient();
  const ctx = await getCurrentPersonContext();
  if (ctx.role !== "student" || !ctx.studentId) return [];

  const { data, error } = await client
    .from("conversations")
    .select("conversation_id,student_id,company_id,application_id,updated_at,companies(name),applications(internship_postings(title))")
    .eq("student_id", ctx.studentId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message || "Could not load conversations.");

  const rows = (data ?? []) as any[];
  const items = await Promise.all(rows.map(async (row) => {
    const company = Array.isArray(row.companies) ? row.companies[0] : row.companies;
    const application = Array.isArray(row.applications) ? row.applications[0] : row.applications;
    const posting = Array.isArray(application?.internship_postings) ? application.internship_postings[0] : application?.internship_postings;

    const { data: latestMessage } = await client
      .from("messages")
      .select("body,created_at")
      .eq("conversation_id", row.conversation_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      conversationId: row.conversation_id,
      studentId: row.student_id,
      companyId: row.company_id,
      applicationId: row.application_id,
      title: company?.name ?? "Company",
      subtitle: posting?.title ? `Regarding ${posting.title}` : "Conversation",
      updatedAt: row.updated_at,
      latestMessage: latestMessage ? { body: latestMessage.body, createdAt: latestMessage.created_at } : null,
    } satisfies ConversationListItem;
  }));

  return items;
}

export async function getCompanyConversations(): Promise<ConversationListItem[]> {
  const client = ensureClient();
  const ctx = await getCurrentPersonContext();
  if (ctx.role !== "company_rep" || !ctx.companyId) return [];

  const { data, error } = await client
    .from("conversations")
    .select("conversation_id,student_id,company_id,application_id,updated_at,students(persons(first_name,last_name,email)),applications(internship_postings(title))")
    .eq("company_id", ctx.companyId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message || "Could not load conversations.");

  const rows = (data ?? []) as any[];
  const items = await Promise.all(rows.map(async (row) => {
    const student = Array.isArray(row.students) ? row.students[0] : row.students;
    const person = Array.isArray(student?.persons) ? student.persons[0] : student?.persons;
    const application = Array.isArray(row.applications) ? row.applications[0] : row.applications;
    const posting = Array.isArray(application?.internship_postings) ? application.internship_postings[0] : application?.internship_postings;

    const { data: latestMessage } = await client
      .from("messages")
      .select("body,created_at")
      .eq("conversation_id", row.conversation_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const fullName = [person?.first_name, person?.last_name].filter(Boolean).join(" ").trim();

    return {
      conversationId: row.conversation_id,
      studentId: row.student_id,
      companyId: row.company_id,
      applicationId: row.application_id,
      title: fullName || person?.email || "Student",
      subtitle: posting?.title ? `Applied for ${posting.title}` : person?.email || "Applicant conversation",
      updatedAt: row.updated_at,
      latestMessage: latestMessage ? { body: latestMessage.body, createdAt: latestMessage.created_at } : null,
    } satisfies ConversationListItem;
  }));

  return items;
}

export async function getConversationMessages(conversationId: string): Promise<ConversationMessage[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("messages")
    .select("message_id,sender_person_id,body,created_at,read_at,persons(first_name,last_name,role)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message || "Could not load messages.");

  return ((data ?? []) as any[]).map((row) => {
    const person = Array.isArray(row.persons) ? row.persons[0] : row.persons;
    const fullName = [person?.first_name, person?.last_name].filter(Boolean).join(" ").trim();

    return {
      messageId: row.message_id,
      senderPersonId: row.sender_person_id,
      senderName: fullName || "Unknown",
      senderRole: person?.role ?? null,
      body: row.body,
      createdAt: row.created_at,
      readAt: row.read_at,
    };
  });
}

export async function sendMessage(conversationId: string, body: string): Promise<void> {
  const client = ensureClient();
  const ctx = await getCurrentPersonContext();
  const text = body.trim();
  if (!text) throw new Error("Message cannot be empty.");

  const { data: message, error } = await client
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_person_id: ctx.person.person_id,
      body: text,
    })
    .select("message_id")
    .single();

  if (error) throw new Error(error.message || "Could not send message.");

  const { error: convError } = await client
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("conversation_id", conversationId);

  if (convError) throw new Error(convError.message || "Could not update conversation.");

  if (message?.message_id) {
    await createNotificationsForMessage(conversationId, message.message_id, ctx);
  }
}

async function createNotificationsForMessage(conversationId: string, messageId: string, ctx: PersonContext): Promise<void> {
  const client = ensureClient();
  const { data: conversation, error } = await client
    .from("conversations")
    .select("conversation_id,student_id,company_id,students(persons(person_id,first_name,last_name,email)),companies(name)")
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (error) throw new Error(error.message || "Could not load conversation participants.");
  if (!conversation) return;

  const row = conversation as any;
  const student = Array.isArray(row.students) ? row.students[0] : row.students;
  const studentPerson = Array.isArray(student?.persons) ? student.persons[0] : student?.persons;
  const company = Array.isArray(row.companies) ? row.companies[0] : row.companies;

  if (ctx.role === "company_rep" && studentPerson?.person_id && studentPerson.person_id !== ctx.person.person_id) {
    await createMessageNotification({
      messageId,
      conversationId,
      recipientPersonId: studentPerson.person_id,
      senderName: company?.name ?? "Company",
    });
    return;
  }

  if (ctx.role === "student" && row.company_id) {
    const { data: representatives, error: repsError } = await client
      .from("company_representatives")
      .select("persons(person_id)")
      .eq("company_id", row.company_id);

    if (repsError) throw new Error(repsError.message || "Could not load company representatives.");

    const senderName = [ctx.person.first_name, ctx.person.last_name].filter(Boolean).join(" ").trim() || ctx.person.email || "Student";
    const recipientPersonIds = new Set(
      ((representatives ?? []) as any[])
        .map((rep) => {
          const person = Array.isArray(rep.persons) ? rep.persons[0] : rep.persons;
          return person?.person_id as string | undefined;
        })
        .filter((personId): personId is string => Boolean(personId) && personId !== ctx.person.person_id),
    );

    await Promise.all(Array.from(recipientPersonIds).map((recipientPersonId) =>
      createMessageNotification({
        messageId,
        conversationId,
        recipientPersonId,
        senderName,
      }),
    ));
  }
}

export async function getOrCreateConversationForApplication(applicationId: string): Promise<string> {
  const client = ensureClient();
  const ctx = await getCurrentPersonContext();

  if (ctx.role !== "company_rep" || !ctx.companyId) {
    throw new Error("Only company representatives can start applicant conversations.");
  }

  const companyId = ctx.companyId;

  const { data: app, error: appError } = await client
    .from("applications")
    .select("application_id,student_id,company_id")
    .eq("application_id", applicationId)
    .maybeSingle();
  if (appError) throw new Error(appError.message || "Could not load application.");
  if (!app) throw new Error("Application not found.");
  if (app.company_id !== companyId) throw new Error("You do not have access to this application.");

  const { data: existing, error: existingError } = await client
    .from("conversations")
    .select("conversation_id")
    .eq("application_id", applicationId)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message || "Could not load conversation.");
  if (existing?.conversation_id) return existing.conversation_id;

  const { data: created, error: createError } = await client
    .from("conversations")
    .insert({
      application_id: app.application_id,
      student_id: app.student_id,
      company_id: app.company_id,
    })
    .select("conversation_id")
    .single();

  if (createError) throw new Error(createError.message || "Could not create conversation.");
  return created.conversation_id;
}
