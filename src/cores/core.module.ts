import { Global, Module } from '@nestjs/common';
import { CoreController } from './controllers/core.controller';
import { CoreService } from './services/core.service';

@Global()
@Module({
  controllers: [CoreController],
  providers: [CoreService],
})
export class CoreModule {}
