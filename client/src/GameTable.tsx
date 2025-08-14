import { useEffect, useState } from "react";
import { GameEvents, type IPlayer, type IRole } from "@myorg/shared";
import { socketService } from "./services/socket.service";
import "./GameTable.css";

interface GameTableProps {
  players: IPlayer[];
  playerId: string;
}

export function GameTable({ players, playerId }: GameTableProps) {
  const [revealedRole, setRevealedRole] = useState<IRole | null>(null);

  const currentPlayer = players.find(p => p.id === playerId);
  const otherPlayers = players.filter(p => p.id !== playerId);
  const radius = 35;
  const totalPlayers = players.length;

  const getPosition = (index: number) => {
    if (totalPlayers === 3) return index === 0 ? { x: 15, y: 50 } : { x: 85, y: 50 };
    if (totalPlayers === 4) {
      switch (index) {
        case 0: return { x: 15, y: 50 };
        case 1: return { x: 85, y: 50 };
        case 2: return { x: 50, y: 15 };
      }
    }
    const angle = (2 * Math.PI * index) / otherPlayers.length - Math.PI / 2;
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    return { x, y };
  };

  useEffect(() => {
    const handler = (data: { roles: { playerId: string; role: IRole }[] }) => {
      console.log("Reveal roles", data);
      const myRole = data.roles.find(r => r.playerId === playerId)?.role;
      if (!myRole) return;
      setRevealedRole(myRole);

      setTimeout(() => setRevealedRole(null), 10000);
    };

    socketService.on(GameEvents.RevealRoles, handler);
    return () => socketService.off(GameEvents.RevealRoles, handler);
  }, [playerId]);

  const renderCard = (player: IPlayer) => (
    <div className="card-placeholder">
      {player.id === playerId && revealedRole && (
        <div className="role-text">{revealedRole.name}</div>
      )}
    </div>
  );

  return (
    <div className="table-container">
      <div className="table">
        {/* Community cards */}
        <div className="community-cards">
          {[0, 1, 2].map((_, i) => (
            <div key={i} className="card-placeholder" />
          ))}
        </div>

        {/* Current player bottom center */}
        {currentPlayer && (
          <div
            className="player-slot"
            style={{ left: "50%", top: "85%", transform: "translate(-50%, -50%)" }}
          >
            <div className="player-name">{currentPlayer.name}</div>
            {renderCard(currentPlayer)}
          </div>
        )}

        {/* Other players */}
        {otherPlayers.map((player, i) => {
          const pos = getPosition(i);
          return (
            <div
              key={player.id}
              className="player-slot"
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}
            >
              <div className="player-name">{player.name}</div>
              {renderCard(player)}
            </div>
          );
        })}
      </div>
    </div>
  );
}