import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

import { WebhookEventType } from '../../common/enums/webhook-event.enum';

export class CreateWebhookDto {
  @ApiProperty({ enum: WebhookEventType })
  @IsEnum(WebhookEventType)
  eventType: WebhookEventType;

  @ApiProperty({ example: 'https://example.com/webhooks/scanner' })
  @IsUrl({ require_tld: false })
  targetUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  message?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
