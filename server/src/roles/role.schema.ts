import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { WinCondition } from '../shared/enums/winCondition.enum';

@Schema({ timestamps: true })
export class Role {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: WinCondition })
  winCondition: WinCondition;

  @Prop({ required: true })
  nightOrder: number;
}

export type RoleDocument = Role & Document;
export const RoleSchema = SchemaFactory.createForClass(Role);
