import { generateSDDirectFile } from "./sddirect";
import type { Request } from "../types";
import type { FileSystem } from "../fileWriter/fsWrapper";

export function getFileGenerator(type: string): (request: Request, fs: FileSystem) => Promise<string> {
  switch (type) {
    case "SDDirect":
      return generateSDDirectFile;
    case "EaziPay":
      // For now, return a placeholder that uses the same fileWriter pattern
      // This will be updated when we integrate with the file writer
      return generateSDDirectFile; // Temporary - will be replaced with EaziPay-specific logic
    default:
      throw new Error(`Unknown file type: ${type}`);
  }
}
