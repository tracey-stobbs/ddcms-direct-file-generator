import { generateSDDirectFile } from "./sddirect";
import type { Request } from "../../types";

export function getFileGenerator(type: string) {
  switch (type) {
    case "SDDirect":
      return generateSDDirectFile;
    default:
      throw new Error(`Unknown file type: ${type}`);
  }
}
