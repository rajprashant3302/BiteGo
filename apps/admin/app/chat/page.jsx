// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import { useSession } from 'next-auth/react';
// import { useSocket } from '@/hooks/useSocket';
// import uploadFile from '@/helpers/uploadFile';
// import EmojiPicker from 'emoji-picker-react';
// import {
//     ArrowLeft, Send, Search, Check, CheckCheck, User,
//     Smile, Image as ImageIcon, Film, X, Loader2, Clock3
// } from 'lucide-react';

// const SHARED_INBOX_ID = "SUPPORT_INBOX";

// const formatLastMessage = (msg) => {
//     if (!msg) return "No messages yet";
//     if (msg.text) return msg.text;
//     if (msg.image?.imageUrl) return "📷 Image";
//     if (msg.video?.videoUrl) return "🎥 Video";
//     return "Attachment";
// };

// const StatusTicks = ({ status }) => {
//     if (status === 'seen') {
//         return <CheckCheck size={14} className="text-blue-500" />;
//     }
//     if (status === 'delivered') {
//         return <CheckCheck size={14} className="text-slate-400" />;
//     }
//     return <Check size={14} className="text-slate-400" />;
// };

// export default function AdminChatPage() {
//     const { data: session } = useSession();
//     const adminId = session?.user?.id;
//     const { socket } = useSocket(session?.user?.accessToken);

//     const [conversations, setConversations] = useState([]);
//     const [activeChatId, setActiveChatId] = useState(null);
//     const [activeUser, setActiveUser] = useState(null);
//     const [messages, setMessages] = useState([]);
//     const [inputText, setInputText] = useState("");
//     const [searchQuery, setSearchQuery] = useState("");
//     const [loading, setLoading] = useState(false);
//     const [showEmoji, setShowEmoji] = useState(false);
//     const [pendingFile, setPendingFile] = useState(null);
//     const [pendingPreviewUrl, setPendingPreviewUrl] = useState(null);
//     const [pendingType, setPendingType] = useState(null);
//     const [supportMeta, setSupportMeta] = useState({
//         hasActiveSession: false,
//         tokenId: null,
//         expiresAt: null,
//         canSend: true
//     });

//     const messagesEndRef = useRef(null);

//     useEffect(() => {
//         if (!socket || !adminId) return;

//         socket.emit('sidebar', SHARED_INBOX_ID);

//         const handleConversations = (data) => {
//             const sortedData = [...data].sort(
//                 (a, b) => new Date(b.lastMsg?.createdAt || 0) - new Date(a.lastMsg?.createdAt || 0)
//             );
//             setConversations(sortedData);
//         };

//         socket.on('conversation', handleConversations);
//         return () => socket.off('conversation', handleConversations);
//     }, [socket, adminId]);

//     useEffect(() => {
//         if (!socket) return;

//         const handleMessageUser = (user) => setActiveUser(user);
//         const handleMessages = (msgs) => setMessages(msgs);
//         const handleSupportMeta = (meta) => setSupportMeta(meta);

//         socket.on('message-user', handleMessageUser);
//         socket.on('message', handleMessages);
//         socket.on('support-chat-meta', handleSupportMeta);

//         return () => {
//             socket.off('message-user', handleMessageUser);
//             socket.off('message', handleMessages);
//             socket.off('support-chat-meta', handleSupportMeta);
//         };
//     }, [socket]);

//     useEffect(() => {
//         messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     }, [messages]);

//     const handleSelectChat = (userId) => {
//         setActiveChatId(userId);
//         socket.emit('message-page', userId);
//         clearPendingMedia();
//     };

//     const handleAttachMedia = (e, type) => {
//         const file = e.target.files[0];
//         if (!file) return;

//         setPendingFile(file);
//         setPendingType(type);
//         setPendingPreviewUrl(URL.createObjectURL(file));
//         e.target.value = null;
//     };

//     const clearPendingMedia = () => {
//         setPendingFile(null);
//         setPendingType(null);
//         if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
//         setPendingPreviewUrl(null);
//     };

//     const handleSendMessage = async () => {
//         if (!activeChatId) return;
//         if (!inputText.trim() && !pendingFile) return;

