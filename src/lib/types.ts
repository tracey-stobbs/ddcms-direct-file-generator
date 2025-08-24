export type Prettify<T> = {
  [K in keyof T]: T[K];
};

// EaziPay-specific types
export type EaziPayDateFormat = "YYYY-MM-DD" | "DD-MMM-YYYY" | "DD/MM/YYYY";
export type EaziPayTrailerFormat = "quoted" | "unquoted";

export interface EaziPaySpecificFields {
  transactionCode: string;
  originatingSortCode: string;
  originatingAccountNumber: string;
  destinationSortCode: string;
  destinationAccountNumber: string;
  destinationAccountName: string;
  fixedZero: 0;
  amount: number;
  processingDate: string;
  empty: undefined;
  sunName: string;
  paymentReference: string;
  sunNumber?: string;
  eaziPayTrailer: string;
}

// Base request shared across endpoints
export interface BaseRequest {
  // New optional processing date override
  processingDate?: string;
  // Renamed flag for inline editing
  forInlineEditing?: boolean;
  // Common options
  numberOfRows?: number;
  includeOptionalFields?: boolean | OptionalField[];
  dateFormat?: EaziPayDateFormat; // EaziPay only
}

// Request body for the generate endpoint ONLY
export interface GenerateRequest extends BaseRequest {
  includeHeaders?: boolean;
  hasInvalidRows?: boolean;
  outputPath?: string;
}

// Request body for row preview endpoints (valid-row/invalid-row)
export type RowPreviewRequest = BaseRequest;

interface OptionalFieldObject {
  realtimeInformationChecksum?: string;
  payDate?: string;
  originatingAccountDetails?: OriginatingAccountDetails;
}

export interface OriginatingAccountDetailOptions {
  canBeInvalid: boolean;
  sortCode?: string;
  accountNumber?: string;
  accountName?: string;
}

export type OriginatingAccountDetails = Prettify<OriginatingAccountDetailOptions>;

export type OptionalFieldItem = Prettify<OptionalFieldObject>;

export type OptionalField = Prettify<
  keyof Record<keyof OptionalFieldItem, string>
>;

export interface SuccessResponse {
  success: true;
  // Generated file content returned by /generate
  fileContent: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export type ApiResponse = SuccessResponse | ErrorResponse;

// Internal legacy Request type used by generator code
export interface Request {
  fileType: "SDDirect" | "Bacs18PaymentLines" | "Bacs18StandardFile" | "EaziPay";
  canInlineEdit: boolean;
  includeHeaders?: boolean;
  numberOfRows?: number;
  hasInvalidRows?: boolean;
  includeOptionalFields?: boolean | OptionalField[];
  defaultValues?: OptionalFieldItem;
  outputPath?: string;
  dateFormat?: EaziPayDateFormat; // EaziPay only
  // New optional processing date override (external API may supply)
  processingDate?: string;
}

export const defaultGenerateRequest: GenerateRequest = {
  forInlineEditing: true,
  includeHeaders: true,
  hasInvalidRows: false,
  numberOfRows: 15,
  includeOptionalFields: true,
} as const;

export const defaultRequest: Request = {
  fileType: "SDDirect",
  canInlineEdit: true,
  includeHeaders: true,
  hasInvalidRows: false,
  numberOfRows: 15,
  includeOptionalFields: true,
} as const;
