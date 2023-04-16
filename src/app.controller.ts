import { Controller, Get } from '@nestjs/common';

@Controller('')
export class AppController {

  @Get('version')
  public getVersion(): string {
    return 'Commit for Maxim';
  }
}
