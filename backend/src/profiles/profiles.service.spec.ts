import { Types } from 'mongoose';

import { BarcodeFormat } from '../common/enums/barcode-format.enum';
import { CameraResolution, PreferredCamera } from '../common/enums/camera.enum';
import { ScanMode } from '../common/enums/scan-mode.enum';
import { UserDocument } from '../users/schemas/user.schema';
import { ProfilesService } from './profiles.service';

const userId = new Types.ObjectId();

const user = {
  _id: userId,
  id: userId.toString(),
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
} as UserDocument;

describe('ProfilesService', () => {
  const userModel = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };
  let service: ProfilesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProfilesService(userModel as never);
  });

  it('returns user settings from users collection', async () => {
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });

    await expect(service.getOrCreateForUser(userId)).resolves.toEqual(
      service.toResponse(user),
    );
    expect(userModel.findOne).toHaveBeenCalledWith({
      _id: userId,
      isActive: true,
    });
  });

  it('updates only provided scan settings', async () => {
    userModel.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });

    await service.updateScanSettings(userId, {
      captureInterval: 500,
      soundEnabled: false,
      activeFormats: undefined,
    });

    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: userId, isActive: true },
      {
        $set: {
          'scanSettings.captureInterval': 500,
          'scanSettings.soundEnabled': false,
        },
      },
      { new: true },
    );
  });

  it('maps user document settings to profile response dto', () => {
    expect(service.toResponse(user)).toEqual({
      id: user.id,
      userId: user.id,
      scanSettings: user.scanSettings,
      cameraSettings: user.cameraSettings,
    });
  });
});
