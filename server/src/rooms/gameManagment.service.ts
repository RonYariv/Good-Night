import { Injectable } from '@nestjs/common';
import { IPlayer, IRole } from '@myorg/shared';
import { RoleService } from 'src/roles/role.service';

interface GameState {
  currentPlayerIndex: number;
  players: IPlayer[];
  centerRoles: IRole[];
}

@Injectable()
export class GameManagementService {
  private games: Map<string, GameState> = new Map();

  constructor(private readonly roleService: RoleService) { };

  private _getRoleTurn(gameCode: string, advance = false) {
    const game = this.games.get(gameCode);
    if (!game) throw new Error('Game does not exist');

    let currentIndex = game.currentPlayerIndex;

    if (advance) {
      currentIndex++;
      game.currentPlayerIndex = currentIndex;
      this.games.set(gameCode, game);
    }

    if (currentIndex >= game.players.length) return null;

    const currentPlayer = game.players[currentIndex];
    return currentPlayer.currentRole?.nightOrder != null ? currentPlayer.currentRole : null;
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
      centerRoles
    };
    this.games.set(gameCode, gameState);
    return sortedPlayers;
  }

  handlePlayerAction(gameCode: string, playerId: string, action: any) {
    const game = this.games.get(gameCode);
    if (!game) {
      throw new Error('Game not started or does not exist');
    }

    // TODO: Implement your game logic here, update game state
    // For example, record player moves, check win conditions, etc.

    // This example just echoes back the action for demo
    return { gameCode, playerId, action, gameState: game };
  }
}
