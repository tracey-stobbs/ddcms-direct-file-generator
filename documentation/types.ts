export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export interface Request {
  fileType: "SDDirect" | "Bacs18PaymentLines" | "Bacs18StandardFile";
  canInlineEdit: boolean;
  includeHeaders?: boolean;
  numberOfRows?: number;
  hasInvalidRows?: boolean;
  includeOptionalFields?: boolean | OptionalField[];
  defaultFields?: OptionalFieldItem;
  outputPath?: string;
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
  defaultFields: {
    originatingAccountDetails: {
      canBeInvalid: true,
      sortCode: "912291",
      accountNumber: "51491194",
      accountName: "Test Account"
    }
  }
} as const;
