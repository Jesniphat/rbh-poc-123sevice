import { Module } from '@nestjs/common';
import { Pck7Controller } from './controllers/pck7.controller';
import { Pck7Service } from './services/pck7.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [Pck7Controller],
  providers: [Pck7Service],
})
export class Pck7Module {}
