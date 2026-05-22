import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { Model, Types } from 'mongoose';

import {
  WebhookDeliveryStatus,
  WebhookEventType,
} from '../common/enums/webhook-event.enum';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import {
  WebhookLogResponseDto,
  WebhookResponseDto,
} from './dto/webhook-response.dto';
import { WebhookLog, WebhookLogDocument } from './schemas/webhook-log.schema';
import { Webhook, WebhookDocument } from './schemas/webhook.schema';

type WebhookEventPayload = Record<string, unknown>;

@Injectable()
export class WebhooksService {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Webhook.name)
    private readonly webhookModel: Model<WebhookDocument>,
    @InjectModel(WebhookLog.name)
    private readonly webhookLogModel: Model<WebhookLogDocument>,
  ) {}

  getEventTypes(): WebhookEventType[] {
    return Object.values(WebhookEventType);
  }

  async create(userId: string, dto: CreateWebhookDto): Promise<WebhookResponseDto> {
    const webhook = await this.webhookModel.create({
      userId: new Types.ObjectId(userId),
      eventType: dto.eventType,
      targetUrl: dto.targetUrl,
      message: dto.message ?? '',
      isActive: dto.isActive ?? true,
    });

    return this.toWebhookResponse(webhook);
  }

  async findAll(): Promise<WebhookResponseDto[]> {
    const webhooks = await this.webhookModel
      .find()
      .sort({ createdAt: -1 })
      .exec();

    return webhooks.map((webhook) => this.toWebhookResponse(webhook));
  }

  async findOne(id: string): Promise<WebhookResponseDto> {
    const webhook = await this.findWebhook(id);
    return this.toWebhookResponse(webhook);
  }

  async update(id: string, dto: UpdateWebhookDto): Promise<WebhookResponseDto> {
    this.assertObjectId(id);

    const webhook = await this.webhookModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    return this.toWebhookResponse(webhook);
  }

  async remove(id: string): Promise<void> {
    this.assertObjectId(id);

    const result = await this.webhookModel.deleteOne({ _id: id }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Webhook not found');
    }
  }

  async findLogs(webhookId: string): Promise<WebhookLogResponseDto[]> {
    await this.findWebhook(webhookId);

    const logs = await this.webhookLogModel
      .find({ webhookId })
      .sort({ triggeredAt: -1 })
      .limit(100)
      .exec();

    return logs.map((log) => this.toWebhookLogResponse(log));
  }

  @OnEvent(WebhookEventType.ScanSuccess)
  async handleScanSuccess(payload: WebhookEventPayload): Promise<void> {
    await this.dispatch(WebhookEventType.ScanSuccess, payload);
  }

  @OnEvent(WebhookEventType.ScanError)
  async handleScanError(payload: WebhookEventPayload): Promise<void> {
    await this.dispatch(WebhookEventType.ScanError, payload);
  }

  @OnEvent(WebhookEventType.UserCreated)
  async handleUserCreated(payload: WebhookEventPayload): Promise<void> {
    await this.dispatch(WebhookEventType.UserCreated, payload);
  }

  @OnEvent(WebhookEventType.HistoryRecordCreated)
  async handleHistoryRecordCreated(payload: WebhookEventPayload): Promise<void> {
    await this.dispatch(WebhookEventType.HistoryRecordCreated, payload);
  }

  @OnEvent(WebhookEventType.HistoryRecordDeleted)
  async handleHistoryRecordDeleted(payload: WebhookEventPayload): Promise<void> {
    await this.dispatch(WebhookEventType.HistoryRecordDeleted, payload);
  }

  private async dispatch(
    eventType: WebhookEventType,
    payload: WebhookEventPayload,
  ): Promise<void> {
    const webhooks = await this.webhookModel
      .find({ eventType, isActive: true })
      .exec();

    await Promise.all(
      webhooks.map((webhook) => this.deliver(webhook, eventType, payload)),
    );
  }

  private async deliver(
    webhook: WebhookDocument,
    eventType: WebhookEventType,
    payload: WebhookEventPayload,
  ): Promise<void> {
    const triggeredAt = new Date();
    const requestBody = {
      eventType,
      message: webhook.message,
      triggeredAt: triggeredAt.toISOString(),
      data: payload,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(webhook.targetUrl, requestBody, {
          timeout: 5000,
        }),
      );

      await this.createLog({
        webhookId: webhook._id,
        eventType,
        triggeredAt,
        status: WebhookDeliveryStatus.Success,
        httpStatusCode: response.status,
        requestBody,
      });
    } catch (error) {
      await this.createLog({
        webhookId: webhook._id,
        eventType,
        triggeredAt,
        status: WebhookDeliveryStatus.Failure,
        httpStatusCode: this.getHttpStatusCode(error),
        errorMessage: this.getErrorMessage(error),
        requestBody,
      });
    }
  }

  private async createLog(input: {
    webhookId: Types.ObjectId;
    eventType: WebhookEventType;
    triggeredAt: Date;
    status: WebhookDeliveryStatus;
    httpStatusCode?: number | null;
    errorMessage?: string | null;
    requestBody: Record<string, unknown>;
  }): Promise<void> {
    await this.webhookLogModel.create({
      webhookId: input.webhookId,
      eventType: input.eventType,
      triggeredAt: input.triggeredAt,
      status: input.status,
      httpStatusCode: input.httpStatusCode ?? null,
      errorMessage: input.errorMessage ?? null,
      requestBody: input.requestBody,
    });
  }

  private async findWebhook(id: string): Promise<WebhookDocument> {
    this.assertObjectId(id);

    const webhook = await this.webhookModel.findById(id).exec();

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    return webhook;
  }

  private assertObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Webhook not found');
    }
  }

  private getHttpStatusCode(error: unknown): number | null {
    if (error instanceof AxiosError) {
      return error.response?.status ?? null;
    }

    return null;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown webhook delivery error';
  }

  private toWebhookResponse(webhook: WebhookDocument): WebhookResponseDto {
    return {
      id: webhook.id,
      userId: webhook.userId.toString(),
      eventType: webhook.eventType,
      targetUrl: webhook.targetUrl,
      message: webhook.message,
      isActive: webhook.isActive,
    };
  }

  private toWebhookLogResponse(log: WebhookLogDocument): WebhookLogResponseDto {
    return {
      id: log.id,
      webhookId: log.webhookId.toString(),
      eventType: log.eventType,
      triggeredAt: log.triggeredAt.toISOString(),
      status: log.status,
      httpStatusCode: log.httpStatusCode ?? null,
      errorMessage: log.errorMessage ?? null,
      requestBody: log.requestBody,
    };
  }
}
