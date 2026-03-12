import React, { useState, useEffect, useRef } from 'react';
import uploadFile from '@/helpers/uploadFile';

const ChatWindow = ({ socket, receiverId, senderId }) => {
    const [message, setMessage] = useState("");
    const [allMessages, setAllMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef();

    useEffect(() => {
        if (socket) {
            // Join the specific user chat page
            socket.emit('message-page', receiverId);

            // Listen for messages (Initial load + new messages)
            socket.on('message', (data) => {
                setAllMessages(data);
            });
        }
    }, [socket, receiverId]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [allMessages]);

    const handleSend = (textPayload = null) => {
        const finalMsg = textPayload || message;
        if (!finalMsg && !loading) return;

        socket.emit('new-message', {
            sender: senderId,
            receiver: receiverId,
            text: finalMsg,
            msgByUserId: senderId
        });
        setMessage("");
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {allMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.msgByUserId === senderId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
                            msg.msgByUserId === senderId ? 'bg-blue-600 text-white' : 'bg-white text-slate-800'
                        }`}>
                            {msg.text}
                            {msg.image?.imageUrl && <img src={msg.image.imageUrl} alt="upload" className="mt-2 rounded" />}
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            {/* AI SUGGESTED REPLIES */}
            {allMessages.length > 0 && allMessages[allMessages.length - 1].msgByUserId !== senderId && (
                <div className="px-4 py-2 flex gap-2 overflow-x-auto">
                    {allMessages[allMessages.length - 1].aiAnalysis?.suggestedReplies?.map((reply, index) => (
                        <button
                            key={index}
                            onClick={() => handleSend(reply)}
                            className="whitespace-nowrap bg-purple-100 text-purple-700 border border-purple-200 px-4 py-1 rounded-full text-sm hover:bg-purple-200 transition"
                        >
                            {reply}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white border-t flex gap-2">
                <input
                    className="flex-1 bg-slate-100 p-2 rounded-md outline-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button onClick={() => handleSend()} className="bg-blue-600 text-white px-6 py-2 rounded-md">
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatWindow;