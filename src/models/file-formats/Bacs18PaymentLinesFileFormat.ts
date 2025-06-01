/**
 * Bacs18PaymentLines file format implementation
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

export const Bacs18PaymentLinesFileFormat: FileFormat = {
  fileType: 'Bacs18PaymentLines',
  fileExtension: 'txt',
  
  // Based on the documentation, we'll define the structure with standard banking fields
  requiredFields: [
    'Source Sort Code',
    'Source Account Number',
    'Destination Sort Code',
    'Destination Account Number',
    'Payment Reference',
    'Amount',
    'Transaction Code'
  ],
  
  optionalFields: [
    'Source Account Name',
    'Destination Account Name',
    'Payment Date'
  ],
  
  // No headers according to documentation
  requiredHeaders: '',
  fullHeaders: '',
  
  generateData({ includeHeaders, includeOptionalFields, numberOfRows, hasInvalidRows }): string {
    let content = '';
    
    // Bacs18PaymentLines doesn't use headers, so we ignore the includeHeaders parameter
    
    // Generate rows
    for (let i = 0; i < numberOfRows; i++) {
      // Determine if this row should be invalid
      const shouldBeInvalid = hasInvalidRows && Math.random() < 0.5;
      
      // Generate required fields
      const sourceSortCode = generateSortCode(shouldBeInvalid && Math.random() < 0.33);
      const sourceAccountNumber = generateAccount(shouldBeInvalid && Math.random() < 0.33);
      const destSortCode = generateSortCode(shouldBeInvalid && Math.random() < 0.33);
      const destAccountNumber = generateAccount(shouldBeInvalid && Math.random() < 0.33);
      const transactionCode = generateTransactionCode(shouldBeInvalid && Math.random() < 0.33);
      const paymentRef = generatePaymentReference(shouldBeInvalid && Math.random() < 0.33);
      const amount = generateAmount(transactionCode, shouldBeInvalid && Math.random() < 0.33);
      
      // Construct required fields into a fixed-width format
      // Using standard BACS formatting with each field having fixed positions
      let row = `${sourceSortCode.padEnd(6, ' ')}${sourceAccountNumber.padEnd(8, ' ')}`;
      row += `${destSortCode.padEnd(6, ' ')}${destAccountNumber.padEnd(8, ' ')}`;
      row += `${paymentRef.padEnd(18, ' ')}${amount.padEnd(11, ' ')}${transactionCode.padEnd(2, ' ')}`;
      
      // Add optional fields if requested
      if (includeOptionalFields) {
        const sourceAccountName = generateAccountName(shouldBeInvalid && Math.random() < 0.33);
        const destAccountName = generateAccountName(shouldBeInvalid && Math.random() < 0.33);
        const payDate = generatePayDate(shouldBeInvalid && Math.random() < 0.33);
        
        row += `${sourceAccountName.padEnd(18, ' ')}`;
        row += `${destAccountName.padEnd(18, ' ')}`;
        row += `${payDate}`;
      }
      
      // Add row to content
      content += row + '\n';
    }
    
    return content;
  },
  
  generateFileName(includeOptionalFields, includeHeaders, hasInvalidRows): string {
    // Bacs18PaymentLines doesn't use headers, so we ignore the includeHeaders parameter
    const fieldIndicator = includeOptionalFields ? 'Full' : 'Basic';
    const validityIndicator = hasInvalidRows ? 'Invalid' : 'Valid';
    const timestamp = DateTime.now().toFormat('yyyyMMdd_HHmmss');
    
    return `Bacs18PaymentLines_${fieldIndicator}_${validityIndicator}_${timestamp}.${this.fileExtension}`;
  }
};
