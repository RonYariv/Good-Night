import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socketService } from "./services/socket.service";
import "./Lobby.css";

export function Lobby() {
  const [roomName, setRoomName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    socketService.connect();
    return () => socketService.disconnect();
  }, []);

  const createRoom = () => {
    if (!roomName) return setError("Room name is required");

    socketService.emit("createRoom", { name: roomName });
    socketService.once("roomCreated", (room) => {
      setError(null);
      navigate(`/room/${room.gameCode}`, { state: { playerId: room.host } });
    });
  };

  const joinRoom = () => {
    if (!playerName || !joinRoomId)
      return setError("Player name and room ID are required");

    socketService.emit("joinRoom", { roomId: joinRoomId, playerName });
    socketService.once("playerJoined", ({ room, playerId }) => {
      console.log("heloooooo")
      console.log("Player joined room:", playerId);
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