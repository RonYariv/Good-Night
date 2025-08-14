import type { IPlayer } from "@myorg/shared";
import "./GameTable.css";

interface GameTableProps {
  players: IPlayer[];
  playerId: string;
}

export function GameTable({ players, playerId }: GameTableProps) {
  const currentPlayer = players.find(p => p.id === playerId);
  const otherPlayers = players.filter(p => p.id !== playerId);
  const radius = 35; // % from center

  return (
    <div className="table-container">
      <div className="table">
        <div className="community-cards">
          {[0, 1, 2].map((_, i) => (
            <div key={i} className="card-placeholder" />
          ))}
        </div>

        {/* Current player at bottom center */}
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
          const countOther = otherPlayers.length;
          const angle = (-Math.PI / 2) + (2 * Math.PI * i) / countOther; 
          const x = 50 + radius * Math.cos(angle);
          const y = 50 + radius * Math.sin(angle);

          return (
            <div
              key={player.id}
              className="player-slot"
              style={{
                left: `${x}%`,
                top: `${y}%`,
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