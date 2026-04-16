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
    <div className="flex flex-col h-125 w-full max-w-md border rounded-lg shadow-sm bg-white">
      {/* Chat History Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`flex ${msg.senderId._id === user?._id ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`p-2 rounded-lg max-w-[80%] ${msg.senderId._id === user?._id ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"}`}
            >
              <span className="text-xs font-bold block mb-1">
                {msg.senderId.name}
              </span>
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-xs text-blue-500 italic animate-pulse bg-white">
          {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
        </div>
      )}

      {/* Input Area */}
      <form
        onSubmit={sendMessage}
        className="p-3 border-t bg-gray-50 flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={onChangeText}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
        >
          Send
        </button>
      </form>
    </div>
  );
};
