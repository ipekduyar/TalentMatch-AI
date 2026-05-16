import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Search } from "lucide-react";
import { toast } from "sonner";

export const MessagesPage = () => {
  const [selectedChat, setSelectedChat] = useState(0);
  const [message, setMessage] = useState("");
  const chats = [
    { id: 0, name: "Mert Doğru", role: "Industrial Engineering Student", status: "Interviewing", avatar: "MD", msgs: ["Hello, thank you for shortlisting me.", "Can we confirm interview time for Tuesday?"] },
    { id: 1, name: "Beyza Dönmez", role: "Computer Engineering Student", status: "Applied", avatar: "BD", msgs: ["I submitted the assignment.", "Happy to answer any questions."] },
  ];
  return <div className="h-[calc(100vh-160px)] flex bg-white rounded-2xl border shadow-sm overflow-hidden">
    <div className="w-80 border-r flex flex-col"><div className="p-4 border-b"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" /><Input className="pl-9 h-9 text-sm" placeholder="Search students..." /></div></div><div className="flex-1 overflow-y-auto">{chats.map((c)=><div key={c.id} onClick={()=>setSelectedChat(c.id)} className={`p-4 cursor-pointer hover:bg-slate-50 ${selectedChat===c.id?"bg-slate-50 border-r-2 border-blue-600":""}`}><p className="text-sm font-bold text-slate-900">{c.name}</p><p className="text-xs text-slate-500">{c.role}</p><p className="text-[11px] text-blue-700 mt-1">{c.status}</p></div>)}</div></div>
    <div className="flex-1 flex flex-col bg-slate-50/30"><div className="h-16 bg-white border-b px-6 flex items-center"><Avatar className="w-8 h-8"><AvatarFallback>{chats[selectedChat].avatar}</AvatarFallback></Avatar><div className="ml-3"><p className="text-sm font-bold text-slate-900">{chats[selectedChat].name}</p><p className="text-xs text-slate-500">Recruiter conversation</p></div></div><div className="flex-1 p-6 space-y-4 overflow-y-auto">{chats[selectedChat].msgs.map((m,i)=><Bubble key={i} isOwn={i%2===1} text={m} />)}</div><Card className="m-4 p-3 border bg-white"><p className="text-xs text-slate-500">Suggested actions: Send interview calendar • Request portfolio • Share role details</p></Card><div className="p-4 bg-white border-t"><form onSubmit={(e)=>{e.preventDefault(); if(!message.trim()) return; toast.success("Message sent"); setMessage("");}} className="flex gap-2"><Input value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Type your reply..." /><Button type="submit" size="icon" className="bg-blue-600"><Send className="w-4 h-4" /></Button></form></div></div>
  </div>;
};

const Bubble = ({ isOwn, text }: { isOwn: boolean; text: string }) => <div className={`flex ${isOwn?"justify-end":"justify-start"}`}><div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${isOwn?"bg-blue-600 text-white":"bg-white border text-slate-800"}`}>{text}</div></div>;
