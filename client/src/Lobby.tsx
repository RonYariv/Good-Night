import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socketService } from "./services/socket.service";
import "./Lobby.css";
import { RoomEvents } from "@myorg/shared";

export function Lobby() {
  const [hostName, setHostName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    socketService.connect();
    
    socketService.on(RoomEvents.Error, (error) => setError(error.message));

    return () => socketService.disconnect();
  }, []);

  const createRoom = () => {
    if (!hostName) return setError("name is required");

    socketService.emit(RoomEvents.CreateRoom, { name: hostName });
    socketService.once(RoomEvents.RoomCreated, (room) => {
      setError(null);
      navigate(`/room/${room.gameCode}`, { state: { playerId: room.host } });
    });
  };

  const joinRoom = () => {
    if (!playerName || !joinRoomId)
      return setError("Player name and room ID are required");

    socketService.emit(RoomEvents.JoinRoom, { roomId: joinRoomId, playerName });
    socketService.once(RoomEvents.PlayerJoined, ({ room, playerId }) => {
      setError(null);
      navigate(`/room/${room.gameCode}`, { state: { playerId: playerId } });
    });
  };

  return (
    <div className="lobby-container">
      <h1 className="lobby-title">The Dark Lobby</h1>

      <section className="lobby-section">
        <h2 className="section-title">Create Room</h2>
        <input
          type="text"
          placeholder="Host name"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
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