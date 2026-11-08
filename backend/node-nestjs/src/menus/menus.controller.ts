import { Controller, Get, Headers } from '@nestjs/common';
import { MenusService } from './menus.service';

@Controller('auth')
export class MenusController {
  constructor(private readonly menus: MenusService) {}

  @Get('menus')
  tree(@Headers('locale') locale?: string) {
    return this.menus.tree(locale);
  }
}
