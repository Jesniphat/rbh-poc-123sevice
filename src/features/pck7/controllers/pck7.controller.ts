import { Body, Controller, Get, Post } from '@nestjs/common';
import { Pck7Service } from '../services/pck7.service';

@Controller('pck7')
export class Pck7Controller {
  constructor(private readonly pck7Service: Pck7Service) {}

  @Get()
  public async genText(): Promise<any> {
    return await this.pck7Service.genTextData();
  }

  @Post('/decode')
  public async decodeText(@Body('message') message: string) {
    return await this.pck7Service.decodeResponse(message);
  }
}
