import { Types } from 'mongoose';

import { BarcodeFormat } from '../common/enums/barcode-format.enum';
import { CameraResolution, PreferredCamera } from '../common/enums/camera.enum';
import { ScanMode } from '../common/enums/scan-mode.enum';
import { ProfilesService } from './profiles.service';
import { ProfileDocument } from './schemas/profile.schema';

const userId = new Types.ObjectId();

const profile = {
  id: new Types.ObjectId().toString(),
  userId,
  scanSettings: {
    captureInterval: 300,
    activeFormats: [BarcodeFormat.Ean13, BarcodeFormat.QrCode],
    scanMode: ScanMode.Continuous,
    soundEnabled: true,
    vibrationEnabled: true,
  },
  cameraSettings: {
    preferredCamera: PreferredCamera.Back,
    resolution: CameraResolution.R720p,
    torchEnabled: false,
  },
} as ProfileDocument;

describe('ProfilesService', () => {
  const profileModel = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };
  let service: ProfilesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProfilesService(profileModel as never);
  });

  it('creates a default profile with upsert', async () => {
    profileModel.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(profile),
    });

    await expect(service.createDefaultForUser(userId)).resolves.toBe(profile);
    expect(profileModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId },
      { $setOnInsert: { userId } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );
  });

  it('updates only provided scan settings', async () => {
    profileModel.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(profile),
    });

    await service.updateScanSettings(userId, {
      captureInterval: 500,
      soundEnabled: false,
      activeFormats: undefined,
    });

    expect(profileModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId },
      {
        $set: {
          'scanSettings.captureInterval': 500,
          'scanSettings.soundEnabled': false,
        },
        $setOnInsert: { userId },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );
  });

  it('maps profile document to response dto', () => {
    expect(service.toResponse(profile)).toEqual({
      id: profile.id,
      userId: userId.toString(),
      scanSettings: profile.scanSettings,
      cameraSettings: profile.cameraSettings,
    });
  });
});
