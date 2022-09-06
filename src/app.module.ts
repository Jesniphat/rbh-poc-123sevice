import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './cores/core.module';
import { Pck7Module } from './features/pck7/pck7.module';

@Module({
  imports: [CoreModule, Pck7Module],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
