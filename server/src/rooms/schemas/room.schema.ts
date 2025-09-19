import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Player, PlayerSchema } from './player.schema';

export type RoomDocument = Room & Document;

@Schema({ timestamps: true })
export class Room {
  @Prop({ required: true })
  gameCode: string;

  @Prop({ required: true })
  host: string; // host player id

  @Prop({ required: true, min: 1, max: 20 })
  maxPlayers: number;

  @Prop({ default: 0 })
  currentPlayers: number;

  @Prop({ default: 'waiting' })
  status: 'waiting' | 'playing' | 'finished' | 'closed';

  @Prop({ type: [PlayerSchema], default: [] })
  players: Player[];

  @Prop({ default: false })
  isPrivate: boolean;

  @Prop({ default: '' })
  password: string;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
RoomSchema.virtual('id').get(function () {
  return this._id.toString();
});

// Enable virtuals in toJSON and toObject output:
RoomSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,   // optionally hide __v
  transform: function (doc, ret: any) {
    delete ret._id;
  }
});

RoomSchema.set('toObject', {
  virtuals: true,
});
