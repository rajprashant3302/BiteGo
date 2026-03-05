import ChatMessages from "./ChatMessages";

export default function ChatMePage() {
  return (
    <main className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-3xl">
        <ChatMessages />
      </div>
    </main>
  );
}