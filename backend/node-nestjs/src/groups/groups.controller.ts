import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiResult } from '../common/response';
import { splitIds } from '../common/query.util';
import { StatusDto } from '../common/status.dto';
import { RequireAuthority } from '../auth/decorators';
import { AddChildGroupDto, EditGroupDto, QueryGroupDto } from './groups.dto';
import { GroupsService } from './groups.service';

@Controller('system/groups')
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Get()
  @RequireAuthority('menu#/system/group')
  list(@Query() query: QueryGroupDto) {
    return this.groups.list(query);
  }

  @Get(':groupId')
  @RequireAuthority('menu#/system/group')
  get(@Param('groupId') groupId: string) {
    return this.groups.get(groupId);
  }

  @Patch(':groupId')
  @RequireAuthority('action#/system/group:edit')
  async edit(@Param('groupId') groupId: string, @Body() dto: EditGroupDto) {
    await this.groups.edit(groupId, dto);
    return ApiResult.message('操作成功');
  }

  @Patch(':groupId/status')
  @RequireAuthority('action#/system/group:edit')
  async updateStatus(@Param('groupId') groupId: string, @Body() dto: StatusDto) {
    await this.groups.updateStatus(groupId, dto.status);
    return ApiResult.message('操作成功');
  }

  @HttpCode(HttpStatus.OK)
  @Post('children')
  @RequireAuthority('action#/system/group:add')
  addChild(@Body() dto: AddChildGroupDto) {
    return this.groups.addChild(dto);
  }

  @Delete(':groupId')
  @RequireAuthority('action#/system/group:delete')
  async removeOne(@Param('groupId') groupId: string) {
    await this.groups.remove([groupId]);
    return ApiResult.message('操作成功');
  }

  @Delete()
  @RequireAuthority('action#/system/group:delete')
  async removeMany(@Query('ids') ids: string) {
    await this.groups.remove(splitIds(ids));
    return ApiResult.message('操作成功');
  }
}
