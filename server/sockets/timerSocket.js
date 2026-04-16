const activeTimers = {};

const FOCUS_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

const timerSocket = (io) => {
  io.on("connection", (socket) => {
    socket.on("get-timer-state", (roomId) => {
      if (activeTimers[roomId]) {
        socket.emit("timer-update", activeTimers[roomId]);
      } else {
        // Send default state if no timer exists yet
        socket.emit("timer-update", {
          timeLeft: FOCUS_TIME,
          isRunning: false,
          mode: "focus",
        });
      }
    });

    socket.on("start-timer", ({ roomId }) => {
      if (!activeTimers[roomId]) {
        activeTimers[roomId] = {
          timeLeft: FOCUS_TIME,
          isRunning: false,
          mode: "focus",
          intervalId: null,
          endTime: null,
        };
      }

      const timer = activeTimers[roomId];
      if (timer.isRunning) return;

      timer.isRunning = true;
      timer.endTime = Date.now() + timer.timeLeft * 1000;

      timer.intervalId = setInterval(() => {
        const remainingStr = Math.round((timer.endTime - Date.now()) / 1000);
        timer.timeLeft = Math.max(0, remainingStr);

        io.to(roomId).emit("timer-update", {
          timeLeft: timer.timeLeft,
          isRunning: timer.isRunning,
          mode: timer.mode,
        });

        if (timer.timeLeft <= 0) {
          clearInterval(timer.intervalId);
          timer.isRunning = false;
          timer.mode = timer.mode === "focus" ? "break" : "focus";
          timer.timeLeft = timer.mode === "focus" ? FOCUS_TIME : BREAK_TIME;

          io.to(roomId).emit("timer-done", timer.mode);
          io.to(roomId).emit("timer-update", {
            timeLeft: timer.timeLeft,
            isRunning: timer.isRunning,
            mode: timer.mode,
          });
        }
      }, 1000);
    });

    socket.on("pause-timer", ({ roomId }) => {
      const timer = activeTimers[roomId];
      if (timer && timer.isRunning) {
        clearInterval(timer.intervalId);
        timer.isRunning = false;
        io.to(roomId).emit("timer-update", {
          timeLeft: timer.timeLeft,
          isRunning: timer.isRunning,
          mode: timer.mode,
        });
      }
    });

    socket.on("reset-timer", ({ roomId }) => {
      const timer = activeTimers[roomId];
      if (timer) {
        clearInterval(timer.intervalId);
        timer.timeLeft = timer.mode === "focus" ? FOCUS_TIME : BREAK_TIME;
        timer.isRunning = false;
        io.to(roomId).emit("timer-update", {
          timeLeft: timer.timeLeft,
          isRunning: timer.isRunning,
          mode: timer.mode,
        });
      }
    });

    socket.on("disconnecting", () => {
      // Loop through all rooms the socket is leaving
      socket.rooms.forEach((roomId) => {
        if (roomId !== socket.id && activeTimers[roomId]) {
          // If this is the last person in the room leaving
          const room = io.sockets.adapter.rooms.get(roomId);
          if (room && room.size <= 1) {
             const timer = activeTimers[roomId];
             if (timer && timer.isRunning) {
                clearInterval(timer.intervalId);
                timer.isRunning = false;
             }
          }
        }
      });
    });
  });
};

export default timerSocket;
