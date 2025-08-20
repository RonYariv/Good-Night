import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RoleAction, TargetType, WinCondition } from '@myorg/shared';

@Schema({ timestamps: true })
export class Role {
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: WinCondition })
  winCondition: WinCondition;

  @Prop()
  nightOrder: number;

  @Prop({ required: true, enum: RoleAction })
  actionType: RoleAction;

  @Prop({ default: 0 })
  maxTargets: number;

  @Prop({ type: [String], enum: TargetType, default: [] })
  targetTypes: TargetType[];
}

export type RoleDocument = Role & Document;
export const RoleSchema = SchemaFactory.createForClass(Role);

RoleSchema.virtual('id').get(function () {
  return this._id.toString();
});

// Enable virtuals in toJSON and toObject output:
RoleSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,   // optionally hide __v
  transform: function (doc, ret: any) {
    delete ret._id;
  }
});

RoleSchema.set('toObject', {
  virtuals: true,
});