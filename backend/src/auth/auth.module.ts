import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

// Auth module is intentionally thin.
// JwtAuthGuard does the heavy lifting using DatabaseService (global).
@Module({
  providers: [JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
