import { GameEvents, type IPlayer, type IRole, type PlayerActionResult, TargetType } from "@myorg/shared";
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
  const [seenRolesMap, setSeenRolesMap] = useState<Record<string, IRole>>({});
  const [currentTurnRole, setCurrentTurnRole] = useState<IRole | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [nightOver, setNightOver] = useState(false);

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
      const totalPlayers = players.length;
      if (totalPlayers === 3) {
        if (index === 0) return { x: 15, y: 50 };
        if (index === 1) return { x: 85, y: 50 };
      }
      if (totalPlayers === 4) {
        switch (index) {
          case 0: return { x: 15, y: 50 };
          case 1: return { x: 85, y: 50 };
          case 2: return { x: 50, y: 15 };
        }
      }
      const angle = (2 * Math.PI * index) / (totalPlayers - 1) - Math.PI / 2;
      const radius = 35;
      return { x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) };
    },
    [players.length]
  );

  useEffect(() => {
    if (!socketService.socket) {
      socketService.connect();
    }

    socketService.emit(GameEvents.GetCurrentTurn, { gameCode });

    const handlers: [string, (...args: any[]) => void][] = [
      [
        GameEvents.RevealRoles,
        (data: { roles: { playerId: string; role: IRole }[] }) => {
          const myRole = data.roles?.find(r => r.playerId === playerId)?.role;
          if (myRole) setRevealedRole(myRole);
        },
      ],
      [
        GameEvents.CurrentRoleTurn,
        (role: IRole) => {
          setCurrentTurnRole(role);
          setSelectedTargets([]);
        },
      ],
      [
        GameEvents.NightIsOver,
        () => {
          setNightOver(true);
          setCurrentTurnRole(null);
        },
      ],
      [
        GameEvents.PlayerActionInfo,
        (res: PlayerActionResult) => {
          const { info, targetsIds } = res;

          if (info?.seenRoles) {
            const newSeenRoles: Record<string, IRole> = {};
            info.seenRoles.forEach((role: IRole, index: number) => {
              const targetId = targetsIds[index];
              newSeenRoles[targetId] = role;
            });
            setSeenRolesMap(prev => ({ ...prev, ...newSeenRoles }));
          }

          if (info?.swappedRole) {
            setRevealedRole(info.swappedRole);
          }
        },
      ],
    ];

    handlers.forEach(([event, fn]) => socketService.on(event, fn));

    // Cleanup
    return () => {
      handlers.forEach(([event, fn]) => socketService.off(event, fn));
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
      targetsIds: selectedTargets,
    });
    setSelectedTargets([]);
  };

  const canAct = !nightOver && currentTurnRole?.id === revealedRole?.id;
  const isValidSelection = selectedTargets.length === (currentTurnRole?.maxTargets || 0);

  const Card = ({
    role,
    isSelected,
    onClick,
  }: {
    role?: IRole;
    isSelected: boolean;
    onClick: () => void;
  }) => (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      className={`card-placeholder ${isSelected ? "selected" : ""}`}
      onClick={onClick}
    >
      {role && <div className="role-text">{role.name}</div>}
    </div>
  );

  const renderPlayerCard = (player: IPlayer) => {
    const isSelected = selectedTargets.includes(player.id);
    const targetType = player.id === playerId ? TargetType.Self : TargetType.Player;
    const roleToShow = player.id === playerId ? revealedRole : seenRolesMap[player.id];

    return (
      <Card
        key={player.id}
        role={roleToShow!}
        isSelected={isSelected}
        onClick={() => canAct && handleSelect(player.id, targetType)}
      />
    );
  };

  const renderCenterCard = (index: number) => {
    const cardId = `center-${index}`;
    const isSelected = selectedTargets.includes(cardId);
    const roleToShow = seenRolesMap[cardId];

    return (
      <Card
        key={cardId}
        role={roleToShow}
        isSelected={isSelected}
        onClick={() => canAct && handleSelect(cardId, TargetType.Center)}
      />
    );
  };

  return (
    <div className="table-container">
      <div className="turn-text">
        {nightOver ? "Good morning!" : currentTurnRole?.name + " wake up"}
      </div>

      <div className="table">
        <div className="community-cards">
          {Array.from({ length: 3 }).map((_, i) => renderCenterCard(i))}
        </div>

        {currentPlayer && (
          <div className="player-slot player-self">
            <div className="player-name">{currentPlayer.name}</div>
            {renderPlayerCard(currentPlayer)}
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
              {renderPlayerCard(player)}
            </div>
          );
        })}
      </div>

      {
        canAct && !nightOver && (
          <div className="action-container">
            <button
              className="done-button"
              onClick={handleDone}
              disabled={!isValidSelection}
            >
              Done
            </button>
          </div>
        )
      }
    </div >
  );
}