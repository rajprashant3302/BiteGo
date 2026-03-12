import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (token) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        if (token) {
            const socketInstance = io(process.env.REACT_APP_BACKEND_URL, {
                auth: { token }
            });

            socketInstance.on('onlineUser', (data) => setOnlineUsers(data));
            setSocket(socketInstance);

            return () => socketInstance.disconnect();
        }
    }, [token]);

    return { socket, onlineUsers };
};