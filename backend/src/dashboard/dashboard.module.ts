import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  ScanRecord,
  ScanRecordSchema,
} from '../scan-history/schemas/scan-record.schema';
import {
  WebhookLog,
  WebhookLogSchema,
} from '../webhooks/schemas/webhook-log.schema';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ScanRecord.name, schema: ScanRecordSchema },
      { name: WebhookLog.name, schema: WebhookLogSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
