# DDCMS Direct File Creator

A Node.js API for generating DDCMS Direct files in predefined formats with random, valid, or intentionally invalid data for testing purposes.

## Features
- Single `/api/generate` endpoint (JSON, body optional)
- Generates SDDirect files (MVP) with correct naming and structure
- Configurable output location and file content
- Field-level validation and invalid data generation
- Extensible for future file types
- Structured logging of all requests, errors, and responses
- 100% unit test coverage (Vitest)

## Getting Started

### Prerequisites
- Node.js (Latest LTS)
- npm

### Install
```sh
npm install
```

### Build
```sh
npm run build
```

### Run
```sh
npm start
```

### Test
```sh
npm run test
```

## API Usage

### POST /api/generate
- Accepts JSON body matching the `Request` interface (see `documentation/types.ts`)
- Returns the full path of the generated file or an error summary

#### Example Request
```json
{
  "fileType": "SDDirect",
  "numberOfRows": 20,
  "hasInvalidRows": true
}
```

#### Example Response
```json
{
  "success": true,
  "filePath": "output/SDDirect_11_x_20_H_I_20250720_141500.csv"
}
```

## Logging
- All requests, errors, and responses are logged in structured JSON format for easy analysis.

## Contributing
- Follow TypeScript, Node.js, and linting best practices
- All code must be unit tested (Vitest)
- See `documentation/REQUIREMENTS.md` and `IMPLEMENTATION_PLAN.md` for details

## License
MIT
