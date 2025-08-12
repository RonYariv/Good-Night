import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Role } from '../../roles/role.schema';

@Schema({ _id: false })
export class PlayerRoleHistory {
  @Prop({ required: true })
  roleId: string;

  @Prop({ required: true })
  assignedAt: number;
}

@Schema({ _id: false })
export class Player {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Role, default: null })
  currentRole: Role | null;


  @Prop({ type: [SchemaFactory.createForClass(PlayerRoleHistory)], default: [] })
  roleHistory: PlayerRoleHistory[];
}

export const PlayerSchema = SchemaFactory.createForClass(Player);
