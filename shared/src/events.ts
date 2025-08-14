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

export enum GameEvents {
  RevealRoles = "revealRoles",
}