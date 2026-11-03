import { Body, Controller, Delete, Get, Header, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { RequireAuthority } from '../auth/decorators';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth-user';
import { splitIds } from '../common/query.util';
import { ApiResult } from '../common/response';
import { StatusDto } from '../common/status.dto';
import { AddUserDto, EditUserDto, QueryUserDto } from './users.dto';
import { UsersService } from './users.service';

@Controller('system/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequireAuthority('menu#/system/user')
  list(@Query() query: QueryUserDto) {
    return this.users.list(query);
  }

  @Get(':userId')
  @RequireAuthority('menu#/system/user')
  get(@Param('userId') userId: string) {
    return this.users.get(userId);
  }

  @HttpCode(HttpStatus.OK)
  @Post()
  @RequireAuthority('action#/system/user:add')
  async create(@Body() dto: AddUserDto, @CurrentUser() actor: AuthUser) {
    const temporaryPassword = await this.users.create(dto, actor);
    return ApiResult.of(temporaryPassword, '操作成功');
  }

  @Patch(':userId')
  @RequireAuthority('action#/system/user:edit')
  async edit(
    @Param('userId') userId: string,
    @Body() dto: EditUserDto,
    @CurrentUser() actor: AuthUser,
  ) {
    await this.users.edit(userId, dto, actor);
    return ApiResult.message('操作成功');
  }

  @Patch(':userId/status')
  @RequireAuthority('action#/system/user:edit')
  async updateStatus(
    @Param('userId') userId: string,
    @Body() dto: StatusDto,
    @CurrentUser() actor: AuthUser,
  ) {
    await this.users.updateStatus(userId, dto.status, actor);
    return ApiResult.message('操作成功');
  }

  @HttpCode(HttpStatus.OK)
  @Post(':userId/reset-password')
  @Header('Cache-Control', 'no-store')
  @RequireAuthority('action#/system/user:edit')
  async resetPassword(@Param('userId') userId: string, @CurrentUser() actor: AuthUser) {
    const temporaryPassword = await this.users.resetPassword(userId, actor);
    return ApiResult.of(temporaryPassword, '操作成功');
  }

  @Delete(':userId')
  @RequireAuthority('action#/system/user:delete')
  async removeOne(@Param('userId') userId: string, @CurrentUser() actor: AuthUser) {
    await this.users.remove([userId], actor);
    return ApiResult.message('删除成功');
  }

  @Delete()
  @RequireAuthority('action#/system/user:delete')
  async removeMany(@Query('ids') ids: string, @CurrentUser() actor: AuthUser) {
    await this.users.remove(splitIds(ids), actor);
    return ApiResult.message('删除成功');
  }
}
