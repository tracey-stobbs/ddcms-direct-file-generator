/**
 * Simple debug script
 */
const fs = require('fs');

// Create a simple log file
const logFile = 'debug.log';

try {
  // Log basic info
  fs.writeFileSync(logFile, `Debug test started at ${new Date().toISOString()}\n`);
  
  // Log node version
  fs.appendFileSync(logFile, `Node version: ${process.version}\n`);
  
  // Check file system access
  try {
    const testDir = './test-dir';
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir);
      fs.appendFileSync(logFile, `Created test directory: ${testDir}\n`);
    }
    
    // Try to write and read a file
    const testFile = './test-dir/test.txt';
    fs.writeFileSync(testFile, 'Test content');
    const content = fs.readFileSync(testFile, 'utf8');
    fs.appendFileSync(logFile, `Successfully wrote and read test file with content: ${content}\n`);
  } catch (fsError) {
    fs.appendFileSync(logFile, `File system error: ${fsError.message}\n${fsError.stack}\n`);
  }
  
  // Try to require modules
  try {
    // Check if we can require built-in modules
    require('path');
    fs.appendFileSync(logFile, 'Successfully required path module\n');
    
    // Check if we can require our custom modules
    try {
      const interfaces = require('./dist/types/interfaces');
      fs.appendFileSync(logFile, `Successfully required interfaces with keys: ${Object.keys(interfaces)}\n`);
    } catch (moduleError) {
      fs.appendFileSync(logFile, `Error requiring custom module: ${moduleError.message}\n${moduleError.stack}\n`);
    }
  } catch (requireError) {
    fs.appendFileSync(logFile, `Require error: ${requireError.message}\n${requireError.stack}\n`);
  }
  
  // Log success
  fs.appendFileSync(logFile, 'Debug test completed successfully\n');
  
} catch (error) {
  // If we can't even write to the log file, try console
  console.error('Critical error in debug script:', error);
}
