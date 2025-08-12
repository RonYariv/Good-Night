import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomService } from './room.service';
import { RoomGateway } from './room.gateway';
import { Room, RoomSchema } from './schemas/room.schema';
import { GameManagementService } from './gameManagment.service';
import { RoleService } from 'src/roles/role.service';
import { RoleModule } from 'src/roles/role.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
    RoleModule
  ],
  providers: [RoomService, RoomGateway, GameManagementService],
  exports: [RoomService],
})
export class RoomModule {}
