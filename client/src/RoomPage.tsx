import { ChatEvents, RoomEvents, type IChatMessage } from "@myorg/shared";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./RoomPage.css";
import { socketService } from "./services/socket.service";

interface Player {
  id: string;
  name: string;
}

export function RoomPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const playerId = location.state?.playerId || null;
  const { gameCode } = useParams<{ gameCode: string }>();

  const [players, setPlayers] = useState<Player[]>([]);
  const [copied, setCopied] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socketService.connect();

    socketService.emit(RoomEvents.RoomByGameCode, { gameCode });

    socketService.on(RoomEvents.RoomData, (room) => {
      setPlayers(room.players);
    });

    socketService.on(RoomEvents.PlayerJoined, ({ room }) => {
      setPlayers(room.players);
    });

    socketService.on(RoomEvents.PlayerLeft, ({ room }) => {
      setPlayers(room.players);
    });

    socketService.on(ChatEvents.History, (history: IChatMessage[]) => {
      setMessages(history);
    });

    socketService.on(ChatEvents.NewMessage, (message: IChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socketService.disconnect();
    };
  }, [gameCode]);

  const startGame = () => {
    socketService.emit(RoomEvents.StartGame, { gameCode });
  };

  const copyGameCode = () => {
    if (gameCode) {
      navigator.clipboard.writeText(gameCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  };

  const sendMessage = () => {
    if (!messageText.trim() || !playerId || !gameCode) return;
    socketService.emit(ChatEvents.Send, {
      roomId: gameCode,
      senderId: playerId,
      text: messageText.trim(),
    });
    setMessageText("");
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
            socketService.emit(RoomEvents.LeaveRoom, { roomId: gameCode, playerId });
            navigate("/");
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

      <section className="chat-section">
        <h2 className="section-title">Game Chat</h2>
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">No messages yet</div>
          )}
          {messages.map((m, i) => {
            const sender =
              players.find((p) => p.id === m.senderId)?.name || "Unknown";
            return (
              <div
                key={i}
                className={"chat-message"}
              >
                <span className="chat-sender">{sender}:</span>{" "}
                <span className="chat-text">{m.text}</span>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
        <div className="chat-input-area">
          <input
            type="text"
            placeholder="Type your message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault(); // prevent line breaks
                sendMessage();
              }
            }}
          />
        </div>
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