//         setLoading(true);

//         try {
//             let uploadedUrl = "";

//             if (pendingFile) {
//                 uploadedUrl = await uploadFile(pendingFile);
//                 if (!uploadedUrl) throw new Error("Upload failed");
//             }

//             socket.emit('new-message', {
//                 sender: SHARED_INBOX_ID,
//                 receiver: activeChatId,
//                 text: inputText.trim(),
//                 ...(pendingType === 'image' && { image: uploadedUrl }),
//                 ...(pendingType === 'video' && { video: uploadedUrl }),
//                 msgByUserId: adminId
//             });

//             setInputText("");
//             setShowEmoji(false);
//             clearPendingMedia();
//         } catch (error) {
//             console.error("Failed to send message", error);
//             alert("Failed to send media. Please try again.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const filteredConversations = conversations.filter(c =>
//         c.userDetails?.name?.toLowerCase().includes(searchQuery.toLowerCase())
//     );

//     if (!session) return null;

//     return (
//         <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">

//             <div className={`w-full md:w-[380px] lg:w-[420px] bg-white border-r border-slate-200 flex flex-col flex-shrink-0 ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
//                 <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
//                     <h1 className="text-xl font-bold text-slate-800">Shared Support Inbox</h1>
//                 </div>

//                 <div className="p-3 border-b border-slate-100">
//                     <div className="relative">
//                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//                         <input
//                             type="text"
//                             placeholder="Search or start new chat"
//                             value={searchQuery}
//                             onChange={(e) => setSearchQuery(e.target.value)}
//                             className="w-full bg-slate-100 text-slate-900 placeholder:text-slate-400 text-sm rounded-lg pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
//                         />
//                     </div>
//                 </div>

//                 <div className="flex-1 overflow-y-auto">
//                     {filteredConversations.length === 0 ? (
//                         <div className="p-6 text-center text-slate-400 text-sm">No conversations found</div>
//                     ) : (
//                         filteredConversations.map((conv) => {
//                             const isUnread = conv.unreadCount > 0;
//                             const isActive = activeChatId === conv.userDetails?.id;
//                             const lastMsgBySupport = conv.lastMsg?.msgByUserId !== conv.userDetails?.id;
//                             const hasActiveSession = conv.activeSession?.isActive;

//                             return (
//                                 <div
//                                     key={conv._id}
//                                     onClick={() => handleSelectChat(conv.userDetails?.id)}
//                                     className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-slate-50 hover:bg-slate-50 ${isActive ? 'bg-blue-50/50 hover:bg-blue-50/50' : ''}`}
//                                 >
//                                     <div className="w-12 h-12 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
//                                         {conv.userDetails?.profile_pic ? (
//                                             <img src={conv.userDetails.profile_pic} alt={conv.userDetails.name} className="w-full h-full object-cover" />
//                                         ) : (
//                                             <User className="text-slate-400" size={24} />
//                                         )}
//                                     </div>

//                                     <div className="flex-1 min-w-0">
//                                         <div className="flex justify-between items-baseline mb-0.5">
//                                             <h3 className={`text-base truncate ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
//                                                 {conv.userDetails?.name || 'Unknown User'}
//                                             </h3>

//                                             <div className="flex items-center gap-2">
//                                                 {!hasActiveSession && (
//                                                     <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
//                                                         expired
//                                                     </span>
//                                                 )}
//                                                 {conv.lastMsg && (
//                                                     <span className={`text-[11px] flex-shrink-0 ${isUnread ? 'text-green-600 font-bold' : 'text-slate-400'}`}>
//                                                         {new Date(conv.lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                                                     </span>
//                                                 )}
//                                             </div>
//                                         </div>

//                                         <div className="flex justify-between items-center gap-2">
//                                             <div className="flex items-center gap-1 min-w-0">
//                                                 {lastMsgBySupport && <StatusTicks status={conv.lastMsg?.status} />}
//                                                 <p className={`text-sm truncate ${isUnread ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
//                                                     {lastMsgBySupport && "Support: "}
//                                                     {formatLastMessage(conv.lastMsg)}
//                                                 </p>
//                                             </div>

