import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationLog } from '../entities/operation-log.entity';
import { OperationLogController } from './operation-log.controller';
import { OperationLogInterceptor } from './operation-log.interceptor';
import { OperationLogService } from './operation-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([OperationLog])],
  controllers: [OperationLogController],
  providers: [OperationLogService, OperationLogInterceptor],
  exports: [OperationLogService, OperationLogInterceptor],
})
export class OperationLogModule {}
