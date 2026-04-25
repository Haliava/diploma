import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  ScanRecord,
  ScanRecordDocument,
} from '../scan-history/schemas/scan-record.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  WebhookLog,
  WebhookLogDocument,
} from '../webhooks/schemas/webhook-log.schema';
import { Webhook, WebhookDocument } from '../webhooks/schemas/webhook.schema';

type ManagedModel =
  | Model<UserDocument>
  | Model<ScanRecordDocument>
  | Model<WebhookDocument>
  | Model<WebhookLogDocument>;

@Injectable()
export class DatabaseInitService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseInitService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(ScanRecord.name)
    private readonly scanRecordModel: Model<ScanRecordDocument>,
    @InjectModel(Webhook.name)
    private readonly webhookModel: Model<WebhookDocument>,
    @InjectModel(WebhookLog.name)
    private readonly webhookLogModel: Model<WebhookLogDocument>,
  ) {}

  async onApplicationBootstrap() {
    await this.ensureCollections();
  }

  private async ensureCollections() {
    const models: ManagedModel[] = [
      this.userModel,
      this.scanRecordModel,
      this.webhookModel,
      this.webhookLogModel,
    ];

    for (const model of models) {
      await this.ensureCollection(model);
      await model.syncIndexes();
      this.logger.log(`MongoDB collection is ready: ${model.collection.name}`);
    }
  }

  private async ensureCollection(model: ManagedModel) {
    const database = model.db.db;

    if (!database) {
      throw new Error('MongoDB connection is not ready');
    }

    const collectionName = model.collection.name;
    const collectionExists = await database
      .listCollections({ name: collectionName }, { nameOnly: true })
      .hasNext();

    if (collectionExists) {
      return;
    }

    await model.createCollection();
    this.logger.log(`Created MongoDB collection: ${collectionName}`);
  }
}
