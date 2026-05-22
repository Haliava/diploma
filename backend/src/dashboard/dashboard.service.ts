import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';

import { ScanRecord, ScanRecordDocument } from '../scan-history/schemas/scan-record.schema';
import { WebhookLog, WebhookLogDocument } from '../webhooks/schemas/webhook-log.schema';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import {
  ScanDayStatsDto,
  ScanFormatStatsDto,
  ScanStatsResponseDto,
} from './dto/scan-stats-response.dto';
import {
  WebhookDayStatsDto,
  WebhookEventStatsDto,
  WebhookStatsResponseDto,
  WebhookStatusStatsDto,
} from './dto/webhook-stats-response.dto';

type CountAggregationResult<TKey extends string, TValue> = {
  _id: TValue;
  count: number;
} & Record<TKey, TValue>;

type ScanDayAggregationResult = {
  _id: {
    date: string;
    format: ScanFormatStatsDto['format'];
  };
  count: number;
};

type WebhookDayAggregationResult = {
  _id: {
    date: string;
    status: WebhookStatusStatsDto['status'];
  };
  count: number;
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(ScanRecord.name)
    private readonly scanRecordModel: Model<ScanRecordDocument>,
    @InjectModel(WebhookLog.name)
    private readonly webhookLogModel: Model<WebhookLogDocument>,
  ) {}

  async getScanStats(query: DashboardQueryDto): Promise<ScanStatsResponseDto> {
    const match = this.buildDateMatch<ScanRecordDocument>('scannedAt', query);

    const [totalCount, byFormat, dayRows] = await Promise.all([
      this.scanRecordModel.countDocuments(match).exec(),
      this.scanRecordModel
        .aggregate<CountAggregationResult<'format', ScanFormatStatsDto['format']>>([
          { $match: match },
          { $group: { _id: '$format', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .exec(),
      this.scanRecordModel
        .aggregate<ScanDayAggregationResult>([
          { $match: match },
          {
            $group: {
              _id: {
                date: {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$scannedAt',
                  },
                },
                format: '$format',
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.date': 1, count: -1 } },
        ])
        .exec(),
    ]);

    return {
      totalCount,
      byFormat: byFormat.map((item) => ({
        format: item._id,
        count: item.count,
      })),
      byDay: this.toScanDayStats(dayRows),
    };
  }

  async getWebhookStats(
    query: DashboardQueryDto,
  ): Promise<WebhookStatsResponseDto> {
    const match = this.buildDateMatch<WebhookLogDocument>('triggeredAt', query);

    const [totalCount, byStatus, byEventType, dayRows] = await Promise.all([
      this.webhookLogModel.countDocuments(match).exec(),
      this.webhookLogModel
        .aggregate<
          CountAggregationResult<'status', WebhookStatusStatsDto['status']>
        >([
          { $match: match },
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .exec(),
      this.webhookLogModel
        .aggregate<
          CountAggregationResult<'eventType', WebhookEventStatsDto['eventType']>
        >([
          { $match: match },
          { $group: { _id: '$eventType', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .exec(),
      this.webhookLogModel
        .aggregate<WebhookDayAggregationResult>([
          { $match: match },
          {
            $group: {
              _id: {
                date: {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$triggeredAt',
                  },
                },
                status: '$status',
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.date': 1, count: -1 } },
        ])
        .exec(),
    ]);

    return {
      totalCount,
      byStatus: byStatus.map((item) => ({
        status: item._id,
        count: item.count,
      })),
      byEventType: byEventType.map((item) => ({
        eventType: item._id,
        count: item.count,
      })),
      byDay: this.toWebhookDayStats(dayRows),
    };
  }

  private buildDateMatch<T>(
    field: string,
    query: DashboardQueryDto,
  ): FilterQuery<T> {
    const match: Record<string, unknown> = {};

    if (query.dateFrom || query.dateTo) {
      const dateRange: { $gte?: Date; $lte?: Date } = {};

      if (query.dateFrom) {
        dateRange.$gte = new Date(query.dateFrom);
      }

      if (query.dateTo) {
        dateRange.$lte = new Date(query.dateTo);
      }

      match[field] = dateRange;
    }

    return match as FilterQuery<T>;
  }

  private toScanDayStats(rows: ScanDayAggregationResult[]): ScanDayStatsDto[] {
    const days = new Map<string, ScanDayStatsDto>();

    for (const row of rows) {
      const current = days.get(row._id.date) ?? {
        date: row._id.date,
        totalCount: 0,
        breakdown: [],
      };

      current.totalCount += row.count;
      current.breakdown.push({
        format: row._id.format,
        count: row.count,
      });
      days.set(row._id.date, current);
    }

    return [...days.values()];
  }

  private toWebhookDayStats(
    rows: WebhookDayAggregationResult[],
  ): WebhookDayStatsDto[] {
    const days = new Map<string, WebhookDayStatsDto>();

    for (const row of rows) {
      const current = days.get(row._id.date) ?? {
        date: row._id.date,
        totalCount: 0,
        breakdown: [],
      };

      current.totalCount += row.count;
      current.breakdown.push({
        status: row._id.status,
        count: row.count,
      });
      days.set(row._id.date, current);
    }

    return [...days.values()];
  }
}
