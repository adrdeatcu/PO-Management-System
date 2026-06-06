import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

// @Global() means DatabaseService is available in every module
// without needing to import DatabaseModule explicitly.
@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
