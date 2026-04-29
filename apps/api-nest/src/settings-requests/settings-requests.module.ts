import { Module } from '@nestjs/common';
import { SettingsRequestsController } from './settings-requests.controller';
import { SettingsRequestsService } from './settings-requests.service';

@Module({
  controllers: [SettingsRequestsController],
  providers: [SettingsRequestsService],
  exports: [SettingsRequestsService],
})
export class SettingsRequestsModule {}
