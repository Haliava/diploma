import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { BarcodeFormat } from '../../common/enums/barcode-format.enum';
import {
  CameraResolution,
  PreferredCamera,
} from '../../common/enums/camera.enum';
import { Role } from '../../common/enums/role.enum';
import { ScanMode } from '../../common/enums/scan-mode.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
export class ScanSettings {
  @Prop({ default: 300, min: 100 })
  captureInterval: number;

  @Prop({
    type: [String],
    enum: Object.values(BarcodeFormat),
    default: [
      BarcodeFormat.Ean13,
      BarcodeFormat.QrCode,
      BarcodeFormat.DataMatrix,
    ],
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

export const CameraSettingsSchema =
  SchemaFactory.createForClass(CameraSettings);

@Schema({
  collection: 'users',
  timestamps: true,
})
export class User {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    sparse: true,
  })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
    enum: Object.values(Role),
    default: Role.User,
  })
  role: Role;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String, default: null })
  refreshTokenHash?: string | null;

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

export const UserSchema = SchemaFactory.createForClass(User);
