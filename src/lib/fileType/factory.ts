import type { FileSystem } from "../fileWriter/fsWrapper";
import type { Request } from "../types";
import { generateEaziPayFile } from "./eazipay";
import { generateSDDirectFile } from "./sddirect";

export function getFileGenerator(type: string): (request: Request, fs: FileSystem) => Promise<string> {
  switch (type) {
    case "SDDirect":
      return generateSDDirectFile;
    case "EaziPay":
      return generateEaziPayFile;
    default:
      throw new Error(`Unknown file type: ${type}`);
  }
}
