import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { BarcodeFormat } from '../../common/enums/barcode-format.enum';

export class CreateScanRecordDto {
  @ApiProperty()
  @IsString()
  @MaxLength(4096)
  content: string;

  @ApiProperty({ enum: BarcodeFormat })
  @IsEnum(BarcodeFormat)
  format: BarcodeFormat;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scannedAt?: string;
}
