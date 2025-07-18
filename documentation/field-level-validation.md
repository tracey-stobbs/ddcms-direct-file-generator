## Field-Level Validation Rules:
Destination Account Name:
must be  18 characters or less and must only contain allowed characters

Destination Sort Code:
Must be  numeric and exactly 6 digits,


Destination Account Number:
Must be  numeric and exactly 8 digits,


Payment Reference:
Must be more than 6 and less than 18 characters and must only contain allowed characters.
Must start with a word character (letter or number).
It must not start with "DDIC" or a space. It cannot contain all the same characters.


Amount:
Must be decimal or integer.
Must not contain seperator characters.
If the Transaction Code is one of 0C, 0N, or 0S, it must be zero (represented as "0").


Transaction Code:
Must be one of the following: (01, 17, 18, 99, 0C, 0N, 0S)
Must not be null.


Realtime Information Checksum:
Must match one of the following patterns:
- A forward slash followed by exactly 3 allowed characters: /XXX
- Exactly 4 zeros: 0000
- Can be empty


Pay Date 
Must be a valid date in the format YYYYMMDD, 
Must be at least 3 working days in the future, but no more than 30 days.
Must not be a Saturday, Sunday, or UK Bank Holiday.
If the Transaction Code is one of 0N, 0C, or 0S, Pay Date MUST BE EXACTLY 3 working days in the future.

Processing Date
Must be a valid date in the format YYYYMMDD.
Must be at least 2 working days in the future.
Must not be a Saturday, Sunday, or UK Bank Holiday.
If the Transaction Code is one of 0N, 0C, or 0S, Processing Date MUST BE EXACTLY 2 working days in the future.
Note: Processing Date is not used in SDDirect file format, but will be used in future file types (Bacs18PaymentLines, Bacs18StandardFile).

Originating Account Name:
must be  18 characters or less and must only contain allowed characters


Originating Sort Code:
Must be  numeric and exactly 6 digits,


Originating Account Number:
Must be numeric or exactly 8 digits,

Only the following characters are allowed:
- [A–Za-z] (Alpha characters)
- [0–9] (Numeric characters)
- [.] (Full stop)
- [&] (Ampersand)
- [/] (Slash)
- [-] (Hyphen)
- [ ] (Blank space)
