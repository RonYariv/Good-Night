import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomEvents, ChatEvents } from '../shared/events';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { GameManagementService } from './gameManagment.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/rooms',
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly roomService: RoomService, private readonly gameManagmentService : GameManagementService) {}

  @WebSocketServer()
  server: Server;

  private roomIdToMessages: Map<string, IChatMessage[]> = new Map();
  private maxHistoryPerRoom = 100;

  // Connection handling
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Room management
  @SubscribeMessage(RoomEvents.CreateRoom)
  async handleCreateRoom(
    @MessageBody() createRoomDto: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = await this.roomService.createRoom(createRoomDto);
      client.join(room.id);
      client.emit(RoomEvents.RoomCreated, room);
      this.server.emit(RoomEvents.RoomListUpdated);
      return { success: true, room };
    } catch (error: any) {
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
      const room = await this.roomService.joinRoom(data.roomId, data.playerName);
      client.join(data.roomId);

      // Send chat history
      const history = this.roomIdToMessages.get(data.roomId) ?? [];
      client.emit(ChatEvents.History, history);

      this.server.to(data.roomId).emit(RoomEvents.PlayerJoined, {
        playerName: data.playerName,
        room,
      });
      this.server.emit(RoomEvents.RoomListUpdated);
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
      const room = this.roomService.leaveRoom(data.roomId, data.playerId);
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
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = await this.roomService.updateRoomStatus(data.roomId, 'playing');
      this.server.to(data.roomId).emit(RoomEvents.GameStarted, room);
      this.server.emit(RoomEvents.RoomListUpdated);
      this.gameManagmentService.startGame(room.id, room.players);
      const currentPlayerTurn = this.gameManagmentService.getCurrentTurnByRoomId(room.id);
      this.server.to(data.roomId).emit(RoomEvents.CurrentPlayerTurn, currentPlayerTurn);
      return { success: true, room };
    } catch (error: any) {
      client.emit(RoomEvents.Error, { message: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage(RoomEvents.PlayerAction)
  async handlePlayerAction(
    @MessageBody() data: { roomId: string; playerId: string; action: any },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Check if it is this player's turn before processing
      if (this.gameManagmentService.isYourTurn(data.roomId, data.playerId)) {
        client.emit(RoomEvents.Error, { message: 'Not your turn' });
        return { success: false, error: 'Not your turn' };
      }

      // Get the next player's turn after processing
      const nextPlayerTurn = this.gameManagmentService.getCurrentTurnByRoomId(data.roomId);

      // Broadcast current turn to all players in the room
      this.server.to(data.roomId).emit(RoomEvents.CurrentPlayerTurn, nextPlayerTurn);

      return { success: true };
    } catch (error: any) {
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