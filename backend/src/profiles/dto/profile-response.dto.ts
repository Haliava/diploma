import { ApiProperty } from '@nestjs/swagger';

import { BarcodeFormat } from '../../common/enums/barcode-format.enum';
import { CameraResolution, PreferredCamera } from '../../common/enums/camera.enum';
import { ScanMode } from '../../common/enums/scan-mode.enum';

export class ScanSettingsResponseDto {
  @ApiProperty()
  captureInterval: number;

  @ApiProperty({ enum: BarcodeFormat, isArray: true })
  activeFormats: BarcodeFormat[];

  @ApiProperty({ enum: ScanMode })
  scanMode: ScanMode;

  @ApiProperty()
  soundEnabled: boolean;

  @ApiProperty()
  vibrationEnabled: boolean;
}

export class CameraSettingsResponseDto {
  @ApiProperty({ enum: PreferredCamera })
  preferredCamera: PreferredCamera;

  @ApiProperty({ enum: CameraResolution })
  resolution: CameraResolution;

  @ApiProperty()
  torchEnabled: boolean;
}

export class ProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: ScanSettingsResponseDto })
  scanSettings: ScanSettingsResponseDto;

  @ApiProperty({ type: CameraSettingsResponseDto })
  cameraSettings: CameraSettingsResponseDto;
}
