import { useEffect, useReducer } from "react";
import { socketService } from "../services/socket.service";
import { GameEvents, type IRole, type PlayerActionResult, type IPlayer } from "@myorg/shared";
import { gameReducer, initialGameState } from "../reducers/gameReducer";
import { type KnownRolesMap } from "../types";

export function useGameSocket(gameCode: string, playerId: string, players: IPlayer[]) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  useEffect(() => {
    if (!socketService.socket) {
      socketService.connect();
    }

    socketService.emit(GameEvents.GetCurrentTurn, { gameCode });

    const handleRevealRoles = (data: { roles: { id: string; role: IRole }[] }) => {
      const myRole = data.roles.find(r => r.id === playerId)?.role;
      dispatch({ type: "SET_ROLE_LIST", payload: data.roles.map(r => r.role) });
      if (myRole) dispatch({ type: "SET_REVEALED_ROLE", payload: myRole });

      if (myRole?.canSeeTeammates) {
        const teamMates = data.roles.filter(r => r.role.id === myRole.id && r.id !== playerId);
        const teamMap: KnownRolesMap = {};
        for (const mate of teamMates) {
          teamMap[mate.id] = { role: mate.role, roleHistory: [mate.role] };
        }
        dispatch({ type: "MERGE_KNOWN_ROLES", payload: teamMap });
      }
    };

    const handleCurrentTurn = (role: IRole) =>
      dispatch({ type: "SET_CURRENT_TURN", payload: role });

    const handleNightIsOver = () =>
      dispatch({ type: "SET_NIGHT_OVER", payload: true });

    const handlePlayerActionInfo = (res: PlayerActionResult) => {
      const { info, targetsIds } = res;
      if (info?.seenRoles) {
        const newSeenRoles: KnownRolesMap = {};
        info.seenRoles.forEach((role, index) => {
          const targetId = targetsIds[index];
          newSeenRoles[targetId] = { role, roleHistory: [role] };
        });
        dispatch({ type: "MERGE_KNOWN_ROLES", payload: newSeenRoles });
      }
      if (info?.swappedRole) {
        dispatch({ type: "SET_REVEALED_ROLE", payload: info.swappedRole });
      }
    };

    const handleVotingTimer = (data: { remainingSeconds: number }) =>
      dispatch({ type: "SET_TIMER", payload: data.remainingSeconds });

    const handleGameIsOver = (data: {
      voteMap: Record<string, string>;
      winners: string[];
      roles: { id: string; role: IRole; roleHistory?: IRole[] }[];
    }) => {
      const knownRoles: KnownRolesMap = data.roles.reduce((acc, curr) => {
        acc[curr.id] = {
          role: curr.role,
          roleHistory: curr.roleHistory ?? [],
        };
        return acc;
      }, {} as KnownRolesMap);

      dispatch({ type: "SET_KNOWN_ROLES", payload: knownRoles });
      dispatch({
        type: "SET_REVEALED_ROLE",
        payload: data.roles.find(r => r.id === playerId)?.role || null,
      });
      dispatch({ type: "SET_WINNERS", payload: data.winners });
      dispatch({ type: "SET_VOTE_MAP", payload: data.voteMap });
      dispatch({ type: "SET_GAME_OVER", payload: true });
    };

    const handlers: [string, (...args: any[]) => void][] = [
      [GameEvents.RevealRoles, handleRevealRoles],
      [GameEvents.CurrentRoleTurn, handleCurrentTurn],
      [GameEvents.NightIsOver, handleNightIsOver],
      [GameEvents.PlayerActionInfo, handlePlayerActionInfo],
      [GameEvents.VotingTimer, handleVotingTimer],
      [GameEvents.GameIsOver, handleGameIsOver],
    ];

    handlers.forEach(([event, fn]) => socketService.on(event, fn));

    return () => handlers.forEach(([event, fn]) => socketService.off(event, fn));
  }, [gameCode, playerId, players]);

  return { state, dispatch };
}