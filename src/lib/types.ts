export type Prettify<T> = {
    [K in keyof T]: T[K];
};

// EaziPay-specific types
export type EaziPayDateFormat = 'YYYY-MM-DD' | 'DD-MMM-YYYY' | 'DD/MM/YYYY';

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
    // Alias used in some tests/validators; maps to paymentReference
    bacsReference?: string;
    sunNumber?: string;
}

export interface Request {
    fileType: 'SDDirect' | 'Bacs18PaymentLines' | 'Bacs18StandardFile' | 'EaziPay';
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

export type OptionalField = Prettify<keyof Record<keyof OptionalFieldItem, string>>;

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
    fileType: 'SDDirect',
    canInlineEdit: true,
    includeHeaders: true,
    hasInvalidRows: false,
    numberOfRows: 15,
    includeOptionalFields: true,
    defaultValues: {
        originatingAccountDetails: {
            canBeInvalid: true,
            sortCode: '912291',
            accountNumber: '51491194',
            accountName: 'Test Account',
        },
    },
} as const;

// MCP: Temporary SUN configuration stub (until auth/config integration)
export const SUN_STUB = {
    sortCode: '912291',
    accountNumber: '51491194',
    accountName: 'Test Account',
    sun: '797154',
    sunName: 'SUN-C-0QZ5A',
} as const;

// MCP: Generate request (body) shape for new endpoints (no fileType in body)
export interface McpGenerateRequest {
    forInlineEditing?: boolean;
    includeHeaders?: boolean;
    hasInvalidRows?: boolean;
    outputPath?: string;
    processingDate?: string; // optional; not yet enforced across generators
    numberOfRows?: number; // optional override
    dateFormat?: EaziPayDateFormat; // for EaziPay only
}

export type FileTypeLiteral = 'SDDirect' | 'Bacs18PaymentLines' | 'Bacs18StandardFile' | 'EaziPay';
