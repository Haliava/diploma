import { ApiProperty } from '@nestjs/swagger';

import { BarcodeFormat } from '../../common/enums/barcode-format.enum';

export class ScanRecordResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ enum: BarcodeFormat })
  format: BarcodeFormat;

  @ApiProperty()
  note: string;

  @ApiProperty()
  scannedAt: string;
}

export class ScanHistoryMetaDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginatedScanRecordsResponseDto {
  @ApiProperty({ type: ScanRecordResponseDto, isArray: true })
  data: ScanRecordResponseDto[];

  @ApiProperty({ type: ScanHistoryMetaDto })
  meta: ScanHistoryMetaDto;
}
