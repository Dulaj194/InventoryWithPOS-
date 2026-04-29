import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { SettingsRequestsController } from './settings-requests.controller';
import { SettingsRequestsService } from './settings-requests.service';

@Module({
  imports: [RealtimeModule],
  controllers: [SettingsRequestsController],
  providers: [SettingsRequestsService],
  exports: [SettingsRequestsService],
})
export class SettingsRequestsModule {}
