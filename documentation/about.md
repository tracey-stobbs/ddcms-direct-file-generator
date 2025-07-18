#### DDCMS Direct File Creator

### A simple API with a single endpoint that generates files in a predifined format with randomly generated data. These files are then saved to a given location on the file system.

## Technologies:

nodejs, typescript, express, vite, vitest

## Running the Application

The application runs on port 3001 by default to avoid conflicts with other common applications.
Do not use port 3000 as it is often used by other development servers.

To specify a custom port, set the PORT environment variable before starting the server.
Example: `$env:PORT=3005; npm start`

## File Naming Convention

Generated files follow this naming pattern:

```
[FileType]_[COLUMNCOUNT]_x_[ROWS]_[HEADERS]_[VALIDITY]_[TIMESTAMP].[extension]
```

Where:
- `[FileType]`: the file type that has been generated
- `[COLUMNCOUNT]`: Number of columns in the file
  - `06`: Only required columns (no optional fields)
  - `11`: All columns including optional fields
- `[ROWS]`: Number of rows as specified in the request, default is 15
- `[HEADERS]`: Indicates if headers are included
  - `_H`: Headers included
  - `NH`: No headers
- `[VALIDITY]`: Indicates if the file contains invalid rows
  - `V`: All rows are valid
  - `I`: Contains invalid rows
- `[TIMESTAMP]`: Date and time in format YYYYMMDD_HHMMSS (e.g., 20250530_142548)
- `[extension]`: the file extension as specified in the file format spec

## Contributing

must following best practice rules regarding linting of typescript files and structure of nodejs apis.
must contain unit tests

- tests must live alongside the file it is testing with a format such as {filename.test.ts}

## Endpoints

1. Generate  
   MUST accept json, but a body is not required. The json must adhere to the following typescript interface:

```typescript
export interface Request {
  fileType: "SDDirect" | "Bacs18PaymentLines" | "Bacs18StandardFile";
  canInlineEdit: boolean;
  includeHeader?: boolean;
  numberOfRows?: number;
  hasInvalidRows?: boolean;
  includeOptionalFields?: boolean | OptionalField[];
  optionalFields?: OptionalFieldItem ;
}
```
When values are not provided, use these values:

```typescript
export const defaultRequest: Request = {
  fileType: "SDDirect",
  canInlineEdit: true,
  includeHeader: true,
  hasInvalidRows: false,
  numberOfRows: 15,
  includeOptionalFields: true,
  optionalFields: {
    originatingAccountDetails: {
      canBeInvalid: true,
      sortCode: "912291",
      accountNumber: "51491194",
      accountName: "Test Account"
    }
  }
} as const;

```
Some types are provided in `./types.ts` you must strive to use these types whenever possible, although you are allowed to created your own.

If IncludeOptionalFields is true, the generated file must include generated data for ALL optional fields.

If IncludeOptionalFields is provided as an array, only the optional fields contained in that array should have data generated.

If optionalFields is not undefined, and not an empty object, use the data that is specified, do not randomly generate.


### FileTypes and FileFormats

It is planned there will be at least three fileTypes supported ("SDDirect" | "Bacs18PaymentLines" | "Bacs18StandardFile"), but for mvp, we will only implement for SDDirect
Code structure must allow for additional file structures in the future

The specification for these files are listed in the following files:
[SDDirect:](FileFormats/SDDirect.md)
[Bacs18PaymentLines](FileFormats/Bacs18PaymentLines.md)
[Bacs18StandardFile](FileFormats/Bacs18StandardFile.md)

### Data Generation

- Use faker.js to generate random data
- Use luxon for anything related to date/time.
- All non-header rows should include randomly generated field data following the [Field-Level Validation Rules](../field-level-validation.md) .  The exception to this is when the data has been specified in the OptionalFields item in the request.

- if the request body includes: `{    "hasInvalidRows": true    }`
  - then 50% of the generated rows must have at least one, but no more than three, fields which do not adhere to [Field-Level Validation Rules](../field-level-validation.md).
