import { Module, NestModule } from '@nestjs/common';
import { WebsocketModule } from './websocket/websocket.module';
import { AvitoModule } from './avito/avito.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    WebsocketModule,
    AvitoModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
})
export class AppModule implements NestModule {
  configure() {}
}
