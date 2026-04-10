// import { useEffect, useState } from 'react';
// import { io } from 'socket.io-client';

// export const useSocket = (token) => {
//     const [socket, setSocket] = useState(null);
//     const [onlineUsers, setOnlineUsers] = useState([]);

//     useEffect(() => {
//         if (!token) return;

//         const backendUrl = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:5003";

//         const socketInstance = io(backendUrl, {
//             auth: { token },
//             transports: ['websocket', 'polling']
//         });

//         socketInstance.on('onlineUser', (data) => setOnlineUsers(data));
//         setSocket(socketInstance);

//         return () => {
//             socketInstance.disconnect();
//         };
//     }, [token]);

//     return { socket, onlineUsers };
// };
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (token) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        if (!token) return;

        const backendUrl =
            process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || 'http://localhost:5003';

        const socketInstance = io(backendUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000
        });

        socketInstance.on('onlineUser', (data) => setOnlineUsers(data || []));
        setSocket(socketInstance);

        return () => {
            socketInstance.removeAllListeners();
            socketInstance.disconnect();
            setSocket(null);
            setOnlineUsers([]);
        };
    }, [token]);

    return { socket, onlineUsers };
};