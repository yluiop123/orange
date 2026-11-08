import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfig } from '../config/app-config';
import { Group } from '../entities/group.entity';
import { LoginAttempt } from '../entities/login-attempt.entity';
import { RevokedToken } from '../entities/revoked-token.entity';
import { User } from '../entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GrantGuard } from './grant-guard';
import { LoginAttemptService } from './login-attempt.service';
import { RefreshTokenCookie } from './refresh-token.cookie';
import { TokenBlacklistService } from './token-blacklist.service';
import { TokenService } from './token.service';
import { UserLookupService } from './user-lookup.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Group, RevokedToken, LoginAttempt]),
    JwtModule.registerAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) =>
        config.jwt.algorithm === 'RS256'
          ? { privateKey: config.jwt.privateKey, publicKey: config.jwt.publicKey }
          : { secret: config.jwt.secret },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    TokenBlacklistService,
    LoginAttemptService,
    UserLookupService,
    RefreshTokenCookie,
    GrantGuard,
  ],
  exports: [
    TokenService,
    TokenBlacklistService,
    LoginAttemptService,
    UserLookupService,
    GrantGuard,
  ],
})
export class AuthModule {}
