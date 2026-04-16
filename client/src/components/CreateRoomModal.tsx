import { useState } from "react";
import { X, Lock, Unlock } from "lucide-react";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; topic: string; isPrivate: boolean; accessCode?: string }) => void;
  isLoading: boolean;
}

export default function CreateRoomModal({ isOpen, onClose, onSubmit, isLoading }: CreateRoomModalProps) {
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [accessCode, setAccessCode] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, topic, isPrivate, accessCode: isPrivate ? accessCode : undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-xl font-semibold text-white">Create Study Room</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Room Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-white outline-none"
              placeholder="e.g. Advanced Data Structures"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Topic</label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-white outline-none"
              placeholder="e.g. Computer Science"
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`flex items-center w-full p-3 rounded-lg border transition-all ${
                isPrivate 
                  ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400" 
                  : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
              }`}
            >
              {isPrivate ? <Lock className="w-5 h-5 mr-3" /> : <Unlock className="w-5 h-5 mr-3" />}
              <div className="text-left flex-1">
                <div className="font-medium text-sm">{isPrivate ? "Private Room" : "Public Room"}</div>
                <div className="text-xs opacity-70">
                  {isPrivate ? "Requires an access code to join" : "Anyone can join this room"}
                </div>
              </div>
            </button>
          </div>

          {isPrivate && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200 block">
              <label className="block text-sm font-medium text-neutral-300 mb-1">Access Code</label>
              <input
                type="text"
                required={isPrivate}
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-white outline-none"
                placeholder="Enter a secret code"
              />
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating..." : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
