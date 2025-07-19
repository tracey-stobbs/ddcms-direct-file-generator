/**
 * Tests for the file storage service
 * Validates file operations, security, and error handling
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { join } from 'path';
import {
  saveFile,
  fileExists,
  getFileStats,
  listFiles,
  deleteFile,
  getDirectorySize
} from "./fileStorage";

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    access: vi.fn(),
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    rename: vi.fn(),
    stat: vi.fn(),
    readdir: vi.fn(),
    unlink: vi.fn()
  }
}));

describe("File Storage Service", () => {
  // Get the mocked fs module
  const mockAccess = vi.fn();
  const mockMkdir = vi.fn();
  const mockWriteFile = vi.fn();
  const mockRename = vi.fn();
  const mockStat = vi.fn();
  const mockReaddir = vi.fn();
  const mockUnlink = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up the mocks
    vi.doMock('fs', () => ({
      promises: {
        access: mockAccess,
        mkdir: mockMkdir,
        writeFile: mockWriteFile,
        rename: mockRename,
        stat: mockStat,
        readdir: mockReaddir,
        unlink: mockUnlink
      }
    }));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("saveFile", () => {
    it("should save file successfully", async () => {
      mockAccess.mockResolvedValue(undefined); // Directory exists
      mockWriteFile.mockResolvedValue(undefined);
      mockRename.mockResolvedValue(undefined);

      const result = await saveFile('./output', 'test.csv', 'content');
      
      expect(result).toBe(join('./output', 'test.csv'));
      expect(mockWriteFile).toHaveBeenCalledWith(
        join('./output', 'test.csv.tmp'),
        'content',
        'utf8'
      );
      expect(mockRename).toHaveBeenCalledWith(
        join('./output', 'test.csv.tmp'),
        join('./output', 'test.csv')
      );
    });

    it("should create directory if it doesn't exist", async () => {
      mockAccess.mockRejectedValue(new Error('Directory not found'));
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockRename.mockResolvedValue(undefined);

      await saveFile('./newdir', 'test.csv', 'content');
      
      expect(mockMkdir).toHaveBeenCalledWith('./newdir', { recursive: true });
    });

    it("should sanitize file paths", async () => {
      mockAccess.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockRename.mockResolvedValue(undefined);

      await saveFile('../dangerous/../../path', 'bad<>file*.csv', 'content');
      
      // Should remove dangerous characters
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringMatching(/dangerous\/path\/badfile\.csv\.tmp$/),
        'content',
        'utf8'
      );
    });

    it("should handle file write errors", async () => {
      mockAccess.mockResolvedValue(undefined);
      mockWriteFile.mockRejectedValue(new Error('Disk full'));

      await expect(saveFile('./output', 'test.csv', 'content'))
        .rejects.toThrow('Failed to save file: Disk full');
    });

    it("should handle rename errors", async () => {
      mockAccess.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockRename.mockRejectedValue(new Error('Permission denied'));

      await expect(saveFile('./output', 'test.csv', 'content'))
        .rejects.toThrow('Failed to save file: Permission denied');
    });
  });

  describe("fileExists", () => {
    it("should return true when file exists", async () => {
      mockAccess.mockResolvedValue(undefined);

      const result = await fileExists('./test.csv');
      
      expect(result).toBe(true);
      expect(mockAccess).toHaveBeenCalledWith('./test.csv');
    });

    it("should return false when file doesn't exist", async () => {
      mockAccess.mockRejectedValue(new Error('File not found'));

      const result = await fileExists('./nonexistent.csv');
      
      expect(result).toBe(false);
    });
  });

  describe("getFileStats", () => {
    it("should return file statistics", async () => {
      const mockStats = {
        size: 1024,
        birthtime: new Date('2025-07-19T10:00:00Z'),
        mtime: new Date('2025-07-19T11:00:00Z'),
        isFile: () => true,
        isDirectory: () => false
      };
      mockStat.mockResolvedValue(mockStats);

      const result = await getFileStats('./test.csv');
      
      expect(result).toEqual({
        size: 1024,
        created: new Date('2025-07-19T10:00:00Z'),
        modified: new Date('2025-07-19T11:00:00Z')
      });
    });

    it("should handle stat errors", async () => {
      mockStat.mockRejectedValue(new Error('File not found'));

      await expect(getFileStats('./nonexistent.csv'))
        .rejects.toThrow('Failed to get file stats: File not found');
    });
  });

  describe("listFiles", () => {
    it("should list all files in directory", async () => {
      mockReaddir.mockResolvedValue(['file1.csv', 'file2.txt', 'file3.csv']);

      const result = await listFiles('./output');
      
      expect(result).toEqual(['file1.csv', 'file2.txt', 'file3.csv']);
    });

    it("should filter files by extension", async () => {
      mockReaddir.mockResolvedValue(['file1.csv', 'file2.txt', 'file3.csv']);

      const result = await listFiles('./output', '.csv');
      
      expect(result).toEqual(['file1.csv', 'file3.csv']);
    });

    it("should return empty array on error", async () => {
      mockReaddir.mockRejectedValue(new Error('Directory not found'));

      const result = await listFiles('./nonexistent');
      
      expect(result).toEqual([]);
    });
  });

  describe("deleteFile", () => {
    it("should delete file successfully", async () => {
      mockUnlink.mockResolvedValue(undefined);

      await deleteFile('./test.csv');
      
      expect(mockUnlink).toHaveBeenCalledWith('./test.csv');
    });

    it("should handle delete errors", async () => {
      mockUnlink.mockRejectedValue(new Error('Permission denied'));

      await expect(deleteFile('./test.csv'))
        .rejects.toThrow('Failed to delete file: Permission denied');
    });
  });

  describe("getDirectorySize", () => {
    it("should calculate directory size", async () => {
      const mockFiles = [
        { name: 'file1.csv', isFile: () => true, isDirectory: () => false },
        { name: 'file2.txt', isFile: () => true, isDirectory: () => false },
        { name: 'subdir', isFile: () => false, isDirectory: () => true }
      ];
      mockReaddir.mockResolvedValue(mockFiles);
      mockStat
        .mockResolvedValueOnce({ size: 1024 })
        .mockResolvedValueOnce({ size: 512 });

      const result = await getDirectorySize('./output');
      
      expect(result).toBe(1536); // 1024 + 512
      expect(mockStat).toHaveBeenCalledTimes(2); // Only files, not directories
    });

    it("should return 0 on error", async () => {
      mockReaddir.mockRejectedValue(new Error('Directory not found'));

      const result = await getDirectorySize('./nonexistent');
      
      expect(result).toBe(0);
    });

    it("should handle stat errors for individual files", async () => {
      const mockFiles = [
        { name: 'file1.csv', isFile: () => true, isDirectory: () => false },
        { name: 'file2.txt', isFile: () => true, isDirectory: () => false }
      ];
      mockReaddir.mockResolvedValue(mockFiles);
      mockStat
        .mockResolvedValueOnce({ size: 1024 })
        .mockRejectedValueOnce(new Error('File not accessible'));

      const result = await getDirectorySize('./output');
      
      expect(result).toBe(1024); // Only counts accessible files
    });
  });
});
