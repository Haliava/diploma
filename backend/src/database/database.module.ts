import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  ScanRecord,
  ScanRecordSchema,
} from '../scan-history/schemas/scan-record.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  WebhookLog,
  WebhookLogSchema,
} from '../webhooks/schemas/webhook-log.schema';
import { Webhook, WebhookSchema } from '../webhooks/schemas/webhook.schema';
import { DatabaseInitService } from './database-init.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ScanRecord.name, schema: ScanRecordSchema },
      { name: Webhook.name, schema: WebhookSchema },
      { name: WebhookLog.name, schema: WebhookLogSchema },
    ]),
  ],
  providers: [DatabaseInitService],
})
export class DatabaseModule {}
