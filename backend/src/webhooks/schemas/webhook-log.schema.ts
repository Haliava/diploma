import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

import {
  WebhookDeliveryStatus,
  WebhookEventType,
} from '../../common/enums/webhook-event.enum';

export type WebhookLogDocument = HydratedDocument<WebhookLog>;

@Schema({
  collection: 'webhook_logs',
  timestamps: true,
})
export class WebhookLog {
  @Prop({
    type: Types.ObjectId,
    ref: 'Webhook',
    required: true,
    index: true,
  })
  webhookId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(WebhookEventType),
    required: true,
    index: true,
  })
  eventType: WebhookEventType;

  @Prop({
    required: true,
    index: true,
  })
  triggeredAt: Date;

  @Prop({
    type: String,
    enum: Object.values(WebhookDeliveryStatus),
    required: true,
    index: true,
  })
  status: WebhookDeliveryStatus;

  @Prop({ type: Number, default: null })
  httpStatusCode?: number | null;

  @Prop({ type: String, default: null })
  errorMessage?: string | null;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {},
  })
  requestBody: Record<string, unknown>;
}

export const WebhookLogSchema = SchemaFactory.createForClass(WebhookLog);

WebhookLogSchema.index({ webhookId: 1, triggeredAt: -1 });
WebhookLogSchema.index({ eventType: 1, status: 1, triggeredAt: -1 });
