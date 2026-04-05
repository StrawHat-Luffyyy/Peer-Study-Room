import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/useAuthStore";

const SOCKET_URL = "http://localhost:5000";

export const useSocket = (roomId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    // Initialize the connection
    const socketInstance = io(SOCKET_URL);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(socketInstance);
    socketInstance.emit("join-room", roomId, user._id);
    return () => {
      socketInstance.emit("leave-room", roomId, user._id);
      socketInstance.disconnect();
    };
  }, [roomId, user]);

  return socket;
};
