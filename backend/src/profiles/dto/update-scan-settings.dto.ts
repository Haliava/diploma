import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

import { BarcodeFormat } from '../../common/enums/barcode-format.enum';
import { ScanMode } from '../../common/enums/scan-mode.enum';

export class UpdateScanSettingsDto {
  @ApiPropertyOptional({ minimum: 100, maximum: 5000 })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(5000)
  captureInterval?: number;

  @ApiPropertyOptional({ enum: BarcodeFormat, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(BarcodeFormat, { each: true })
  activeFormats?: BarcodeFormat[];

  @ApiPropertyOptional({ enum: ScanMode })
  @IsOptional()
  @IsEnum(ScanMode)
  scanMode?: ScanMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  soundEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  vibrationEnabled?: boolean;
}
