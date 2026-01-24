import React, { useState, useRef, useEffect } from 'react';
import { IconMessage, IconX, IconSparkles, IconArrowUp } from './Icons';
import { chatWithAI } from '../services/geminiService';

interface Message {
    role: 'user' | 'model';
    text: string;
}

const ChatAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: 'Xin chào! Tôi có thể giúp bạn viết tài liệu. Hãy hỏi tôi về mẹo viết, kiểm tra ngữ pháp hoặc gợi ý nội dung.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            // Convert simple message format to Gemini history format
            const historyForApi = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const responseText = await chatWithAI(userMsg, historyForApi);
            
            setMessages(prev => [...prev, { role: 'model', text: responseText }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            <div 
                className={`bg-white rounded-2xl shadow-2xl border border-indigo-100 w-80 sm:w-96 overflow-hidden transition-all duration-300 origin-bottom-right mb-4 flex flex-col ${
                    isOpen ? 'scale-100 opacity-100 h-[500px]' : 'scale-0 opacity-0 h-0'
                }`}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2 text-white">
                        <IconSparkles className="w-5 h-5" />
                        <span className="font-bold">Trợ lý AI</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                        <IconX className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div 
                                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-br-none' 
                                    : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                                }`}
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-white border-t border-slate-100">
                    <div className="relative flex items-center">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Hỏi AI để được trợ giúp..."
                            className="w-full bg-slate-100 border-none rounded-full pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none text-slate-700"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                        >
                            <IconArrowUp className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 ${
                    isOpen 
                    ? 'bg-slate-200 text-slate-600 rotate-90' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                }`}
            >
                {isOpen ? <IconX className="w-6 h-6" /> : <IconMessage className="w-7 h-7" />}
            </button>
        </div>
    );
};

export default ChatAssistant;