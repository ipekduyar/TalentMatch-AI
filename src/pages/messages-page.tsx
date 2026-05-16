import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Search, MoreVertical, Phone, Video } from "lucide-react";
import { useCurrentUser } from "@/lib/auth-context";

export const MessagesPage = () => {
  const { user } = useCurrentUser();
  const [selectedChat, setSelectedChat] = useState<number | null>(0);
  const [message, setMessage] = useState("");

  const chats = [
    { id: 0, name: 'Garanti BBVA HR', lastMsg: 'We would like to invite you for an interview.', time: '10:45 AM', unread: true, avatar: 'GB' },
    { id: 1, name: 'Trendyol Recruiting', lastMsg: 'Your CV has been reviewed.', time: 'Yesterday', unread: false, avatar: 'TY' },
    { id: 2, name: 'Mert Doğru', lastMsg: 'Thanks for the feedback!', time: 'Monday', unread: false, avatar: 'MD' },
  ];

  return (
    <div className="h-[calc(100vh-160px)] flex bg-white rounded-2xl border shadow-sm overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
             <Input className="pl-9 h-9 text-sm" placeholder="Search messages..." />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
           {chats.map((chat) => (
             <div 
               key={chat.id} 
               onClick={() => setSelectedChat(chat.id)}
               className={`p-4 flex items-center space-x-3 cursor-pointer hover:bg-slate-50 transition-colors ${selectedChat === chat.id ? 'bg-slate-50 border-r-2 border-blue-600' : ''}`}
             >
               <Avatar className="w-10 h-10">
                 <AvatarFallback>{chat.avatar}</AvatarFallback>
               </Avatar>
               <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                     <p className="text-sm font-bold text-slate-900 truncate">{chat.name}</p>
                     <span className="text-[10px] text-slate-400 uppercase font-medium">{chat.time}</span>
                  </div>
                  <p className={`text-xs truncate ${chat.unread ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>{chat.lastMsg}</p>
               </div>
             </div>
           ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col bg-slate-50/30">
        {selectedChat !== null ? (
          <>
            <div className="h-16 bg-white border-b px-6 flex items-center justify-between">
               <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{chats[selectedChat].avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                     <p className="text-sm font-bold text-slate-900">{chats[selectedChat].name}</p>
                     <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online</p>
                  </div>
               </div>
               <div className="flex items-center space-x-2 text-slate-400">
                  <button className="p-2 hover:bg-slate-100 rounded-lg"><Phone className="w-4 h-4" /></button>
                  <button className="p-2 hover:bg-slate-100 rounded-lg"><Video className="w-4 h-4" /></button>
                  <button className="p-2 hover:bg-slate-100 rounded-lg"><MoreVertical className="w-4 h-4" /></button>
               </div>
            </div>

            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
               <MessageBubble isOwn={false} text="Hello İpek! We were impressed by your background in Industrial Engineering." />
               <MessageBubble isOwn={false} text="We would like to invite you for an interview next Tuesday at 11:00 AM." />
               <MessageBubble isOwn={true} text="Hello! Thank you so much for the opportunity. I would be happy to attend." />
               <MessageBubble isOwn={false} text="Great! I've sent the calendar invite to your email." />
            </div>

            <div className="p-4 bg-white border-t">
               <form 
                 onSubmit={(e) => { e.preventDefault(); setMessage(""); }}
                 className="flex items-center space-x-2"
               >
                  <Input 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 h-10" 
                    placeholder="Type your message..." 
                  />
                  <Button type="submit" size="icon" className="bg-blue-600">
                     <Send className="w-4 h-4" />
                  </Button>
               </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
             <p className="text-slate-400">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MessageBubble = ({ isOwn, text }: { isOwn: boolean, text: string }) => (
  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${isOwn ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border text-slate-800 rounded-bl-none shadow-sm'}`}>
      {text}
      <p className={`text-[9px] mt-1 ${isOwn ? 'text-blue-200' : 'text-slate-400'}`}>11:04 AM</p>
    </div>
  </div>
);
