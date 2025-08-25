## EaziPay File Format

FileType: EaziPay
FileExtensions: .csv or .txt
HasHeader: false
HasFooter: false
DateFormats: `['YYYY-MM-DD', 'DD-MMM-YYYY', 'DD/MM/YYYY']`
Contents:


### Fields (exact order, all strings unless specified)

- Transaction Code 
- Originating Sort Code 
- Originating Account Number
- Destination Sort Code
- Destination Account Number
- Destination Account Name
- Fixed zero
- Amount (integer)
- Processing Date 
- Empty
- SUN Name 
- BACS Reference
- SUN Number 
- Empty Trailer 1
- Empty Trailer 2


## Additional Field-Level Validation Rules:

- Sun Number
  - If the Transaction Code is none of 0C, 0N, or 0S, it must be null or undefined. 
  - It is an optional field, so can be null or undefined, even if Transaction Code is one of 0C, 0N, 0S

- Empty Trailer columns
  - The last two columns are always empty strings.
​
###### Default Values for incoming request
```typescript
const defaultRequest: Request = {
  fileType: "EaziPay",
  canInlineEdit: true,
  includeHeaders: false,
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
```



# Example Formats
e.g. 17,111111,11111111,111111,11111111,Test Company,0,155040,10-APR-2025,,Test Company,DDREF01,,,


