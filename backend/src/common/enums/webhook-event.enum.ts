export enum WebhookEventType {
  ScanSuccess = 'SCAN_SUCCESS',
  ScanError = 'SCAN_ERROR',
  UserCreated = 'USER_CREATED',
  HistoryRecordCreated = 'HISTORY_RECORD_CREATED',
  HistoryRecordDeleted = 'HISTORY_RECORD_DELETED',
}

export enum WebhookDeliveryStatus {
  Success = 'success',
  Failure = 'failure',
}
