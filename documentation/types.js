"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRequest = void 0;
exports.defaultRequest = {
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
            accountName: "Test Account"
        }
    }
};
