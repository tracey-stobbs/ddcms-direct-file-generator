### Bacs18PaymentLines
FileType: Bacs18PaymentLines
FileExtension: .txt
HasHeader: false
HasFooter: false

## 1. Purpose
This document defines the requirements for generating a Bacs18PaymentLines file, which contains the data records section of a Bacs18StandardFile. Each line in the output file represents a single payment instruction, formatted according to the Bacs Standard 18 specification.

## 2. Scope
- The requirements cover the generation of input payment data into a valid Bacs18PaymentLines file.
- The file must be suitable for inclusion in a Bacs18StandardFile submission.

## 3. Functional Requirements

### 3.1 Output File Structure
- The system must generate either a "DAILY" OR "MULTI" output file containing a list of payment instructions, each containing all required fields.
- A "MULTI" output file contains all 12 fields and each payment line has a length of exactly 106 characters
- A "DAILY" output file contains only the first 11 fields and each payment line has a length of exactly 100 characters
- The user must be able to specify in their API request on whether to produce a MULTI or a DAILY file.  This will default to MULTI.
- The output file must:
  - Contain one line per payment instruction.
  - Have no header or footer rows.
  - Use the .txt file extension.
  - Each line must strictly follow the field order and length as specified below.

- Each payment instruction must include the following fields, at the exact positions and lengths specified:

| Field                         | Start  | End   | Length  | Padding/Justification| Notes                                     | 
| ------------------------------| -------| ------| --------| ---------------------| ---------------------------------------   | 
| Destination Sort Code         | 1      | 6     | 6       | Left, zero-padded    | Numeric                                   | 
| Destination Account Number    | 7      | 14    | 8       | Left, zero-padded    | Numeric                                   | 
| Fixed zero                    | 15     |       | 1       | Left, zero-padded    | Numeric                                   | 
| Transaction Code              | 16     | 17    | 2       | Left, space-padded   | Must be a valid Bacs transaction code     | 
| Originating Sort Code         | 18     | 23    | 6       | Left, zero-padded    | Numeric                                   | 
| Originating Account Number    | 24     | 31    | 8       | Left, zero-padded    | Numeric                                   | 
| RealTimeInformationCheckSum   | 32     | 35    | 4       | Left, zero-padded    | Uppercase, allowed chars only             | 
| Amount                        | 36     | 46    | 11      | Right, zero-padded   | In pence,                                 | 
| Originating Account Name      | 47     | 64    | 18      | Left, space-padded   | Uppercase, allowed chars only             | 
| Payment Reference             | 65     | 82    | 18      | Left, space-padded   | Uppercase, allowed chars only             | 
| Destination Account Name      | 83     | 100   | 18      | Left, space-padded   | Uppercase, allowed chars only             | 
| Processing Date               | 101    | 106   | 6       | Left, space-padded   | (bYYDDD) (b=space,YY=Year,DDD=Day of Year)| 

#### Field Length Enforcement
- Each field must be the exact length as specified above.
- If the data for a field is too short, it must be padded (with spaces or zeros as indicated) to reach the required length.
- If the data for a field is too long, it must be truncated to fit the specified length.

### 3.3 Field Formatting and Validation
- All fields must be output as strings unless otherwise specified.
- Each field must be the exact length and at the exact position as specified in section 3.1.
- Amount must be in pence, right justified, and zero-filled to 11 characters.
- All string fields must be left or right justified and padded as per the table above.
- If any generated or provided data is too short for a field, it must be padded (with spaces or zeros as indicated) to the required length.
- If any generated or provided data is too long for a field, it must be truncated to the required length.
- The Transaction Code must be validated against the list of allowed Bacs transaction codes.
- The Processing Date must be in Julian date format, left-padded with a space to make 6 characters (e.g., ' 25201' for 201st day of 2025).
- No field may contain characters outside the allowed set: A–Z (upper case), 0–9, . (full stop), & (ampersand), / (slash), - (hyphen), and blank space.
- Any invalid character must be replaced with a blank space.

#### Account balancing
Day sections and account sections must balance. Balancing is achieved using contra records: a debit 
contra balances debit records; a credit contra balances credit records.

## 4. Non-Functional Requirements
- The file generation process must be performant and able to handle large batches of payment instructions efficiently.
- The code must be modular, maintainable, and extensible for future changes to the Bacs18 specification.
- The implementation must be fully unit tested and linted, following TypeScript best practices.
- The output must be deterministic and repeatable for the same input data.

## 5. Extensibility
- The system should be designed to allow for future changes in field definitions, validation rules, or output formats with minimal code changes.


