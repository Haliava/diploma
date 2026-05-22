import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { BarcodeFormat } from '../../common/enums/barcode-format.enum';

export type ScanRecordDocument = HydratedDocument<ScanRecord>;

@Schema({
  collection: 'scan_records',
  timestamps: true,
})
export class ScanRecord {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  content: string;

  @Prop({
    type: String,
    enum: Object.values(BarcodeFormat),
    required: true,
    index: true,
  })
  format: BarcodeFormat;

  @Prop({
    default: '',
    trim: true,
  })
  note: string;

  @Prop({
    required: true,
    index: true,
  })
  scannedAt: Date;
}

export const ScanRecordSchema = SchemaFactory.createForClass(ScanRecord);

ScanRecordSchema.index({ userId: 1, scannedAt: -1 });
ScanRecordSchema.index({ userId: 1, format: 1, scannedAt: -1 });
ScanRecordSchema.index({ content: 'text', note: 'text' });
