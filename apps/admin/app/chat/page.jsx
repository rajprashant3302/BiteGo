'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket'; 
import uploadFile from '@/helpers/uploadFile';
import EmojiPicker from 'emoji-picker-react';
import { 
    ArrowLeft, Send, Search, Check, CheckCheck, User, 
    Smile, Image as ImageIcon, Film, X, Loader2 
} from 'lucide-react';

export default function AdminChatPage() {
    const { data: session } = useSession();
    
    // 1. The actual logged-in admin's ID
    const adminId = session?.user?.id; 
    // 2. The Virtual Inbox ID
    const SHARED_INBOX_ID = "SUPPORT_INBOX"; 
    
    const { socket } = useSocket(session?.user?.accessToken);

    const [conversations, setConversations] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [activeUser, setActiveUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // --- NEW MEDIA & EMOJI STATES ---
    const [loading, setLoading] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [pendingFile, setPendingFile] = useState(null);
    const [pendingPreviewUrl, setPendingPreviewUrl] = useState(null);
    const [pendingType, setPendingType] = useState(null);

    const messagesEndRef = useRef(null);

    // Fetch & Listen to Sidebar Conversations for the SHARED INBOX
    useEffect(() => {
        if (!socket || !adminId) return;

        socket.emit('sidebar', SHARED_INBOX_ID);

        const handleConversations = (data) => {
            const sortedData = data.sort((a, b) => new Date(b.lastMsg?.createdAt || 0) - new Date(a.lastMsg?.createdAt || 0));
            setConversations(sortedData);
        };

        socket.on('conversation', handleConversations);
        return () => socket.off('conversation', handleConversations);
    }, [socket, adminId]);

    // Fetch & Listen to Active Chat Messages
    useEffect(() => {
        if (!socket) return;

        const handleMessageUser = (user) => setActiveUser(user);
        const handleMessages = (msgs) => setMessages(msgs);

        socket.on('message-user', handleMessageUser);
        socket.on('message', handleMessages);

        return () => {
            socket.off('message-user', handleMessageUser);
            socket.off('message', handleMessages);
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSelectChat = (userId) => {
        setActiveChatId(userId);
        socket.emit('message-page', userId);
        // Clear any pending media if switching chats
        clearPendingMedia(); 
    };

    // --- MEDIA PREVIEW HANDLERS ---
    const handleAttachMedia = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        setPendingFile(file);
        setPendingType(type);
        setPendingPreviewUrl(URL.createObjectURL(file)); 
        e.target.value = null; // Reset input
    };

    const clearPendingMedia = () => {
        setPendingFile(null);
        setPendingType(null);
        if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
        setPendingPreviewUrl(null);
    };

    // --- SEND HANDLER (Handles Text & Media) ---
    const handleSendMessage = async () => {
        if (!inputText.trim() && !pendingFile) return;

        setLoading(true);

        try {
            let uploadedUrl = "";
            
            if (pendingFile) {
                uploadedUrl = await uploadFile(pendingFile);
                if (!uploadedUrl) throw new Error("Upload failed");
            }

            socket.emit('new-message', {
                sender: SHARED_INBOX_ID, 
                receiver: activeChatId, 
                text: inputText.trim(),
                ...(pendingType === 'image' && { image: uploadedUrl }),
                ...(pendingType === 'video' && { video: uploadedUrl }),
                msgByUserId: adminId 
            });
            
            setInputText("");
            setShowEmoji(false);
            clearPendingMedia();
        } catch (error) {
            console.error("Failed to send message", error);
            alert("Failed to send media. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const filteredConversations = conversations.filter(c => 
        c.userDetails?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!session) return null;

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
            
            {/* ================= SIDEBAR ================= */}
            <div className={`w-full md:w-[380px] lg:w-[420px] bg-white border-r border-slate-200 flex flex-col flex-shrink-0 ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
                
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-slate-800">Shared Support Inbox</h1>
                </div>

                <div className="p-3 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search or start new chat" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-100 text-sm rounded-lg pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-sm">No conversations found</div>
                    ) : (
                        filteredConversations.map((conv) => {
                            const isUnread = conv.unreadCount > 0;
                            const isActive = activeChatId === conv.userDetails?.id;
                            const lastMsgBySupport = conv.lastMsg?.msgByUserId !== conv.userDetails?.id;

                            return (
                                <div 
                                    key={conv._id}
                                    onClick={() => handleSelectChat(conv.userDetails?.id)}
                                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-slate-50 hover:bg-slate-50 ${isActive ? 'bg-blue-50/50 hover:bg-blue-50/50' : ''}`}
                                >
                                    <div className="w-12 h-12 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                        {conv.userDetails?.profile_pic ? (
                                            <img src={conv.userDetails.profile_pic} alt={conv.userDetails.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="text-slate-400" size={24} />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h3 className={`text-base truncate ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                                                {conv.userDetails?.name || 'Unknown User'}
                                            </h3>
                                            {conv.lastMsg && (
                                                <span className={`text-[11px] flex-shrink-0 ${isUnread ? 'text-green-600 font-bold' : 'text-slate-400'}`}>
                                                    {new Date(conv.lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex justify-between items-center gap-2">
                                            <p className={`text-sm truncate ${isUnread ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                                                {lastMsgBySupport && "Support: "}
                                                {conv.lastMsg?.text || (conv.lastMsg?.image?.imageUrl ? "📷 Image" : "Attachment")}
                                            </p>
                                            
                                            {isUnread && (
                                                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-[10px] font-bold text-white">{conv.unreadCount}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ================= ACTIVE CHAT WINDOW ================= */}
            <div className={`flex-1 bg-[#efeae2] flex flex-col ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
                
                {!activeChatId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <Send size={40} className="text-blue-200 ml-2" />
                        </div>
                        <h2 className="text-2xl font-light text-slate-600 mb-2">BiteGo Admin Support</h2>
                        <p className="text-sm">Select a chat to start messaging</p>
                    </div>
                ) : (
                    <>
                        <div className="h-16 px-4 bg-white border-b border-slate-200 flex items-center gap-3 shadow-sm z-10">
                            <button 
                                onClick={() => setActiveChatId(null)} 
                                className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-full"
                            >
                                <ArrowLeft size={24} />
                            </button>

                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                {activeUser?.profile_pic ? (
                                    <img src={activeUser.profile_pic} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="text-slate-400" size={20} />
                                )}
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-800 leading-tight">{activeUser?.name || 'Loading...'}</h2>
                                <p className="text-xs text-slate-500">{activeUser?.online ? 'Online' : 'Offline'}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}>
                            {messages.map((msg, idx) => {
                                const isSupportReply = msg.msgByUserId !== activeChatId;

                                return (
                                    <div key={msg._id || idx} className={`flex ${isSupportReply ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-3 py-2 shadow-sm relative flex flex-col ${
                                            isSupportReply ? 'bg-[#d9fdd3] rounded-tr-sm text-slate-800' : 'bg-white rounded-tl-sm text-slate-800'
                                        }`}>
                                            
                                            {msg.image?.imageUrl && (
                                                <img src={msg.image.imageUrl} alt="attachment" className="w-full max-h-64 object-cover rounded-xl mb-1 mt-1 cursor-pointer" onClick={() => window.open(msg.image.imageUrl, '_blank')} />
                                            )}

                                            {msg.video?.videoUrl && (
                                                <video src={msg.video.videoUrl} controls className="w-full rounded-xl max-h-60 mb-2 mt-1" />
                                            )}

                                            {msg.text && (
                                                <p className="text-[15px] leading-relaxed pr-8 pb-1 whitespace-pre-wrap break-words">{msg.text}</p>
                                            )}

                                            <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] text-slate-400">
                                                <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {isSupportReply && (
                                                    msg.seen ? <CheckCheck size={14} className="text-blue-500" /> : <Check size={14} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* --- INPUT AREA & PREVIEWS --- */}
                        <div className="bg-slate-50 border-t border-slate-200 z-20 flex flex-col relative">
                            
                            {/* PENDING MEDIA PREVIEW */}
                            {pendingPreviewUrl && (
                                <div className="p-4 border-b border-slate-200 bg-white flex items-start gap-4">
                                    <div className="relative w-24 h-24 rounded-lg overflow-hidden shadow-sm border border-slate-200 bg-black">
                                        {pendingType === 'image' ? (
                                            <img src={pendingPreviewUrl} alt="preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <video src={pendingPreviewUrl} className="w-full h-full object-cover" />
                                        )}
                                        <button 
                                            onClick={clearPendingMedia}
                                            disabled={loading}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="flex-1 text-sm text-slate-500 pt-1">
                                        {loading ? "Uploading media..." : `Add a caption to this ${pendingType}...`}
                                    </div>
                                </div>
                            )}

                            {/* EMOJI PICKER POPOVER */}
                            {showEmoji && (
                                <div className="absolute bottom-full left-4 mb-2 z-30 shadow-2xl rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                                    <EmojiPicker 
                                        onEmojiClick={(e) => setInputText(prev => prev + e.emoji)} 
                                        width={300} 
                                        height={400} 
                                    />
                                </div>
                            )}

                            {/* TEXT INPUT BLOCK */}
                            <div className="p-3 flex items-end gap-2">
                                <div className="flex items-center gap-1 pb-1">
                                    <button onClick={() => setShowEmoji(!showEmoji)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                                        {showEmoji ? <X size={20} /> : <Smile size={20} />}
                                    </button>
                                    
                                    <label className="p-2 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer">
                                        <ImageIcon size={20} />
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAttachMedia(e, 'image')} disabled={loading} />
                                    </label>

                                    <label className="p-2 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer">
                                        <Film size={20} />
                                        <input type="file" accept="video/*" className="hidden" onChange={(e) => handleAttachMedia(e, 'video')} disabled={loading} />
                                    </label>
                                </div>

                                <textarea
                                    className="flex-1 bg-white border border-slate-200 p-3 rounded-2xl outline-none resize-none max-h-32 text-sm disabled:opacity-70 shadow-sm"
                                    rows={1}
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder={pendingFile ? "Add a caption..." : "Type a message..."}
                                    disabled={loading}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />

                                <button 
                                    onClick={handleSendMessage} 
                                    disabled={loading || (!inputText.trim() && !pendingFile)}
                                    className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 transition-all flex-shrink-0 mb-0.5 shadow-sm"
                                >
                                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}