import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument } from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { IRoom, RoomStatus, IPlayer } from '@myorg/shared';
import { randomUUID } from 'crypto';

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
  ) { }

  async createRoom(createRoomDto: CreateRoomDto): Promise<RoomDocument> {
    const host: IPlayer = { id: randomUUID(), name: "host", currentRole: null, roleHistory: null };
    const room: RoomDocument = new this.roomModel({
      ...createRoomDto,
      host: host.id,
      gameCode: this.generateGameCode(),
      maxPlayers: 6,
      currentPlayers: 1,
      players: [host],
      status: 'waiting',
    });
    return room.save();
  }

  generateGameCode(length = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars[randomIndex];
    }
    return result;
  }

  async getAllRooms(): Promise<RoomDocument[]> {
    return this.roomModel.find({ isPrivate: false, status: 'waiting' }).exec();
  }

  async getRoomByGameCode(gameCode: string): Promise<RoomDocument> {
    const room = await this.roomModel.findOne({ gameCode }).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return room;
  }

  async joinRoom(roomId: string, playerName: string): Promise<{ room: Promise<RoomDocument>; id: string; }> {
    const room = await this.getRoomByGameCode(roomId);

    if (room.status !== 'waiting') {
      throw new BadRequestException('Game has already started');
    }

    if (room.currentPlayers >= room.maxPlayers) {
      throw new BadRequestException('Room is full');
    }
    const id = randomUUID();
    room.players.push({ id, name: playerName, currentRole: null, roleHistory: [] });
    room.currentPlayers += 1;

    return { room: room.save(), id };
  }

  async leaveRoom(roomId: string, playerId: string): Promise<RoomDocument> {
    const room = await this.getRoomByGameCode(roomId);

    if (!room.players.some(player => player.id === playerId)) {
      throw new BadRequestException('Player not in room');
    }

    room.players = room.players.filter(player => player.id !== playerId);
    room.currentPlayers -= 1;

    // If host leaves, assign new host or close room
    if (room.host === playerId && room.players.length > 0) {
      room.host = room.players[0].id;
    }

    // If no players left, update to finished
    if (room.players.length === 0) {
      await this.roomModel.findByIdAndUpdate(
        roomId,
        { status: "finished" },
        { new: true }
      );
      return room;
    }


    return room.save();
  }

  async updateRoomStatus(roomId: string, status: RoomStatus): Promise<RoomDocument> {
    const room = await this.getRoomByGameCode(roomId);
    room.status = status;
    return room.save();
  }

  async deleteRoom(roomId: string): Promise<void> {
    const result = await this.roomModel.findByIdAndDelete(roomId).exec();
    if (!result) {
      throw new NotFoundException('Room not found');
    }
  }
}
