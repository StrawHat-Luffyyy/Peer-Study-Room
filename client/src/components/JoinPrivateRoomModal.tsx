import { useState } from "react";
import { X, Lock } from "lucide-react";

interface JoinPrivateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (accessCode: string) => void;
  roomName: string;
  isLoading: boolean;
}

export default function JoinPrivateRoomModal({ isOpen, onClose, onSubmit, roomName, isLoading }: JoinPrivateRoomModalProps) {
  const [accessCode, setAccessCode] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(accessCode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-400" />
            Private Room
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-neutral-400 mb-5">
            <span className="font-semibold text-white">{roomName}</span> requires an access code to join.
          </p>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Access Code</label>
            <input
              type="text"
              required
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-white outline-none"
              placeholder="Enter code"
              autoFocus
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !accessCode}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Joining..." : "Join"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
