import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../entities/permission.entity';
import { PermissionI18n } from '../entities/permission-i18n.entity';
import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, PermissionI18n])],
  controllers: [MenusController],
  providers: [MenusService],
})
export class MenusModule {}
