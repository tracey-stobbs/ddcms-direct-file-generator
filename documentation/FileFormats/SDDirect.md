## SDDirect File Format

FileType: SDDirect
FileExtension: .csv
Contents:

### Fields (exact order, all strings unless specified)
  - Destination Account Name
  - Destination Sort Code
  - Destination Account Number
  - Payment Reference
  - Amount (decimal)
  - Transaction Code

  - if the request includes `{    "includeOptionalFields": true    }`, the following additional fields, in this exact order
    - ​Realtime Information Checksum 
    - Pay Date  (DateTime)
    - Originating Sort Code 
    - Originating Account Number 
    - Originating Account name      
    
### Header Row
- When the request body includes `{    "includeHeaders": true, "includeOptionalFields" : false   }`,
   - The first line of the file must be exactly "Destination Account Name,Destination Sort Code,Destination Account Number,Payment Reference,Amount,Transaction code"

- When the request body includes `{    "includeHeaders": true, "includeOptionalFields" : true   }`:

   - The first line of the file must be exactly "Destination Account Name,Destination Sort Code,Destination Account Number,Payment Reference,Amount,Transaction code,Realtime Information Checksum,Pay Date,Originating Sort Code,Originating Account Number,Originating Account Name"

- When the request body includes `{"includeHeaders": false}` 
  - The first line of the file must be valid


