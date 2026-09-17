# 🏆 SportStream — MERN Live Sports Streaming Platform

A full-stack, production-grade live sports streaming platform built with MongoDB, Express, React, and Node.js — with high security, real-time Socket.IO live chat, HLS video streaming, and a dark UI matching the SportStream design.

---

## 📁 Project Structure

```
sportstream/
├── server/                 # Node.js + Express backend
│   ├── models/
│   │   ├── User.js         # User model with bcrypt + account lock
│   │   └── Stream.js       # Stream model
│   ├── routes/
│   │   ├── auth.js         # Register, Login, Refresh, Logout
│   │   ├── streams.js      # CRUD + go-live + end stream
│   │   ├── sports.js       # Sports list + sport-filtered streams + schedule
│   │   ├── schedule.js
│   │   └── users.js
│   ├── middleware/
│   │   └── auth.js         # JWT protect + role-based authorize
│   ├── index.js            # Express + Socket.IO server
│   ├── .env.example
│   └── package.json
│
└── client/                 # React frontend
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar/     # Navigation sidebar
    │   │   ├── Navbar/      # Top search bar
    │   │   ├── StreamCard/  # Stream card with hover play
    │   │   └── VideoPlayer/ # HLS player + live chat panel
    │   ├── context/
    │   │   └── AuthContext.js  # Global auth state
    │   ├── pages/
    │   │   ├── Home/        # Explore Sports + Recent Live Sports
    │   │   ├── Browse/      # Browse by sport category
    │   │   ├── Schedule/    # Upcoming matches schedule
    │   │   ├── Stream/      # Stream watch page with chat
    │   │   ├── Login/       # Login page
    │   │   └── Register/    # Register page
    │   ├── utils/
    │   │   └── api.js       # Axios with auto-refresh interceptor
    │   ├── App.js
    │   ├── index.js
    │   └── index.css        # Global dark theme styles
    └── package.json
```

---

## 🔐 Security Features

| Feature | Implementation |
|---|---|
| Password hashing | bcryptjs with salt rounds 12 |
| JWT Access Token | Short-lived (15 min), signed with secret |
| JWT Refresh Token | 7-day, rotated on each use, hashed in DB |
| Account lockout | 5 failed logins → 2-hour lock |
| Rate limiting | Global: 200/15min · Auth: 20/15min |
| Helmet.js | HTTP security headers + CSP |
| CORS | Restricted to CLIENT_URL |
| Input validation | mongoose-validator + custom checks |
| Role-based access | user / streamer / admin roles |
| Token blacklisting | Refresh tokens stored as SHA-256 hash |
| Auto token refresh | Axios interceptor silently refreshes |
| Request size limit | 10kb body limit |

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm

### 1. Clone & Install

```bash
git clone <your-repo>
cd sportstream
npm install
cd server && npm install
cd ../client && npm install
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
MONGO_URI=mongodb://localhost:27017/sportstream

# Generate strong secrets:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_64_char_secret_here
JWT_REFRESH_SECRET=your_other_64_char_secret_here
JWT_EXPIRE=15m
```

### 3. Run Development

```bash
# From root (runs both server + client):
npm run dev

# Or separately:
cd server && npm run dev    # API on http://localhost:5000
cd client && npm start     # React on http://localhost:3000
```

---

## 🌐 API Endpoints

### Auth — `/api/auth`
| Method | Route | Description | Auth |
|---|---|---|---|
| POST | `/register` | Create account | Public |
| POST | `/login` | Login (returns tokens) | Public |
| POST | `/refresh` | Rotate refresh token | Public |
| POST | `/logout` | Invalidate refresh token | 🔒 |
| GET | `/me` | Get current user | 🔒 |

### Streams — `/api/streams`
| Method | Route | Description | Auth |
|---|---|---|---|
| GET | `/` | List streams (filter: sport, status) | Public |
| GET | `/:id` | Get stream + increment viewer | Public |
| POST | `/` | Create stream | 🔒 Streamer/Admin |
| PATCH | `/:id/go-live` | Start stream | 🔒 Streamer/Admin |
| PATCH | `/:id/end` | End stream | 🔒 Streamer/Admin |
| DELETE | `/:id` | Delete stream | 🔒 Owner/Admin |

### Sports — `/api/sports`
| Method | Route | Description |
|---|---|---|
| GET | `/` | All sports + live counts |
| GET | `/:name/streams` | Streams for a sport |

### Schedule — `/api/schedule`
| Method | Route | Description |
|---|---|---|
| GET | `/` | Upcoming streams (filter: date, sport) |

---

## 📡 Socket.IO Events (Real-time)

| Event | Direction | Description |
|---|---|---|
| `join_stream` | client→server | Join stream room |
| `leave_stream` | client→server | Leave stream room |
| `chat_message` | client→server | Send chat message |
| `viewer_count` | server→client | Current viewer count |
| `new_message` | server→client | New chat message |
| `chat_history` | server→client | Last 50 messages on join |

**Auth required:** Socket connection requires valid JWT in `socket.handshake.auth.token`.

---

## 🎥 HLS Live Streaming Setup

To integrate actual live streams:

1. **Set up an RTMP server** (e.g., [nginx-rtmp](https://github.com/arut/nginx-rtmp-module) or [node-media-server](https://github.com/illuspas/Node-Media-Server))
2. Streamer broadcasts via OBS → RTMP server using their `streamKey`
3. RTMP server converts to HLS → sets `hlsUrl` on the Stream document
4. VideoPlayer picks up `stream.hlsUrl` and loads via HLS.js

---

## 🗄️ Database Models

### User
- `username`, `email`, `password` (hashed)
- `role`: user | streamer | admin
- `loginAttempts`, `lockUntil` (brute-force protection)
- `refreshTokens[]` (hashed, rotatable)
- `watchHistory[]`, `favoritesSports[]`

### Stream
- `title`, `description`, `sport`, `tags`
- `streamKey` (unique, hidden from API)
- `hlsUrl`, `streamUrl`
- `status`: live | upcoming | ended | offline
- `viewers`, `likes`, `peakViewers`
- `teams: { home, away }`
- `isPremium`, `isPublic`

---

## 🚢 Production Deployment

### Backend (e.g., Railway / Render / EC2)
```bash
NODE_ENV=production
MONGO_URI=mongodb+srv://...  # MongoDB Atlas
CLIENT_URL=https://yourdomain.com
```

### Frontend (e.g., Vercel / Netlify)
```bash
cd client
npm run build
# Deploy /build folder
# Set REACT_APP_API_URL if not using proxy
```

### MongoDB Atlas
1. Create free cluster at mongodb.com
2. Whitelist IPs
3. Copy connection string to `MONGO_URI`

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6 |
| Styling | Custom CSS (no UI library) |
| Real-time | Socket.IO |
| Video | HLS.js |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens) |
| Security | Helmet, express-rate-limit, bcryptjs |
| Dev | Nodemon, Concurrently |

---

## 📜 License
MIT — Free to use and modify.
