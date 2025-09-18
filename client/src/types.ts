// types.ts
import { type IRole } from "@myorg/shared";

export interface GameState {
  revealedRole: IRole | null;
  knownRolesMap: Record<string, IRole>;
  currentTurnRole: IRole | null;
  selectedTargets: string[];
  nightOver: boolean;
  timer: number;
  votedPlayerId: string | null;
  roleList: IRole[];
  winners: string[];
  isGameOver: boolean;
  voteMap: Record<string, string>;
}

export type GameAction =
  | { type: "SET_REVEALED_ROLE"; payload: IRole | null }
  | { type: "SET_KNOWN_ROLES"; payload: Record<string, IRole> }
  | { type: "SET_CURRENT_TURN"; payload: IRole | null }
  | { type: "SET_SELECTED_TARGETS"; payload: string[] }
  | { type: "SET_NIGHT_OVER"; payload: boolean }
  | { type: "SET_TIMER"; payload: number }
  | { type: "SET_VOTED_PLAYER"; payload: string | null }
  | { type: "SET_ROLE_LIST"; payload: IRole[] }
  | { type: "SET_WINNERS"; payload: string[] }
  | { type: "SET_GAME_OVER"; payload: boolean }
  | { type: "SET_VOTE_MAP"; payload: Record<string, string> }
  | { type: "MERGE_KNOWN_ROLES"; payload: Record<string, IRole> };