//                                             {isUnread && (
//                                                 <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
//                                                     <span className="text-[10px] font-bold text-white">{conv.unreadCount}</span>
//                                                 </div>
//                                             )}
//                                         </div>
//                                     </div>
//                                 </div>
//                             );
//                         })
//                     )}
//                 </div>
//             </div>

//             <div className={`flex-1 bg-[#efeae2] flex flex-col ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
//                 {!activeChatId ? (
//                     <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
//                         <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
//                             <Send size={40} className="text-blue-200 ml-2" />
//                         </div>
//                         <h2 className="text-2xl font-light text-slate-600 mb-2">BiteGo Admin Support</h2>
//                         <p className="text-sm">Select a chat to start messaging</p>
//                     </div>
//                 ) : (
//                     <>
//                         <div className="h-16 px-4 bg-white border-b border-slate-200 flex items-center gap-3 shadow-sm z-10">
//                             <button
//                                 onClick={() => setActiveChatId(null)}
//                                 className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-full"
//                             >
//                                 <ArrowLeft size={24} />
//                             </button>

//                             <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
//                                 {activeUser?.profile_pic ? (
//                                     <img src={activeUser.profile_pic} alt="" className="w-full h-full object-cover" />
//                                 ) : (
//                                     <User className="text-slate-400" size={20} />
//                                 )}
//                             </div>

//                             <div className="flex-1 min-w-0">
//                                 <h2 className="font-semibold text-slate-800 leading-tight">{activeUser?.name || 'Loading...'}</h2>
//                                 <p className="text-xs text-slate-500">{activeUser?.online ? 'Online' : 'Offline'}</p>
//                             </div>

//                             <div className="text-right">
//                                 <div className="text-xs text-slate-500 flex items-center gap-1 justify-end">
//                                     <Clock3 size={12} />
//                                     <span>{supportMeta?.hasActiveSession ? 'Active token' : 'No active token'}</span>
//                                 </div>
//                                 {supportMeta?.expiresAt && (
//                                     <div className="text-[11px] text-slate-400">
//                                         expires {new Date(supportMeta.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                                     </div>
//                                 )}
//                             </div>
//                         </div>

//                         <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}>
//                             {messages.map((msg, idx) => {
//                                 const isSupportReply = msg.msgByUserId !== activeChatId;

//                                 return (
//                                     <div key={msg._id || idx} className={`flex ${isSupportReply ? 'justify-end' : 'justify-start'}`}>
//                                         <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-3 py-2 shadow-sm relative flex flex-col ${isSupportReply ? 'bg-[#d9fdd3] rounded-tr-sm text-slate-800' : 'bg-white rounded-tl-sm text-slate-800'}`}>
//                                             {msg.image?.imageUrl && (
//                                                 <img
//                                                     src={msg.image.imageUrl}
//                                                     alt="attachment"
//                                                     className="w-full max-h-64 object-cover rounded-xl mb-1 mt-1 cursor-pointer"
//                                                     onClick={() => window.open(msg.image.imageUrl, '_blank')}
//                                                 />
//                                             )}

//                                             {msg.video?.videoUrl && (
//                                                 <video src={msg.video.videoUrl} controls className="w-full rounded-xl max-h-60 mb-2 mt-1" />
//                                             )}

//                                             {msg.text && (
//                                                 <p className="text-[15px] leading-relaxed pr-8 pb-1 whitespace-pre-wrap break-words">{msg.text}</p>
//                                             )}

//                                             <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] text-slate-400">
//                                                 <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
//                                                 {isSupportReply && <StatusTicks status={msg.status} />}
//                                             </div>
//                                         </div>
//                                     </div>
//                                 );
//                             })}
//                             <div ref={messagesEndRef} />
//                         </div>

