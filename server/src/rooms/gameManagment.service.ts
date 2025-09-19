import { GameSettings, IPlayer, IRole, PlayerActionResult, WinCondition } from '@myorg/shared';
import { Injectable } from '@nestjs/common';
import { RoleService } from 'src/roles/role.service';

interface VirtualCenter {
  id: string;
  role: IRole;
}

interface GameState {
  currentPlayerIndex: number;
  players: IPlayer[];
  centerRoles: IRole[];
  virtualCenters: VirtualCenter[];
  usedRoleIds: Set<string>;
  voteMap?: Record<string, string>;
}

@Injectable()
export class GameManagementService {
  private games: Map<string, GameState> = new Map();

  constructor(private readonly roleService: RoleService) { };

  private _getRoleTurn(gameCode: string, advance = false): IRole | null {
    const game = this.games.get(gameCode);
    if (!game) throw new Error('Game does not exist');

    if (advance) game.currentPlayerIndex++;

    const actors = [
      ...game.players.map(p => ({ id: p.id, role: p.roleHistory[0] })),
      ...game.virtualCenters.map(c => ({ id: c.id, role: c.role })),
    ].sort((a, b) => (a.role?.nightOrder ?? Infinity) - (b.role?.nightOrder ?? Infinity));

    while (game.currentPlayerIndex < actors.length) {
      const actor = actors[game.currentPlayerIndex];
      if (actor.role && actor.role.nightOrder != null && !game.usedRoleIds.has(actor.role.id)) {
        return actor.role;
      }
      game.currentPlayerIndex++;
    }

    return null;
  }

