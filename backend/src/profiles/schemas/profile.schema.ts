import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { BarcodeFormat } from '../../common/enums/barcode-format.enum';
import { CameraResolution, PreferredCamera } from '../../common/enums/camera.enum';
import { ScanMode } from '../../common/enums/scan-mode.enum';

export type ProfileDocument = HydratedDocument<Profile>;

@Schema({ _id: false })
export class ScanSettings {
  @Prop({ default: 300, min: 100 })
  captureInterval: number;

  @Prop({
    type: [String],
    enum: Object.values(BarcodeFormat),
    default: [BarcodeFormat.Ean13, BarcodeFormat.QrCode, BarcodeFormat.DataMatrix],
  })
  activeFormats: BarcodeFormat[];

  @Prop({
    type: String,
    enum: Object.values(ScanMode),
    default: ScanMode.Continuous,
  })
  scanMode: ScanMode;

  @Prop({ default: true })
  soundEnabled: boolean;

  @Prop({ default: true })
  vibrationEnabled: boolean;
}

export const ScanSettingsSchema = SchemaFactory.createForClass(ScanSettings);

@Schema({ _id: false })
export class CameraSettings {
  @Prop({
    type: String,
    enum: Object.values(PreferredCamera),
    default: PreferredCamera.Back,
  })
  preferredCamera: PreferredCamera;

  @Prop({
    type: String,
    enum: Object.values(CameraResolution),
    default: CameraResolution.R720p,
  })
  resolution: CameraResolution;

  @Prop({ default: false })
  torchEnabled: boolean;
}

export const CameraSettingsSchema = SchemaFactory.createForClass(CameraSettings);

@Schema({
  collection: 'profiles',
  timestamps: true,
})
export class Profile {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: ScanSettingsSchema,
    default: () => ({}),
  })
  scanSettings: ScanSettings;

  @Prop({
    type: CameraSettingsSchema,
    default: () => ({}),
  })
  cameraSettings: CameraSettings;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
