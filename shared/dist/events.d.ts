export declare enum RoomEvents {
    CreateRoom = "createRoom",
    RoomCreated = "roomCreated",
    JoinRoom = "joinRoom",
    LeaveRoom = "leaveRoom",
    GetRooms = "getRooms",
    PlayerJoined = "playerJoined",
    PlayerLeft = "playerLeft",
    RoomList = "roomList",
    RoomListUpdated = "roomListUpdated",
    RoomByGameCode = "roomByGameCode",
    RoomData = "roomData",
    StartGame = "startGame",
    EndGame = "endGame",
    GameStarted = "gameStarted",
    GameEnded = "gameEnded",
    Error = "error"
}
export declare enum ChatEvents {
    Join = "chat:join",
    Leave = "chat:leave",
    Send = "chat:send",
    NewMessage = "chat:new",
    History = "chat:history",
    Error = "chat:error"
}
export declare enum GameEvents {
    RevealRoles = "revealRoles",
    CurrentRoleTurn = "currentRoleTurn",
    GetCurrentTurn = "getCurrentTurn",
    PlayerAction = "playerAction",
    PlayerActionInfo = "playerActionInfo",
    NightIsOver = "nightIsOver"
}
