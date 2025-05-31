# DDCMS Direct File Builder

A Node.js API for generating test files with predefined formats and randomly generated data.

## Features

- Generate CSV files with randomly generated data
- Support for multiple file formats (SDDirect, Bacs18PaymentLines, Bacs18StandardFile)
- Configurable number of rows, headers, and optional fields
- Option to include invalid data for testing validation logic
- Consistent file naming convention

## Tech Stack

- Node.js
- TypeScript
- Express.js
- Vitest (for testing)

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YourOrg/ddcms-direct-file-builder.git
   cd ddcms-direct-file-builder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the application:
   ```bash
   npm run build
   ```

### Running the Application

Start the application:
```bash
npm start
```

By default, the server runs on port 3001. To use a different port, set the `PORT` environment variable:
```bash
PORT=3005 npm start
```

### Development Mode

Run the application with hot-reloading:
```bash
npm run dev
```

## API Endpoints

### Generate File

`POST /api/generate`

Generates a file based on the provided parameters.

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

All fields are optional and will use the default values shown above if not provided.

#### Response

```json
{
  "message": "File generated successfully",
  "fileName": "SDDirect_06_H_V_20250530_142548.csv",
  "filePath": "/path/to/output/SDDirect_06_H_V_20250530_142548.csv"
}
```

## File Naming Convention

Generated files follow this naming pattern:
```
SDDirect_[COLUMNCOUNT]_[HEADERS]_[VALIDITY]_[TIMESTAMP].csv
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

## Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Contributing

Please ensure that all contributions follow the project's coding style and include appropriate tests.

To check code quality:
```bash
npm run lint
```

To automatically fix linting issues:
```bash
npm run lint:fix
```

## License

This project is licensed under the ISC License.
