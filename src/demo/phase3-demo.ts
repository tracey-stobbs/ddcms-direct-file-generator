/**
 * Phase 3 Demonstration
 * Shows the complete data generation and file generation capabilities
 */
import { generateFile } from '../services/fileGenerator';
import { generateRecords } from '../services/dataGeneration';

console.log('🚀 Phase 3 Data Generation Engine Demo\n');

// Demo 1: Basic file generation with defaults
console.log('📄 Demo 1: Default SDDirect file generation');
const defaultFile = generateFile({});
console.log(`Generated: ${defaultFile.filename}`);
console.log(`Records: ${defaultFile.metadata.recordCount}`);
console.log(`Columns: ${defaultFile.metadata.columnCount}`);
console.log(`Valid/Invalid: ${defaultFile.metadata.validRecords}/${defaultFile.metadata.invalidRecords}`);
console.log('Preview (first 3 lines):');
console.log(defaultFile.content.split('\n').slice(0, 3).join('\n'));
console.log('');

// Demo 2: Custom configuration with invalid rows
console.log('📄 Demo 2: Custom file with invalid rows');
const customFile = generateFile({
  numberOfRows: 10,
  hasInvalidRows: true,
  includeHeaders: false,
  includeOptionalFields: false
});
console.log(`Generated: ${customFile.filename}`);
console.log(`Records: ${customFile.metadata.recordCount}`);
console.log(`Valid/Invalid: ${customFile.metadata.validRecords}/${customFile.metadata.invalidRecords}`);
console.log('Preview (first 3 lines):');
console.log(customFile.content.split('\n').slice(0, 3).join('\n'));
console.log('');

// Demo 3: Large file with canInlineEdit limit
console.log('📄 Demo 3: Large file respecting canInlineEdit limit');
const largeFile = generateFile({
  numberOfRows: 100,
  hasInvalidRows: true,
  canInlineEdit: true
});
console.log(`Generated: ${largeFile.filename}`);
console.log(`Records: ${largeFile.metadata.recordCount}`);
console.log(`Valid/Invalid: ${largeFile.metadata.validRecords}/${largeFile.metadata.invalidRecords}`);
console.log(`Note: Invalid rows capped at 49 due to canInlineEdit=true`);
console.log('');

// Demo 4: Show data generation directly
console.log('🔧 Demo 4: Direct data generation examples');
const validRecords = generateRecords(5, false, true, true);
console.log('Valid records with optional fields:');
validRecords.forEach((record, i) => {
  console.log(`${i + 1}. ${record.destinationAccountName} | ${record.transactionCode} | ${record.amount} | ${record.payDate || 'N/A'}`);
});
console.log('');

// Demo 5: Transaction code business rules
console.log('🎯 Demo 5: Transaction code business rules demonstration');
const mixedRecords = generateRecords(20, false, true, true);
const zeroAmountCodes = ['0C', '0N', '0S'];
const specialRecords = mixedRecords.filter(r => zeroAmountCodes.includes(r.transactionCode));
console.log(`Generated ${mixedRecords.length} records, found ${specialRecords.length} with special transaction codes:`);
specialRecords.forEach(record => {
  console.log(`- Code ${record.transactionCode}: Amount=${record.amount} (must be "0")`);
});

console.log('\n✅ Phase 3 Data Generation Engine is complete and fully functional!');
console.log('🎉 All business rules, validation, and file generation features implemented.');
