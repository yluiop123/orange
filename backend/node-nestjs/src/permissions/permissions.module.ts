import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../entities/permission.entity';
import { PermissionI18n } from '../entities/permission-i18n.entity';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, PermissionI18n, Role, User])],
  controllers: [PermissionsController],
  providers: [PermissionsService],
})
export class PermissionsModule {}
