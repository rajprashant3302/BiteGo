// export default SupportIcon;
import React, { useState } from 'react';
import { BiSupport } from 'react-icons/bi';
import { IoClose } from 'react-icons/io5';
import ChatWindow from './ChatWindow';

const SupportIcon = ({ socket, senderId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const supportAdminId = 'SUPPORT_INBOX';

    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end sm:bottom-6 sm:right-6">
            {isOpen && (
                <div className="mb-4 h-[78vh] w-[calc(100vw-24px)] max-w-[390px] overflow-hidden rounded-[28px] border border-orange-200 bg-white shadow-[0_24px_80px_rgba(249,115,22,0.22)] animate-in fade-in slide-in-from-bottom-4 duration-300 sm:h-[620px]">
                    <ChatWindow
                        socket={socket}
                        senderId={senderId}
                        receiverId={supportAdminId}
                    />
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group flex items-center justify-center rounded-full p-4 text-white shadow-xl transition-all duration-300 hover:scale-110 ${isOpen
                        ? 'bg-orange-600 shadow-orange-300'
                        : 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_16px_40px_rgba(249,115,22,0.45)]'
                    }`}
                title={isOpen ? 'Close support chat' : 'Open support chat'}
            >
                {isOpen ? (
                    <IoClose size={28} />
                ) : (
                    <BiSupport size={28} className="drop-shadow-sm" />
                )}
            </button>
        </div>
    );
};

export default SupportIcon;