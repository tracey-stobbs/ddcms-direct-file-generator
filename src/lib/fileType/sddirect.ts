import { faker } from "@faker-js/faker";
import { DateTime } from "luxon";
import { generateFileWithFs } from "../fileWriter/fileWriter";
import type { FileSystem } from "../fileWriter/fsWrapper";
import { Request } from "../types";

// Helper: Generate a valid payment reference
function generatePaymentReference(): string {
  let ref = faker.string.alphanumeric(faker.number.int({ min: 7, max: 17 }));
  // Ensure it doesn't start with space or 'DDIC', and not all identical chars
  while (/^( |DDIC)/.test(ref) || /^([A-Za-z0-9])\1+$/.test(ref)) {
    ref = faker.string.alphanumeric(faker.number.int({ min: 7, max: 17 }));
  }
  return ref;
}

// Helper: Generate a valid pay date (3-30 working days in the future, not weekend/holiday)
function generatePayDate(): string {
  // For simplicity, just add 3-30 days and format as YYYYMMDD
  const days = faker.number.int({ min: 3, max: 30 });
  return DateTime.now().plus({ days }).toFormat("yyyyLLdd");
}

function getOriginatingDetails(request: Request): Record<string, string> {
  const details = request.defaultValues?.originatingAccountDetails;
  return {
  "Originating Sort Code": details?.sortCode || faker.finance.routingNumber(),
  "Originating Account Number": details?.accountNumber || faker.finance.accountNumber(8),
  "Originating Account Name": details?.accountName || faker.person.fullName().slice(0, 18),
  };
}

export function generateValidSDDirectRow(request: Request): Record<string, unknown> {
  const originating = getOriginatingDetails(request);
  return {
  "Destination Account Name": faker.person.fullName().slice(0, 18),
    "Destination Sort Code": faker.finance.routingNumber().slice(0, 6),
  "Destination Account Number": faker.finance.accountNumber(8),
    "Payment Reference": generatePaymentReference(),
  "Amount": faker.finance.amount({ min: 1, max: 10000, dec: 2 }),
    "Transaction code": faker.helpers.arrayElement(["01", "17", "18", "99", "0C", "0N", "0S"]),
  "Realtime Information Checksum": faker.helpers.arrayElement(["/" + faker.string.alpha({ length: 3, casing: "upper" }), "0000", ""]),
    "Pay Date": generatePayDate(),
    ...originating
  };
}

// Helper: Generate an invalid value for a given field
function generateInvalidValue(field: string): string {
  switch (field) {
  case "Destination Account Name": return faker.string.alpha({ length: 25 }); // too long
  case "Destination Sort Code": return faker.string.alpha({ length: 6 }); // not numeric
  case "Destination Account Number": return faker.string.alpha({ length: 8 }); // not numeric
  case "Payment Reference": return "DDIC" + faker.string.alphanumeric(5); // starts with DDIC
    case "Amount": return "-9999.99"; // negative
    case "Transaction code": return "XX"; // invalid code
  case "Realtime Information Checksum": return "////"; // invalid pattern
    case "Pay Date": return "20250101"; // not 3+ working days in future
    case "Originating Sort Code": return "ABCDEF"; // not numeric
    case "Originating Account Number": return "ABCDEFGH"; // not numeric
  case "Originating Account Name": return faker.string.alpha({ length: 25 }); // too long
    default: return "INVALID";
  }
}

export function generateInvalidSDDirectRow(request: Request): Record<string, unknown> {
  // Start with a valid row
  const row = generateValidSDDirectRow(request);
  // List of fields to potentially invalidate
  const fields = Object.keys(row);
  // Randomly pick 1-3 fields to invalidate
  const numInvalid = faker.number.int({ min: 1, max: 3 });
  const invalidFields = faker.helpers.shuffle(fields).slice(0, numInvalid);
  for (const field of invalidFields) {
    row[field] = generateInvalidValue(field);
  }
  // If canBeInvalid is true, force at least one originating field to be invalid
  if (request.defaultValues?.originatingAccountDetails?.canBeInvalid) {
    const origFields = ["Originating Sort Code", "Originating Account Number", "Originating Account Name"];
    const field = faker.helpers.arrayElement(origFields);
    row[field] = generateInvalidValue(field);
  }
  return row;
}
export async function generateSDDirectFile(request: Request, fs: FileSystem): Promise<string> {
  // Delegate to the tested fileWriter logic
  const sun = request.defaultValues?.originatingAccountDetails?.sortCode ?? "DEFAULT";
  const result = await generateFileWithFs(request, fs, sun);
  return result.filePath;
}
