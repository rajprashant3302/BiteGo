import React, { useState, useEffect, useRef } from 'react';
import uploadFile from '@/helpers/uploadFile';
import EmojiPicker from 'emoji-picker-react';
import { Smile, Image as ImageIcon, Film, Send, X, Loader2 } from 'lucide-react';

const ChatWindow = ({ socket, receiverId, senderId }) => {
    const [message, setMessage] = useState("");
    const [allMessages, setAllMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    
    // NEW: States to hold media before it is sent
    const [pendingFile, setPendingFile] = useState(null);
    const [pendingPreviewUrl, setPendingPreviewUrl] = useState(null);
    const [pendingType, setPendingType] = useState(null);

    const scrollRef = useRef();

    useEffect(() => {
        if (!socket) return;

        socket.emit('message-page', receiverId);

        const handleNewMessage = (data) => {
            setAllMessages(data);
        };

        socket.on('message', handleNewMessage);

        return () => {
            socket.off('message', handleNewMessage);
        };
    }, [socket, receiverId]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [allMessages]);

    // Handle File Selection (Show Preview instead of uploading immediately)
    const handleAttachMedia = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        setPendingFile(file);
        setPendingType(type);
        setPendingPreviewUrl(URL.createObjectURL(file)); // Create local preview URL
        
        // Reset the input value so the same file can be selected again if cancelled
        e.target.value = null; 
    };

    // Cancel pending media
    const clearPendingMedia = () => {
        setPendingFile(null);
        setPendingType(null);
        if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
        setPendingPreviewUrl(null);
    };

    // Handle Send (Text, Media, or Both)
    const handleSend = async (textPayload = null) => {
        const finalMsg = typeof textPayload === 'string' ? textPayload : message;
        
        // Don't send if empty AND no file is attached
        if (!finalMsg.trim() && !pendingFile) return;

        setLoading(true);

        try {
            let uploadedUrl = "";
            
            // If there's a file, upload it first
            if (pendingFile) {
                uploadedUrl = await uploadFile(pendingFile);
                if (!uploadedUrl) throw new Error("Upload failed");
            }

            // Emit the message payload
            socket.emit('new-message', {
                sender: senderId,
                receiver: receiverId,
                text: finalMsg.trim(), // This acts as the text message OR the caption
                ...(pendingType === 'image' && { image: uploadedUrl }),
                ...(pendingType === 'video' && { video: uploadedUrl }),
                msgByUserId: senderId
            });

            // Clean up UI after successful send
            setMessage("");
            setShowEmoji(false);
            clearPendingMedia();

        } catch (error) {
            console.error("Failed to send message", error);
            alert("Failed to send media. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const latestMsg = allMessages.length > 0 ? allMessages[allMessages.length - 1] : null;
    const showAiSuggestions = latestMsg && latestMsg.msgByUserId !== senderId && latestMsg.aiAnalysis?.suggestedReplies?.length > 0;

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            
            {latestMsg && latestMsg.msgByUserId !== senderId && latestMsg.aiAnalysis?.sentiment && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 px-4 py-2 flex items-center justify-between text-xs font-medium text-blue-800">
                    <span>✨ AI Insight: User seems {latestMsg.aiAnalysis.sentiment}</span>
                </div>
            )}

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
                {allMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.msgByUserId === senderId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm flex flex-col ${
                            msg.msgByUserId === senderId 
                                ? 'bg-blue-600 text-white rounded-tr-sm' 
                                : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm'
                        }`}>
                            
                            {/* Render Image first if it exists */}
                            {msg.image?.imageUrl && (
                                <img 
                                    src={msg.image.imageUrl} 
                                    alt="attachment" 
                                    className="rounded-xl max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity mb-2" 
                                    onClick={() => window.open(msg.image.imageUrl, '_blank')}
                                />
                            )}

                            {/* Render Video first if it exists */}
                            {msg.video?.videoUrl && (
                                <video 
                                    src={msg.video.videoUrl} 
                                    controls 
                                    className="rounded-xl max-h-60 mb-2" 
                                />
                            )}
                            
                            {/* Render Text/Caption underneath the media */}
                            {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            {/* AI SUGGESTED REPLIES */}
            {showAiSuggestions && !pendingFile && (
                <div className="absolute bottom-[72px] left-0 w-full px-4 py-2 bg-gradient-to-t from-slate-50 to-transparent flex gap-2 overflow-x-auto hide-scrollbar z-10">
                    {latestMsg.aiAnalysis.suggestedReplies.map((reply, index) => (
                        <button
                            key={index}
                            onClick={() => handleSend(reply)}
                            className="whitespace-nowrap bg-white text-blue-600 border border-blue-200 shadow-sm px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-50 transition-colors flex items-center gap-1"
                        >
                            ✨ {reply}
                        </button>
                    ))}
                </div>
            )}

            {/* Emoji Picker Popover */}
            {showEmoji && (
                <div className="absolute bottom-20 left-4 z-20 shadow-2xl rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    <EmojiPicker 
                        onEmojiClick={(e) => setMessage(prev => prev + e.emoji)} 
                        width={300} 
                        height={400} 
                    />
                </div>
            )}

            {/* Input & Preview Area */}
            <div className="bg-white border-t border-slate-200 z-20 flex flex-col">
                
                {/* 🌟 NEW: PENDING MEDIA PREVIEW 🌟 */}
                {pendingPreviewUrl && (
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-start gap-4">
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden shadow-sm border border-slate-200 bg-black">
                            {pendingType === 'image' ? (
                                <img src={pendingPreviewUrl} alt="preview" className="w-full h-full object-cover" />
                            ) : (
                                <video src={pendingPreviewUrl} className="w-full h-full object-cover" />
                            )}
                            {/* Cancel Button */}
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

                {/* Input Controls */}
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
                        className="flex-1 bg-slate-100 p-3 rounded-2xl outline-none resize-none max-h-32 text-sm disabled:opacity-70"
                        rows={1}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={pendingFile ? "Add a caption..." : "Type a message..."}
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
                        className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 transition-all flex-shrink-0 mb-0.5"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </div>
            </div>
            
        </div>
    );
};

export default ChatWindow;