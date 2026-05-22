import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateCameraSettingsDto } from './dto/update-camera-settings.dto';
import { UpdateScanSettingsDto } from './dto/update-scan-settings.dto';
import { Profile, ProfileDocument } from './schemas/profile.schema';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
  ) {}

  async createDefaultForUser(
    userId: string | Types.ObjectId,
  ): Promise<ProfileDocument> {
    return this.profileModel
      .findOneAndUpdate(
        { userId },
        { $setOnInsert: { userId } },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();
  }

  async findByUserId(userId: string | Types.ObjectId): Promise<ProfileDocument | null> {
    return this.profileModel.findOne({ userId }).exec();
  }

  async getOrCreateForUser(
    userId: string | Types.ObjectId,
  ): Promise<ProfileResponseDto> {
    const profile = await this.createDefaultForUser(userId);
    return this.toResponse(profile);
  }

  async updateScanSettings(
    userId: string | Types.ObjectId,
    dto: UpdateScanSettingsDto,
  ): Promise<ProfileResponseDto> {
    const $set = this.toNestedSet('scanSettings', dto);
    const profile = await this.profileModel
      .findOneAndUpdate(
        { userId },
        {
          $set,
          $setOnInsert: { userId },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();

    return this.toResponse(profile);
  }

  async updateCameraSettings(
    userId: string | Types.ObjectId,
    dto: UpdateCameraSettingsDto,
  ): Promise<ProfileResponseDto> {
    const $set = this.toNestedSet('cameraSettings', dto);
    const profile = await this.profileModel
      .findOneAndUpdate(
        { userId },
        {
          $set,
          $setOnInsert: { userId },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();

    return this.toResponse(profile);
  }

  toResponse(profile: ProfileDocument): ProfileResponseDto {
    return {
      id: profile.id,
      userId: profile.userId.toString(),
      scanSettings: {
        captureInterval: profile.scanSettings.captureInterval,
        activeFormats: profile.scanSettings.activeFormats,
        scanMode: profile.scanSettings.scanMode,
        soundEnabled: profile.scanSettings.soundEnabled,
        vibrationEnabled: profile.scanSettings.vibrationEnabled,
      },
      cameraSettings: {
        preferredCamera: profile.cameraSettings.preferredCamera,
        resolution: profile.cameraSettings.resolution,
        torchEnabled: profile.cameraSettings.torchEnabled,
      },
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
