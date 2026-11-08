import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { RequireAuthority } from '../auth/decorators';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth-user';
import { requiredIds } from '../common/query.util';
import { ApiResult } from '../common/response';
import { AddRoleDto, EditRoleDto, QueryRoleDto } from './roles.dto';
import { RolesService } from './roles.service';

@Controller('system/roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  @RequireAuthority('menu#/system/role')
  list(@Query() query: QueryRoleDto) {
    return this.roles.list(query);
  }

  @Get(':roleId')
  @RequireAuthority('menu#/system/role')
  get(@Param('roleId') roleId: string) {
    return this.roles.get(roleId);
  }

  @HttpCode(HttpStatus.OK)
  @Post()
  @RequireAuthority('action#/system/role:add')
  async create(@Body() dto: AddRoleDto, @CurrentUser() actor: AuthUser) {
    const id = await this.roles.create(dto, actor);
    return ApiResult.of(id, '操作成功');
  }

  @Patch(':roleId')
  @RequireAuthority('action#/system/role:edit')
  async edit(
    @Param('roleId') roleId: string,
    @Body() dto: EditRoleDto,
    @CurrentUser() actor: AuthUser,
  ) {
    await this.roles.edit(roleId, dto, actor);
    return ApiResult.message('操作成功');
  }

  @Delete(':roleId')
  @RequireAuthority('action#/system/role:delete')
  async removeOne(@Param('roleId') roleId: string, @CurrentUser() actor: AuthUser) {
    await this.roles.remove([roleId], actor);
    return ApiResult.message('操作成功');
  }

  @Delete()
  @RequireAuthority('action#/system/role:delete')
  async removeMany(@Query('ids') ids: string, @CurrentUser() actor: AuthUser) {
    await this.roles.remove(requiredIds(ids), actor);
    return ApiResult.message('操作成功');
  }
}
