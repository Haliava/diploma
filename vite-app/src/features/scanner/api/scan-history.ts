import { axiosInstance } from "@/shared/api/app"
import type { BarcodeFormat } from "@/shared/lib/wasm-scanner"

export type CreateScanRecordRequest = {
  content: string
  format: BarcodeFormat
  note?: string
  scannedAt?: string
}

export type ScanRecordResponse = {
  id: string
  userId: string
  content: string
  format: BarcodeFormat
  note: string
  scannedAt: string
}

export const createScanRecord = (payload: CreateScanRecordRequest) =>
  axiosInstance.post<ScanRecordResponse>("/scan-history", payload)
