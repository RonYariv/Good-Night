import { IPlayer } from "./player.interface";

export type RoomStatus = 'waiting' | 'playing' | 'finished';

export interface IRoom {
    id: string;
    name: string;
    host: string; // player id of host
    maxPlayers: number;
    currentPlayers: number;
    gameCode: string;
    url: string;
    status: RoomStatus;
    players: IPlayer[];
    isPrivate: boolean;
    password: string;
  }