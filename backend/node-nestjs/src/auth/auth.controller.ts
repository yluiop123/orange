import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from './decorators';
import { CurrentUser } from './current-user.decorator';
import type { AuthUser } from './auth-user';
import { AppRequest } from '../common/app-request';
import { ApiResult } from '../common/response';
import { OperationLogPolicy } from '../operation-log/operation-log.policy';
import { ChangePasswordDto, LoginDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(
    @Body() dto: LoginDto,
    @Req() request: AppRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.auth.login(dto.username, dto.password, OperationLogPolicy.clientIp(request), response);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Req() request: AppRequest, @Res({ passthrough: true }) response: Response) {
    return this.auth.refresh(refreshTokenOf(request), response);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() request: AppRequest, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.user, refreshTokenOf(request), response);
    return ApiResult.message('ok');
  }

  @Get('user-info')
  userInfo(@CurrentUser() user: AuthUser) {
    return this.auth.userInfo(user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const message = await this.auth.changePassword(user, dto.oldPassword, dto.newPassword, response);
    return ApiResult.message(message);
  }
}

function refreshTokenOf(request: AppRequest): string | null {
  const token = (request as AppRequest & { cookies?: Record<string, string> }).cookies
    ?.refresh_token;
  return token && token.trim().length > 0 ? token : null;
}
