import { All, Controller, HttpException, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/decorators';

interface CanonicalRoute {
  methods: string[];
  pattern: RegExp;
}

/**
 * Canonical routes, used only to distinguish "wrong method" (40501) from
 * "unknown route" (40401). Express answers 404 for both by default.
 */
const CANONICAL_ROUTES: CanonicalRoute[] = [
  { methods: ['POST'], pattern: /^auth\/login$/ },
  { methods: ['POST'], pattern: /^auth\/refresh$/ },
  { methods: ['POST'], pattern: /^auth\/logout$/ },
  { methods: ['GET'], pattern: /^auth\/user-info$/ },
  { methods: ['POST'], pattern: /^auth\/change-password$/ },
  { methods: ['GET'], pattern: /^auth\/menus$/ },
  { methods: ['GET', 'DELETE'], pattern: /^system\/users$/ },
  { methods: ['GET', 'PATCH', 'DELETE'], pattern: /^system\/users\/[^/]+$/ },
  { methods: ['PATCH'], pattern: /^system\/users\/[^/]+\/status$/ },
  { methods: ['POST'], pattern: /^system\/users\/[^/]+\/reset-password$/ },
  { methods: ['GET', 'DELETE'], pattern: /^system\/roles$/ },
  { methods: ['GET', 'PATCH', 'DELETE'], pattern: /^system\/roles\/[^/]+$/ },
  { methods: ['GET', 'DELETE'], pattern: /^system\/groups$/ },
  { methods: ['GET', 'PATCH', 'DELETE'], pattern: /^system\/groups\/[^/]+$/ },
  { methods: ['PATCH'], pattern: /^system\/groups\/[^/]+\/status$/ },
  { methods: ['POST'], pattern: /^system\/groups\/children$/ },
  { methods: ['GET', 'DELETE'], pattern: /^system\/permissions$/ },
  { methods: ['GET', 'PATCH', 'DELETE'], pattern: /^system\/permissions\/[^/]+$/ },
  { methods: ['POST'], pattern: /^system\/permissions\/children$/ },
  { methods: ['GET'], pattern: /^system\/operation-logs$/ },
];

@Controller()
export class FallbackController {
  @Public()
  @All('*path')
  notFound(@Req() request: Request): never {
    const path = request.path.replace(/^\/api\/v1\/?/, '').replace(/\/$/, '');
    const matchesPath = CANONICAL_ROUTES.some((route) => route.pattern.test(path));
    if (matchesPath) {
      throw new HttpException('Method Not Allowed', 405);
    }
    throw new HttpException('Not Found', 404);
  }
}
