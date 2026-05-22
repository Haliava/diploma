import { ApiProperty } from '@nestjs/swagger';

import {
  WebhookDeliveryStatus,
  WebhookEventType,
} from '../../common/enums/webhook-event.enum';

export class WebhookResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: WebhookEventType })
  eventType: WebhookEventType;

  @ApiProperty()
  targetUrl: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  isActive: boolean;
}

export class WebhookLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  webhookId: string;

  @ApiProperty({ enum: WebhookEventType })
  eventType: WebhookEventType;

  @ApiProperty()
  triggeredAt: string;

  @ApiProperty({ enum: WebhookDeliveryStatus })
  status: WebhookDeliveryStatus;

  @ApiProperty({ nullable: true })
  httpStatusCode: number | null;

  @ApiProperty({ nullable: true })
  errorMessage: string | null;

  @ApiProperty()
  requestBody: Record<string, unknown>;
}
