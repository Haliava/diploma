import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { WebhookEventType } from '../common/enums/webhook-event.enum';
import { BatchDeleteScanRecordsDto } from './dto/batch-delete-scan-records.dto';
import { CreateScanRecordDto } from './dto/create-scan-record.dto';
import {
  ListScanRecordsQueryDto,
  SortOrder,
} from './dto/list-scan-records-query.dto';
import {
  PaginatedScanRecordsResponseDto,
  ScanRecordResponseDto,
} from './dto/scan-record-response.dto';
import { UpdateScanRecordDto } from './dto/update-scan-record.dto';
import { ScanRecord, ScanRecordDocument } from './schemas/scan-record.schema';

@Injectable()
export class ScanHistoryService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectModel(ScanRecord.name)
    private readonly scanRecordModel: Model<ScanRecordDocument>,
  ) {}

  async create(
    userId: string,
    dto: CreateScanRecordDto,
  ): Promise<ScanRecordResponseDto> {
    const scanRecord = await this.scanRecordModel.create({
      userId: new Types.ObjectId(userId),
      content: dto.content,
      format: dto.format,
      note: dto.note ?? '',
      scannedAt: dto.scannedAt ? new Date(dto.scannedAt) : new Date(),
    });
    const response = this.toResponse(scanRecord);

    this.eventEmitter.emit(WebhookEventType.HistoryRecordCreated, {
      scanRecord: response,
      userId,
    });
    this.eventEmitter.emit(WebhookEventType.ScanSuccess, {
      scanRecord: response,
      userId,
    });

    return response;
  }

  async findAll(
    userId: string,
    query: ListScanRecordsQueryDto,
  ): Promise<PaginatedScanRecordsResponseDto> {
    const filter = this.buildFilter(userId, query);
    const skip = (query.page - 1) * query.limit;
    const sortDirection = query.sortOrder === SortOrder.Asc ? 1 : -1;

    const [records, total] = await Promise.all([
      this.scanRecordModel
        .find(filter)
        .sort({ [query.sortBy]: sortDirection })
        .skip(skip)
        .limit(query.limit)
        .exec(),
      this.scanRecordModel.countDocuments(filter).exec(),
    ]);

    return {
      data: records.map((record) => this.toResponse(record)),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(userId: string, id: string): Promise<ScanRecordResponseDto> {
    const record = await this.findOwnedRecord(userId, id);
    return this.toResponse(record);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateScanRecordDto,
  ): Promise<ScanRecordResponseDto> {
    this.assertObjectId(id);

    const update = {
      ...dto,
      ...(dto.scannedAt ? { scannedAt: new Date(dto.scannedAt) } : {}),
    };
    const record = await this.scanRecordModel
      .findOneAndUpdate({ _id: id, userId }, { $set: update }, { new: true })
      .exec();

    if (!record) {
      throw new NotFoundException('Scan record not found');
    }

    return this.toResponse(record);
  }

  async remove(userId: string, id: string): Promise<void> {
    const record = await this.findOwnedRecord(userId, id);
    await this.scanRecordModel.deleteOne({ _id: record._id, userId }).exec();

    this.eventEmitter.emit(WebhookEventType.HistoryRecordDeleted, {
      scanRecord: this.toResponse(record),
      userId,
    });
  }

  async deleteBatch(
    userId: string,
    dto: BatchDeleteScanRecordsDto,
  ): Promise<{ deletedCount: number }> {
    const ids = dto.ids.map((id) => new Types.ObjectId(id));
    const records = await this.scanRecordModel
      .find({ _id: { $in: ids }, userId })
      .exec();

    const result = await this.scanRecordModel
      .deleteMany({ _id: { $in: ids }, userId })
      .exec();

    if (records.length > 0) {
      this.eventEmitter.emit(WebhookEventType.HistoryRecordDeleted, {
        scanRecords: records.map((record) => this.toResponse(record)),
        userId,
      });
    }

    return { deletedCount: result.deletedCount };
  }

  private async findOwnedRecord(
    userId: string,
    id: string,
  ): Promise<ScanRecordDocument> {
    this.assertObjectId(id);

    const record = await this.scanRecordModel.findOne({ _id: id, userId }).exec();

    if (!record) {
      throw new NotFoundException('Scan record not found');
    }

    return record;
  }

  private buildFilter(
    userId: string,
    query: ListScanRecordsQueryDto,
  ): FilterQuery<ScanRecordDocument> {
    const filter: FilterQuery<ScanRecordDocument> = {
      userId: new Types.ObjectId(userId),
    };

    if (query.format) {
      filter.format = query.format;
    }

    if (query.dateFrom || query.dateTo) {
      filter.scannedAt = {};

      if (query.dateFrom) {
        filter.scannedAt.$gte = new Date(query.dateFrom);
      }

      if (query.dateTo) {
        filter.scannedAt.$lte = new Date(query.dateTo);
      }
    }

    if (query.search?.trim()) {
      filter.$text = { $search: query.search.trim() };
    }

    return filter;
  }

  private assertObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Scan record not found');
    }
  }

  private toResponse(record: ScanRecordDocument): ScanRecordResponseDto {
    return {
      id: record.id,
      userId: record.userId.toString(),
      content: record.content,
      format: record.format,
      note: record.note,
      scannedAt: record.scannedAt.toISOString(),
    };
  }
}
