import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { toast } from "react-hot-toast";

interface TimerProps {
  roomId: string;
  socket: Socket | null;
}

export const PomodoroTimer = ({ roomId, socket }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"focus" | "break">("focus");

  useEffect(() => {
    if (!socket) return;

    // Ask server for the current time when component mounts
    socket.emit("get-timer-state", roomId);

    // Listen for the every-second tick from the server
    socket.on("timer-update", (data) => {
      setTimeLeft(data.timeLeft);
      setIsRunning(data.isRunning);
      setMode(data.mode);
    });

    // Listen for the alarm
    socket.on("timer-done", (newMode) => {
      // Trigger sleek toast notification
      toast.success(
        `${newMode === "break" ? "Focus time is over! Take a break." : "Break is over! Time to focus."}`,
        { duration: 6000, icon: newMode === "break" ? '☕' : '🧠' }
      );
    });

    return () => {
      socket.off("timer-update");
      socket.off("timer-done");
    };
  }, [socket, roomId]);

  // Formatting helpers
  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border w-full max-w-sm mx-auto text-center">
      <h3 className="text-lg font-semibold text-gray-700 mb-2 capitalize">
        {mode} Session
      </h3>

      <div className="text-5xl font-mono font-bold text-blue-600 mb-6">
        {minutes}:{seconds}
      </div>

      <div className="flex justify-center gap-3">
        {!isRunning ? (
          <button
            onClick={() => socket?.emit("start-timer", { roomId })}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md font-medium transition"
          >
            Start
          </button>
        ) : (
          <button
            onClick={() => socket?.emit("pause-timer", { roomId })}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md font-medium transition"
          >
            Pause
          </button>
        )}

        <button
          onClick={() => socket?.emit("reset-timer", { roomId })}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md font-medium transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
};
