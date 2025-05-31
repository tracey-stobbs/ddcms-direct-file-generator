/**
 * Manual test script
 */
// Import dependencies
const fs = require('fs');
const path = require('path');

// Clear console and display a message
console.clear();
console.log("============================================");
console.log("Starting manual test of the file generator");
console.log("============================================");

console.log('Running manual test...');

// Import the file generator
const { FileGenerator } = require('./dist/services/file-generator');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created output directory: ${outputDir}`);
}

// Create a generator instance
const generator = new FileGenerator(outputDir);

// Generate a file
console.log('Generating file...');
generator.generateFile({
  fileType: 'SDDirect',
  numberOfRows: 10,
  includeHeaders: true,
  includeOptionalFields: true,
  hasInvalidRows: false
})
  .then(filePath => {
    console.log(`File generated successfully: ${filePath}`);
    
    // Read and display the file content
    const content = fs.readFileSync(filePath, 'utf8');
    console.log('\nFile content:');
    console.log(content);
    
    // Also save content to a separate file for easier inspection
    const contentLogFile = path.join(__dirname, 'file-content.log');
    fs.writeFileSync(contentLogFile, content);
    console.log(`Full content saved to: ${contentLogFile}`);
  })
  .catch(error => {
    console.error(`Error generating file: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);
  });
