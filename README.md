# Ubar Ride Share — Backend API

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-OpenAPI_3.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)

**A production-ready RESTful API for a full-featured ride-hailing platform**

[API Docs](#api-documentation) · [Quick Start](#quick-start) · [Architecture](#architecture) · [Environment Variables](#environment-variables)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [API Reference](#api-reference)
- [Real-Time Events (Socket.IO)](#real-time-events-socketio)
- [Authentication Flow](#authentication-flow)
- [Fare Calculation Logic](#fare-calculation-logic)
- [Database Models](#database-models)
- [Security](#security)

---

## Overview

The **Ubar Ride Share Backend** is a Node.js/Express REST API that powers a complete ride-hailing platform similar to Uber. It manages two distinct user roles — **Users (passengers)** and **Captains (drivers)** — through separate authentication flows, and handles the full lifecycle of a ride from creation to completion using real-time Socket.IO events.

The backend integrates with the **Geoapify API** for geocoding, routing distance/time calculations, and address autocomplete, replacing Google Maps for unrestricted usage.

---

## Key Features

| Feature | Description |
|---|---|
| 🔐 **Dual Authentication** | Separate JWT-based auth for passengers and drivers, with token blacklisting on logout |
| 🚗 **Full Ride Lifecycle** | Create → Confirm → OTP Start → Live Tracking → End ride |
| 📡 **Real-Time Updates** | Socket.IO pushes ride events and live captain GPS to connected clients instantly |
| 🗺️ **Geoapify Integration** | Geocoding, routing distance/time, and address autocomplete |
| 💰 **Dynamic Fare Engine** | Calculates fares per vehicle type using real distance + duration |
| 🛡️ **Token Blacklist** | Logged-out JWT tokens are stored and rejected on all future requests |
| 📍 **Radius-Based Captain Discovery** | Finds captains within 10 km of pickup using MongoDB geospatial queries |
| 📖 **Interactive API Docs** | Full Swagger/OpenAPI 3.0 UI at `/api-docs` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js 4.x |
| Database | MongoDB Atlas (via Mongoose 8.x) |
| Authentication | JSON Web Tokens (jsonwebtoken) + bcrypt |
| Real-Time | Socket.IO 4.x |
| Geolocation | Geoapify REST API (geocoding + routing) |
| Validation | express-validator 7.x |
| API Docs | swagger-jsdoc + swagger-ui-express |
| HTTP Client | Axios (for Geoapify calls) |
| Dev Server | Nodemon |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (Frontend)                  │
│              React + Socket.IO Client                │
└────────────────────┬────────────────────────────────┘
                     │ HTTP REST + WebSocket
┌────────────────────▼────────────────────────────────┐
│                  Express Server                      │
│                 (Port 5005)                          │
│  ┌──────────────────────────────────────────────┐   │
│  │   Routes → Controllers → Services → Models   │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────┐   ┌────────────────────────────┐  │
│  │  Socket.IO   │   │  Auth Middleware (JWT)      │  │
│  │  (Real-time) │   │  Token Blacklist Check      │  │
│  └──────────────┘   └────────────────────────────┘  │
└────────────┬───────────────────┬────────────────────┘
             │                   │
┌────────────▼────┐   ┌──────────▼──────────────────┐
│  MongoDB Atlas  │   │  Geoapify API               │
│  (Data Store)   │   │  (Geocoding + Routing)      │
└─────────────────┘   └─────────────────────────────┘
```

---

## Project Structure

```
Backend/
├── app.js                    # Express app setup, middleware, routes, Swagger
├── server.js                 # HTTP server + Socket.IO initialization
├── socket.js                 # Socket.IO event handlers + location broadcasting
├── swagger.js                # OpenAPI 3.0 spec definition
├── .env                      # Environment variables (not committed)
├── package.json
│
├── controllers/              # Request handlers (thin layer, delegates to services)
│   ├── user.controller.js
│   ├── captain.controller.js
│   ├── map.controller.js
│   └── ride.controller.js
│
├── services/                 # Business logic layer
│   ├── user.service.js
│   ├── captain.service.js
│   ├── maps.service.js       # Geoapify geocoding + routing
│   └── ride.service.js       # Fare calc, OTP gen, ride state machine
│
├── models/                   # Mongoose schemas
│   ├── user.model.js
│   ├── captain.model.js
│   ├── ride.model.js
│   └── blacklistToken.model.js
│
├── routes/                   # Express router definitions + validation rules
│   ├── user.routes.js
│   ├── captain.routes.js
│   ├── maps.routes.js
│   └── ride.routes.js
│
├── middlewares/
│   └── auth.middleware.js    # authUser + authCaptain JWT guards
│
└── db/
    └── db.js                 # MongoDB connection
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- Geoapify API key (free tier available at [geoapify.com](https://www.geoapify.com/))

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd Backend

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# Edit .env with your actual values (see Environment Variables section)

# 4. Start the development server
npm run dev

# 5. Open the API docs
# http://localhost:5005/api-docs
```

### Available Scripts

| Script | Command | Description |
|---|---|---|
| Development | `npm run dev` | Start with nodemon (auto-reload) |
| Production | `npm start` | Start with node |

---

## Environment Variables

Create a `.env` file in the `Backend/` root:

```env
# MongoDB Connection String (Atlas or local)
DB_CONNECT=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/<dbname>

# JWT Secret — use a long, random string in production
JWT_SECRET=your_super_secret_jwt_key_here

# Geoapify API Key — get a free key at https://www.geoapify.com/
GEOAPIFY_API_KEY=your_geoapify_api_key_here

# Server port (optional, defaults to 5005)
PORT=5005
```

> ⚠️ **Never commit your `.env` file.** It is already listed in `.gitignore`.

---

## API Documentation

Interactive Swagger UI is available when the server is running:

| URL | Description |
|---|---|
| `http://localhost:5005/api-docs` | **Interactive Swagger UI** — try all endpoints in the browser |
| `http://localhost:5005/api-docs.json` | Raw OpenAPI 3.0 JSON — import into Postman or Insomnia |

### How to use Swagger UI

1. Run the server: `npm run dev`
2. Open `http://localhost:5005/api-docs`
3. Register a user via **POST /users/register** or captain via **POST /captains/register**
4. Login via **POST /users/login** — copy the `token` from the response
5. Click the **Authorize 🔒** button at the top right
6. Paste the token and click **Authorize**
7. All protected endpoints are now unlocked — click **Try it out** on any endpoint

---

## API Reference

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/users/register` | ❌ Public | Register a new passenger |
| `POST` | `/users/login` | ❌ Public | Login and receive JWT token |
| `GET` | `/users/profile` | ✅ User | Get authenticated user's profile |
| `GET` | `/users/logout` | ✅ User | Logout and blacklist token |

### Captains

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/captains/register` | ❌ Public | Register a new driver |
| `POST` | `/captains/login` | ❌ Public | Login and receive JWT token |
| `GET` | `/captains/profile` | ✅ Captain | Get authenticated captain's profile |
| `GET` | `/captains/logout` | ✅ Captain | Logout and blacklist token |

### Maps

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/maps/get-coordinates?address=` | ✅ User | Geocode address → lat/lng |
| `GET` | `/maps/get-distance-time?origin=&destination=` | ✅ User | Driving distance + duration |
| `GET` | `/maps/get-suggestions?input=` | ✅ User | Address autocomplete suggestions |

### Rides

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/rides/get-fare?pickup=&destination=` | ✅ User | Fare estimate for all vehicle types |
| `POST` | `/rides/create` | ✅ User | Create a new ride request |
| `POST` | `/rides/confirm` | ✅ Captain | Captain accepts a ride |
| `GET` | `/rides/start-ride?rideId=&otp=` | ✅ Captain | Verify OTP and start ride |
| `POST` | `/rides/end-ride` | ✅ Captain | Mark ride as completed |

---

## Real-Time Events (Socket.IO)

The server runs Socket.IO on the same port as the REST API (`5005`).

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join` | `{ userId, userType: "user" \| "captain" }` | Register socket session with user/captain ID |
| `update-location-captain` | `{ userId, location: { ltd, lng } }` | Captain sends live GPS coordinates (every 10s) |

### Server → Client

| Event | Sent To | Description |
|---|---|---|
| `new-ride` | Nearby captains | Fired after `POST /rides/create` — carries ride + user data |
| `ride-confirmed` | Passenger | Fired after captain calls `POST /rides/confirm` |
| `ride-started` | Passenger | Fired after OTP verified via `GET /rides/start-ride` |
| `ride-ended` | Passenger | Fired after captain calls `POST /rides/end-ride` |
| `captain-location-update` | Passenger (during ride) | Live GPS coordinates of captain |

---

## Authentication Flow

```
User/Captain                Backend
     │                          │
     │  POST /users/login        │
     │─────────────────────────▶│
     │                          │  1. Find user by email
     │                          │  2. bcrypt.compare(password)
     │                          │  3. jwt.sign({ _id }, secret, 24h)
     │◀─────────────────────────│
     │  { token, user }          │
     │                          │
     │  GET /users/profile       │
     │  Authorization: Bearer <token>
     │─────────────────────────▶│
     │                          │  1. Extract token from header/cookie
     │                          │  2. Check BlacklistToken model
     │                          │  3. jwt.verify(token, secret)
     │                          │  4. Attach user to req.user
     │◀─────────────────────────│
     │  { user profile }         │
     │                          │
     │  GET /users/logout        │
     │─────────────────────────▶│
     │                          │  1. Add token to BlacklistToken collection
     │                          │  2. Clear cookie
     │◀─────────────────────────│
     │  { message: "Logged out" }│
```

---

## Fare Calculation Logic

Fares are calculated dynamically using real routing data from Geoapify.

```
Fare = Base Fare + (Distance in km × Per-Km Rate) + (Duration in min × Per-Min Rate)
```

| Vehicle | Base Fare | Per Km | Per Minute | Capacity |
|---|---|---|---|---|
| **Auto** | ৳30 | ৳10 | ৳2 | 3 |
| **Car** | ৳50 | ৳15 | ৳3 | 4 |
| **Moto** | ৳20 | ৳8 | ৳1.5 | 1 |

**Example:** Connaught Place → India Gate (~12.5 km, 33 min)
- Auto: ৳30 + (12.5 × 10) + (33 × 2) = **৳221**
- Car: ৳50 + (12.5 × 15) + (33 × 3) = **৳336**
- Moto: ৳20 + (12.5 × 8) + (33 × 1.5) = **৳169**

---

## Database Models

### User
```js
{
  fullname: { firstname: String (min 3), lastname: String },
  email:    String (unique, required),
  password: String (hashed, select: false),
  socketId: String
}
```

### Captain
```js
{
  fullname: { firstname, lastname },
  email:    String (unique),
  password: String (hashed, select: false),
  status:   "active" | "inactive",
  vehicle: {
    color, plate, capacity: Number,
    vehicleType: "car" | "motorcycle" | "auto"
  },
  location: { ltd: Number, lng: Number },
  socketId: String,
  currentRideUserId: ObjectId (ref: user)
}
```

### Ride
```js
{
  user:        ObjectId (ref: user),
  captain:     ObjectId (ref: captain),
  pickup:      String,
  destination: String,
  fare:        Number,
  status:      "pending" | "accepted" | "ongoing" | "completed" | "cancelled",
  duration:    Number (seconds),
  distance:    Number (metres),
  otp:         String (6-digit, select: false),
  paymentID, orderId, signature: String
}
```

### BlacklistToken
```js
{
  token:     String (unique),
  createdAt: Date (TTL: 24h — auto-deleted)
}
```

---

## Security

- **Password Hashing:** All passwords are hashed with `bcrypt` (salt rounds: 10) before storage
- **JWT Expiry:** Tokens expire after 24 hours
- **Token Blacklisting:** Logged-out tokens are stored in MongoDB and rejected on all requests
- **Input Validation:** All endpoints use `express-validator` to sanitize and validate inputs
- **CORS:** Configured to only allow requests from known frontend origins
- **No Password in Response:** Password fields use `select: false` in Mongoose — never returned in queries

---

## License

ISC © Ubar Ride Share
