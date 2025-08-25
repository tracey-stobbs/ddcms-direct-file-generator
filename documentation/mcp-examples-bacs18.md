# MCP examples: Bacs18PaymentLines

These requests target the in-memory MCP router (see `src/mcp/server.ts`).

- file.preview (MULTI)

Request:
{
  "id": 11,
  "method": "file.preview",
  "params": { "sun": "123456", "fileType": "Bacs18PaymentLines", "numberOfRows": 2, "variant": "MULTI" }
}

- row.generate (DAILY, invalid)

Request:
{
  "id": 12,
  "method": "row.generate",
  "params": { "sun": "123456", "fileType": "Bacs18PaymentLines", "validity": "invalid", "variant": "DAILY" }
}

Disclaimer: Bacs18PaymentLines output is for preview/testing only; no guarantee of acceptance by BACS.