  isCenterRole(gameCode: string, roleId: string): boolean {
    const game = this.games.get(gameCode)!;
    return game.virtualCenters.some(vc => vc.role.id === roleId);
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

  private buildRolePool(settings: GameSettings, roles: IRole[]) {
    const rolePool: IRole[] = [];
    const mustAssignments: IRole[] = [];

    for (const [roleName, cfg] of Object.entries(settings.roleCountDict)) {
      const roleObj = roles.find(r => r.name === roleName);
      if (!roleObj) continue;

      // Add total count
      rolePool.push(...Array(cfg.count).fill(roleObj));

      // Track must roles separately
      mustAssignments.push(...Array(cfg.must ?? 0).fill(roleObj));
    }

    return { rolePool, mustAssignments };
  }

  private fillPool(rolePool: IRole[], totalNeeded: number, settings: GameSettings, roles: IRole[]) {
    const extraRoles = roles.filter(r => !(r.name in settings.roleCountDict));
    const fallback = extraRoles.length > 0 ? extraRoles : roles;

    let extraIndex = 0;
    while (rolePool.length < totalNeeded) {
      rolePool.push(fallback[extraIndex % fallback.length]);
      extraIndex++;
    }
  }

  private assignRoles(playersCount: number, shuffledPool: IRole[], mustAssignments: IRole[]) {
    const assignedRoles: (IRole | null)[] = Array(playersCount).fill(null);

    const mustCount = Math.min(mustAssignments.length, playersCount);
    const mustRoles = this.shuffle([...mustAssignments]).slice(0, mustCount);
    const mustIndices = this.sampleIndices(playersCount, mustCount);

    // Place must roles
    mustRoles.forEach((role, i) => {
      assignedRoles[mustIndices[i]] = role;
      // Remove one instance from pool to avoid duplication
      const idx = shuffledPool.findIndex(r => r.name === role.name);
      if (idx !== -1) shuffledPool.splice(idx, 1);
    });

    // Fill remaining spots
    let poolPtr = 0;
    for (let i = 0; i < playersCount; i++) {
      if (!assignedRoles[i]) {
        assignedRoles[i] = shuffledPool[poolPtr++] ?? null;
      }
    }

    return assignedRoles;
  }

  private shuffle<T>(arr: T[]) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private sampleIndices(total: number, k: number) {
    const idx = Array.from({ length: total }, (_, i) => i);
    return this.shuffle(idx).slice(0, k);
  }

  votePlayer(gameCode: string, playerId: string, votedPlayerId: string) {
    const game = this.getGameByCode(gameCode);
    if (!game) throw new Error("Game not found");

    if (!game.voteMap) {
      game.voteMap = {};
    }

    // update the vote
    game.voteMap[playerId] = votedPlayerId;

    return game.voteMap;
  }


  roleListByGameCode(gameCode: string): { id: string, role: IRole, roleHistory?: IRole[] }[] {
    const game = this.games.get(gameCode);
    if (!game) return [] as any;
    return [...game.players
      .map(p => ({ id: p.id, role: p.currentRole!, roleHistory: p.roleHistory })), ...game.virtualCenters]
      .sort((a, b) => a.role.name.localeCompare(b.role.name));
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

  getWinningPlayers(gameCode: string): string[] {
    const game = this.games.get(gameCode);
    if (!game) return [];

    const { players, voteMap } = game;
    if (!players || !voteMap) return [];

    // 1. Count votes
    const voteCounts: Record<string, number> = {};
    for (const [voterId, votedId] of Object.entries(voteMap)) {
      if (!votedId) continue;
      voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
    }

    // 2. Find max votes
    const maxVotes = Math.max(0, ...Object.values(voteCounts));
    const deadPlayers = players.filter(p => voteCounts[p.id] === maxVotes);

    // 3. Build winner set
    let winners: string[] = [];

    for (const player of players) {
      const role = player.currentRole;
      if (!role) continue;

      switch (role.winCondition) {
        case WinCondition.SOLO:
          // Wins alone if he's dead
          if (deadPlayers.some(dp => dp.id === player.id)) {
            winners = [player.id]; // SOLO overrides everything
            return winners;
          }
          break;

        case WinCondition.STAYING_ALIVE:
          // Wins if all players of the same role are alive
          const sameRolePlayers = players.filter(p => p.currentRole?.id === role.id);
          const allAlive = sameRolePlayers.every(
            p => !deadPlayers.some(dp => dp.id === p.id)
          );
          if (allAlive) {
            winners.push(player.id);
          }
          break;

        case WinCondition.KILLING_EVIL:
          // Wins if Werewolf is dead
          const werewolves = players.filter(p => p.currentRole?.name === "Werewolf");
          const werewolvesDead = werewolves.every(w =>
            deadPlayers.some(dp => dp.id === w.id)
          );
          if (werewolvesDead) {
            winners.push(player.id);
          }
          break;

        default:
          break;
      }
    }

    return winners;
  }

  async startGame(gameCode: string, players: IPlayer[], gameSettings?: GameSettings) {
    const roles = await this.roleService.list();

    const settings: GameSettings = gameSettings ?? {
      roleCountDict: {
        Seer: { count: 1, must: 0 },
        Werewolf: { count: 2, must: 1 },
      },
    };

    const centerCardsCount = 3;
    const totalNeeded = players.length + centerCardsCount;

    // Step 1: Build initial role pool + must assignments
    const { rolePool, mustAssignments } = this.buildRolePool(settings, roles);

    // Step 2: Ensure pool has enough roles (add fillers if needed)
    this.fillPool(rolePool, totalNeeded, settings, roles);

    // Step 3: Shuffle and separate center roles
    const shuffledPool = this.shuffle([...rolePool]);
    const centerRoles = shuffledPool.splice(0, centerCardsCount);

    // Step 4: Assign must roles
    const assignedRoles = this.assignRoles(players.length, shuffledPool, mustAssignments);

    // Step 5: Map roles to players
    const playersWithRoles = players.map((player, i) => ({
      ...player,
      id: player.id,
      currentRole: assignedRoles[i],
      roleHistory: assignedRoles[i] ? [assignedRoles[i]!] : [],
    }));

    // Step 6: Sort players by role night order
    const sortedPlayers = playersWithRoles.sort((a, b) => {
      const aOrder = a.currentRole?.nightOrder ?? Infinity;
      const bOrder = b.currentRole?.nightOrder ?? Infinity;
      return aOrder - bOrder;
    });

    // Step 7: Build game state
    const virtualCenters: VirtualCenter[] = centerRoles.map((role, i) => ({
      id: `center-${i}`,
      role,
    }));

    const gameState: GameState = {
      currentPlayerIndex: 0,
      players: sortedPlayers,
      centerRoles,
      virtualCenters,
      usedRoleIds: new Set(),
    };

    this.games.set(gameCode, gameState);
    return this.roleListByGameCode(gameCode);
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

  handleCenterAction(gameCode: string, center: VirtualCenter): PlayerActionResult {
    const game = this.games.get(gameCode);
    if (!game) throw new Error('Game not started or does not exist');

    const originalRole = center.role;
    if (!originalRole) throw new Error('Center role not found');

    game.usedRoleIds.add(originalRole.id);
    this.games.set(gameCode, game);

    return {
      gameCode,
      playerId: center.id,
      action: originalRole.actionType,
      info: {},
      targetsIds: [],
    };
  }

}
