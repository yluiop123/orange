import { Controller, Get, Query } from '@nestjs/common';
import { RequireAuthority } from '../auth/decorators';
import { QueryOperationLogDto } from './operation-log.dto';
import { OperationLogService } from './operation-log.service';

@Controller('system/operation-logs')
export class OperationLogController {
  constructor(private readonly logs: OperationLogService) {}

  @Get()
  @RequireAuthority('menu#/system/operation-log')
  list(@Query() query: QueryOperationLogDto) {
    return this.logs.query(query);
  }
}
