import type { IPlayer } from "@myorg/shared";
import "./GameTable.css";

interface GameTableProps {
  players: IPlayer[];
  playerId: string;
}

export function GameTable({ players, playerId }: GameTableProps) {
  const currentPlayer = players.find(p => p.id === playerId);
  const otherPlayers = players.filter(p => p.id !== playerId);
  const radius = 35; // % distance from center

  const totalPlayers = players.length;

  const getPosition = (index: number) => {
    if (totalPlayers === 3) {
      return index === 0 ? { x: 15, y: 50 } : { x: 85, y: 50 };
    }
    if (totalPlayers === 4) {
      switch (index) {
        case 0: return { x: 15, y: 50 };   // left
        case 1: return { x: 85, y: 50 };   // right
        case 2: return { x: 50, y: 15 };   // top
      }
    }
    const angle = (2 * Math.PI * index) / otherPlayers.length - Math.PI / 2; // start from top
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    return { x, y };
  };

  return (
    <div className="table-container">
      <div className="table">
        {/* Community area */}
        <div className="community-cards">
          {[0, 1, 2].map((_, i) => (
            <div key={i} className="card-placeholder" />
          ))}
        </div>

        {/* Current player bottom center */}
        {currentPlayer && (
          <div
            className="player-slot"
            style={{
              left: `50%`,
              top: `85%`,
              transform: `translate(-50%, -50%)`,
            }}
          >
            <div className="player-name">{currentPlayer.name}</div>
            <div className="card-placeholder" data-player-id={currentPlayer.id} />
          </div>
        )}

        {/* Other players */}
        {otherPlayers.map((player, i) => {
          const pos = getPosition(i);
          return (
            <div
              key={player.id}
              className="player-slot"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: `translate(-50%, -50%)`,
              }}
            >
              <div className="player-name">{player.name}</div>
              <div className="card-placeholder" data-player-id={player.id} />
            </div>
          );
        })}
      </div>
    </div>
  );
}