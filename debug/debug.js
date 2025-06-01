const { SDDirectFileFormat } = require('../src/models/file-formats/SDDirectFileFormat');

const content = SDDirectFileFormat.generateData({
  includeHeaders: false,
  includeOptionalFields: true,
  numberOfRows: 1,
  hasInvalidRows: false
});

console.log('SDDirectFileFormat content:');
console.log(content);
console.log('Field count:', content.split('\n')[0].split(',').length);
console.log('Fields:', content.split('\n')[0].split(','));
