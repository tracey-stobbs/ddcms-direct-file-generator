/**
 * File Storage Service
 * Handles saving generated files to disk with proper directory management
 */
import { promises as fs } from 'fs';
import { join } from 'path';
import { logger } from '../lib/logger';

// Export fs for testing
export const fsPromises = fs;

/**
 * Ensure directory exists, creating it if necessary
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fsPromises.access(dirPath);
  } catch {
    // Directory doesn't exist, create it
    await fsPromises.mkdir(dirPath, { recursive: true });
    logger.info(`Created directory: ${dirPath}`);
  }
}

/**
 * Sanitize file path to prevent directory traversal attacks
 */
function sanitizeFilePath(filePath: string): string {
  // Remove any path traversal attempts
  const sanitized = filePath.replace(/\.\./g, '').replace(/[<>:"|?*]/g, '');
  return sanitized;
}

/**
 * Save content to file with atomic write operation
 */
export async function saveFile(
  outputPath: string,
  filename: string,
  content: string
): Promise<string> {
  try {
    // Sanitize inputs
    const sanitizedPath = sanitizeFilePath(outputPath);
    const sanitizedFilename = sanitizeFilePath(filename);
    
    // Ensure output directory exists
    await ensureDirectoryExists(sanitizedPath);
    
    // Create full file path
    const fullPath = join(sanitizedPath, sanitizedFilename);
    
    // Write file atomically (write to temp file, then rename)
    const tempPath = fullPath + '.tmp';
    await fsPromises.writeFile(tempPath, content, 'utf8');
    await fsPromises.rename(tempPath, fullPath);
    
    logger.info(`File saved successfully: ${fullPath}`);
    return fullPath;
    
  } catch (error) {
    logger.error(`Failed to save file: ${error}`);
    throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file stats
 */
export async function getFileStats(filePath: string): Promise<{
  size: number;
  created: Date;
  modified: Date;
}> {
  try {
    const stats = await fsPromises.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (error) {
    throw new Error(`Failed to get file stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * List files in directory
 */
export async function listFiles(dirPath: string, extension?: string): Promise<string[]> {
  try {
    const files = await fsPromises.readdir(dirPath);
    
    if (extension) {
      return files.filter(file => file.endsWith(extension));
    }
    
    return files;
  } catch (error) {
    logger.error(`Failed to list files in ${dirPath}: ${error}`);
    return [];
  }
}

/**
 * Delete file
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fsPromises.unlink(filePath);
    logger.info(`File deleted: ${filePath}`);
  } catch (error) {
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get directory size
 */
export async function getDirectorySize(dirPath: string): Promise<number> {
  try {
    const files = await fsPromises.readdir(dirPath, { withFileTypes: true });
    let totalSize = 0;
    
    for (const file of files) {
      if (file.isFile()) {
        try {
          const stats = await fsPromises.stat(join(dirPath, file.name));
          totalSize += stats.size;
        } catch (fileError) {
          // Skip files that can't be accessed, but continue processing others
          logger.warn(`Failed to get stats for ${file.name}: ${fileError}`);
        }
      }
    }
    
    return totalSize;
  } catch (error) {
    logger.error(`Failed to calculate directory size: ${error}`);
    return 0;
  }
}
