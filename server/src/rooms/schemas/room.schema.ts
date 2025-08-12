import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Player, PlayerSchema } from './player.schema';

export type RoomDocument = Room & Document;

@Schema({ timestamps: true })
export class Room {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  host: string; // host player id

  @Prop({ required: true, min: 1, max: 20 })
  maxPlayers: number;

  @Prop({ default: 0 })
  currentPlayers: number;

  @Prop({ required: true })
  gameCode: string;

  @Prop({ required: true, unique: true })
  url: string;

  @Prop({ default: 'waiting' })
  status: 'waiting' | 'playing' | 'finished';

  @Prop({ type: [PlayerSchema], default: [] })
  players: Player[];

  @Prop({ default: false })
  isPrivate: boolean;

  @Prop({ default: '' })
  password: string;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
