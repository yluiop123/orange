import { Controller, Get } from '@nestjs/common';
import { MenusService } from './menus.service';

@Controller('auth')
export class MenusController {
  constructor(private readonly menus: MenusService) {}

  @Get('menus')
  tree() {
    return this.menus.tree();
  }
}
