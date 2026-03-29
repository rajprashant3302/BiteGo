import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (token) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        if (token) {
            // ✅ Fix: Use NEXT_PUBLIC_ and provide a fallback for local dev
            const backendUrl = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:5003";
            
            const socketInstance = io(backendUrl, {
                auth: { token }
            });

            socketInstance.on('onlineUser', (data) => setOnlineUsers(data));
            setSocket(socketInstance);

            return () => socketInstance.disconnect();
        }
    }, [token]);

    return { socket, onlineUsers };
};