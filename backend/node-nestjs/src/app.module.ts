import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AuthoritiesGuard } from './auth/authorities.guard';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { FallbackModule } from './common/fallback.module';
import { ResponseInterceptor } from './common/response.interceptor';
import { buildValidationPipe } from './common/validation';
import { AppConfig, AppConfigModule } from './config/app-config';
import { ENTITIES } from './entities';
import { GroupsModule } from './groups/groups.module';
import { MenusModule } from './menus/menus.module';
import { OperationLogInterceptor } from './operation-log/operation-log.interceptor';
import { OperationLogModule } from './operation-log/operation-log.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        type: 'postgres' as const,
        host: config.db.host,
        port: config.db.port,
        username: config.db.user,
        password: config.db.password,
        database: config.db.name,
        entities: ENTITIES,
        synchronize: false,
        logging: false,
        ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
        extra: { max: 10 },
      }),
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    GroupsModule,
    PermissionsModule,
    MenusModule,
    OperationLogModule,
    FallbackModule,
  ],
  providers: [
    { provide: APP_PIPE, useValue: buildValidationPipe() },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: AuthoritiesGuard },
    { provide: APP_INTERCEPTOR, useClass: OperationLogInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
