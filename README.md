# DDCMS Direct File Builder

A simple API with a single endpoint that generates files in predefined formats with randomly generated data. These files are then saved to a given location on the file system.

## Technologies

- Node.js
- TypeScript
- Express
- Vitest (for testing)

## Installation

```bash
# Install dependencies
npm install

# Build the application
npm run build
```

## Running the Application

The application runs on port 3001 by default to avoid conflicts with other common applications.

```bash
# Start the application
npm start

# Start in development mode (with auto-reloading)
npm run dev
```

To specify a custom port, set the PORT environment variable before starting the server:

```bash
# Windows (PowerShell)
$env:PORT=3005; npm start

# Linux/MacOS
PORT=3005 npm start
```

## API Endpoints

### `POST /api/generate`

Generates a file with randomly generated data according to the specified parameters.

#### Request Body

```json
{
  "fileType": "SDDirect",
  "includeHeaders": true,
  "includeOptionalFields": false,
  "numberOfRows": 100,
  "hasInvalidRows": false
}
```

All fields are optional except `fileType`. Default values will be used for any missing fields.

#### Parameters

- `fileType`: Type of file to generate. Currently supported: "SDDirect" (required)
- `includeHeaders`: Whether to include header row (default: true)
- `includeOptionalFields`: Whether to include optional fields (default: false)
- `numberOfRows`: Number of rows to generate (default: 100)
- `hasInvalidRows`: Whether to include rows with invalid data (default: false)

#### Response

```json
{
  "message": "File generated successfully",
  "fileName": "SDDirect_06_H__V_20250530_142548.csv",
  "filePath": "/path/to/output/SDDirect_06_H__V_20250530_142548.csv",
  "fileSize": 1024,
  "requestTime": "2025-05-30T14:25:48.000Z",
  "processingTimeMs": 42
}
```

### `GET /health`

Health check endpoint to verify the API is running.

#### Response

```json
{
  "status": "ok"
}
```

## File Naming Convention

Generated files follow this naming pattern:
```
SDDirect_[COLUMNCOUNT]_[HEADERS]_[VALIDITY]_[TIMESTAMP].[extension]
```

Where:
- `[COLUMNCOUNT]`: Number of columns in the file
  - `06`: Only required columns (no optional fields)
  - `11`: All columns including optional fields
- `[HEADERS]`: Indicates if headers are included
  - `H_`: Headers included
  - `NH`: No headers
- `[VALIDITY]`: Indicates if the file contains invalid rows
  - `V`: All rows are valid
  - `I`: Contains invalid rows
- `[TIMESTAMP]`: Date and time in format YYYYMMDD_HHMMSS (e.g., 20250530_142548)
- `[extension]`: The file extension as specified in the file format spec

## File Types

Currently, only the `SDDirect` file type is implemented, but the codebase is designed to support additional file types in the future.

### SDDirect File Format

A CSV file with the following fields:

#### Required Fields
- Destination Account Name
- Destination Sort Code
- Destination Account Number
- Payment Reference (must start with a word character)
- Amount
- Transaction Code

#### Optional Fields
- Realtime Information Checksum
- Pay-Date
- Originating Sort Code
- Originating Account Number
- Originating Account Name

## Development

### Running Tests

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Linting

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## Contributing

Contributions must follow best practice rules regarding linting of TypeScript files and structure of Node.js APIs.

All code must include unit tests:
- Tests must live alongside the file being tested with a format such as `{filename.test.ts}`
- Test coverage should be maintained at a high level
