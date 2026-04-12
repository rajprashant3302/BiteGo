import React, { useState, useEffect, useRef, useMemo } from 'react';
import uploadFile from '@/helpers/uploadFile';
import EmojiPicker from 'emoji-picker-react';
import {
    Smile,
    Image as ImageIcon,
    Film,
    Send,
    X,
    Loader2,
    Check,
    CheckCheck,
    Clock3,
    Sparkles,
    MessageCircleHeart
} from 'lucide-react';

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

const StatusTicks = ({ status }) => {
    if (status === 'seen') {
        return <CheckCheck size={14} className="text-sky-200" />;
    }
    if (status === 'delivered') {
        return <CheckCheck size={14} className="text-orange-100/80" />;
    }
    return <Check size={14} className="text-orange-100/80" />;
};

const ChatWindow = ({ socket, receiverId, senderId }) => {
    const [message, setMessage] = useState('');
    const [allMessages, setAllMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [pendingFile, setPendingFile] = useState(null);
    const [pendingPreviewUrl, setPendingPreviewUrl] = useState(null);
    const [pendingType, setPendingType] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [supportMeta, setSupportMeta] = useState({
        hasActiveSession: false,
        tokenId: null,
        expiresAt: null,
        canSend: true
    });

    const scrollRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        socket.emit('message-page', receiverId);

        const handleNewMessage = (data) => {
            setAllMessages(Array.isArray(data) ? data : []);
        };

        const handleSupportMeta = (meta) => {
            setSupportMeta(meta || {});
        };

        socket.on('message', handleNewMessage);
        socket.on('support-chat-meta', handleSupportMeta);

        return () => {
            socket.off('message', handleNewMessage);
            socket.off('support-chat-meta', handleSupportMeta);
        };
    }, [socket, receiverId]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [allMessages]);

    useEffect(() => {
        return () => {
            if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
        };
    }, [pendingPreviewUrl]);

    const groupedMessages = useMemo(() => groupMessagesByDay(allMessages), [allMessages]);

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

    const handleSend = async (textPayload = null) => {
        const finalMsg = typeof textPayload === 'string' ? textPayload : message;

        if (!socket) return;
        if (!finalMsg.trim() && !pendingFile) return;

        setLoading(true);

        try {
            let uploadedUrl = '';

            if (pendingFile) {
                uploadedUrl = await uploadFile(pendingFile);
                if (!uploadedUrl) throw new Error('Upload failed');
            }

            socket.emit('new-message', {
                sender: senderId,
                receiver: receiverId,
                text: finalMsg.trim(),
                ...(pendingType === 'image' && { image: uploadedUrl }),
                ...(pendingType === 'video' && { video: uploadedUrl }),
                msgByUserId: senderId
            });

            setMessage('');
            setShowEmoji(false);
            clearPendingMedia();
        } catch (error) {
            console.error('Failed to send message', error);
            alert('Failed to send media. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const latestMsg = allMessages.length > 0 ? allMessages[allMessages.length - 1] : null;
    const showAiSuggestions =
        latestMsg &&
        latestMsg.msgByUserId !== senderId &&
        latestMsg.aiAnalysis?.suggestedReplies?.length > 0;

    return (
        <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50">
            <div className="border-b border-orange-100 bg-white/90 px-4 py-3 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-200">
                            <MessageCircleHeart size={20} />
                        </div>

                        <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-800">
                                BiteGo Support
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500">
                                Fast help for your issue
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="flex items-center justify-end gap-1 text-xs text-slate-500">
                            <Clock3 size={12} />
                            <span>
                                {supportMeta?.hasActiveSession ? 'Active token' : 'No active token'}
                            </span>
                        </div>

                        <div className="mt-0.5 text-[11px] text-orange-600">
                            {supportMeta?.tokenId ? supportMeta.tokenId : ''}
                        </div>

                        {supportMeta?.expiresAt && supportMeta?.hasActiveSession && (
                            <div className="text-[11px] text-slate-400">
                                expires {formatTime(supportMeta.expiresAt)}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {latestMsg &&
                latestMsg.msgByUserId !== senderId &&
                latestMsg.aiAnalysis?.sentiment && (
                    <div className="border-b border-orange-100 bg-gradient-to-r from-orange-100 to-amber-50 px-4 py-2 text-xs font-medium text-orange-700">
                        ✨ AI Insight: Support sees this chat as {latestMsg.aiAnalysis.sentiment}
                    </div>
                )}

            {!supportMeta?.hasActiveSession && (
                <div className="border-b border-orange-200 bg-orange-50 px-4 py-2 text-sm text-orange-700">
                    Previous token expired. Old messages are hidden for you. A new support token will be created automatically when you send a new message.
                </div>
            )}

            <div
                className="flex-1 overflow-y-auto px-3 py-4 md:px-4"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 1px 1px, rgba(251,146,60,0.08) 1px, transparent 0)',
                    backgroundSize: '22px 22px'
                }}
            >
                {groupedMessages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                        <div className="mb-4 rounded-full bg-orange-100 p-5 text-orange-500">
                            <MessageCircleHeart size={28} />
                        </div>
                        <p className="text-sm font-medium text-slate-700">
                            Start a new support conversation
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Send your message and we’ll connect you with support.
                        </p>
                    </div>
                ) : (
                    groupedMessages.map((group) => (
                        <div key={group.label}>
                            <div className="sticky top-2 z-[1] mb-4 flex justify-center">
                                <span className="rounded-full border border-orange-100 bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-500 shadow-sm backdrop-blur">
                                    {group.label}
                                </span>
                            </div>

                            <div className="space-y-4">
                                {group.items.map((msg, i) => {
                                    const isMine = msg.msgByUserId === senderId;

                                    return (
                                        <div
                                            key={msg._id || i}
                                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`relative flex max-w-[82%] flex-col rounded-2xl p-3 shadow-sm ${isMine
                                                        ? 'rounded-tr-sm bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange-200'
                                                        : 'rounded-tl-sm border border-orange-100 bg-white text-slate-800'
                                                    }`}
                                            >
                                                {msg.image?.imageUrl && (
                                                    <img
                                                        src={msg.image.imageUrl}
                                                        alt="attachment"
                                                        className="mb-2 max-h-72 cursor-pointer rounded-xl object-cover transition hover:opacity-95"
                                                        onClick={() => setPreviewImage(msg.image.imageUrl)}
                                                    />
                                                )}

                                                {msg.video?.videoUrl && (
                                                    <video
                                                        src={msg.video.videoUrl}
                                                        controls
                                                        className="mb-2 max-h-72 rounded-xl"
                                                    />
                                                )}

                                                {msg.text && (
                                                    <p className="whitespace-pre-wrap break-words pr-10 text-sm">
                                                        {msg.text}
                                                    </p>
                                                )}

                                                <div
                                                    className={`mt-1 flex justify-end gap-1 text-[10px] ${isMine ? 'text-orange-100' : 'text-slate-400'
                                                        }`}
                                                >
                                                    <span>{formatTime(msg.createdAt)}</span>
                                                    {isMine && <StatusTicks status={msg.status} />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}

                <div ref={scrollRef} />
            </div>

            {showAiSuggestions && !pendingFile && (
                <div className="absolute bottom-[78px] left-0 z-10 flex w-full gap-2 overflow-x-auto bg-gradient-to-t from-orange-50 to-transparent px-4 py-2">
                    {latestMsg.aiAnalysis.suggestedReplies.map((reply, index) => (
                        <button
                            key={index}
                            onClick={() => handleSend(reply)}
                            className="flex items-center gap-1 whitespace-nowrap rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-600 shadow-sm transition hover:bg-orange-50"
                        >
                            <Sparkles size={14} />
                            {reply}
                        </button>
                    ))}
                </div>
            )}

            {showEmoji && (
                <div className="absolute bottom-20 left-4 z-20 overflow-hidden rounded-2xl shadow-2xl">
                    <EmojiPicker
                        onEmojiClick={(e) => setMessage((prev) => prev + e.emoji)}
                        width={300}
                        height={380}
                    />
                </div>
            )}

            <div className="z-20 border-t border-orange-100 bg-white/95 backdrop-blur">
                {pendingPreviewUrl && (
                    <div className="border-b border-orange-100 bg-orange-50 p-4">
                        <div className="flex items-start gap-4">
                            <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-orange-100 bg-black">
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

                            <div className="flex-1 pt-1 text-sm text-slate-500">
                                {loading
                                    ? 'Uploading media...'
                                    : `Add a caption to this ${pendingType}...`}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-end gap-2 p-3">
                    <div className="flex items-center gap-1 pb-1">
                        <button
                            onClick={() => setShowEmoji(!showEmoji)}
                            className="rounded-xl p-2 text-slate-400 transition hover:bg-orange-50 hover:text-orange-600"
                        >
                            {showEmoji ? <X size={20} /> : <Smile size={20} />}
                        </button>

                        <label className="cursor-pointer rounded-xl p-2 text-slate-400 transition hover:bg-orange-50 hover:text-orange-600">
                            <ImageIcon size={20} />
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleAttachMedia(e, 'image')}
                                disabled={loading}
                            />
                        </label>

                        <label className="cursor-pointer rounded-xl p-2 text-slate-400 transition hover:bg-orange-50 hover:text-orange-600">
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
                        className="max-h-32 flex-1 resize-none rounded-2xl border border-orange-100 bg-orange-50 p-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 disabled:opacity-70"
                        rows={1}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={pendingFile ? 'Add a caption...' : 'Type your message...'}
                        disabled={loading}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />

                    <button
                        onClick={() => handleSend()}
                        disabled={loading || (!message.trim() && !pendingFile)}
                        className="mb-0.5 flex-shrink-0 rounded-2xl bg-orange-500 p-3 text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 disabled:bg-slate-300"
                    >
                        {loading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <Send size={20} />
                        )}
                    </button>
                </div>
            </div>

            {previewImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4">
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
};

export default ChatWindow;