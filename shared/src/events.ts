export enum RoomEvents {
  CreateRoom = 'createRoom',
  RoomCreated = 'roomCreated',
  JoinRoom = 'joinRoom',
  LeaveRoom = 'leaveRoom',
  GetRooms = 'getRooms',
  PlayerJoined = 'playerJoined',
  PlayerLeft = 'playerLeft',
  PlayerAction = 'PlayerAction',
  RoomList = 'roomList',
  RoomListUpdated = 'roomListUpdated',
  RoomByGameCode = 'roomByGameCode',
  RoomData = 'roomData',
  StartGame = 'startGame',
  EndGame = 'endGame',
  GameStarted = 'gameStarted',
  GameEnded = 'gameEnded',
  CurrentPlayerTurn = 'CurrentPlayerTurn',
  Error = 'error',
}

export enum ChatEvents {
  Join = 'chat:join',
  Leave = 'chat:leave',
  Send = 'chat:send',
  NewMessage = 'chat:new',
  History = 'chat:history',
  Error = 'chat:error',
}

export enum RoleEvents {
  Create = 'role:create',
  List = 'role:list',
  Update = 'role:update',
  Delete = 'role:delete',
  Created = 'role:created',
  Updated = 'role:updated',
  Deleted = 'role:deleted',
  Error = 'role:error',
}

export enum PlayerEvents {
  Create = 'player:create',
  List = 'player:list',
  Get = 'player:get',
  SetRole = 'player:setRole',
  Created = 'player:created',
  Updated = 'player:updated',
  Error = 'player:error',
}
