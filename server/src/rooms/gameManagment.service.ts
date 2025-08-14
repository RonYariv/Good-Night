import { Injectable } from '@nestjs/common';
import { IPlayer, IRole } from '@myorg/shared';
import { RoleService } from 'src/roles/role.service';

interface GameState {
  currentPlayerIndex : number;
  players : IPlayer[];
  centerRoles : IRole[];
}

@Injectable()
export class GameManagementService {
  private games: Map<string, GameState> = new Map();

  constructor(private readonly roleService : RoleService){};


  getCurrentTurnByRoomId(roomId:string){
    const game = this.games.get(roomId);
    if(!game){
        throw new Error('Game does not exist');
    }

    const currentTurnIndex = (game.currentPlayerIndex + 1) % game.players.length;
    return game.players[currentTurnIndex];
  }

  isYourTurn(roomId:string, playerId :string){
    const game = this.games.get(roomId);
    return playerId == game?.players[game.currentPlayerIndex].id;
  }



  async startGame(roomId: string, players: IPlayer[]) {
    console.log(players);
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
    const sortedPlayers = playersWithRoles.sort(
    (a, b) => (a.currentRole?.nightOrder ?? 0) - (b.currentRole?.nightOrder ?? 0)
    );
      
    const gameState: GameState = {
      currentPlayerIndex: 0,
      players : sortedPlayers,
      centerRoles
    };
    this.games.set(roomId, gameState);
    return sortedPlayers;
  }

  handlePlayerAction(roomId: string, playerId: string, action: any) {
    const game = this.games.get(roomId);
    if (!game) {
      throw new Error('Game not started or does not exist');
    }

    // TODO: Implement your game logic here, update game state
    // For example, record player moves, check win conditions, etc.

    // This example just echoes back the action for demo
    return { roomId, playerId, action, gameState: game };
  }
}
