/**
 * SDDirect file format implementation
 */
import { FileFormatStrategy, FieldValidationRule } from '../../types/interfaces';
import { 
  generateRandomString, 
  generateRandomNumericString, 
  generateRandomAmount,
  generateRandomTransactionCode,
  generateValidFutureBusinessDate,
  generateRandomRTIChecksum
} from '../../utils/data-generator';
import { FORBIDDEN_PAYMENT_REF_PREFIXES, TRANSACTION_CODES, ZERO_AMOUNT_TRANSACTION_CODES } from '../../utils/constants';

export class SDDirectFileFormat implements FileFormatStrategy {
  /**
   * Get header row for SDDirect file
   */
  getHeaders(): string[] {
    const requiredHeaders = [
      'Destination Account Name',
      'Destination Sort Code',
      'Destination Account Number',
      'Payment Reference',
      'Amount',
      'Transaction code'
    ];

    const optionalHeaders = [
      'Realtime Information Checksum',
      'Pay-Date',
      'Originating Sort Code',
      'Originating Account Number',
      'Originating Account Name'
    ];

    return [
      ...requiredHeaders,
      ...optionalHeaders
    ];
  }

  /**
   * Get validation and generation rules for required fields
   */
  getRequiredFields(): FieldValidationRule[] {
    return [
      // Destination Account Name
      {
        name: 'Destination Account Name',
        validate: (value: string) => {
          return value.length <= 18 && [...value].every(char => 
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.&/- '.includes(char));
        },
        generate: () => {
          const length = Math.floor(Math.random() * 12) + 5; // Random length between 5 and 17
          return generateRandomString(length);
        },
        generateInvalid: () => {
          // Too long name
          return generateRandomString(19);
        }
      },

      // Destination Sort Code
      {
        name: 'Destination Sort Code',
        validate: (value: string) => {
          return /^\d{6}$/.test(value);
        },
        generate: () => {
          return generateRandomNumericString(6);
        },
        generateInvalid: () => {
          // Either too short, too long, or contains non-numeric characters
          const invalidOptions = [
            generateRandomNumericString(5),
            generateRandomNumericString(7),
            generateRandomNumericString(3) + 'ABC'
          ];
          return invalidOptions[Math.floor(Math.random() * invalidOptions.length)];
        }
      },

      // Destination Account Number
      {
        name: 'Destination Account Number',
        validate: (value: string) => {
          return /^\d{8}$/.test(value);
        },
        generate: () => {
          return generateRandomNumericString(8);
        },
        generateInvalid: () => {
          // Either too short, too long, or contains non-numeric characters
          const invalidOptions = [
            generateRandomNumericString(7),
            generateRandomNumericString(9),
            generateRandomNumericString(4) + 'ABCD'
          ];
          return invalidOptions[Math.floor(Math.random() * invalidOptions.length)];
        }
      },

      // Payment Reference
      {
        name: 'Payment Reference',
        validate: (value: string) => {
          // More than 6 and less than 18 characters
          if (value.length <= 6 || value.length >= 18) {
            return false;
          }
          
          // Check if it starts with forbidden prefix
          for (const prefix of FORBIDDEN_PAYMENT_REF_PREFIXES) {
            if (value.startsWith(prefix)) {
              return false;
            }
          }
          
          // Check if all characters are the same
          if (new Set([...value]).size === 1) {
            return false;
          }
          
          // Check for allowed characters
          return [...value].every(char => 
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.&/- '.includes(char));
        },
        generate: () => {
          // Generate random length between 7 and 17
          const length = Math.floor(Math.random() * 11) + 7;
          
          // Generate base reference
          let reference = generateRandomString(length);
          
          // Ensure not all characters are the same
          if (new Set([...reference]).size === 1) {
            const position = Math.floor(Math.random() * reference.length);
            const differentChar = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(
              Math.floor(Math.random() * 62)
            );
            reference = reference.substring(0, position) + differentChar + reference.substring(position + 1);
          }
          
          // Ensure it doesn't start with forbidden prefix
          if (FORBIDDEN_PAYMENT_REF_PREFIXES.some(prefix => reference.startsWith(prefix))) {
            // Replace the beginning with a valid start
            reference = 'REF' + reference.substring(3);
          }
          
          return reference;
        },
        generateInvalid: () => {
          // Generate an invalid payment reference
          const invalidOptions = [
            // Too short
            generateRandomString(6),
            // Too long
            generateRandomString(18),
            // Starts with forbidden prefix
            'DDIC' + generateRandomString(5),
            // Starts with space
            ' ' + generateRandomString(10),
            // All the same character
            'A'.repeat(10)
          ];
          return invalidOptions[Math.floor(Math.random() * invalidOptions.length)];
        }
      },

      // Amount
      {
        name: 'Amount',
        validate: (value: string, transactionCode?: string) => {
          // Check if it's a valid decimal number
          if (!/^\d+(\.\d{1,2})?$/.test(value)) {
            return false;
          }
          
          // Check if it should be zero based on transaction code
          if (transactionCode && ZERO_AMOUNT_TRANSACTION_CODES.includes(transactionCode) && value !== '0.00') {
            return false;
          }
          
          return true;
        },
        generate: function() {
          // Get the transaction code that will be generated next (this is a workaround)
          // In a real implementation, we'd have a better way to coordinate this
          const transactionCode = TRANSACTION_CODES[Math.floor(Math.random() * TRANSACTION_CODES.length)];
          
          if (ZERO_AMOUNT_TRANSACTION_CODES.includes(transactionCode)) {
            return '0.00';
          }
          
          // Random amount between 0.01 and 10000
          return generateRandomAmount(0.01, 10000);
        },
        generateInvalid: function() {
          const invalidOptions = [
            // Non-numeric characters
            '123.4A',
            // More than 2 decimal places
            '123.456',
            // Using separator character
            '1,234.56',
            // Wrong amount for zero-required transaction code (we'll assume 0C is being used)
            '123.45'
          ];
          return invalidOptions[Math.floor(Math.random() * invalidOptions.length)];
        }
      },

      // Transaction Code
      {
        name: 'Transaction code',
        validate: (value: string) => {
          return TRANSACTION_CODES.includes(value);
        },
        generate: () => {
          return generateRandomTransactionCode();
        },
        generateInvalid: () => {
          // Generate an invalid transaction code
          const invalidOptions = [
            '00',
            '02',
            'XX',
            '1',
            '123'
          ];
          return invalidOptions[Math.floor(Math.random() * invalidOptions.length)];
        }
      }
    ];
  }

  /**
   * Get validation and generation rules for optional fields
   */
  getOptionalFields(): FieldValidationRule[] {
    return [
      // Realtime Information Checksum
      {
        name: 'Realtime Information Checksum',
        validate: (value: string) => {
          // Empty is valid
          if (value === '') {
            return true;
          }
          
          // Forward slash + 3 chars
          if (/^\/[A-Za-z0-9.&\/\- ]{3}$/.test(value)) {
            return true;
          }
          
          // 4 zeros
          if (value === '0000') {
            return true;
          }
          
          return false;
        },
        generate: () => {
          return generateRandomRTIChecksum();
        },
        generateInvalid: () => {
          // Invalid RTI checksum
          const invalidOptions = [
            '//AB',   // Double slash
            '/AB',    // Too short
            '/ABCD',  // Too long
            '000',    // Too few zeros
            '00000'   // Too many zeros
          ];
          return invalidOptions[Math.floor(Math.random() * invalidOptions.length)];
        }
      },

      // Pay Date
      {
        name: 'Pay-Date',
        validate: (value: string) => {
          // Check format YYYYMMDD
          if (!/^\d{8}$/.test(value)) {
            return false;
          }
          
          try {
            const year = parseInt(value.substring(0, 4));
            const month = parseInt(value.substring(4, 6)) - 1;
            const day = parseInt(value.substring(6, 8));
            
            // Check valid date
            const date = new Date(year, month, day);
            if (
              date.getFullYear() !== year ||
              date.getMonth() !== month ||
              date.getDate() !== day
            ) {
              return false;
            }
            
            // Check business day (not weekend or bank holiday)
            if (!isBusinessDay(value)) {
              return false;
            }
            
            // Check if at least 2 days in future but no more than 30 days
            const today = new Date();
            const twoDaysLater = new Date(today);
            twoDaysLater.setDate(today.getDate() + 2);
            
            const thirtyDaysLater = new Date(today);
            thirtyDaysLater.setDate(today.getDate() + 30);
            
            return date >= twoDaysLater && date <= thirtyDaysLater;
          } catch (error) {
            return false;
          }
        },
        generate: () => {
          return generateValidFutureBusinessDate();
        },
        generateInvalid: () => {
          const today = new Date();
          const options = [
            // Invalid date format
            '2025-05-30',
            // Date too soon (tomorrow)
            (() => {
              const tomorrow = new Date(today);
              tomorrow.setDate(today.getDate() + 1);
              return tomorrow.getFullYear().toString() +
                String(tomorrow.getMonth() + 1).padStart(2, '0') +
                String(tomorrow.getDate()).padStart(2, '0');
            })(),
            // Date too far in future (31 days)
            (() => {
              const farFuture = new Date(today);
              farFuture.setDate(today.getDate() + 31);
              return farFuture.getFullYear().toString() +
                String(farFuture.getMonth() + 1).padStart(2, '0') +
                String(farFuture.getDate()).padStart(2, '0');
            })(),
            // Weekend date
            '20250531', // Assuming May 31, 2025 is a Saturday
            '20250601'  // Assuming June 1, 2025 is a Sunday
          ];
          return options[Math.floor(Math.random() * options.length)];
        }
      },

      // Originating Sort Code
      {
        name: 'Originating Sort Code',
        validate: (value: string) => {
          return /^\d{6}$/.test(value);
        },
        generate: () => {
          return generateRandomNumericString(6);
        },
        generateInvalid: () => {
          // Either too short, too long, or contains non-numeric characters
          const invalidOptions = [
            generateRandomNumericString(5),
            generateRandomNumericString(7),
            generateRandomNumericString(3) + 'ABC'
          ];
          return invalidOptions[Math.floor(Math.random() * invalidOptions.length)];
        }
      },

      // Originating Account Number
      {
        name: 'Originating Account Number',
        validate: (value: string) => {
          return /^\d{8}$/.test(value);
        },
        generate: () => {
          return generateRandomNumericString(8);
        },
        generateInvalid: () => {
          // Either too short, too long, or contains non-numeric characters
          const invalidOptions = [
            generateRandomNumericString(7),
            generateRandomNumericString(9),
            generateRandomNumericString(4) + 'ABCD'
          ];
          return invalidOptions[Math.floor(Math.random() * invalidOptions.length)];
        }
      },

      // Originating Account Name
      {
        name: 'Originating Account Name',
        validate: (value: string) => {
          return value.length <= 18 && [...value].every(char => 
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.&/- '.includes(char));
        },
        generate: () => {
          const length = Math.floor(Math.random() * 12) + 5; // Random length between 5 and 17
          return generateRandomString(length);
        },
        generateInvalid: () => {
          // Too long name
          return generateRandomString(19);
        }
      }
    ];
  }

  /**
   * Get file prefix for SDDirect format
   */
  getFilePrefix(): string {
    return 'SDDirect';
  }
}
