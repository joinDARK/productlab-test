import { Module } from '@nestjs/common';
import { AvitoService } from './avito.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WebsocketModule } from 'src/websocket/websocket.module';

@Module({
  imports: [ConfigModule, WebsocketModule],
  providers: [ConfigService, AvitoService],
})
export class AvitoModule {}
