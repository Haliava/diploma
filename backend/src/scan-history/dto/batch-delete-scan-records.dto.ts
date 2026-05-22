import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsMongoId } from 'class-validator';

export class BatchDeleteScanRecordsDto {
  @ApiProperty({ type: String, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  ids: string[];
}

export class BatchDeleteScanRecordsResponseDto {
  @ApiProperty()
  deletedCount: number;
}
