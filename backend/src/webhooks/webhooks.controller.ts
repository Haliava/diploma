import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { WebhookEventType } from '../common/enums/webhook-event.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import {
  WebhookLogResponseDto,
  WebhookResponseDto,
} from './dto/webhook-response.dto';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@ApiBearerAuth()
@Roles(Role.Admin)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get('event-types')
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: {
        type: 'string',
        enum: Object.values(WebhookEventType),
      },
    },
  })
  getEventTypes(): WebhookEventType[] {
    return this.webhooksService.getEventTypes();
  }

  @Get()
  @ApiOkResponse({ type: WebhookResponseDto, isArray: true })
  findAll(): Promise<WebhookResponseDto[]> {
    return this.webhooksService.findAll();
  }

  @Post()
  @ApiOkResponse({ type: WebhookResponseDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWebhookDto,
  ): Promise<WebhookResponseDto> {
    return this.webhooksService.create(user.id, dto);
  }

  @Get(':id')
  @ApiOkResponse({ type: WebhookResponseDto })
  findOne(@Param('id') id: string): Promise<WebhookResponseDto> {
    return this.webhooksService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: WebhookResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
  ): Promise<WebhookResponseDto> {
    return this.webhooksService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@Param('id') id: string): Promise<void> {
    return this.webhooksService.remove(id);
  }

  @Get(':id/logs')
  @ApiOkResponse({ type: WebhookLogResponseDto, isArray: true })
  findLogs(@Param('id') id: string): Promise<WebhookLogResponseDto[]> {
    return this.webhooksService.findLogs(id);
  }
}
