import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Role } from '../../roles/role.schema';
import { IRole } from '@myorg/shared';

@Schema({ _id: false })
export class Player {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Role, default: null })
  currentRole: Role | null;


  @Prop({ type: [Role], default: [] })
  roleHistory: IRole[];
}

export const PlayerSchema = SchemaFactory.createForClass(Player);
