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

export type ScanHistoryResponse = {
  data: ScanRecordResponse[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type UpdateScanRecordRequest = Partial<CreateScanRecordRequest>

export const createScanRecord = (payload: CreateScanRecordRequest) =>
  axiosInstance.post<ScanRecordResponse>("/scan-history", payload)

export const getScanHistory = () =>
  axiosInstance.get<ScanHistoryResponse>("/scan-history", {
    params: {
      limit: 100,
      sortBy: "scannedAt",
      sortOrder: "desc",
    },
  })

export const updateScanRecord = (
  id: string,
  payload: UpdateScanRecordRequest,
) => axiosInstance.patch<ScanRecordResponse>(`/scan-history/${id}`, payload)

export const deleteScanRecord = (id: string) =>
  axiosInstance.delete<void>(`/scan-history/${id}`)
