import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { WebhookEventType } from '../../common/enums/webhook-event.enum';

export type WebhookDocument = HydratedDocument<Webhook>;

@Schema({
  collection: 'webhooks',
  timestamps: true,
})
export class Webhook {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(WebhookEventType),
    required: true,
    index: true,
  })
  eventType: WebhookEventType;

  @Prop({
    required: true,
    trim: true,
  })
  targetUrl: string;

  @Prop({
    default: '',
    trim: true,
  })
  message: string;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const WebhookSchema = SchemaFactory.createForClass(Webhook);

WebhookSchema.index({ userId: 1, eventType: 1 });
WebhookSchema.index({ eventType: 1, isActive: 1 });
