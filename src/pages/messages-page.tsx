import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Search } from "lucide-react";
import {
  getCompanyConversations,
  getConversationMessages,
  getCurrentPersonContext,
  getStudentConversations,
  sendMessage,
  type ConversationListItem,
  type ConversationMessage,
} from "@/lib/messages-service";

export const MessagesPage = () => {
  const [searchParams] = useSearchParams();
  const requestedConversationId = searchParams.get("conversation");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<"student" | "company_rep" | "admin" | null>(null);
  const [myPersonId, setMyPersonId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.conversationId === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const loadConversations = async () => {
    setError(null);
    setLoading(true);
    try {
      const context = await getCurrentPersonContext();
      setRole(context.role);
      setMyPersonId(context.person.person_id);

      const list = context.role === "company_rep"
        ? await getCompanyConversations()
        : await getStudentConversations();
      setConversations(list);
      setSelectedConversationId((current) => {
        if (requestedConversationId && list.some((item) => item.conversationId === requestedConversationId)) {
          return requestedConversationId;
        }
        return current ?? list[0]?.conversationId ?? null;
      });
    } catch (err: any) {
      setError(err?.message || "Could not load conversations.");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setError(null);
    try {
      const data = await getConversationMessages(conversationId);
      setMessages(data);
    } catch (err: any) {
      setError(err?.message || "Could not load messages.");
    }
  };

  useEffect(() => {
    void loadConversations();
  }, [requestedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedConversationId);
  }, [selectedConversationId]);

  const onSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedConversationId || sending) return;

    setSending(true);
    setError(null);
    try {
      await sendMessage(selectedConversationId, messageText);
      setMessageText("");
      await loadMessages(selectedConversationId);
      await loadConversations();
    } catch (err: any) {
      setError(err?.message || "Could not send message.");
    } finally {
      setSending(false);
    }
  };

  const emptyCopy = role === "company_rep"
    ? "No applicant conversations yet."
    : "No messages yet. When a company contacts you, conversations will appear here.";

  return (
    <div className="h-[calc(100vh-160px)] flex bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input className="pl-9 h-9 text-sm" placeholder="Search messages..." disabled />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? <p className="p-4 text-sm text-slate-500">Loading conversations...</p> : null}
          {!loading && conversations.length === 0 ? <p className="p-4 text-sm text-slate-500">{emptyCopy}</p> : null}

          {!loading && conversations.map((conversation) => (
            <button
              key={conversation.conversationId}
              onClick={() => setSelectedConversationId(conversation.conversationId)}
              className={`w-full text-left p-4 flex items-center space-x-3 hover:bg-slate-50 transition-colors ${selectedConversationId === conversation.conversationId ? "bg-slate-50 border-r-2 border-blue-600" : ""}`}
            >
              <Avatar className="w-10 h-10">
                <AvatarFallback>{conversation.title.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900 truncate">{conversation.title}</p>
                  <span className="text-[10px] text-slate-400 uppercase font-medium">{new Date(conversation.updatedAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs truncate text-slate-500">{conversation.latestMessage?.body ?? conversation.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-50/30">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-slate-400">Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            <div className="h-16 bg-white border-b px-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>{selectedConversation.title.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold text-slate-900">{selectedConversation.title}</p>
                  <p className="text-[11px] text-slate-500">{selectedConversation.subtitle}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              {messages.length === 0 ? <p className="text-sm text-slate-500">No messages yet. Start the conversation.</p> : null}
              {messages.map((item) => {
                const isOwn = item.senderPersonId === myPersonId;
                return (
                  <div key={item.messageId} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${isOwn ? "bg-blue-600 text-white rounded-br-none" : "bg-white border text-slate-800 rounded-bl-none shadow-sm"}`}>
                      {!isOwn ? <p className="text-[11px] font-semibold mb-1">{item.senderName}</p> : null}
                      {item.body}
                      <p className={`text-[9px] mt-1 ${isOwn ? "text-blue-200" : "text-slate-400"}`}>{new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-white border-t">
              <form onSubmit={onSendMessage} className="flex items-center space-x-2">
                <Input value={messageText} onChange={(e) => setMessageText(e.target.value)} className="flex-1 h-10" placeholder="Type your message..." />
                <Button type="submit" size="icon" className="bg-blue-600" disabled={sending}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>

      {error ? <div className="absolute bottom-4 right-4 bg-red-50 text-red-700 border border-red-200 rounded-md px-3 py-2 text-xs">{error}</div> : null}
    </div>
  );
};
