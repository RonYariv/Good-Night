import { useEffect, useState } from 'react';
import { socketService } from './services/socket.service';
import './Lobby.css';

interface Room {
  id: string;
  gameCode: string;
  name: string;
  players: { id: string; name: string }[];
  status: string;
}

const RoomEvents = {
  CreateRoom: 'createRoom',
  RoomCreated: 'roomCreated',
  JoinRoom: 'joinRoom',
  LeaveRoom: 'leaveRoom',
  GetRooms: 'getRooms',
  PlayerJoined: 'playerJoined',
  PlayerLeft: 'playerLeft',
  PlayerAction: 'PlayerAction',
  RoomList: 'roomList',
  RoomListUpdated: 'roomListUpdated',
  StartGame: 'startGame',
  EndGame: 'endGame',
  GameStarted: 'gameStarted',
  GameEnded: 'gameEnded',
  CurrentPlayerTurn: 'CurrentPlayerTurn',
  Error: 'error',
} as const;

export function Lobby() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomName, setRoomName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    socketService.connect();

    socketService.on(RoomEvents.RoomListUpdated, () => {
      // update rooms list from backend if sent here
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const createRoom = () => {
    if (!roomName) return setError('Room name is required');
    socketService.emit(RoomEvents.CreateRoom, { name: roomName });
    socketService.on(RoomEvents.RoomCreated, (room: Room) => {
      setRooms((prev) => [...prev, room]);
      setError(null);
    });
  };

  const joinRoom = () => {
    if (!playerName || !joinRoomId) return setError('Player name and room ID are required');
    socketService.emit(RoomEvents.JoinRoom, { roomId: joinRoomId, playerName });
    socketService.on(RoomEvents.PlayerJoined, ({room}) => {
      // TODO
      setError(null);
    });
  };

  return (
    <div className="lobby-container">
      <h1 className="lobby-title">The Dark Lobby</h1>

      <section className="lobby-section">
        <h2 className="section-title">Create Room</h2>
        <input
          type="text"
          placeholder="Room name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          className="input-field"
        />
        <button onClick={createRoom} className="btn btn-create">
          Create
        </button>
      </section>

      <section className="lobby-section">
        <h2 className="section-title">Join Room</h2>
        <input
          type="text"
          placeholder="Room ID"
          value={joinRoomId}
          onChange={(e) => setJoinRoomId(e.target.value)}
          className="input-field"
        />
        <input
          type="text"
          placeholder="Player name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="input-field"
        />
        <button onClick={joinRoom} className="btn btn-join">
          Join
        </button>
      </section>

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}