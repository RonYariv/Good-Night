# Room Game API Documentation

## Overview
This API provides endpoints and WebSocket events for managing game rooms in a multiplayer game server.

## REST API Endpoints

### Rooms

#### Create Room
- **POST** `/rooms`
- **Body:**
  ```json
  {
    "name": "Game Room 1",
    "host": "player123",
    "maxPlayers": 8,
    "gameCode": "ABC123",
    "url": "room-abc123",
    "isPrivate": false,
    "password": ""
  }
  ```

#### Get All Public Rooms
- **GET** `/rooms`
- Returns list of all public waiting rooms

#### Get Room by ID
- **GET** `/rooms/:id`
- Returns room details by MongoDB ID

#### Get Room by URL
- **GET** `/rooms/url/:url`
- Returns room details by custom URL

#### Join Room
- **POST** `/rooms/:id/join`
- **Body:**
  ```json
  {
    "playerId": "player456"
  }
  ```

#### Leave Room
- **POST** `/rooms/:id/leave`
- **Body:**
  ```json
  {
    "playerId": "player456"
  }
  ```

#### Update Room Status
- **PUT** `/rooms/:id/status`
- **Body:**
  ```json
  {
    "status": "playing"
  }
  ```
- Status options: `waiting`, `playing`, `finished`

#### Delete Room
- **DELETE** `/rooms/:id`

## WebSocket Events

### Client to Server Events

#### `createRoom`
- Creates a new room and joins the client to it
- **Data:**
  ```json
  {
    "name": "Game Room 1",
    "host": "player123",
    "maxPlayers": 8,
    "gameCode": "ABC123",
    "url": "room-abc123",
    "isPrivate": false,
    "password": ""
  }
  ```

#### `joinRoom`
- Joins a client to an existing room
- **Data:**
  ```json
  {
    "roomId": "room_id_here",
    "playerId": "player456"
  }
  ```

#### `leaveRoom`
- Removes a client from a room
- **Data:**
  ```json
  {
    "roomId": "room_id_here",
    "playerId": "player456"
  }
  ```

#### `getRooms`
- Requests list of all public rooms

#### `startGame`
- Changes room status to "playing"
- **Data:**
  ```json
  {
    "roomId": "room_id_here"
  }
  ```

#### `endGame`
- Changes room status to "finished"
- **Data:**
  ```json
  {
    "roomId": "room_id_here"
  }
  ```

### Server to Client Events

#### `roomCreated`
- Emitted when a room is successfully created
- **Data:** Room object

#### `playerJoined`
- Emitted to all clients in a room when a player joins
- **Data:**
  ```json
  {
    "playerId": "player456",
    "room": { /* room object */ }
  }
  ```

#### `playerLeft`
- Emitted to all clients in a room when a player leaves
- **Data:**
  ```json
  {
    "playerId": "player456",
    "room": { /* room object */ }
  }
  ```

#### `roomList`
- Emitted when client requests room list
- **Data:** Array of room objects

#### `roomListUpdated`
- Emitted to all clients when room list changes

#### `gameStarted`
- Emitted to all clients in a room when game starts
- **Data:** Updated room object

#### `gameEnded`
- Emitted to all clients in a room when game ends
- **Data:** Updated room object

#### `error`
- Emitted when an error occurs
- **Data:**
  ```json
  {
    "message": "Error description"
  }
  ```

## Room Schema

```typescript
{
  _id: ObjectId,
  name: string,           // Room display name
  host: string,           // Host player ID
  maxPlayers: number,     // Maximum players allowed (1-20)
  currentPlayers: number, // Current number of players
  gameCode: string,       // Game identifier code
  url: string,            // Unique URL for the room
  status: string,         // 'waiting' | 'playing' | 'finished'
  players: string[],      // Array of player IDs
  isPrivate: boolean,     // Whether room is private
  password: string,       // Password for private rooms
  createdAt: Date,        // Auto-generated timestamp
  updatedAt: Date         // Auto-generated timestamp
}
```

## Setup Requirements

1. **MongoDB**: Ensure MongoDB is running locally or set `MONGODB_URI` environment variable
2. **Dependencies**: Install required packages with `npm install`
3. **Server**: Run with `npm run start:dev` for development mode

## Example Usage

### Creating a Room via WebSocket
```javascript
const socket = io('http://localhost:3000');

socket.emit('createRoom', {
  name: 'My Game Room',
  host: 'player123',
  maxPlayers: 6,
  gameCode: 'GAME001',
  url: 'my-room',
  isPrivate: false
});

socket.on('roomCreated', (room) => {
  console.log('Room created:', room);
});
```

### Joining a Room via REST API
```javascript
const response = await fetch('http://localhost:3000/rooms/room_id/join', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ playerId: 'player456' })
});

const result = await response.json();
```
