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
  const [knownRolesMap, setKnownRolesMap] = useState<Record<string, IRole>>({});
  const [currentTurnRole, setCurrentTurnRole] = useState<IRole | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [nightOver, setNightOver] = useState(false);
  const [timer, setVotingTimer] = useState(0);
  const [roleList, setRoleList] = useState<IRole[]>([]);

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
        (data: { roles: { id: string; role: IRole }[] }) => {
          console.log("Received roles:", data.roles);
          const myRole = data.roles?.find(r => r.id === playerId)?.role;
          setRoleList(data.roles?.map(r => r.role));
          if (myRole) setRevealedRole(myRole);
          if (myRole?.canSeeTeammates) {
            const teamMates = data.roles.filter(r => r.role.id === myRole.id && r.id !== playerId);
            const teamMap: Record<string, IRole> = {};
            for (const mate of teamMates) {
              teamMap[mate.id] = mate.role;
            }

            setKnownRolesMap(prev => ({ ...prev, ...teamMap }));
          }
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
            setKnownRolesMap(prev => ({ ...prev, ...newSeenRoles }));
          }

          if (info?.swappedRole) {
            setRevealedRole(info.swappedRole);
          }
        },
      ],
      [
        GameEvents.VotingTimer, (data: { remainingSeconds: number }) => {
          setVotingTimer(data.remainingSeconds);
        },
      ]
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
    const roleToShow = player.id === playerId ? revealedRole : knownRolesMap[player.id];

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
    const roleToShow = knownRolesMap[cardId];

    return (
      <Card
        key={cardId}
        role={roleToShow}
        isSelected={isSelected}
        onClick={() => canAct && handleSelect(cardId, TargetType.Center)}
      />
    );
  };

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }


  return (
    <div className="game-container">
      <div className="turn-text-container">
        <div className="turn-text">
          {nightOver ? "Good morning!" : currentTurnRole?.name + " wake up"}
        </div>

        {nightOver && (
          <div className="timer-container">
            <div className="timer-circle">
              <span className="timer-text">{formatTime(timer)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="table-container">

        <div className="role-list">
          {roleList.map((role, i) => (
            <div key={i} className="role-item">
              {role.name}
            </div>
          ))}
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