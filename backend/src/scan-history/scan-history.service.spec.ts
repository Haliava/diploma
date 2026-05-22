import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { BarcodeFormat } from '../common/enums/barcode-format.enum';
import { WebhookEventType } from '../common/enums/webhook-event.enum';
import {
  ScanHistorySortBy,
  SortOrder,
} from './dto/list-scan-records-query.dto';
import { ScanHistoryService } from './scan-history.service';
import { ScanRecordDocument } from './schemas/scan-record.schema';

const userId = new Types.ObjectId();
const recordId = new Types.ObjectId();
const scannedAt = new Date('2026-05-21T10:00:00.000Z');

const createRecord = (): ScanRecordDocument =>
  ({
    _id: recordId,
    id: recordId.toString(),
    userId,
    content: 'HELLO',
    format: BarcodeFormat.QrCode,
    note: '',
    scannedAt,
  }) as ScanRecordDocument;

describe('ScanHistoryService', () => {
  const eventEmitter = {
    emit: jest.fn(),
  };
  const scanRecordModel = {
    countDocuments: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
    deleteOne: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };
  let service: ScanHistoryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ScanHistoryService(eventEmitter as never, scanRecordModel as never);
  });

  it('creates a scan record and emits history and scan events', async () => {
    const record = createRecord();
    scanRecordModel.create.mockResolvedValue(record);

    const result = await service.create(userId.toString(), {
      content: record.content,
      format: record.format,
      scannedAt: scannedAt.toISOString(),
    });

    expect(result).toEqual({
      id: record.id,
      userId: userId.toString(),
      content: record.content,
      format: record.format,
      note: record.note,
      scannedAt: scannedAt.toISOString(),
    });
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      WebhookEventType.HistoryRecordCreated,
      expect.objectContaining({ userId: userId.toString() }),
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      WebhookEventType.ScanSuccess,
      expect.objectContaining({ userId: userId.toString() }),
    );
  });

  it('returns paginated records with filters and search', async () => {
    const record = createRecord();
    const limit = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([record]) });
    const skip = jest.fn().mockReturnValue({ limit });
    const sort = jest.fn().mockReturnValue({ skip });
    const findExecChain = { sort };

    scanRecordModel.find.mockReturnValue(findExecChain);
    scanRecordModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(1),
    });

    const result = await service.findAll(userId.toString(), {
      page: 1,
      limit: 20,
      sortBy: ScanHistorySortBy.ScannedAt,
      sortOrder: SortOrder.Desc,
      format: BarcodeFormat.QrCode,
      dateFrom: '2026-05-01T00:00:00.000Z',
      dateTo: '2026-05-22T00:00:00.000Z',
      search: 'HELLO',
    });

    expect(scanRecordModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        format: BarcodeFormat.QrCode,
        $text: { $search: 'HELLO' },
      }),
    );
    expect(result.meta).toEqual({
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    expect(result.data).toHaveLength(1);
  });

  it('throws not found for invalid record id', async () => {
    await expect(service.findOne(userId.toString(), 'bad-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deletes a batch of owned records and emits delete event', async () => {
    const record = createRecord();
    scanRecordModel.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([record]),
    });
    scanRecordModel.deleteMany.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    await expect(
      service.deleteBatch(userId.toString(), { ids: [recordId.toString()] }),
    ).resolves.toEqual({ deletedCount: 1 });
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      WebhookEventType.HistoryRecordDeleted,
      expect.objectContaining({ userId: userId.toString() }),
    );
  });
});
