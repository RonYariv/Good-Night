import { IPlayer, IRole, PlayerActionResult } from '@myorg/shared';
import { Injectable } from '@nestjs/common';
import { RoleService } from 'src/roles/role.service';

interface GameState {
  currentPlayerIndex: number;
  players: IPlayer[];
  centerRoles: IRole[];
  usedRoleIds: Set<string>;
}

@Injectable()
export class GameManagementService {
  private games: Map<string, GameState> = new Map();

  constructor(private readonly roleService: RoleService) { };

  private _getRoleTurn(gameCode: string, advance = false): IRole | null {
    const game = this.games.get(gameCode);
    if (!game) throw new Error('Game does not exist');

    if (advance) {
      game.currentPlayerIndex++;
    }

    while (game.currentPlayerIndex < game.players.length) {
      const currentPlayer = game.players[game.currentPlayerIndex];
      const role = currentPlayer.currentRole;

      if (role && role.nightOrder != null && !game.usedRoleIds.has(role.id)) {
        this.games.set(gameCode, game);
        return role;
      }

      game.currentPlayerIndex++;
    }

    return null;
  }



  private handleNoneAction(): PlayerActionResult['info'] {
    return {};
  }

  private handlePeekAction(targetsIds: string[], game: GameState): PlayerActionResult['info'] {
    const seenRoles = targetsIds.map(id => {
      if (id.startsWith("center-")) {
        const index = parseInt(id.split("-")[1], 10);
        return game.centerRoles[index];
      }
      const targetPlayer = game.players.find(p => p.id === id);
      return targetPlayer?.currentRole! || null;
    });
    return { seenRoles };
  }

  private handleSwapSelfAction(
    player: IPlayer,
    targetsIds: string[],
    game: GameState
  ): PlayerActionResult['info'] {
    if (targetsIds.length !== 1) return {};

    const targetId = targetsIds[0];
    let newRole: IRole | null = player.currentRole;

    if (targetId.startsWith("center-")) {
      const index = parseInt(targetId.split("-")[1], 10);
      [player.currentRole, game.centerRoles[index]] = [game.centerRoles[index], player.currentRole!];
      newRole = {} as IRole;
    } else {
      const targetPlayer = game.players.find(p => p.id === targetId);
      if (targetPlayer) {
        [player.currentRole, targetPlayer.currentRole] = [targetPlayer.currentRole, player.currentRole];
        newRole = player.currentRole;
      }
    }

    return { swappedRole: newRole };
  }


  private handleSwapTwoAction(targetsIds: string[], game: GameState): void {
    if (targetsIds.length !== 2) return;
    const first = game.players.find(p => p.id === targetsIds[0]);
    const second = game.players.find(p => p.id === targetsIds[1]);
    let swappedRoles: { [key: string]: IRole | null } = {};
    if (first && second) {
      [first.currentRole, second.currentRole] = [second.currentRole, first.currentRole];
      swappedRoles[first.id] = first.currentRole;
      swappedRoles[second.id] = second.currentRole;
    }
    return;
  }

  private handleSwapCenterAction(targetsIds: string[], game: GameState): void {
    if (targetsIds.length !== 2) return;
    const index1 = parseInt(targetsIds[0].split("-")[1], 10);
    const index2 = parseInt(targetsIds[1].split("-")[1], 10);
    [game.centerRoles[index1], game.centerRoles[index2]] = [game.centerRoles[index2], game.centerRoles[index1]];
    return;
  }

  getGameByCode(gameCode: string): GameState | undefined {
    return this.games.get(gameCode);
  }

  getRoleTurnByRoomId(gameCode: string) {
    return this._getRoleTurn(gameCode, false);
  }

  advanceRoleTurnByRoomId(gameCode: string) {
    return this._getRoleTurn(gameCode, true);
  }


  isYourTurn(gameCode: string, playerId: string) {
    const game = this.games.get(gameCode);
    if (!game) return false;

    const currentRole = this._getRoleTurn(gameCode, false);
    if (!currentRole) return false;

    const playerRole = game.players.find(p => p.id === playerId)?.currentRole;
    if (!playerRole) return false;

    return playerRole.id === currentRole.id;
  }


  async startGame(gameCode: string, players: IPlayer[]) {
    const roles = await this.roleService.list();

    // Shuffle roles
    const shuffledRoles = [...roles].sort(() => Math.random() - 0.5);

    // Take 3 roles out (these will NOT be given to players)
    const centerRoles = shuffledRoles.splice(0, 3);

    // Assign the remaining shuffled roles to players (1 per player, no repeats)
    const playersWithRoles = players.map((player, index) => ({
      ...player,
      id: player.id,
      currentRole: shuffledRoles[index] ?? null,
    }));

    // Sort players by nightOrder of their assigned role
    const sortedPlayers = playersWithRoles.sort((a, b) => {
      const aOrder = a.currentRole?.nightOrder ?? Infinity;
      const bOrder = b.currentRole?.nightOrder ?? Infinity;
      return aOrder - bOrder;
    });

    const gameState: GameState = {
      currentPlayerIndex: 0,
      players: sortedPlayers,
      centerRoles,
      usedRoleIds: new Set(),
    };
    this.games.set(gameCode, gameState);
    return sortedPlayers;
  }

  handlePlayerAction(gameCode: string, playerId: string, targetsIds: string[]): PlayerActionResult {
    const game = this.games.get(gameCode);
    if (!game) throw new Error('Game not started or does not exist');

    const player = game.players.find(p => p.id === playerId);
    if (!player || !player.currentRole) throw new Error('Player or role not found');
    const originalRole = player.currentRole;

    const actionType = player.currentRole.actionType;
    let info: PlayerActionResult['info'] = {};

    switch (actionType) {
      case "none":
        info = this.handleNoneAction();
        break;
      case "peek":
        info = this.handlePeekAction(targetsIds, game);
        break;
      case "swapSelf":
        info = this.handleSwapSelfAction(player, targetsIds, game);
        break;
      case "swapTwo":
        this.handleSwapTwoAction(targetsIds, game);
        break;
      case "swapCenter":
        this.handleSwapCenterAction(targetsIds, game);
        break;
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }

    game.usedRoleIds.add(originalRole.id);
    this.games.set(gameCode, game);

    return { gameCode, playerId, action: actionType, info, targetsIds };
  }
}
