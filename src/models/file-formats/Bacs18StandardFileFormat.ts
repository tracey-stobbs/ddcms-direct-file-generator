/**
 * Bacs18StandardFile format implementation
 */
import { FileFormat } from './FileFormat';
import { 
  generateAccount, 
  generateAccountName, 
  generateAmount, 
  generateChecksum, 
  generatePayDate, 
  generatePaymentReference, 
  generateSortCode, 
  generateTransactionCode 
} from '../../services/dataGenerationService';
import { DateTime } from 'luxon';

export const Bacs18StandardFileFormat: FileFormat = {
  fileType: 'Bacs18StandardFile',
  fileExtension: 'bacs',
  
  requiredFields: [
    'Header Record Identifier',
    'Processing Date',
    'Originator ID',
    'File Code',
    'Record Type',
    'Destination Sort Code',
    'Destination Account Number',
    'Destination Account Name',
    'Payment Reference',
    'Amount',
    'Transaction Code'
  ],
  
  optionalFields: [
    'Realtime Information Checksum',
    'Pay-Date',
    'Originating Sort Code',
    'Originating Account Number',
    'Originating Account Name',
    'Footer Identifier'
  ],
  
  // Define header structure
  requiredHeaders: 'VOL1',
  fullHeaders: 'VOL1,HDR1',
  
  generateData({ includeHeaders, includeOptionalFields, numberOfRows, hasInvalidRows }): string {
    let content = '';
    
    // Add standard BACS file header
    if (includeHeaders) {
      // Add VOL1 header - basic header
      content += 'VOL1' + 'BACS    '.padEnd(20) + DateTime.now().toFormat('yydddd') + '\n';
      
      // Add HDR1 header if full headers requested
      if (includeOptionalFields) {
        content += 'HDR1' + 'PAYMENT  '.padEnd(20) + DateTime.now().toFormat('yydddd') + '\n';
      }
    }
    
    // Generate data rows
    for (let i = 0; i < numberOfRows; i++) {
      // Determine if this row should be invalid
      const shouldBeInvalid = hasInvalidRows && Math.random() < 0.5;
      
      // Generate standard required fields
      const recordType = '1'; // 1=first record, 2=continuation, 3=last record
      const destSortCode = generateSortCode(shouldBeInvalid && Math.random() < 0.33);
      const destAccountNumber = generateAccount(shouldBeInvalid && Math.random() < 0.33);
      const destAccountName = generateAccountName(shouldBeInvalid && Math.random() < 0.33);
      const paymentRef = generatePaymentReference(shouldBeInvalid && Math.random() < 0.33);
      const transactionCode = generateTransactionCode(shouldBeInvalid && Math.random() < 0.33);
      const amount = generateAmount(transactionCode, shouldBeInvalid && Math.random() < 0.33);
      const processingDate = DateTime.now().plus({ days: 1 }).toFormat('yyMMdd');
      const originatorId = 'ORG' + DateTime.now().toFormat('yyMMdd');
      const fileCode = 'PAYFILE';
        // Construct the record in standard BACS format (fixed width)
      // Record format based on traditional BACS standards
      let row = recordType; // Record type (1 char)
      row += destSortCode; // Destination sort code (6 chars)
      row += destAccountNumber.padEnd(8, ' '); // Destination account number (8 chars)
      row += destAccountName.padEnd(18, ' ').replace(/,/g, '.'); // Account name (18 chars) - replace commas
      row += paymentRef.padEnd(18, ' ').replace(/,/g, '.'); // Reference (18 chars) - replace commas
      row += amount.padEnd(11, '0'); // Amount (11 chars)
      row += transactionCode; // Transaction code (2 chars)
      row += processingDate; // Processing date (6 chars)
      row += originatorId.padEnd(10, ' '); // Originator ID (10 chars)
      row += fileCode.padEnd(7, ' '); // File code (7 chars)
      
      // Add optional fields if requested
      if (includeOptionalFields) {
        const checksum = generateChecksum(shouldBeInvalid && Math.random() < 0.33);
        const payDate = generatePayDate(shouldBeInvalid && Math.random() < 0.33);
        const origSortCode = generateSortCode(shouldBeInvalid && Math.random() < 0.33);
        const origAccountNumber = generateAccount(shouldBeInvalid && Math.random() < 0.33);
        const origAccountName = generateAccountName(shouldBeInvalid && Math.random() < 0.33);
          row += checksum.padEnd(4, ' '); // Checksum (4 chars)
        row += payDate; // Pay date (8 chars)
        row += origSortCode; // Orig sort code (6 chars)
        row += origAccountNumber.padEnd(8, ' '); // Orig account number (8 chars)
        row += origAccountName.padEnd(18, ' ').replace(/,/g, '.'); // Orig account name (18 chars) - replace commas
      }
      
      // Add row to content
      content += row + '\n';
    }
    
    // Add footer if using optional fields
    if (includeHeaders && includeOptionalFields) {
      content += 'EOF1' + 'BACS    '.padEnd(20) + DateTime.now().toFormat('yydddd') + '\n';
    }
    
    return content;
  },
  
  generateFileName(includeOptionalFields, includeHeaders, hasInvalidRows): string {
    const recordIndicator = includeOptionalFields ? 'Extended' : 'Standard';
    const headerIndicator = includeHeaders ? 'WithHeaders' : 'NoHeaders';
    const validityIndicator = hasInvalidRows ? 'Invalid' : 'Valid';
    const timestamp = DateTime.now().toFormat('yyyyMMdd_HHmmss');
    
    return `Bacs18StandardFile_${recordIndicator}_${headerIndicator}_${validityIndicator}_${timestamp}.${this.fileExtension}`;
  }
};
