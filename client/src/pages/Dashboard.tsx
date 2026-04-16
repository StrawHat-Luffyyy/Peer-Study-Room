import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Plus, Users, Hash, Lock, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { getPublicRooms, createRoom, joinRoom, type Room } from "../api/roomService";
import CreateRoomModal from "../components/CreateRoomModal";
import JoinPrivateRoomModal from "../components/JoinPrivateRoomModal";
import JoinByIdModal from "../components/JoinByIdModal";

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinByIdModalOpen, setJoinByIdModalOpen] = useState(false);
  const [selectedPrivateRoom, setSelectedPrivateRoom] = useState<Room | null>(null);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const data = await getPublicRooms();
      setRooms(data);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async (data: { name: string; topic: string; isPrivate: boolean; accessCode?: string }) => {
    try {
      setIsCreating(true);
      const newRoom = await createRoom(data);
      setCreateModalOpen(false);
      navigate(`/room/${newRoom._id}`);
    } catch (error) {
      console.error("Failed to create room:", error);
      toast.error("Failed to create room.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinClick = async (room: Room) => {
    if (room.isPrivate) {
      setSelectedPrivateRoom(room);
      setJoinModalOpen(true);
      return;
    }

    try {
      await joinRoom(room._id);
      navigate(`/room/${room._id}`);
    } catch (error: any) {
      if (error.response?.data?.message === "You are already in this room") {
        navigate(`/room/${room._id}`);
      } else {
        console.error("Failed to join room:", error);
        toast.error(error.response?.data?.message || "Failed to join room.");
      }
    }
  };

  const handleJoinPrivateSubmit = async (accessCode: string) => {
    if (!selectedPrivateRoom) return;
    try {
      setIsJoining(true);
      await joinRoom(selectedPrivateRoom._id, accessCode);
      setJoinModalOpen(false);
      navigate(`/room/${selectedPrivateRoom._id}`);
    } catch (error: any) {
      console.error("Failed to join private room:", error);
      toast.error(error.response?.data?.message || "Invalid access code.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinByIdSubmit = async (roomId: string, accessCode: string) => {
    try {
      setIsJoining(true);
      await joinRoom(roomId, accessCode);
      setJoinByIdModalOpen(false);
      navigate(`/room/${roomId}`);
    } catch (error: any) {
      console.error("Failed to join room by ID:", error);
      if (error.response?.data?.message === "You are already in this room") {
        navigate(`/room/${roomId}`);
      } else {
        toast.error(error.response?.data?.message || "Invalid room ID or access code.");
      }
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1/3 h-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="z-10 mb-4 md:mb-0">
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Hash className="text-white w-5 h-5" />
              </span>
              Peer Study Room
            </h1>
            <p className="text-neutral-400 mt-2">Welcome back, {user?.name || "Student"}! Ready to focus?</p>
          </div>
          <div className="flex items-center gap-4 z-10 w-full md:w-auto justify-end">
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4 cursor-pointer" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
            <button
              onClick={() => setJoinByIdModalOpen(true)}
              className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium rounded-lg border border-neutral-700 transition-all flex items-center gap-2"
            >
              <Hash className="w-5 h-5" />
              <span className="hidden sm:inline">Join with ID</span>
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Create Room</span>
            </button>
          </div>
        </header>

        {/* Room List Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Available Rooms
            </h2>
            <button 
              onClick={fetchRooms}
              className="p-2 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 rounded-lg transition-colors hover:bg-neutral-800"
              title="Refresh Rooms"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 bg-neutral-900 border border-neutral-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-20 bg-neutral-900 border border-neutral-800 rounded-2xl">
              <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-neutral-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No public rooms available</h3>
              <p className="text-neutral-400 mb-6 max-w-sm mx-auto">Create a new study room or use a private access code to join an existing one.</p>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium rounded-lg border border-neutral-700 transition-all"
              >
                Create the first room
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {rooms.map((room) => {
                const creatorName = typeof room.createdBy === 'object' ? room.createdBy.name : 'Unknown';
                return (
                  <div key={room._id} className="group bg-neutral-900 border border-neutral-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg transition-all hover:shadow-indigo-500/10 flex flex-col h-full hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg text-white truncate pr-2">{room.name}</h3>
                      {room.isPrivate ? (
                        <div className="bg-neutral-800 p-1.5 rounded-md text-amber-400" title="Private Room">
                          <Lock className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="bg-neutral-800 px-2 py-1 rounded-md text-xs font-medium text-emerald-400">Public</div>
                      )}
                    </div>
                    
                    <div className="text-sm font-medium text-indigo-400 mb-4 inline-flex px-2 py-1 bg-indigo-500/10 rounded-md w-fit">
                      {room.topic}
                    </div>

                    <div className="mt-auto space-y-4">
                      <div className="flex items-center text-sm text-neutral-400">
                        <Users className="w-4 h-4 mr-2 text-neutral-500" />
                        {room.members.length} member{room.members.length !== 1 ? 's' : ''}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                        <div className="text-xs text-neutral-500 truncate">
                          Created by <span className="text-neutral-300">{creatorName}</span>
                        </div>
                        <button
                          onClick={() => handleJoinClick(room)}
                          className="px-4 py-1.5 text-sm font-medium bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg transition-all"
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <CreateRoomModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateRoom}
        isLoading={isCreating}
      />
      
      {selectedPrivateRoom && (
        <JoinPrivateRoomModal
          isOpen={joinModalOpen}
          onClose={() => {
            setJoinModalOpen(false);
            setSelectedPrivateRoom(null);
          }}
          onSubmit={handleJoinPrivateSubmit}
          roomName={selectedPrivateRoom.name}
          isLoading={isJoining}
        />
      )}

      <JoinByIdModal
        isOpen={joinByIdModalOpen}
        onClose={() => setJoinByIdModalOpen(false)}
        onSubmit={handleJoinByIdSubmit}
        isLoading={isJoining}
      />
    </div>
  );
}
