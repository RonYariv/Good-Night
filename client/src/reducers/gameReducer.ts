import { type GameState, type GameAction } from "../types";

export const initialGameState: GameState = {
  revealedRole: null,
  knownRolesMap: {},
  currentTurnRole: null,
  selectedTargets: [],
  nightOver: false,
  timer: 0,
  votedPlayerId: null,
  roleList: [],
  winners: [],
  isGameOver: false,
  voteMap: {},
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_REVEALED_ROLE":
      return { ...state, revealedRole: action.payload };
    case "SET_KNOWN_ROLES":
      return { ...state, knownRolesMap: action.payload };
    case "MERGE_KNOWN_ROLES":
      return { ...state, knownRolesMap: { ...state.knownRolesMap, ...action.payload } };
    case "SET_CURRENT_TURN":
      return { ...state, currentTurnRole: action.payload, selectedTargets: [] };
    case "SET_SELECTED_TARGETS":
      return { ...state, selectedTargets: action.payload };
    case "SET_NIGHT_OVER":
      return { ...state, nightOver: action.payload, currentTurnRole: null };
    case "SET_TIMER":
      return { ...state, timer: action.payload };
    case "SET_VOTED_PLAYER":
      return { ...state, votedPlayerId: action.payload };
    case "SET_ROLE_LIST":
      return { ...state, roleList: action.payload };
    case "SET_WINNERS":
      return { ...state, winners: action.payload };
    case "SET_GAME_OVER":
      return { ...state, isGameOver: action.payload };
    case "SET_VOTE_MAP":
      return { ...state, voteMap: action.payload };
    default:
      return state;
  }
}
