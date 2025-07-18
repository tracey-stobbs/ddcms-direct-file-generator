export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export interface Request {
  fileType: "SDDirect" | "Bacs18PaymentLines" | "Bacs18StandardFile";
  canInlineEdit: boolean;
  includeHeader?: boolean;
  numberOfRows?: number;
  hasInvalidRows?: boolean;
  includeOptionalFields?: boolean | OptionalField[];
  optionalFields?: OptionalFieldItem ;
}

interface OptionalFieldObject {
  realtimeInformationChecksum?: string;
  payDate?: string;
  originatingAccountDetails?: OriginatingAccountDetails;
}

interface originatingAccountDetailOptions {
  canBeInvalid: boolean;
  SortCode?: string;
  AccountNumber?: string;
  AccountName?: string;
}

type OriginatingAccountDetails = Prettify<originatingAccountDetailOptions>;

export type OptionalFieldItem = Prettify<OptionalFieldObject>;

export type OptionalField = Prettify<
  keyof Record<keyof OptionalFieldItem, string>
>;

export const defaultRequest: Request = {
  fileType: "SDDirect",
  canInlineEdit: true,
  includeHeader: true,
  hasInvalidRows: false,
  numberOfRows: 15,
  optionalFields: {
    originatingAccountDetails: {
      canBeInvalid: true,
      SortCode: "912291",
      AccountNumber: "51491194",
      AccountName: "Test Account"
    }
  }
} as const;