//                         <div className="bg-slate-50 border-t border-slate-200 z-20 flex flex-col relative">
//                             {pendingPreviewUrl && (
//                                 <div className="p-4 border-b border-slate-200 bg-white flex items-start gap-4">
//                                     <div className="relative w-24 h-24 rounded-lg overflow-hidden shadow-sm border border-slate-200 bg-black">
//                                         {pendingType === 'image' ? (
//                                             <img src={pendingPreviewUrl} alt="preview" className="w-full h-full object-cover" />
//                                         ) : (
//                                             <video src={pendingPreviewUrl} className="w-full h-full object-cover" />
//                                         )}
//                                         <button
//                                             onClick={clearPendingMedia}
//                                             disabled={loading}
//                                             className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
//                                         >
//                                             <X size={14} />
//                                         </button>
//                                     </div>
//                                     <div className="flex-1 text-sm text-slate-500 pt-1">
//                                         {loading ? "Uploading media..." : `Add a caption to this ${pendingType}...`}
//                                     </div>
//                                 </div>
//                             )}

//                             {showEmoji && (
//                                 <div className="absolute bottom-full left-4 mb-2 z-30 shadow-2xl rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2">
//                                     <EmojiPicker
//                                         onEmojiClick={(e) => setInputText(prev => prev + e.emoji)}
//                                         width={300}
//                                         height={400}
//                                     />
//                                 </div>
//                             )}

//                             {!supportMeta?.hasActiveSession && (
//                                 <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-sm text-amber-700">
//                                     This token has expired. History is visible, and a new token will be created automatically when a new message is sent.
//                                 </div>
//                             )}

//                             <div className="p-3 flex items-end gap-2">
//                                 <div className="flex items-center gap-1 pb-1">
//                                     <button onClick={() => setShowEmoji(!showEmoji)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
//                                         {showEmoji ? <X size={20} /> : <Smile size={20} />}
//                                     </button>

//                                     <label className="p-2 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer">
//                                         <ImageIcon size={20} />
//                                         <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAttachMedia(e, 'image')} disabled={loading} />
//                                     </label>

//                                     <label className="p-2 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer">
//                                         <Film size={20} />
//                                         <input type="file" accept="video/*" className="hidden" onChange={(e) => handleAttachMedia(e, 'video')} disabled={loading} />
//                                     </label>
//                                 </div>

//                                 <textarea
//                                     className="flex-1 bg-white border border-slate-200 p-3 rounded-2xl outline-none resize-none max-h-32 text-sm text-slate-900 placeholder:text-slate-400 disabled:opacity-70 shadow-sm"
//                                     rows={1}
//                                     value={inputText}
//                                     onChange={(e) => setInputText(e.target.value)}
//                                     placeholder={pendingFile ? "Add a caption..." : "Type a message..."}
//                                     disabled={loading}
//                                     onKeyDown={(e) => {
//                                         if (e.key === 'Enter' && !e.shiftKey) {
//                                             e.preventDefault();
//                                             handleSendMessage();
//                                         }
//                                     }}
//                                 />

//                                 <button
//                                     onClick={handleSendMessage}
//                                     disabled={loading || (!inputText.trim() && !pendingFile)}
//                                     className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 transition-all flex-shrink-0 mb-0.5 shadow-sm"
//                                 >
//                                     {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
//                                 </button>
//                             </div>
//                         </div>
//                     </>
//                 )}
//             </div>
//         </div>
//     );
// }

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';
import uploadFile from '@/helpers/uploadFile';
import EmojiPicker from 'emoji-picker-react';
import {
    ArrowLeft,
    Send,
    Search,
    Check,
    CheckCheck,
    User,
    Smile,
    Image as ImageIcon,
    Film,
    X,
    Loader2,
    Clock3,
    MessageCircleMore,
    PanelLeft,
    RefreshCw
} from 'lucide-react';

const SHARED_INBOX_ID = 'SUPPORT_INBOX';

const formatLastMessage = (msg) => {
    if (!msg) return 'No messages yet';
    if (msg.text) return msg.text;
    if (msg.image?.imageUrl) return '📷 Photo';
    if (msg.video?.videoUrl) return '🎥 Video';
    return 'Attachment';
};

