import 'reflect-metadata';

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import * as bcrypt from 'bcrypt';
import mongoose, { Types } from 'mongoose';

import { BarcodeFormat } from '../common/enums/barcode-format.enum';
import { CameraResolution, PreferredCamera } from '../common/enums/camera.enum';
import { Role } from '../common/enums/role.enum';
import { ScanMode } from '../common/enums/scan-mode.enum';
import {
  WebhookDeliveryStatus,
  WebhookEventType,
} from '../common/enums/webhook-event.enum';
import {
  ScanRecord,
  ScanRecordSchema,
} from '../scan-history/schemas/scan-record.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  WebhookLog,
  WebhookLogSchema,
} from '../webhooks/schemas/webhook-log.schema';
import { Webhook, WebhookSchema } from '../webhooks/schemas/webhook.schema';

type SeedUser = {
  email: string;
  name: string;
  role: Role;
};

const seedUsers: SeedUser[] = [
  { email: 'admin@example.com', name: 'Admin Demo', role: Role.Admin },
  { email: 'ivan@example.com', name: 'Ivan Demo', role: Role.User },
  { email: 'scanner@example.com', name: 'Warehouse Scanner', role: Role.User },
  { email: 'operator@example.com', name: 'Operator Demo', role: Role.User },
];

const scanFormats = [
  BarcodeFormat.QrCode,
  BarcodeFormat.Ean13,
  BarcodeFormat.Code128,
  BarcodeFormat.DataMatrix,
  BarcodeFormat.Pdf417,
];

const eventTypes = [
  WebhookEventType.ScanSuccess,
  WebhookEventType.HistoryRecordCreated,
  WebhookEventType.HistoryRecordDeleted,
  WebhookEventType.UserCreated,
];

const UserModel = mongoose.model(User.name, UserSchema);
const ScanRecordModel = mongoose.model(ScanRecord.name, ScanRecordSchema);
const WebhookModel = mongoose.model(Webhook.name, WebhookSchema);
const WebhookLogModel = mongoose.model(WebhookLog.name, WebhookLogSchema);

function loadEnvFile() {
  const envPath = join(process.cwd(), '.env');

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value.replace(/^["']|["']$/g, '');
    }
  }
}

function daysAgo(days: number, hour = 10) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

async function seed() {
  loadEnvFile();

  const mongoUri =
    process.env.MONGODB_URI ?? 'mongodb://localhost:27017/diploma_scanner';

  await mongoose.connect(mongoUri);
  await Promise.all([
    UserModel.syncIndexes(),
    ScanRecordModel.syncIndexes(),
    WebhookModel.syncIndexes(),
    WebhookLogModel.syncIndexes(),
  ]);

  const passwordHash = await bcrypt.hash('password123', 10);
  const users = await Promise.all(
    seedUsers.map((user, index) =>
      UserModel.findOneAndUpdate(
        { email: user.email },
        {
          $set: {
            ...user,
            passwordHash,
            isActive: true,
            refreshTokenHash: null,
            scanSettings: {
              captureInterval: 250 + index * 100,
              activeFormats: scanFormats.slice(0, 3 + (index % 2)),
              scanMode:
                index % 2 === 0 ? ScanMode.Continuous : ScanMode.Single,
              soundEnabled: index !== 2,
              vibrationEnabled: true,
            },
            cameraSettings: {
              preferredCamera: PreferredCamera.Back,
              resolution:
                index % 2 === 0
                  ? CameraResolution.R720p
                  : CameraResolution.R1080p,
              torchEnabled: index === 2,
            },
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      ).exec(),
    ),
  );

  const userIds = users.map((user) => user._id);
  const oldWebhooks = await WebhookModel.find({ userId: { $in: userIds } })
    .select('_id')
    .exec();
  const oldWebhookIds = oldWebhooks.map((webhook) => webhook._id);

  await Promise.all([
    ScanRecordModel.deleteMany({ userId: { $in: userIds } }).exec(),
    WebhookModel.deleteMany({ userId: { $in: userIds } }).exec(),
    WebhookLogModel.deleteMany({ webhookId: { $in: oldWebhookIds } }).exec(),
  ]);

  const scanRecords = Array.from({ length: 90 }, (_, index) => {
    const user = users[index % users.length];
    const format = scanFormats[index % scanFormats.length];
    const scannedAt = daysAgo(29 - (index % 30), 8 + (index % 10));

    return {
      userId: user._id,
      content: `${format}-DEMO-${String(index + 1).padStart(4, '0')}`,
      format,
      note: index % 4 === 0 ? 'Тестовая запись для проверки истории' : '',
      scannedAt,
    };
  });

  await ScanRecordModel.insertMany(scanRecords);

  const webhooks = await WebhookModel.insertMany(
    users.flatMap((user, userIndex) =>
      eventTypes.slice(0, 3).map((eventType, eventIndex) => ({
        userId: user._id,
        eventType,
        targetUrl: `https://example.com/api/webhooks/${userIndex + 1}/${eventIndex + 1}`,
        message: `Demo delivery for ${eventType}`,
        isActive: eventIndex !== 2 || userIndex % 2 === 0,
      })),
    ),
  );

  const webhookLogs = Array.from({ length: 120 }, (_, index) => {
    const webhook = webhooks[index % webhooks.length];
    const triggeredAt = daysAgo(29 - (index % 30), 9 + (index % 8));
    const isSuccess = index % 5 !== 0;
    const status = isSuccess
      ? WebhookDeliveryStatus.Success
      : WebhookDeliveryStatus.Failure;

    return {
      webhookId: webhook._id as Types.ObjectId,
      eventType: webhook.eventType,
      triggeredAt,
      status,
      httpStatusCode: isSuccess ? 200 + (index % 3) : 500,
      errorMessage: isSuccess ? null : 'Demo target returned an error',
      requestBody: {
        eventType: webhook.eventType,
        message: webhook.message,
        triggeredAt: triggeredAt.toISOString(),
        data: {
          content: `DEMO-${String(index + 1).padStart(4, '0')}`,
          source: 'seed',
        },
      },
    };
  });

  await WebhookLogModel.insertMany(webhookLogs);

  console.log('Seed completed');
  console.log('Admin: admin@example.com / password123');
  console.log('User: ivan@example.com / password123');
  console.log(
    `Inserted ${users.length} users, ${scanRecords.length} scan records, ${webhooks.length} webhooks, ${webhookLogs.length} webhook logs`,
  );
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
