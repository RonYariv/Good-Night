import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { instrument } from '@socket.io/admin-ui';
import { Namespace, Server, Socket } from 'socket.io';
import { ChatEvents, RoomEvents, IChatMessage, GameEvents, IPlayer } from '@myorg/shared';
import { CreateRoomDto } from './dto/create-room.dto';
import { GameManagementService } from './gameManagment.service';
import { RoomService } from './room.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/rooms',
})
export class RoomGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  constructor(
    private readonly roomService: RoomService,
    private readonly gameManagmentService: GameManagementService,
  ) { }

  @WebSocketServer()
  server: Server;

  private roomIdToMessages: Map<string, IChatMessage[]> = new Map();
  private maxHistoryPerRoom = 100;

  afterInit(nameSpace: Namespace) {
    instrument(nameSpace.server, {
      auth: false,
      mode: 'production',
    });
  }

  // Connection handling
  handleConnection(client: Socket) {
    //console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    //console.log(`Client disconnected: ${client.id}`);
  }

  // Room management
  @SubscribeMessage(RoomEvents.CreateRoom)
  async handleCreateRoom(
    @MessageBody() createRoomDto: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = await this.roomService.createRoom(createRoomDto);
      client.join(room.gameCode);
      client.emit(RoomEvents.RoomCreated, room);
      this.server.emit(RoomEvents.RoomListUpdated);
      return { success: true, room };
    } catch (error: any) {
      console.log(error);
      client.emit(RoomEvents.Error, { message: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage(RoomEvents.JoinRoom)
  async handleJoinRoom(
    @MessageBody() data: { roomId: string; playerName: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const result = await this.roomService.joinRoom(data.roomId, data.playerName);
      client.join(data.roomId);

      const room = await result.room;
      const id = result.id;

      this.server.to(data.roomId).emit(RoomEvents.PlayerJoined, {
        room,
        playerId: id
      });
      this.server.emit(RoomEvents.RoomListUpdated);
      return { success: true, room };
    } catch (error: any) {
      console.log(error);
      client.emit(RoomEvents.Error, { message: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage(RoomEvents.RoomByGameCode)
  async handleGetRoomByGameCode(
    @MessageBody() data: { gameCode: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { gameCode } = data;
      client.join(gameCode);

      const room = await this.roomService.getRoomByGameCode(gameCode);
      if (!room) {
        client.emit(RoomEvents.Error, { message: 'Room not found' });
        return { success: false, error: 'Room not found' };
      }

      client.emit(RoomEvents.RoomData, room);

      // Send chat history
      const history = this.roomIdToMessages.get(room.gameCode) ?? [];
      client.emit(ChatEvents.History, history);

      return { success: true, room };
    } catch (error: any) {
      client.emit(RoomEvents.Error, { message: error.message });
      return { success: false, error: error.message };
    }
  }


  @SubscribeMessage(RoomEvents.LeaveRoom)
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string; playerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = await this.roomService.leaveRoom(data.roomId, data.playerId);
      client.leave(data.roomId);
      this.server.to(data.roomId).emit(RoomEvents.PlayerLeft, {
        playerId: data.playerId,
        room,
      });
      this.server.emit(RoomEvents.RoomListUpdated);
      return { success: true, room };
    } catch (error: any) {
      client.emit(RoomEvents.Error, { message: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage(RoomEvents.StartGame)
  async handleStartGame(
    @MessageBody() data: { gameCode: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // 1. Update room status
      const room = await this.roomService.updateRoomStatus(data.gameCode, 'playing');

      // 2. Emit general events
      this.server.to(data.gameCode).emit(RoomEvents.GameStarted, room);
      this.server.emit(RoomEvents.RoomListUpdated);

      // 3. Start game logic
      const playersWithRoles: IPlayer[] = await this.gameManagmentService.startGame(data.gameCode, room.players);

      // 4. Emit current turn
      const currentRole = this.gameManagmentService.getRoleTurnByRoomId(data.gameCode);
      if (!currentRole) {
        this.server.to(data.gameCode).emit(GameEvents.NightIsOver);
        return { success: true };
      }
      this.server.to(data.gameCode).emit(GameEvents.CurrentRoleTurn, currentRole);

      // 5. Emit all roles
      const rolesData = playersWithRoles.map(p => ({
        playerId: p.id,
        role: p.currentRole,
      }));
      this.server.to(data.gameCode).emit(GameEvents.RevealRoles, { roles: rolesData });

      return { success: true, room };
    } catch (error: any) {
      console.log(error);
      client.emit(RoomEvents.Error, { message: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage(GameEvents.GetCurrentTurn)
  async handleGetCurrentTurn(
    @MessageBody() data: { gameCode: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      client.join(data.gameCode);
      
      const game = this.gameManagmentService.getGameByCode(data.gameCode);
      const rolesData = game?.players.map(p => ({
        playerId: p.id,
        role: p.roleHistory[0],
      }));
      client.emit(GameEvents.RevealRoles, { roles: rolesData });
      
      const currentRole = this.gameManagmentService.getRoleTurnByRoomId(data.gameCode);
      if (!currentRole) {
        client.emit(GameEvents.NightIsOver);
        return { success: true };
      }

      client.emit(GameEvents.CurrentRoleTurn, currentRole);

      return { success: true, currentRoleId: currentRole.id };
    } catch (error: any) {
      client.emit(RoomEvents.Error, { message: error.message });
      return { success: false, error: error.message };
    }
  }



  @SubscribeMessage(GameEvents.PlayerAction)
  async handlePlayerAction(
    @MessageBody() data: { gameCode: string; playerId: string; targetsIds: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!this.gameManagmentService.isYourTurn(data.gameCode, data.playerId)) {
        client.emit(RoomEvents.Error, { message: 'Not your turn' });
        return { success: false, error: 'Not your turn' };
      }

      const actionResult = this.gameManagmentService.handlePlayerAction(data.gameCode, data.playerId, data.targetsIds);

      client.emit(GameEvents.PlayerActionInfo, actionResult);

      // Get the next player's turn after processing
      const nextRole = this.gameManagmentService.advanceRoleTurnByRoomId(data.gameCode);

      if (!nextRole) {
        this.server.to(data.gameCode).emit(GameEvents.NightIsOver);
        return { success: true };
      }

      // Broadcast current turn to all players in the room
      this.server.to(data.gameCode).emit(GameEvents.CurrentRoleTurn, nextRole);

      return { success: true };
    } catch (error: any) {
      console.log(error);
      client.emit(RoomEvents.Error, { message: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage(RoomEvents.EndGame)
  async handleEndGame(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = this.roomService.updateRoomStatus(data.roomId, 'finished');
      this.server.to(data.roomId).emit(RoomEvents.GameEnded, room);
      this.server.emit(RoomEvents.RoomListUpdated);
      return { success: true, room };
    } catch (error: any) {
      client.emit(RoomEvents.Error, { message: error.message });
      return { success: false, error: error.message };
    }
  }

  // Chat system
  @SubscribeMessage(ChatEvents.Send)
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; senderId: string; text: string },
  ) {
    const { roomId, senderId, text } = data || {};
    if (!roomId || !senderId || !text?.trim()) {
      client.emit(ChatEvents.Error, { message: 'roomId, senderId and text are required' });
      return;
    }

    const message: IChatMessage = {
      roomId,
      senderId,
      text: text.trim(),
      at: Date.now(),
    };

    const list = this.roomIdToMessages.get(roomId) ?? [];
    list.push(message);
    if (list.length > this.maxHistoryPerRoom) {
      list.splice(0, list.length - this.maxHistoryPerRoom);
    }
    this.roomIdToMessages.set(roomId, list);

    this.server.to(roomId).emit(ChatEvents.NewMessage, message);
  }
}