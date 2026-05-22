import { BarcodeFormat } from "./types"

export const barcodeFormatCodes: Record<BarcodeFormat, number> = {
  [BarcodeFormat.Ean8]: 0,
  [BarcodeFormat.Ean13]: 1,
  [BarcodeFormat.UpcA]: 2,
  [BarcodeFormat.UpcE]: 3,
  [BarcodeFormat.Code39]: 4,
  [BarcodeFormat.Code128]: 5,
  [BarcodeFormat.QrCode]: 6,
  [BarcodeFormat.DataMatrix]: 7,
  [BarcodeFormat.Pdf417]: 8,
  [BarcodeFormat.Aztec]: 9,
  [BarcodeFormat.Other]: 10,
}

const codeToBarcodeFormat = new Map(
  Object.entries(barcodeFormatCodes).map(([format, code]) => [
    code,
    format as BarcodeFormat,
  ]),
)

export const toBarcodeFormat = (code: number) =>
  codeToBarcodeFormat.get(code) ?? BarcodeFormat.Other

export const toActiveFormatsMask = (formats?: BarcodeFormat[]) => {
  if (!formats?.length) {
    return 0
  }

  return formats.reduce((mask, format) => {
    const code = barcodeFormatCodes[format]
    return mask | (1 << code)
  }, 0)
}
