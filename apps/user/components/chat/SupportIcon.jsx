import React, { useState } from 'react';
import { BiSupport } from 'react-icons/bi';
import { IoClose } from 'react-icons/io5';
import ChatWindow from './ChatWindow'; // The component we created earlier

const SupportIcon = ({ socket, senderId }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // In a real support app, the receiverId is usually a fixed "Admin" or "Support" ID
    const supportAdminId = "SUPPORT_AGENT_PRISMA_ID"; 

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            
            {/* The Chat Window Popup */}
            {isOpen && (
                <div className="mb-4 w-[350px] h-[500px] shadow-2xl rounded-2xl overflow-hidden border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                        <span className="font-semibold">Customer Support</span>
                        <button onClick={() => setIsOpen(false)}><IoClose size={20}/></button>
                    </div>
                    <ChatWindow 
                        socket={socket} 
                        senderId={senderId} 
                        receiverId={supportAdminId} 
                    />
                </div>
            )}

            {/* The Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${
                    isOpen ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'
                }`}
            >
                {isOpen ? <IoClose size={28} /> : <BiSupport size={28} />}
            </button>
        </div>
    );
};

export default SupportIcon;