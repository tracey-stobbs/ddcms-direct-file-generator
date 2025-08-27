import type { FileSystem } from '../fileWriter/fsWrapper';
import type { Request } from '../types';
import type { FileTypeAdapter } from './adapter';
import { bacs18PaymentLinesAdapter } from './bacs18PaymentLines';
import { eaziPayAdapter, generateEaziPayFile } from './eazipay';
import { generateSDDirectFile, sdDirectAdapter } from './sddirect';

export function getFileGenerator(
  type: string,
): (request: Request, fs: FileSystem) => Promise<string> {
  switch (type) {
    case 'SDDirect':
      return generateSDDirectFile;
    case 'EaziPay':
      return generateEaziPayFile;
    case 'Bacs18PaymentLines':
      // No file writer implemented for fixed-width yet; fall through to throw for legacy API
      throw new Error(`Legacy file generator not supported for: ${type}`);
    default:
      throw new Error(`Unknown file type: ${type}`);
  }
}

export function getFileTypeAdapter(type: string): FileTypeAdapter {
  switch (type) {
    case 'SDDirect':
      return sdDirectAdapter;
    case 'EaziPay':
      return eaziPayAdapter;
    case 'Bacs18PaymentLines':
      return bacs18PaymentLinesAdapter;
    default:
      throw new Error(`Unknown file type: ${type}`);
  }
}
