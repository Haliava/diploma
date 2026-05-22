import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { BarcodeFormat } from '../../common/enums/barcode-format.enum';

export enum ScanHistorySortBy {
  ScannedAt = 'scannedAt',
  CreatedAt = 'createdAt',
  Format = 'format',
  Content = 'content',
}

export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

export class ListScanRecordsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ enum: ScanHistorySortBy, default: ScanHistorySortBy.ScannedAt })
  @IsOptional()
  @IsEnum(ScanHistorySortBy)
  sortBy = ScanHistorySortBy.ScannedAt;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.Desc })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder = SortOrder.Desc;

  @ApiPropertyOptional({ enum: BarcodeFormat })
  @IsOptional()
  @IsEnum(BarcodeFormat)
  format?: BarcodeFormat;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
