import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { RequireAuthority } from '../auth/decorators';
import { requiredIds } from '../common/query.util';
import { ApiResult } from '../common/response';
import { AddChildPermissionDto, EditPermissionDto, QueryPermissionDto } from './permissions.dto';
import { PermissionsService } from './permissions.service';

@Controller('system/permissions')
export class PermissionsController {
  constructor(private readonly permissions: PermissionsService) {}

  @Get()
  @RequireAuthority('menu#/system/permission')
  list(@Query() query: QueryPermissionDto) {
    return this.permissions.list(query);
  }

  @Get(':permissionId')
  @RequireAuthority('menu#/system/permission')
  get(@Param('permissionId') permissionId: string) {
    return this.permissions.get(permissionId);
  }

  @Patch(':permissionId')
  @RequireAuthority('action#/system/permission:edit')
  async edit(@Param('permissionId') permissionId: string, @Body() dto: EditPermissionDto) {
    await this.permissions.edit(permissionId, dto);
    return ApiResult.message('操作成功');
  }

  @HttpCode(HttpStatus.OK)
  @Post('children')
  @RequireAuthority('action#/system/permission:add')
  addChild(@Body() dto: AddChildPermissionDto) {
    return this.permissions.addChild(dto);
  }

  @Delete(':permissionId')
  @RequireAuthority('action#/system/permission:delete')
  async removeOne(@Param('permissionId') permissionId: string) {
    await this.permissions.remove([permissionId]);
    return ApiResult.message('操作成功');
  }

  @Delete()
  @RequireAuthority('action#/system/permission:delete')
  async removeMany(@Query('ids') ids: string) {
    await this.permissions.remove(requiredIds(ids));
    return ApiResult.message('操作成功');
  }
}
