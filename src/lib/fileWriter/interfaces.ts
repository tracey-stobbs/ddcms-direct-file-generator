import type { Request } from '../types';

export interface GeneratedFileMeta {
    rows: number;
    columns: number;
    header: string;
    validity: string;
    extension: string; // includes leading dot (e.g., ".csv")
    fileType: string;
    sun: string;
}

export interface GeneratedFile {
    filePath: string;
    fileContent: string;
    meta: GeneratedFileMeta;
}

export interface IFileWriter {
    generate(
        request: Request,
        sun: string,
        options?: { fs?: import('./fsWrapper').FileSystem },
    ): Promise<GeneratedFile>;
}

export type WriterContext = 'api' | 'mcp';
