export type TransactionCode = "01" | "17" | "18" | "99" | "0C" | "0N" | "0S";

export const ALLOWED_TRANSACTION_CODES: TransactionCode[] = [
  "01",
  "17",
  "18",
  "99",
  "0C",
  "0N",
  "0S",
];

export const ZERO_AMOUNT_TRANSACTION_CODES: TransactionCode[] = [
  "0C",
  "0N",
  "0S",
];

export const CREDIT_TRANSACTION_CODES: TransactionCode[] = [
  "99"]

export interface RowData {
  destinationAccountName: string;
  destinationSortCode: string;
  destinationAccountNumber: string;
  paymentReference: string;
  amount: string;
  transactionCode: string;
  realtimeInformationChecksum?: string;
  payDate?: string;
  processingDate?: string;
  originatingSortCode?: string;
  originatingAccountNumber?: string;
  originatingAccountName?: string;
}
export const DEFAULT_FILE_ROW: RowData = {
  destinationAccountName: "",
  destinationSortCode: "",
  destinationAccountNumber: "",
  paymentReference: "",
  amount: "",
  transactionCode: "",
  realtimeInformationChecksum: undefined,
  payDate: undefined,
  processingDate: undefined,
  originatingSortCode: undefined,
  originatingAccountNumber: undefined,
  originatingAccountName: undefined,
};
