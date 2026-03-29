const Sidebar = ({ socket, currentUserId }) => {
    const [conversations, setConversations] = useState([]);

    useEffect(() => {
        if (socket) {
            socket.emit('sidebar', currentUserId);
            socket.on('conversation', (data) => {
                setConversations(data);
            });
        }
    }, [socket, currentUserId]);

    return (
        <div className="w-80 bg-white border-r h-full overflow-y-auto">
            <h2 className="p-4 text-xl font-bold border-b">Support Chats</h2>
            {conversations.map((conv, i) => (
                <div key={i} className="p-4 border-b hover:bg-slate-50 cursor-pointer">
                    <p className="font-semibold">{conv.userDetails?.Name}</p>
                    <p className="text-sm text-slate-500 truncate">{conv.lastMsg?.text}</p>
                </div>
            ))}
        </div>
    );
};