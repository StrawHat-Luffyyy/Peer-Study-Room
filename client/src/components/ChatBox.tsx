import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuthStore } from '../store/useAuthStore';
interface Message {
  _id: string;
  text: string;
  senderId: {
    _id: string;
    name: string;
    avatar: string;
  };
}

export const ChatBox = ({ roomId }: { roomId: string }) => {
  const socket = useSocket(roomId);
  const { user } = useAuthStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    socket.on('receive-message', (newMessage: Message) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    socket.on('user-joined', (data) => {
      console.log(data.message); // Could be used to show a toast notification
    });

    // Cleanup listeners
    return () => {
      socket.off('receive-message');
      socket.off('user-joined');
    };
  }, [socket]);

  // Handle sending a message
  const sendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !user) return;

    socket.emit('send-message', {
      roomId,
      senderId: user._id,
      text: inputText,
    });

    setInputText('');
  };

  return (
    <div className="flex flex-col h-125 w-full max-w-md border rounded-lg shadow-sm bg-white">
      {/* Chat History Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg) => (
          <div key={msg._id} className={`flex ${msg.senderId._id === user?._id ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-2 rounded-lg max-w-[80%] ${msg.senderId._id === user?._id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
              <span className="text-xs font-bold block mb-1">{msg.senderId.name}</span>
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="p-3 border-t bg-gray-50 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition">
          Send
        </button>
      </form>
    </div>
  );
};