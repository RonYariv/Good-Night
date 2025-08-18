import { GameEvents, type IPlayer, type IRole, TargetType } from "@myorg/shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import "./GameTable.css";
import { socketService } from "./services/socket.service";

interface GameTableProps {
  players: IPlayer[];
  playerId: string;
  gameCode: string;
}

export function GameTable({ players, playerId, gameCode }: GameTableProps) {
  const [revealedRole, setRevealedRole] = useState<IRole | null>(null);
  const [currentTurnRole, setCurrentTurnRole] = useState<IRole | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);

  const currentPlayer = useMemo(
    () => players.find(p => p.id === playerId),
    [players, playerId]
  );

  const otherPlayers = useMemo(
    () => players.filter(p => p.id !== playerId),
    [players, playerId]
  );

  const getPosition = useCallback(
    (index: number) => {
      const totalPlayers = otherPlayers.length;
      if (totalPlayers === 0) return { x: 50, y: 50 };
      const angle = (2 * Math.PI * index) / totalPlayers - Math.PI / 2;
      const radius = 35;
      return {
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
      };
    },
    [otherPlayers.length]
  );

  useEffect(() => {
    if (!socketService.socket) socketService.connect();

    socketService.emit(GameEvents.GetCurrentTurn, { gameCode });

    const handleRevealRoles = (data: { roles: { playerId: string; role: IRole }[] }) => {
      const myRole = data.roles.find(r => r.playerId === playerId)?.role;
      if (!myRole) return;
      setRevealedRole(myRole);
    };

    const handleCurrentTurn = (role: IRole) => {
      setCurrentTurnRole(role);
      setSelectedTargets([]);
    };

    socketService.on(GameEvents.RevealRoles, handleRevealRoles);
    socketService.on(GameEvents.CurrentRoleTurn, handleCurrentTurn);

    return () => {
      socketService.off(GameEvents.RevealRoles, handleRevealRoles);
      socketService.off(GameEvents.CurrentRoleTurn, handleCurrentTurn);
    };
  }, [playerId, gameCode]);

  const handleSelect = (targetId: string, targetType: TargetType) => {
    if (!currentTurnRole || !currentTurnRole.targetTypes.includes(targetType)) return;
    setSelectedTargets(prev =>
      prev.includes(targetId)
        ? prev.filter(id => id !== targetId)
        : prev.length < (currentTurnRole.maxTargets || 0)
          ? [...prev, targetId]
          : prev
    );
  };

  const handleDone = () => {
    if (!currentTurnRole) return;
    socketService.emit(GameEvents.PlayerAction, {
      gameCode,
      playerId,
      roleId: currentTurnRole.id,
      targets: selectedTargets,
    });
    setSelectedTargets([]);
  };

  const canAct = currentTurnRole?.id === revealedRole?.id;
  const isValidSelection = selectedTargets.length === (currentTurnRole?.maxTargets || 0);

  const renderCard = (player: IPlayer) => {
    const isSelected = selectedTargets.includes(player.id);
    return (
      <div
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        className={`card-placeholder ${isSelected ? "selected" : ""}`}
        onClick={() => canAct && handleSelect(player.id, TargetType.Player)}
      >
        {player.id === playerId && revealedRole && (
          <div className="role-text">
            {revealedRole.name}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="table-container">
      {currentTurnRole && (
        <div className="turn-text">{currentTurnRole.name} wake up</div>
      )}

      <div className="table">
        <div className="community-cards">
          {Array.from({ length: 3 }).map((_, i) => {
            const cardId = `center-${i}`;
            const isSelected = selectedTargets.includes(cardId);
            return (
              <div
                key={cardId}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                className={`card-placeholder ${isSelected ? "selected" : ""}`}
                onClick={() => canAct && handleSelect(cardId, TargetType.Center)}
              />
            );
          })}
        </div>

        {currentPlayer && (
          <div className="player-slot player-self">
            <div className="player-name">{currentPlayer.name}</div>
            {renderCard(currentPlayer)}
          </div>
        )}

        {otherPlayers.map((player, i) => {
          const { x, y } = getPosition(i);
          return (
            <div
              key={player.id}
              className="player-slot"
              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
            >
              <div className="player-name">{player.name}</div>
              {renderCard(player)}
            </div>
          );
        })}
      </div>

      {canAct && (
        <div className="action-container">
          <button
            className="done-button"
            onClick={handleDone}
            disabled={!isValidSelection}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}