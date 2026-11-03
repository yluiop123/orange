import { Injectable } from '@nestjs/common';
import type { CookieOptions, Response } from 'express';
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH } from '../common/constants';
import { AppConfig } from '../config/app-config';

/** The refresh token is only ever delivered as an HttpOnly cookie. */
@Injectable()
export class RefreshTokenCookie {
  constructor(private readonly config: AppConfig) {}

  set(response: Response, token: string): void {
    response.cookie(REFRESH_COOKIE_NAME, token, this.options(this.config.jwt.refreshExpire * 1000));
  }

  clear(response: Response): void {
    response.clearCookie(REFRESH_COOKIE_NAME, this.options(0));
  }

  private options(maxAge: number): CookieOptions {
    const options: CookieOptions = {
      httpOnly: true,
      secure: this.config.cookie.secure,
      sameSite: this.config.cookie.sameSite,
      path: REFRESH_COOKIE_PATH,
      maxAge,
    };
    if (this.config.cookie.domain) {
      options.domain = this.config.cookie.domain;
    }
    return options;
  }
}
