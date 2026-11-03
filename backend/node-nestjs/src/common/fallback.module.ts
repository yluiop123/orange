import { Module } from '@nestjs/common';
import { FallbackController } from './fallback.controller';

/** Registered last so its catch-all only sees unmatched requests. */
@Module({
  controllers: [FallbackController],
})
export class FallbackModule {}
