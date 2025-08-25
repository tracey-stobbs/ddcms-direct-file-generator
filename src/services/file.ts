import type { PreviewParams as StrategyParams, PreviewResult as StrategyResult } from "../lib/fileType/adapter";
import { getFileTypeAdapter } from "../lib/fileType/factory";

export async function preview(params: StrategyParams): Promise<StrategyResult> {
  const p = params;
  if (p.fileType !== "EaziPay" && p.fileType !== "SDDirect" && p.fileType !== "Bacs18PaymentLines") {
    throw new Error(`Unsupported fileType for preview: ${p.fileType}`);
  }
  const adapter = getFileTypeAdapter(p.fileType);
  const rows = adapter.buildPreviewRows(p);
  const content = adapter.serialize(rows, p);
  const meta = adapter.previewMeta(rows, p);
  return { content, meta };
}
