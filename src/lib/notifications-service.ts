import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type NotificationType = "status_update" | "new_message" | string;

export type AppNotification = {
  notificationId: string;
  personId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedApplicationId: string | null;
  relatedConversationId: string | null;
  eventKey: string | null;
  isRead: boolean;
  createdAt: string;
};

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function toNotification(row: any): AppNotification {
  return {
    notificationId: row.notification_id,
    personId: row.person_id,
    type: row.type,
    title: row.title,
    message: row.message,
    relatedApplicationId: row.related_application_id ?? null,
    relatedConversationId: row.related_conversation_id ?? null,
    eventKey: row.event_key ?? null,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

async function getCurrentPersonId(): Promise<string> {
  const client = ensureClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) throw new Error(authError.message || "Could not load authenticated user.");
  if (!authData.user) throw new Error("You must be signed in to view notifications.");

  const { data: person, error: personError } = await client
    .from("persons")
    .select("person_id")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();

  if (personError) throw new Error(personError.message || "Could not load profile.");
  if (!person?.person_id) throw new Error("Person profile not found.");
  return person.person_id;
}

export async function createApplicationStatusNotification(params: {
  applicationId: string;
  status: string;
}): Promise<void> {
  const client = ensureClient();
  const { error } = await client.rpc("create_status_notification", {
    p_application_id: params.applicationId,
    p_status: params.status,
  });

  if (error) throw new Error(error.message || "Could not create application status notification.");
}

export async function createMessageNotification(params: {
  messageId: string;
  conversationId: string;
}): Promise<void> {
  const client = ensureClient();
  const { error } = await client.rpc("create_message_notification", {
    p_message_id: params.messageId,
    p_conversation_id: params.conversationId,
  });

  if (error) throw new Error(error.message || "Could not create message notification.");
}

export async function getCurrentUserNotifications(): Promise<AppNotification[]> {
  const client = ensureClient();
  const personId = await getCurrentPersonId();

  const { data, error } = await client
    .from("notifications")
    .select("notification_id,person_id,type,title,message,related_application_id,related_conversation_id,event_key,is_read,created_at")
    .eq("person_id", personId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message || "Could not load notifications.");
  return (data ?? []).map(toNotification);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const client = ensureClient();
  const personId = await getCurrentPersonId();

  const { count, error } = await client
    .from("notifications")
    .select("notification_id", { count: "exact", head: true })
    .eq("person_id", personId)
    .eq("is_read", false);

  if (error) throw new Error(error.message || "Could not load unread notifications.");
  return count ?? 0;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const client = ensureClient();
  const personId = await getCurrentPersonId();

  const { error } = await client
    .from("notifications")
    .update({ is_read: true })
    .eq("notification_id", notificationId)
    .eq("person_id", personId);

  if (error) throw new Error(error.message || "Could not mark notification as read.");
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const client = ensureClient();
  const personId = await getCurrentPersonId();

  const { error } = await client
    .from("notifications")
    .update({ is_read: true })
    .eq("person_id", personId)
    .eq("is_read", false);

  if (error) throw new Error(error.message || "Could not mark notifications as read.");
}
