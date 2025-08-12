import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { socketService } from "./services/socket.service";
import "./RoomPage.css";

interface Player {
  id: string;
  name: string;
}

export function RoomPage() {
  const location = useLocation();
  const playerId = location.state?.playerId || null;
  const { gameCode } = useParams<{ gameCode: string }>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    socketService.connect();

    socketService.emit("roomByGameCode", { gameCode });

    socketService.on("roomData", (room) => {
      setPlayers(room.players);
    });

    socketService.on("playerJoined", ({ room }) => {
        console.log("player joined", room);
      setPlayers(room.players);
    });

    socketService.on("playerLeft", ({ room }) => {
      setPlayers(room.players);
    });

    return () => {
      socketService.disconnect();
    };
  }, [gameCode]);

  const startGame = () => {
    socketService.emit("startGame", { gameCode });
  };

  const copyGameCode = () => {
    if (gameCode) {
      navigator.clipboard.writeText(gameCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  };

  return (
    <div className="room-container">
      <header className="room-header">
        <h1 className="room-title">Game Room</h1>
           <div className="game-code">
                Code: <strong>{gameCode}</strong>
                <button
                    onClick={copyGameCode}
                    className="copy-text-btn"
                    type="button"
                    disabled={copied}
                >
                    {copied ? "Copied!" : "Copy"}
                </button>
            </div>
      </header>

          <button
              onClick={() => {
                if (playerId && gameCode) {
                  socketService.emit("leaveRoom", { roomId: gameCode, playerId });
                  // redirect logic here, e.g., navigate('/')
                }
              }}
              className="btn btn-leave"
              type="button"
            >
              Leave Room
          </button>

      <section className="players-section">
        <h2 className="section-title">Players ({players.length})</h2>
        <ul className="player-list">
          {players.map((p) => (
            <li key={p.id} className="player-item">
              {p.name}
            </li>
          ))}
        </ul>
      </section>

      <div className="room-actions">
        <button
          onClick={startGame}
          disabled={players.length < 4}
          className="btn"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}