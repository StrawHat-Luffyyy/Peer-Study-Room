# Peer Study Room

A scalable, real-time collaborative platform engineered for distributed focus sessions. Users can synchronize Pomodoro intervals, architect collaborative documentation, and communicate in isolated, secure topic-based channels via persistent WebSockets.


## Features

- Stateless JWT authentication with secure password derivation.
- Segregated study environments via standard mapping or encrypted Access Codes.
- Real-time persistent Chat system utilizing Socket.io broadcasting.
- Collaborative rich-text note editor buffering live HTML synchronizations.
- Authoritative Node.js Pomodoro timer immune to browser clock-throttling and event-loop drift.
- Live participant Presence Engine managing connected socket states.
- High-performance UI powered by raw CSS and Tailwind utilities mapping to React Router paths.

---

## Tech Stack

| Domain | Technology | Purpose |
| ------ | ---------- | ------- |
| **Frontend UI** | React 19 + TypeScript | Component rendering and type safety |
| **Frontend Styling** | Tailwind CSS v4 | High-performance CSS utility generation |
| **Global State** | Zustand | Managing JWT cache and UI primitives |
| **Backend Core** | Node.js + Express | REST routing and middleware orchestration |
| **Real-time Pipeline** | Socket.io | Bi-directional streaming for editor and chat data |
| **Database** | MongoDB + Mongoose | Persistence layer for Room, User, and Note schemas |
| **Security** | JSON Web Tokens + bcrypt | Salted credential verification and session validation |
| **Text Editor** | TipTap | Headless ProseMirror wrapper for extensible text manipulation |

---

## System Architecture

The project operates under a hybrid protocol model, separating structural data loading from rapid interactivity. 

**Request-Response Flow (REST):** 
Core lifecycle events such as Authentication, Room Initialization, and initial data mounting (loading chat histories or note snapshots) are processed synchronously through Express routers over standard HTTP. This allows native browser caching and rigid JWT bearer validation via middleware closures before expensive socket resources are allocated.

**Event-Driven Flow (WebSockets):**
Once a user successfully negotiates entry into a room via REST, a singular bi-directional WebSocket connection opens. The connection multiplexes three separate logic domains—Timers, Editor, and Chat—over a unified active Socket instance. 

Data propagates in an **Authoritative Server** matrix. Clients are thin; they compute no timing calculations and process no state merges. Key presses and button triggers are simply dispatched generically to the Node.js event broker, which calculates the absolute truth and reflects the required DOM updates universally across subscribing rooms. 

---

## Detailed Walkthrough

### Authentication Flow
1. A client submits credentials to the REST API (`/api/auth/login` or `register`).
2. Express pipes the request body through validation logic. If registering, the Mongoose `User` schema intercepts the save utilizing a `pre-save` hook to inject cryptographic salts via `bcrypt` before storing.
3. The server generates a signed JSON Web Token holding the user's `_id` and dispatches it in the HTTP JSON response.
4. Zustand (Frontend State) catches this response, securely indexing the token and forcing a `<PrivateRoute>` reconciliation, seamlessly mounting the Dashboard component.

### Room Flow
1. Users instruct the `roomController` to mount either a `Public` or `Private` schema configuration. Private rooms enforce `accessCode` strict-equality checks.
2. The Database pushes the user's schema `ObjectId` into the target Room's `members` array.
3. Upon entering the UI route `/room/:id`, React mounts `useSocket`. The client establishes a TCP connection, immediately emitting a `join-room` payload consisting of its JWT-derived user object.

### Real-Time Chat Flow
1. **Connection Logic:** The backend `chatSocket` executes `socket.join(roomId)`. Socket.io abstracts this via internal memory adapters, binding the socket instance exclusively to that namespace.
2. **Broadcast Hierarchy:** Dispatched messages bundle `roomId`, `senderId`, and `text`. Node explicitly targets `io.to(roomId).emit(...)`, guaranteeing isolation from other concurrent study instances.
3. **Persistence Overlay:** Prior to emitting the volatile payload, the socket awaits a Mongoose `Message.create` query, permanently cementing the string against the persistent database to guarantee data is preserved for users who join later.

### Collaborative Notes Flow
1. **Initial Mount:** Because WebSocket state changes mid-frame, the editor requires an anchor. When `<CollaborativeEditor>` mounts, it queries `GET /api/rooms/:id/note` to fetch the authoritative database state.
2. **Delta Broadcasting:** TipTap invokes `onUpdate` listeners on keystroke. The raw HTML string is bridged immediately out of the Web Worker pool and blasted through `editorSocket`.
3. **Database Debouncing:** Persisting database rows per-keystroke results in extreme IO saturation. TipTap logic utilizes a `lodash` `debounce` wrapper, suppressing `save-document` execution until a distinct 2000ms pause in user typing is observed, at which time an upsert pipeline executes against the MongoDB `Note` collection.

### Pomodoro Timer Flow (CRITICAL)
A common pitfall with client-side JavaScript timers is aggressive browser throttling (when tabs run in the background). This architecture sidesteps that constraint via Server-Authority computations.

