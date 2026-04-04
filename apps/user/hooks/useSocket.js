import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (token) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        if (token) {
            const backendUrl = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || undefined;
            const socketPath = process.env.NEXT_PUBLIC_CHAT_SOCKET_PATH || "/chat-socket.io";

            const socketInstance = io(backendUrl, {
                path: socketPath,
                auth: { token }
            });

            socketInstance.on('onlineUser', (data) => setOnlineUsers(data));
            setSocket(socketInstance);

            return () => socketInstance.disconnect();
        }
    }, [token]);

    return { socket, onlineUsers };
};
