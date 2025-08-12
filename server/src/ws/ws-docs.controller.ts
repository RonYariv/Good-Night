import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ChatEvents, RoomEvents, RoleEvents, PlayerEvents } from '../shared/events';

@ApiTags('ws')
@Controller('ws-docs')
export class WsDocsController {
  @Get()
  @ApiOkResponse({ description: 'WebSocket events and payload schemas' })
  getWsDocs() {
    return {
      namespace: '/rooms',
      room: {
        clientToServer: {
          [RoomEvents.CreateRoom]: {
            body: {
              name: 'string',
              host: 'string',
              maxPlayers: 'number',
              gameCode: 'string',
              url: 'string',
              isPrivate: 'boolean? (optional)',
              password: 'string? (optional)'
            }
          },
          [RoomEvents.JoinRoom]: { body: { roomId: 'string', playerId: 'string' } },
          [RoomEvents.LeaveRoom]: { body: { roomId: 'string', playerId: 'string' } },
          [RoomEvents.GetRooms]: { body: null },
          [RoomEvents.StartGame]: { body: { roomId: 'string' } },
          [RoomEvents.EndGame]: { body: { roomId: 'string' } }
        },
        serverToClient: {
          [RoomEvents.RoomCreated]: { data: 'Room' },
          [RoomEvents.PlayerJoined]: { data: { playerId: 'string', room: 'Room' } },
          [RoomEvents.PlayerLeft]: { data: { playerId: 'string', room: 'Room' } },
          [RoomEvents.RoomList]: { data: 'Room[]' },
          [RoomEvents.RoomListUpdated]: { data: null },
          [RoomEvents.GameStarted]: { data: 'Room' },
          [RoomEvents.GameEnded]: { data: 'Room' },
          [RoomEvents.Error]: { data: { message: 'string' } }
        }
      },
      chat: {
        clientToServer: {
          [ChatEvents.Join]: { body: { roomId: 'string', userId: 'string' } },
          [ChatEvents.Send]: { body: { roomId: 'string', senderId: 'string', text: 'string' } },
          [ChatEvents.Leave]: { body: { roomId: 'string' } }
        },
        serverToClient: {
          [ChatEvents.History]: { data: '[{ roomId: string, senderId: string, text: string, at: number }]'} ,
          [ChatEvents.NewMessage]: { data: '{ roomId: string, senderId: string, text: string, at: number }' },
          [ChatEvents.Error]: { data: { message: 'string' } }
        }
      },
      roles: {
        clientToServer: {
          [RoleEvents.Create]: { body: { name: 'string', winCondition: 'Villagers|Adversaries|Solo', nightOrder: 'number' } },
          [RoleEvents.List]: { body: null },
          [RoleEvents.Update]: { body: '{ id: string } & Partial<{ name: string, winCondition: string, nightOrder: number }>' },
          [RoleEvents.Delete]: { body: { id: 'string' } },
        },
        serverToClient: {
          [RoleEvents.Created]: { data: 'Role' },
          [RoleEvents.Updated]: { data: 'Role' },
          [RoleEvents.Deleted]: { data: '{ id: string }' },
          [RoleEvents.Error]: { data: '{ message: string }' },
        }
      },
      players: {
        clientToServer: {
          [PlayerEvents.Create]: { body: { name: 'string' } },
          [PlayerEvents.List]: { body: null },
          [PlayerEvents.Get]: { body: { id: 'string' } },
          [PlayerEvents.SetRole]: { body: { playerId: 'string', roleId: 'string' } },
        },
        serverToClient: {
          [PlayerEvents.Created]: { data: 'Player' },
          [PlayerEvents.Updated]: { data: 'Player' },
          [PlayerEvents.Error]: { data: '{ message: string }' },
        }
      }
    };
  }
}
