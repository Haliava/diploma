import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { BarcodeFormat } from '../common/enums/barcode-format.enum';
import { CameraResolution, PreferredCamera } from '../common/enums/camera.enum';
import { ScanMode } from '../common/enums/scan-mode.enum';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateCameraSettingsDto } from './dto/update-camera-settings.dto';
import { UpdateScanSettingsDto } from './dto/update-scan-settings.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findByUserId(
    userId: string | Types.ObjectId,
  ): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(userId)) {
      return null;
    }

    return this.userModel.findOne({ _id: userId, isActive: true }).exec();
  }

  async getOrCreateForUser(
    userId: string | Types.ObjectId,
  ): Promise<ProfileResponseDto> {
    const user = await this.findRequiredUser(userId);
    return this.toResponse(user);
  }

  async updateScanSettings(
    userId: string | Types.ObjectId,
    dto: UpdateScanSettingsDto,
  ): Promise<ProfileResponseDto> {
    const $set = this.toNestedSet('scanSettings', dto);
    const user = await this.userModel
      .findOneAndUpdate(
        { _id: userId, isActive: true },
        { $set },
        { new: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponse(user);
  }

  async updateCameraSettings(
    userId: string | Types.ObjectId,
    dto: UpdateCameraSettingsDto,
  ): Promise<ProfileResponseDto> {
    const $set = this.toNestedSet('cameraSettings', dto);
    const user = await this.userModel
      .findOneAndUpdate(
        { _id: userId, isActive: true },
        { $set },
        { new: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponse(user);
  }

  toResponse(user: UserDocument): ProfileResponseDto {
    const scanSettings = user.scanSettings ?? this.getDefaultScanSettings();
    const cameraSettings =
      user.cameraSettings ?? this.getDefaultCameraSettings();

    return {
      id: user.id,
      userId: user.id,
      scanSettings: {
        captureInterval: scanSettings.captureInterval,
        activeFormats: scanSettings.activeFormats,
        scanMode: scanSettings.scanMode,
        soundEnabled: scanSettings.soundEnabled,
        vibrationEnabled: scanSettings.vibrationEnabled,
      },
      cameraSettings: {
        preferredCamera: cameraSettings.preferredCamera,
        resolution: cameraSettings.resolution,
        torchEnabled: cameraSettings.torchEnabled,
      },
    };
  }

  private async findRequiredUser(
    userId: string | Types.ObjectId,
  ): Promise<UserDocument> {
    const user = await this.findByUserId(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private getDefaultScanSettings() {
    return {
      captureInterval: 300,
      activeFormats: [
        BarcodeFormat.Ean13,
        BarcodeFormat.QrCode,
        BarcodeFormat.DataMatrix,
      ],
      scanMode: ScanMode.Continuous,
      soundEnabled: true,
      vibrationEnabled: true,
    };
  }

  private getDefaultCameraSettings() {
    return {
      preferredCamera: PreferredCamera.Back,
      resolution: CameraResolution.R720p,
      torchEnabled: false,
    };
  }

  private toNestedSet<T extends object>(
    prefix: string,
    dto: T,
  ): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(dto)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [`${prefix}.${key}`, value]),
    );
  }
}
