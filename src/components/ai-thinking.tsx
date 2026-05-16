import React from "react";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

export const AIThinking = ({ message }: { message: string }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-6 text-center">
      <div className="relative">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-blue-600"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-slate-900">AI is working...</h3>
        <p className="text-slate-500 animate-pulse">{message}</p>
      </div>
    </div>
  );
};
