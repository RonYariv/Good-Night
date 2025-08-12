export class CreateRoomDto {
  name: string;
  host: string;
  maxPlayers: number;
  gameCode: string;
  url: string;
  isPrivate?: boolean;
  password?: string;
}
