import { ApiProperty } from '@nestjs/swagger';

import { BarcodeFormat } from '../../common/enums/barcode-format.enum';

export class ScanFormatStatsDto {
  @ApiProperty({ enum: BarcodeFormat })
  format: BarcodeFormat;

  @ApiProperty()
  count: number;
}

export class ScanDayStatsDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  totalCount: number;

  @ApiProperty({ type: ScanFormatStatsDto, isArray: true })
  breakdown: ScanFormatStatsDto[];
}

export class ScanStatsResponseDto {
  @ApiProperty()
  totalCount: number;

  @ApiProperty({ type: ScanFormatStatsDto, isArray: true })
  byFormat: ScanFormatStatsDto[];

  @ApiProperty({ type: ScanDayStatsDto, isArray: true })
  byDay: ScanDayStatsDto[];
}