1. **Instantiation:** Upon clicking `Start`, the Node.js array initializes `activeTimers[roomId]`. 
2. **Absolute Time Computance:** Rather than recursively decrementing an integer via `setInterval`, the server extrapolates a terminus timestamp: `endTime = Date.now() + duration`.
3. **Drift-proof Processing:** The interval triggers asynchronously, evaluating `Math.max(0, Math.round((endTime - Date.now()) / 1000))`. This absolute time differential explicitly guarantees zero drift regardless of Node.js event-loop congestion or garbage collection pauses.
4. **Client Sync:** The `timer-update` listener feeds dumb UI components the exact seconds remaining, shifting phases dynamically on zero without client interaction.

### Presence & Typing System
1. **Global Roster Caching:** To prevent intense aggregate database queries on every socket connection, `chatSocket.js` maintains an in-memory dictionary natively handling arrays of `roomUsers`.
2. **State Cleanup:** A `disconnecting` lifecycle hook automatically purges the specific `<Socket.id>` originating the closure across all traversed arrays, instantly purging their Avatar node out of the `Room.tsx` UI tree.
3. **Throttled Keyboards:** Similar to the Note Flow, generic key-down events trigger `typing` arrays. `ChatBox.tsx` utilizes `lodash` strictly for the teardown sequence, meaning the "User is typing..." overlay smoothly animates and vanishes dynamically.

---

## Folder Structure

```text
peer-study-room/
├── client/                     # React Frontend Environment
│   ├── src/
│   │   ├── api/                # HTTP Axios Instances & Fetch wrappers
│   │   ├── components/         # Reusable presentation views
│   │   ├── hooks/              # Native Socket connection pooling
│   │   ├── pages/              # React Router DOM mounting indices
│   │   └── store/              # Zustand global storage slices
│   └── package.json
└── server/                     # Node.js Server Environment
    ├── controllers/            # Express business logic
    ├── middlewares/            # JWT barricades & error formatting
    ├── models/                 # Secure Mongoose schema descriptors
    ├── routes/                 # Express network maps
    ├── sockets/                # Modular WebSocket namespaces
    └── server.js               # Entry script & connection bootloader
```

---

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/StrawHat-Luffyyy/peer-study-room.git
   cd peer-study-room
   ```

2. **Backend Configuration:**
   Navigate into the `/server` directory and install runtime dependencies:
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file at the root of `/server` based on the configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/peer-study-room
   JWT_SECRET=super_secret_override_token_99
   ```
   Start the Node server:
   ```bash
   npm run dev
   ```

3. **Frontend Configuration:**
   Navigate into the `/client` directory and install build dependencies:
   ```bash
   cd client
   npm install
   ```
   Start the Vite compilation engine:
   ```bash
   npm run dev
   ```
   Application will be visible at `http://localhost:5173`.

---

## API Endpoints

### Authentication
- `POST /api/auth/register`: Generate a new user schema and yield a token.
- `POST /api/auth/login`: Evaluate submitted credentials against bcrypt hashes.

### Rooms
- `GET /api/rooms`: Scan and output all unprotected, public room clusters.
- `POST /api/rooms`: Provision a new localized Namespace instance.
- `POST /api/rooms/:id/join`: Analyze access code validity against private schematics.
- `GET /api/rooms/:id/messages`: Extract Chat history array bounded to the specific origin room.
- `GET /api/rooms/:id/note`: Return unified HTML Note markup snapshot.

---

## Socket Events

### Chat Network (`chatSocket.js`)
- `join-room`: Emitted by client. Triggers namespace isolation and updates Roster.
- `send-message`: Submits strings for database logging and pipeline broadcasting.
- `receive-message`: Injected into UI message array by target browsers.
- `typing` / `stop-typing`: Relays boolean animation states.
- `room-users-update`: Pushes Roster array changes to the UI Avatar stack.

### Editor Network (`editorSocket.js`)
- `send-changes`: Immediate HTML markup transmission bypassing REST delays.
- `receive-changes`: Instructs ProseMirror engine to mutate cursor output.
- `save-document`: Throttled database mutation request.

### Timer Network (`timerSocket.js`)
- `get-timer-state`: Request initial state payload if attaching late.
- `start-timer` / `pause-timer` / `reset-timer`: Control protocol hooks.
- `timer-update`: High-frequency broadcast triggering numeric UI re-renders.
- `timer-done`: Alarm trigger sequence.


## Future Improvements

- **Yjs (CRDT Protocol):** The current tip-tap integration utilizes generic HTML overwrites. Scaling the application necessitates discarding `send-changes` and attaching `y-webrtc` or a dedicated Hocuspocus backend to execute true Operation Transformations that handle deep cursor-conflict tracking.
- **Redis Multiplexing:** Storing `activeTimers` and `roomUsers` natively within V8 memory prohibits horizontal pipeline scaling. Connecting the `socket.io-redis` adapter preserves instance state universally.
- **Horizontal Pod Scaling:** Upon migrating memory into a Redis boundary cache, configuring NGINX or AWS Elastic Load Balancing with sticky sessions enables boundless node instantiation.

---

## Author 
Developed by `Krish Macwan, Namya Patel, Purvansh Dave, Himani Patel`
