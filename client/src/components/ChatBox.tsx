import { useEffect, useState, useCallback } from "react";
import { useSocket } from "../hooks/useSocket";
import { useAuthStore } from "../store/useAuthStore";
import axiosInstance from "../api/axiosInstance";
import debounce from "lodash/debounce";

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
  const [inputText, setInputText] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await axiosInstance.get(`/rooms/${roomId}/messages`);
        setMessages(data);
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
    };

    fetchHistory();
  }, [roomId]);
  useEffect(() => {
    if (!socket) return;

    socket.on("receive-message", (newMessage: Message) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    socket.on("user-joined", (data) => {
      console.log(data.message);
    });

    socket.on("user-typing", (userName: string) => {
      setTypingUsers((prev) => {
        if (!prev.includes(userName)) return [...prev, userName];
        return prev;
      });
    });

    socket.on("user-stopped-typing", (userName: string) => {
      setTypingUsers((prev) => prev.filter((name) => name !== userName));
    });

    // Cleanup listeners
    return () => {
      socket.off("receive-message");
      socket.off("user-joined");
      socket.off("user-typing");
      socket.off("user-stopped-typing");
    };
  }, [socket]);

  // Typing emitter (debounced)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleTyping = useCallback(
    debounce(() => {
      socket?.emit("stop-typing", { roomId, userName: user?.name });
    }, 2000),
    [socket, roomId, user]
  );

  const onChangeText = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (socket && user) {
      socket.emit("typing", { roomId, userName: user.name });
      handleTyping();
    }
  };

  // Handle sending a message
  const sendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !user) return;

    socket.emit("send-message", {
      roomId,
      senderId: user._id,
      text: inputText,
    });

    setInputText("");
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent">
      {/* Chat History Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`flex ${msg.senderId._id === user?._id ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`p-3 rounded-2xl max-w-[85%] shadow-sm ${
                msg.senderId._id === user?._id 
                  ? "bg-indigo-600 text-white rounded-br-none" 
                  : "bg-neutral-800 text-neutral-200 rounded-bl-none border border-neutral-700/50"
              }`}
            >
              {msg.senderId._id !== user?._id && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  {msg.senderId.name}
                </span>
              )}
              <p className="text-sm tracking-wide leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Typing indicator */}
      <div className="min-h-[24px] px-4 py-1 text-xs text-indigo-400/80 italic">
        {typingUsers.length > 0 && (
          <span className="animate-pulse">
            {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
          </span>
        )}
      </div>

      {/* Input Area */}
      <form
        onSubmit={sendMessage}
        className="p-3 border-t border-neutral-800 bg-neutral-900 flex gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={onChangeText}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white placeholder-neutral-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white px-5 py-2.5 font-medium rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:shadow-none active:scale-95"
        >
          Send
        </button>
      </form>
    </div>
  );
};
