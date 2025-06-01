/**
 * SDDirect file format implementation
 */
import { FileFormat } from "./FileFormat";
import {
  generateValidRow,
  generateInvalidRow,
} from "../../services/dataGenerationService";
import { DateTime } from "luxon";
import { RowData } from "@models/RowData";

export const SDDirectFileFormat: FileFormat = {
  fileType: "SDDirect",
  fileExtension: "csv",

  requiredFields: [
    "Destination Account Name",
    "Destination Sort Code",
    "Destination Account Number",
    "Payment Reference",
    "Amount",
    "Transaction Code",
  ],

  optionalFields: [
    "Realtime Information Checksum",
    "Pay-Date",
    "Originating Sort Code",
    "Originating Account Number",
    "Originating Account Name",
  ],

  requiredHeaders:
    "Destination Account Name,Destination Sort Code,Destination Account Number,Payment Reference,Amount,Transaction code",

  fullHeaders:
    "Destination Account Name,Destination Sort Code,Destination Account Number,Payment Reference,Amount,Transaction code,Realtime Information Checksum,Pay-Date,Originating Sort Code,Originating Account Number,Originating Account Name",

  generateData({
    includeHeaders,
    includeOptionalFields,
    numberOfRows,
    hasInvalidRows,
  }): string {
    let content = "";

    let rows: RowData[] = [];

    for (let i = 0; i < numberOfRows; i++) {
      // Determine if this row should be invalid
      // If hasInvalidRows is true, make 1-3 rows invalid (randomly)
      const shouldBeInvalid =
        hasInvalidRows &&
        (i === Math.floor(Math.random() * numberOfRows) || // At least one row
          i === Math.floor(Math.random() * numberOfRows) || // Maybe another
          i === Math.floor(Math.random() * numberOfRows)); // Maybe a third

      const row = shouldBeInvalid
        ? generateInvalidRow(includeOptionalFields)
        : generateValidRow(includeOptionalFields);

      rows.push(row);
    }

    // Add headers if requested
    if (includeHeaders) {
      content += includeOptionalFields
        ? this.fullHeaders
        : this.requiredHeaders;
      content += "\r\n";
    }

    // Generate rows
    // Add data rows
    rows.forEach((row) => {
      const rowValues = [
        row.destinationAccountName,
        row.destinationSortCode,
        row.destinationAccountNumber,
        row.paymentReference,
        row.amount,
        row.transactionCode,
      ];

      if (includeOptionalFields) {
        rowValues.push(
          row.realtimeInformationChecksum || "",
          row.payDate || "",
          row.originatingSortCode || "",
          row.originatingAccountNumber || "",
          row.originatingAccountName || ""
        );
      }

      content += rowValues.join(",") + "\r\n";
    });

    return content.trim() + "\r\n";
  },

  generateFileName(
    includeOptionalFields,
    includeHeaders,
    hasInvalidRows
  ): string {
    const columnCount = includeOptionalFields ? "11" : "06";
    const headersIndicator = includeHeaders ? "H_" : "NH";
    const validityIndicator = hasInvalidRows ? "I" : "V";
    const timestamp = DateTime.now().toFormat("yyyyMMdd_HHmmss");

    return `SDDirect_${columnCount}_${headersIndicator}_${validityIndicator}_${timestamp}.${this.fileExtension}`;
  },
};
