import { ApiProperty } from '@nestjs/swagger';

import {
  WebhookDeliveryStatus,
  WebhookEventType,
} from '../../common/enums/webhook-event.enum';

export class WebhookStatusStatsDto {
  @ApiProperty({ enum: WebhookDeliveryStatus })
  status: WebhookDeliveryStatus;

  @ApiProperty()
  count: number;
}

export class WebhookEventStatsDto {
  @ApiProperty({ enum: WebhookEventType })
  eventType: WebhookEventType;

  @ApiProperty()
  count: number;
}

export class WebhookDayStatsDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  totalCount: number;

  @ApiProperty({ type: WebhookStatusStatsDto, isArray: true })
  breakdown: WebhookStatusStatsDto[];
}

export class WebhookStatsResponseDto {
  @ApiProperty()
  totalCount: number;

  @ApiProperty({ type: WebhookStatusStatsDto, isArray: true })
  byStatus: WebhookStatusStatsDto[];

  @ApiProperty({ type: WebhookEventStatsDto, isArray: true })
  byEventType: WebhookEventStatsDto[];

  @ApiProperty({ type: WebhookDayStatsDto, isArray: true })
  byDay: WebhookDayStatsDto[];
}
