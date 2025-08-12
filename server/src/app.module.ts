import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WsDocsController } from './ws/ws-docs.controller';
import { RoleModule } from './roles/role.module';
import { RoomModule } from './rooms/room.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://ronyariv:Squackduck0024@good-night.n5yqwjg.mongodb.net/?retryWrites=true&w=majority&appName=Good-Night'),
    RoleModule,
    RoomModule
  ],
  controllers: [AppController, WsDocsController],
  providers: [AppService],
})
export class AppModule {}
