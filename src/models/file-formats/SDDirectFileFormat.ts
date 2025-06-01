/**
 * SDDirect file format implementation
 */
import { FileFormat } from './FileFormat';
import { generateAccount, generateAccountName, generateAmount, generateChecksum, 
         generatePayDate, generatePaymentReference, generateSortCode, generateTransactionCode } from '../../services/dataGenerationService';
import { DateTime } from 'luxon';

export const SDDirectFileFormat: FileFormat = {
  fileType: 'SDDirect',
  fileExtension: 'csv',
  
  requiredFields: [
    'Destination Account Name',
    'Destination Sort Code',
    'Destination Account Number',
    'Payment Reference',
    'Amount',
    'Transaction Code'
  ],
  
  optionalFields: [
    'Realtime Information Checksum',
    'Pay-Date',
    'Originating Sort Code',
    'Originating Account Number',
    'Originating Account Name'
  ],
  
  requiredHeaders: 'Destination Account Name,Destination Sort Code,Destination Account Number,Payment Reference,Amount,Transaction code',
  
  fullHeaders: 'Destination Account Name,Destination Sort Code,Destination Account Number,Payment Reference,Amount,Transaction code,Realtime Information Checksum,Pay-Date,Originating Sort Code,Originating Account Number,Originating Account Name',
    generateData({ includeHeaders, includeOptionalFields, numberOfRows, hasInvalidRows }): string {
    let content = '';
    
    // Add headers if requested
    if (includeHeaders) {
      content += includeOptionalFields ? this.fullHeaders : this.requiredHeaders;
      content += '\n';
    }
    
    // Generate rows
    for (let i = 0; i < numberOfRows; i++) {
      // Determine if this row should be invalid
      const shouldBeInvalid = hasInvalidRows && Math.random() < 0.5;
      
      // Generate required fields
      const transactionCode = generateTransactionCode(shouldBeInvalid && Math.random() < 0.33);
      const destAccountName = generateAccountName(shouldBeInvalid && Math.random() < 0.33);
      const destSortCode = generateSortCode(shouldBeInvalid && Math.random() < 0.33);
      const destAccountNumber = generateAccount(shouldBeInvalid && Math.random() < 0.33);
      const paymentRef = generatePaymentReference(shouldBeInvalid && Math.random() < 0.33);
      const amount = generateAmount(transactionCode, shouldBeInvalid && Math.random() < 0.33);
      
      // Construct required fields row - exactly 6 fields as per the specification
      const row = [
        destAccountName,
        destSortCode,
        destAccountNumber,
        paymentRef,
        amount,
        transactionCode
      ];
      
      // Add optional fields if requested - 5 additional fields, making 11 total
      if (includeOptionalFields) {
        const checksum = generateChecksum(shouldBeInvalid && Math.random() < 0.33);
        const payDate = generatePayDate(shouldBeInvalid && Math.random() < 0.33);
        const origSortCode = generateSortCode(shouldBeInvalid && Math.random() < 0.33);
        const origAccountNumber = generateAccount(shouldBeInvalid && Math.random() < 0.33);
        const origAccountName = generateAccountName(shouldBeInvalid && Math.random() < 0.33);
        
        row.push(checksum);
        row.push(payDate);
        row.push(origSortCode);
        row.push(origAccountNumber);
        row.push(origAccountName);
      }
        // Add row to content
      content += row.join(',') + '\n';
    }
    
    return content.trim() + '\n';
  },
  
  generateFileName(includeOptionalFields, includeHeaders, hasInvalidRows): string {
    const columnCount = includeOptionalFields ? '11' : '06';
    const headersIndicator = includeHeaders ? 'H_' : 'NH';
    const validityIndicator = hasInvalidRows ? 'I' : 'V';
    const timestamp = DateTime.now().toFormat('yyyyMMdd_HHmmss');
    
    return `SDDirect_${columnCount}_${headersIndicator}_${validityIndicator}_${timestamp}.${this.fileExtension}`;
  }
};
