import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ScanRecord, ScanRecordSchema } from './schemas/scan-record.schema';
import { ScanHistoryController } from './scan-history.controller';
import { ScanHistoryService } from './scan-history.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ScanRecord.name, schema: ScanRecordSchema },
    ]),
  ],
  controllers: [ScanHistoryController],
  providers: [ScanHistoryService],
  exports: [MongooseModule, ScanHistoryService],
})
export class ScanHistoryModule {}
