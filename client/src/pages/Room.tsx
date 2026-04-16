import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { ChatBox } from "../components/ChatBox";
import { PomodoroTimer } from "../components/PomodoroTimer";
import { CollaborativeEditor } from "../components/CollaborativeEditor";
import { getPublicRooms, type Room as RoomType } from "../api/roomService";

export default function Room() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const socket = useSocket(id as string);
  
  const [roomInfo, setRoomInfo] = useState<RoomType | null>(null);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);

  // We fetch the room info to display its title. We could use a specific GET /api/rooms/:id 
  // but since we only have getPublicRooms, we can look it up (or we can just show generic until a new API is added).
  useEffect(() => {
    // For now, an optimistic approach
    getPublicRooms().then((rooms) => {
      const current = rooms.find((r) => r._id === id);
      if (current) setRoomInfo(current);
    }).catch(console.error);
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    socket.on("room-users-update", (users) => {
      setActiveUsers(users);
    });
    return () => {
      socket.off("room-users-update");
    };
  }, [socket]);

  if (!id) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-800 p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 text-neutral-400 hover:text-white bg-neutral-800/50 hover:bg-neutral-800 rounded-lg transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                {roomInfo ? roomInfo.name : "Study Room"}
                {roomInfo?.isPrivate && <span className="px-2 py-0.5 mt-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-indigo-500/20 text-indigo-400">Private</span>}
              </h1>
              <p className="text-xs text-neutral-400 font-medium">
                {roomInfo ? roomInfo.topic : "Connecting..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center px-2 py-1 bg-neutral-800 rounded-lg border border-neutral-700">
              <Users className="w-4 h-4 text-emerald-400 mr-2 ml-1" />
              <div className="flex -space-x-2 mr-2">
                {activeUsers.map((u, i) => (
                  <div key={i} title={u.name} className="w-6 h-6 rounded-full bg-indigo-500 border border-neutral-800 flex items-center justify-center text-[10px] font-bold text-white z-10 relative">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
              <span className="text-xs font-medium text-neutral-300 pr-1">{activeUsers.length} Live</span>
            </div>
            <button className="p-2 text-neutral-400 hover:text-white bg-neutral-800/50 hover:bg-neutral-800 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        
        {/* Left Column: Editor & Timer */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl overflow-hidden p-6 relative">
             <PomodoroTimer roomId={id} socket={socket} />
          </div>

          <div className="flex-1 min-h-[500px]">
             {/* Note: the CollaborativeEditor currently has bright classes from before, we might want to let it manage its own style but it will work */}
             <CollaborativeEditor roomId={id} socket={socket} />
          </div>
        </div>

        {/* Right Column: ChatBox */}
        <div className="lg:col-span-4 flex flex-col h-[calc(100vh-120px)] lg:sticky lg:top-24">
          <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
             <div className="bg-neutral-800/50 p-4 border-b border-neutral-800 shrink-0">
               <h2 className="text-lg font-semibold text-white">Room Chat</h2>
               <p className="text-xs text-neutral-400">Discuss with peers</p>
             </div>
             
             <div className="flex-1 overflow-hidden relative contents-chatbox">
               <ChatBox roomId={id} />
             </div>
          </div>
        </div>

      </main>
    </div>
  );
}
