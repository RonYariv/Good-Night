import { GameEvents, type IPlayer, type IRole, TargetType } from "@myorg/shared";
import { useMemo, useState } from "react";
import "./GameTable.css";
import { useGameSocket } from "./hooks/useGameSocket";
import { socketService } from "./services/socket.service";
import { useNavigate } from "react-router-dom";

interface GameTableProps {
  players: IPlayer[];
  playerId: string;
  gameCode: string;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function GameTable({ players, playerId, gameCode }: GameTableProps) {
  const { state, dispatch } = useGameSocket(gameCode, playerId, players);
  const navigate = useNavigate();


  const currentPlayer = useMemo(() => players.find(p => p.id === playerId), [players, playerId]);
  const otherPlayers = useMemo(() => players.filter(p => p.id !== playerId), [players, playerId]);

  const canAct = !state.nightOver && state.currentTurnRole?.id === state.revealedRole?.id;
  const isValidSelection = state.selectedTargets.length === (state.currentTurnRole?.maxTargets || 0);

  const handleSelect = (targetId: string, targetType: TargetType) => {
    if (!state.currentTurnRole || !state.currentTurnRole.targetTypes.includes(targetType)) return;

    let newSelection = [...state.selectedTargets];
    const maxTargets = state.currentTurnRole.maxTargets || 0;

    if (maxTargets === 1) newSelection = [targetId];
    else if (!newSelection.includes(targetId))
      newSelection = newSelection.length < maxTargets ? [...newSelection, targetId] : [...newSelection.slice(1), targetId];

    dispatch({ type: "SET_SELECTED_TARGETS", payload: newSelection });
  };

  const handleDone = () => {
    if (!state.currentTurnRole) return;

    socketService.emit(GameEvents.PlayerAction, {
      gameCode,
      playerId,
      targetsIds: state.selectedTargets,
    });

    dispatch({ type: "SET_SELECTED_TARGETS", payload: [] });
  };

  const handleVote = (targetId: string) => {
    socketService.emit(GameEvents.VotePlayer,
      {
        gameCode, playerId, votedPlayerId: targetId

      });
    dispatch({ type: "SET_VOTED_PLAYER", payload: targetId });
  }

  const getPlayerNameById = (id: string) => players.find(p => p.id === id)?.name || id;

  type SelectionType = "" | "selected" | "voted";

  const Card = ({
    role,
    selectionType,
    onClick,
    roleHistory = []
  }: {
    role?: IRole;
    selectionType: SelectionType;
    onClick: () => void;
    roleHistory?: IRole[];
  }) => {
    const [hover, setHover] = useState(false);

    return (
      <div
        role="button"
        tabIndex={0}
        aria-pressed={selectionType !== ""}
        className={`card-placeholder ${selectionType}`}
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {hover && roleHistory.length > 1 ? (
          <div className="role-history-text">
            {roleHistory.map(r => r.name).join(" → ")}
          </div>
        ) : (
          role && <div className="role-text">{role.name}</div>
        )}
      </div>
    );
  };


  const renderPlayerCard = (player: IPlayer) => {
    let selectionType: SelectionType = "";
    if (state.selectedTargets.includes(player.id)) selectionType = "selected";
    else if (state.votedPlayerId === player.id) selectionType = "voted";

    const targetType = player.id === playerId ? TargetType.Self : TargetType.Player;
    const roleToShow = player.id === playerId ? state.revealedRole : state.knownRolesMap[player.id]?.role;
    const roleHistory = state.knownRolesMap[player.id]?.roleHistory || [];

    const handleClick = () => {
      if (state.isGameOver) return;
      if (canAct) handleSelect(player.id, targetType);
      else if (state.nightOver && player.id !== playerId && state.votedPlayerId !== player.id) handleVote(player.id);
    };

    return <Card key={player.id} role={roleToShow!} selectionType={selectionType} onClick={handleClick} roleHistory={state.isGameOver ? roleHistory : []}
    />;
  };

  const renderCenterCard = (index: number) => {
    const cardId = `center-${index}`;
    const isSelected = state.selectedTargets.includes(cardId);
    const roleToShow = state.knownRolesMap[cardId]?.role;

    return (
      <Card
        key={cardId}
        role={roleToShow}
        selectionType={isSelected ? "selected" : ""}
        onClick={() => canAct && handleSelect(cardId, TargetType.Center)}
      />
    );
  };

  const getPosition = (index: number) => {
    const totalPlayers = otherPlayers.length + 1; // including self
    if (totalPlayers === 3) {
      if (index === 0) return { x: 15, y: 50 };
      if (index === 1) return { x: 85, y: 50 };
    }
    if (totalPlayers === 4) {
      switch (index) {
        case 0:
          return { x: 15, y: 50 };
        case 1:
          return { x: 85, y: 50 };
        case 2:
          return { x: 50, y: 15 };
      }
    }
    const angle = (2 * Math.PI * index) / totalPlayers - Math.PI / 2;
    const radius = 35;
    return { x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) };
  };

  return (
    <div className="game-container">
      <div className="turn-text-container">
        <div className="turn-text">{state.nightOver ? "Good morning!" : state.currentTurnRole?.name + " wake up"}</div>

        {state.nightOver && (
          <>
            <div className="timer-container">
              <div className="timer-circle">
                {!state.isGameOver ? (
                  <span>{formatTime(state.timer)}</span>
                ) : (
                  <span
                    className="timer-exit"
                    onClick={() => navigate("/")}
                  >
                    Exit
                  </span>
                )}
              </div>
            </div>
            {!state.isGameOver ? (
              <div className="vote-text">Vote before time runs out!</div>
            ) : (
              <div className="vote-text">
                Winners: {state.winners.map(id => getPlayerNameById(id)).join(", ")}
              </div>
            )}
          </>
        )}
      </div>

      <div className="table-container">
        <div className="role-list">
          {state.roleList.map((role, i) => (
            <div key={i} className="role-item">
              {role.name}
            </div>
          ))}
        </div>

        <div className="table">
          <div className="community-cards">{Array.from({ length: 3 }).map((_, i) => renderCenterCard(i))}</div>

          {currentPlayer && (
            <div className="player-slot player-self">
              {state.isGameOver && <div className="voted-player-name">{getPlayerNameById(state.voteMap?.[playerId])}</div>}
              <div className="player-name">{currentPlayer.name}</div>
              {renderPlayerCard(currentPlayer)}
            </div>
          )}

          {otherPlayers.map((player, i) => {
            const { x, y } = getPosition(i);
            return (
              <div key={player.id} className="player-slot" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}>
                {state.isGameOver && <div className="voted-player-name">{getPlayerNameById(state.voteMap?.[player.id])}</div>}
                <div className="player-name">{player.name}</div>
                {renderPlayerCard(player)}
              </div>
            );
          })}
        </div>
      </div>

      {canAct && !state.nightOver && (
        <div className="action-container">
          <button className="done-button" onClick={handleDone} disabled={!isValidSelection}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}