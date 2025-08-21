import { GameSettings, IPlayer, IRole, PlayerActionResult } from '@myorg/shared';
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
      const initialRole = currentPlayer.roleHistory[0];

      if (initialRole && initialRole.nightOrder != null && !game.usedRoleIds.has(initialRole.id)) {
        this.games.set(gameCode, game);
        return initialRole;
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
    const isCenterCard = targetId.startsWith("center-");

    if (isCenterCard) {
      const index = parseInt(targetId.split("-")[1], 10);
      [player.currentRole, game.centerRoles[index]] = [game.centerRoles[index], player.currentRole!];
      newRole = player.currentRole;
    } else {
      const targetPlayer = game.players.find(p => p.id === targetId) as IPlayer;
      if (targetPlayer) {
        [player.currentRole, targetPlayer.currentRole] = [targetPlayer.currentRole, player.currentRole];
        newRole = player.currentRole;
        targetPlayer.roleHistory.push(targetPlayer.currentRole!);
      }
    }

    if (newRole) player.roleHistory.push(newRole);
    if (isCenterCard) return {};

    return { swappedRole: newRole };
  }


  private handleSwapTwoAction(targetsIds: string[], game: GameState): void {
    if (targetsIds.length !== 2) return;

    const first = game.players.find(p => p.id === targetsIds[0]) as IPlayer;
    const second = game.players.find(p => p.id === targetsIds[1]) as IPlayer;

    if (first && second) {
      [first.currentRole, second.currentRole] = [second.currentRole, first.currentRole];
      if (first.currentRole) first.roleHistory.push(first.currentRole);
      if (second.currentRole) second.roleHistory.push(second.currentRole);
    }
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

    const playerInitialRole = game.players.find(p => p.id === playerId)?.roleHistory[0];
    if (!playerInitialRole) return false;

    return playerInitialRole.id === currentRole.id;
  }


  async startGame(gameCode: string, players: IPlayer[], gameSettings?: GameSettings) {
    const roles = await this.roleService.list();
    const settings: GameSettings = gameSettings ??
      { roleCountDict: { Villager: 2, Werewolf: 2 } };

    let rolePool: IRole[] = [];
    Object.entries(settings.roleCountDict).forEach(([roleName, count]) => {
      const roleObj = roles.find(r => r.name === roleName);
      if (roleObj) {
        for (let i = 0; i < count; i++) rolePool.push(roleObj);
      }
    });

    const centerCardsCount = 3;
    const totalNeeded = players.length + centerCardsCount;
    const extraRoles = roles.filter(r => !(r.name in settings.roleCountDict));

    let extraIndex = 0;
    while (rolePool.length < totalNeeded) {
      rolePool.push(extraRoles[extraIndex % extraRoles.length]);
      extraIndex++;
    }

    const shuffledRoles = [...rolePool].sort(() => Math.random() - 0.5);
    const centerRoles = shuffledRoles.splice(0, centerCardsCount);

    const playersWithRoles = players.map((player, index) => {
      const assignedRole = shuffledRoles[index] ?? null;
      return {
        ...player,
        id: player.id,
        currentRole: assignedRole,
        roleHistory: assignedRole ? [assignedRole] : [],
      };
    });

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
    if (!player || !player.roleHistory[0]) throw new Error('Player or role not found');
    const originalRole = player.roleHistory[0];

    const actionType = player.roleHistory[0].actionType;
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
