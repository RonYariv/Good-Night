import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { socketService } from "./services/socket.service";
import "./RoomPage.css";

interface Player {
  id: string;
  name: string;
}

interface ChatMessage {
  roomId: string;
  senderId: string;
  text: string;
  at: number;
}

export function RoomPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const playerId = location.state?.playerId || null;
  const { gameCode } = useParams<{ gameCode: string }>();

  const [players, setPlayers] = useState<Player[]>([]);
  const [copied, setCopied] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socketService.connect();

    socketService.emit("roomByGameCode", { gameCode });

    socketService.on("roomData", (room) => {
      setPlayers(room.players);
    });

    socketService.on("playerJoined", ({ room }) => {
      setPlayers(room.players);
    });

    socketService.on("playerLeft", ({ room }) => {
      setPlayers(room.players);
    });

    socketService.on("chat:history", (history: ChatMessage[]) => {
      setMessages(history);
    });

    socketService.on("chat:new", (message: ChatMessage) => {
      console.log("New chat message:", message);
      setMessages((prev) => [...prev, message]);
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

  const sendMessage = () => {
    if (!messageText.trim() || !playerId || !gameCode) return;
    socketService.emit("chat:send", {
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
            socketService.emit("leaveRoom", { roomId: gameCode, playerId });
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