import { PartialType } from '@nestjs/swagger';

import { CreateScanRecordDto } from './create-scan-record.dto';

export class UpdateScanRecordDto extends PartialType(CreateScanRecordDto) {}
