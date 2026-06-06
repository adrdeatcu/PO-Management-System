import { Module } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [ProfilesService],
  controllers: [ProfilesController],
  exports: [ProfilesService],
})
export class ProfilesModule {}
