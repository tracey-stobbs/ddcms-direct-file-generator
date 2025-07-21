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
  paymentReference: string;
  amount: number;
  fixedZero: 0;
  processingDate: string;
  empty: undefined;
  sunName: string;
  bacsReference: string;
  sunNumber?: string;
  eaziPayTrailer: string;
}

export interface Request {
  fileType:
    | "SDDirect"
    | "Bacs18PaymentLines"
    | "Bacs18StandardFile"
    | "EaziPay";
  canInlineEdit: boolean;
  includeHeaders?: boolean;
  numberOfRows?: number;
  hasInvalidRows?: boolean;
  includeOptionalFields?: boolean | OptionalField[];
  defaultValues?: OptionalFieldItem;
  outputPath?: string;
  dateFormat?: EaziPayDateFormat; // EaziPay only
}

interface OptionalFieldObject {
  realtimeInformationChecksum?: string;
  payDate?: string;
  originatingAccountDetails?: OriginatingAccountDetails;
}

interface OriginatingAccountDetailOptions {
  canBeInvalid: boolean;
  sortCode?: string;
  accountNumber?: string;
  accountName?: string;
}

type OriginatingAccountDetails = Prettify<OriginatingAccountDetailOptions>;

export type OptionalFieldItem = Prettify<OptionalFieldObject>;

export type OptionalField = Prettify<
  keyof Record<keyof OptionalFieldItem, string>
>;

export interface SuccessResponse {
  success: true;
  filePath: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export type ApiResponse = SuccessResponse | ErrorResponse;

export const defaultRequest: Request = {
  fileType: "SDDirect",
  canInlineEdit: true,
  includeHeaders: true,
  hasInvalidRows: false,
  numberOfRows: 15,
  includeOptionalFields: true,
  defaultValues: {
    originatingAccountDetails: {
      canBeInvalid: true,
      sortCode: "912291",
      accountNumber: "51491194",
      accountName: "Test Account",
    },
  },
} as const;
