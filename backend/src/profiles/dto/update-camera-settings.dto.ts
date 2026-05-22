import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

import { CameraResolution, PreferredCamera } from '../../common/enums/camera.enum';

export class UpdateCameraSettingsDto {
  @ApiPropertyOptional({ enum: PreferredCamera })
  @IsOptional()
  @IsEnum(PreferredCamera)
  preferredCamera?: PreferredCamera;

  @ApiPropertyOptional({ enum: CameraResolution })
  @IsOptional()
  @IsEnum(CameraResolution)
  resolution?: CameraResolution;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  torchEnabled?: boolean;
}