const formatTime = (dateValue) => {
    if (!dateValue) return '';
    return new Date(dateValue).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatDateLabel = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (a, b) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    if (sameDay(date, today)) return 'Today';
    if (sameDay(date, yesterday)) return 'Yesterday';

    return date.toLocaleDateString([], {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const StatusTicks = ({ status }) => {
    if (status === 'seen') {
        return <CheckCheck size={14} className="text-sky-400" />;
    }
    if (status === 'delivered') {
        return <CheckCheck size={14} className="text-slate-400" />;
    }
    return <Check size={14} className="text-slate-500" />;
};

const groupMessagesByDay = (messages) => {
    const grouped = [];

    for (const msg of messages) {
        const label = formatDateLabel(msg.createdAt);
        const lastGroup = grouped[grouped.length - 1];

        if (!lastGroup || lastGroup.label !== label) {
            grouped.push({
                label,
                items: [msg]
            });
        } else {
            lastGroup.items.push(msg);
        }
    }

    return grouped;
};

export default function AdminChatPage() {
    const { data: session } = useSession();
    const adminId = session?.user?.id;
    const { socket } = useSocket(session?.user?.accessToken);

    const [conversations, setConversations] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [activeUser, setActiveUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [pendingFile, setPendingFile] = useState(null);
    const [pendingPreviewUrl, setPendingPreviewUrl] = useState(null);
    const [pendingType, setPendingType] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [supportMeta, setSupportMeta] = useState({
        hasActiveSession: false,
        tokenId: null,
        expiresAt: null,
        canSend: true
    });

    const messagesEndRef = useRef(null);

    const refreshSidebar = () => {
        if (!socket) return;
        socket.emit('sidebar', SHARED_INBOX_ID);
    };

    useEffect(() => {
        if (!socket || !adminId) return;

        refreshSidebar();

        const handleConnect = () => {
            socket.emit('sidebar', SHARED_INBOX_ID);
            if (activeChatId) {
                socket.emit('message-page', activeChatId);
            }
        };

        const handleConversations = (data) => {
            const sortedData = [...data].sort(
                (a, b) => new Date(b.lastMsg?.createdAt || 0) - new Date(a.lastMsg?.createdAt || 0)
            );
            setConversations(sortedData);
        };

        socket.on('connect', handleConnect);
        socket.on('conversation', handleConversations);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('conversation', handleConversations);
        };
    }, [socket, adminId, activeChatId]);

    useEffect(() => {
        if (!socket) return;

        const handleMessageUser = (user) => setActiveUser(user);
        const handleAdminMessages = (msgs) => setMessages(msgs);
        const handleFallbackMessages = (msgs) => setMessages(msgs);
        const handleSupportMeta = (meta) => setSupportMeta(meta);

        socket.on('message-user', handleMessageUser);
        socket.on('admin-message', handleAdminMessages);
        socket.on('message', handleFallbackMessages);
        socket.on('support-chat-meta', handleSupportMeta);

        return () => {
            socket.off('message-user', handleMessageUser);
            socket.off('admin-message', handleAdminMessages);
            socket.off('message', handleFallbackMessages);
            socket.off('support-chat-meta', handleSupportMeta);
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        return () => {
            if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
        };
    }, [pendingPreviewUrl]);

    const activeConversation = useMemo(() => {
        return conversations.find((conv) => conv.userDetails?.id === activeChatId) || null;
    }, [conversations, activeChatId]);

    const filteredConversations = useMemo(() => {
        return conversations.filter((c) =>
            c.userDetails?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [conversations, searchQuery]);

    const groupedMessages = useMemo(() => groupMessagesByDay(messages), [messages]);

    const handleSelectChat = (userId) => {
        if (!socket) return;
        setActiveChatId(userId);
        setIsSidebarOpen(false);
        socket.emit('message-page', userId);
        clearPendingMedia();
    };

    const handleAttachMedia = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        setPendingFile(file);
        setPendingType(type);
        setPendingPreviewUrl(URL.createObjectURL(file));
        e.target.value = null;
    };

    const clearPendingMedia = () => {
        setPendingFile(null);
        setPendingType(null);
        if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
        setPendingPreviewUrl(null);
    };

    const handleSendMessage = async () => {
        if (!socket || !activeChatId) return;
        if (!inputText.trim() && !pendingFile) return;

        setLoading(true);

        try {
            let uploadedUrl = '';

            if (pendingFile) {
                uploadedUrl = await uploadFile(pendingFile);
                if (!uploadedUrl) throw new Error('Upload failed');
            }

            socket.emit('new-message', {
                sender: SHARED_INBOX_ID,
                receiver: activeChatId,
                text: inputText.trim(),
                ...(pendingType === 'image' && { image: uploadedUrl }),
                ...(pendingType === 'video' && { video: uploadedUrl }),
                msgByUserId: adminId
            });

            setInputText('');
            setShowEmoji(false);
            clearPendingMedia();
        } catch (error) {
            console.error('Failed to send message', error);
            alert('Failed to send media. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!session) return null;

    return (
        <div className="h-screen w-full overflow-hidden bg-[#0a0f1a] text-white">
            <div className="flex h-full">
                <div
                    className={`${activeChatId && !isSidebarOpen ? 'hidden md:flex' : 'flex'
                        } w-full md:w-[360px] lg:w-[420px] xl:w-[440px] flex-shrink-0 flex-col border-r border-white/10 bg-[#0f1726]`}
                >
                    <div className="border-b border-white/10 bg-gradient-to-r from-[#111827] via-[#0f1726] to-[#111827] px-4 py-4">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-white">
                                    Shared Support Inbox
                                </h1>
                                <p className="mt-1 text-xs text-slate-400">
                                    Monitor and reply to all support conversations
                                </p>
                            </div>

                            <button
                                onClick={refreshSidebar}
                                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                                title="Refresh inbox"
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>

                        <div className="relative">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                                size={18}
                            />
                            <input
                                type="text"
                                placeholder="Search conversations"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-[#0b1220] py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-sky-500/40 focus:ring-2 focus:ring-sky-500/10"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {filteredConversations.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                                <div className="mb-4 rounded-full bg-white/5 p-5">
                                    <MessageCircleMore size={32} className="text-slate-500" />
                                </div>
                                <p className="text-sm font-medium text-slate-300">
                                    No conversations found
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    New user messages will appear here automatically
                                </p>
                            </div>
                        ) : (
                            filteredConversations.map((conv) => {
                                const isUnread = conv.unreadCount > 0;
                                const isActive = activeChatId === conv.userDetails?.id;
                                const lastMsgBySupport =
                                    conv.lastMsg?.msgByUserId !== conv.userDetails?.id;
                                const hasActiveSession = conv.activeSession?.isActive;

                                return (
                                    <button
                                        key={conv._id}
                                        type="button"
                                        onClick={() => handleSelectChat(conv.userDetails?.id)}
                                        className={`w-full border-b border-white/5 px-4 py-3 text-left transition ${isActive
                                                ? 'bg-sky-500/10'
                                                : 'bg-transparent hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                                                {conv.userDetails?.profile_pic ? (
                                                    <img
                                                        src={conv.userDetails.profile_pic}
                                                        alt={conv.userDetails.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <User className="text-slate-500" size={22} />
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="mb-1 flex items-center justify-between gap-3">
                                                    <h3
                                                        className={`truncate text-[15px] ${isUnread
                                                                ? 'font-bold text-white'
                                                                : 'font-semibold text-slate-200'
                                                            }`}
                                                    >
                                                        {conv.userDetails?.name || 'Unknown User'}
                                                    </h3>

                                                    <div className="flex items-center gap-2">
                                                        {!hasActiveSession && (
                                                            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                                                                expired
                                                            </span>
                                                        )}
                                                        {conv.lastMsg && (
                                                            <span
                                                                className={`text-[11px] ${isUnread
                                                                        ? 'font-bold text-emerald-400'
                                                                        : 'text-slate-500'
                                                                    }`}
                                                            >
                                                                {formatTime(conv.lastMsg.createdAt)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex min-w-0 items-center gap-1.5">
                                                        {lastMsgBySupport && (
                                                            <StatusTicks status={conv.lastMsg?.status} />
                                                        )}

                                                        <p
                                                            className={`truncate text-sm ${isUnread
                                                                    ? 'font-medium text-slate-200'
                                                                    : 'text-slate-400'
                                                                }`}
                                                        >
                                                            {lastMsgBySupport ? 'Support: ' : ''}
                                                            {formatLastMessage(conv.lastMsg)}
                                                        </p>
                                                    </div>

                                                    {isUnread && (
                                                        <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5">
                                                            <span className="text-[10px] font-bold text-white">
                                                                {conv.unreadCount}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className={`${!activeChatId ? 'hidden md:flex' : 'flex'} min-w-0 flex-1 flex-col bg-[#060b14]`}>
                    {!activeChatId ? (
                        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                            <div className="mb-5 rounded-full border border-sky-500/20 bg-sky-500/10 p-6 shadow-[0_0_80px_rgba(14,165,233,0.12)]">
                                <Send size={38} className="ml-1 text-sky-400" />
                            </div>
                            <h2 className="text-2xl font-semibold text-white">BiteGo Admin Chat</h2>
                            <p className="mt-2 max-w-md text-sm text-slate-400">
                                Select a conversation from the inbox to start messaging users.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="flex h-20 items-center gap-3 border-b border-white/10 bg-[#0b1220]/95 px-4 backdrop-blur">
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="rounded-xl p-2 text-slate-400 transition hover:bg-white/5 hover:text-white md:hidden"
                                >
                                    <ArrowLeft size={22} />
                                </button>

                                <button
                                    onClick={() => setIsSidebarOpen((prev) => !prev)}
                                    className="hidden rounded-xl p-2 text-slate-400 transition hover:bg-white/5 hover:text-white md:inline-flex"
                                >
                                    <PanelLeft size={20} />
                                </button>

                                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                                    {activeUser?.profile_pic ? (
                                        <img
                                            src={activeUser.profile_pic}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <User className="text-slate-500" size={20} />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h2 className="truncate text-sm font-semibold text-white">
                                        {activeUser?.name || activeConversation?.userDetails?.name || 'Loading...'}
                                    </h2>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        {activeUser?.online ? 'Online now' : 'Offline'}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-1 text-xs text-slate-400">
                                        <Clock3 size={12} />
                                        <span>
                                            {supportMeta?.hasActiveSession ? 'Active token' : 'Expired token'}
                                        </span>
                                    </div>

                                    <div className="mt-1 text-[11px] text-slate-500">
                                        {supportMeta?.tokenId ? supportMeta.tokenId : 'No token'}
                                    </div>

                                    {supportMeta?.expiresAt && supportMeta?.hasActiveSession && (
                                        <div className="mt-0.5 text-[11px] text-slate-500">
                                            expires {formatTime(supportMeta.expiresAt)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div
                                className="flex-1 overflow-y-auto px-3 py-4 md:px-6"
                                style={{
                                    backgroundColor: '#060b14',
                                    backgroundImage:
                                        'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
                                    backgroundSize: '24px 24px'
                                }}
                            >
                                {groupedMessages.map((group) => (
                                    <div key={group.label}>
                                        <div className="sticky top-2 z-[1] mb-4 flex justify-center">
                                            <span className="rounded-full border border-white/10 bg-[#111827]/90 px-3 py-1 text-[11px] font-medium text-slate-300 shadow-sm backdrop-blur">
                                                {group.label}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            {group.items.map((msg, idx) => {
                                                const isSupportReply = msg.msgByUserId !== activeChatId;
                                                const sessionTag = msg.sessionTokenId || msg.tokenId || null;

                                                return (
                                                    <div
                                                        key={msg._id || `${group.label}-${idx}`}
                                                        className={`flex ${isSupportReply ? 'justify-end' : 'justify-start'
                                                            }`}
                                                    >
                                                        <div
                                                            className={`relative max-w-[88%] md:max-w-[72%] rounded-2xl px-3 py-2.5 shadow-lg ${isSupportReply
                                                                    ? 'rounded-tr-sm border border-sky-500/20 bg-gradient-to-br from-sky-500/15 to-cyan-500/10 text-slate-100'
                                                                    : 'rounded-tl-sm border border-white/10 bg-[#111827] text-slate-100'
                                                                }`}
                                                        >
                                                            {sessionTag && (
                                                                <div className="mb-2 inline-flex rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                                                                    {sessionTag}
                                                                </div>
                                                            )}

                                                            {msg.image?.imageUrl && (
                                                                <img
                                                                    src={msg.image.imageUrl}
                                                                    alt="attachment"
                                                                    className="mb-2 mt-1 max-h-72 w-full cursor-pointer rounded-xl object-cover"
                                                                    onClick={() => setPreviewImage(msg.image.imageUrl)}
                                                                />
                                                            )}

                                                            {msg.video?.videoUrl && (
                                                                <video
                                                                    src={msg.video.videoUrl}
                                                                    controls
                                                                    className="mb-2 mt-1 max-h-72 w-full rounded-xl"
                                                                />
                                                            )}

                                                            {msg.text && (
                                                                <p className="whitespace-pre-wrap break-words pr-10 text-[15px] leading-relaxed">
                                                                    {msg.text}
                                                                </p>
                                                            )}

                                                            <div className="mt-1 flex justify-end gap-1 text-[10px] text-slate-400">
                                                                <span>{formatTime(msg.createdAt)}</span>
                                                                {isSupportReply && (
                                                                    <StatusTicks status={msg.status} />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                <div ref={messagesEndRef} />
                            </div>

                            <div className="relative border-t border-white/10 bg-[#0b1220]">
                                {pendingPreviewUrl && (
                                    <div className="border-b border-white/10 bg-[#0f1726] p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-white/10 bg-black">
                                                {pendingType === 'image' ? (
                                                    <img
                                                        src={pendingPreviewUrl}
                                                        alt="preview"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <video
                                                        src={pendingPreviewUrl}
                                                        className="h-full w-full object-cover"
                                                    />
                                                )}
                                                <button
                                                    onClick={clearPendingMedia}
                                                    disabled={loading}
                                                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/80"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>

                                            <div className="flex-1 pt-1 text-sm text-slate-400">
                                                {loading
                                                    ? 'Uploading media...'
                                                    : `Add a caption to this ${pendingType}...`}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {showEmoji && (
                                    <div className="absolute bottom-full left-4 z-30 mb-2 overflow-hidden rounded-2xl shadow-2xl">
                                        <EmojiPicker
                                            onEmojiClick={(e) => setInputText((prev) => prev + e.emoji)}
                                            width={300}
                                            height={380}
                                            theme="dark"
                                        />
                                    </div>
                                )}

                                {!supportMeta?.hasActiveSession && (
                                    <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
                                        This token has expired. Previous history is still visible here.
                                        A new token will be created automatically when a new message is sent.
                                    </div>
                                )}

                                <div className="flex items-end gap-2 p-3 md:p-4">
                                    <div className="flex items-center gap-1 pb-1">
                                        <button
                                            onClick={() => setShowEmoji(!showEmoji)}
                                            className="rounded-xl p-2 text-slate-400 transition hover:bg-white/5 hover:text-sky-400"
                                        >
                                            {showEmoji ? <X size={20} /> : <Smile size={20} />}
                                        </button>

                                        <label className="cursor-pointer rounded-xl p-2 text-slate-400 transition hover:bg-white/5 hover:text-sky-400">
                                            <ImageIcon size={20} />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handleAttachMedia(e, 'image')}
                                                disabled={loading}
                                            />
                                        </label>

                                        <label className="cursor-pointer rounded-xl p-2 text-slate-400 transition hover:bg-white/5 hover:text-sky-400">
                                            <Film size={20} />
                                            <input
                                                type="file"
                                                accept="video/*"
                                                className="hidden"
                                                onChange={(e) => handleAttachMedia(e, 'video')}
                                                disabled={loading}
                                            />
                                        </label>
                                    </div>

                                    <textarea
                                        className="max-h-32 flex-1 resize-none rounded-2xl border border-white/10 bg-[#111827] p-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500/30 focus:ring-2 focus:ring-sky-500/10 disabled:opacity-70"
                                        rows={1}
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder={pendingFile ? 'Add a caption...' : 'Type a message...'}
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
                                        className="mb-0.5 flex-shrink-0 rounded-2xl bg-sky-500 p-3 text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400"
                                    >
                                        {loading ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : (
                                            <Send size={20} className="ml-0.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {previewImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
                    <button
                        onClick={() => setPreviewImage(null)}
                        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                    >
                        <X size={24} />
                    </button>

                    <img
                        src={previewImage}
                        alt="preview"
                        className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
                    />
                </div>
            )}
        </div>
    );
}