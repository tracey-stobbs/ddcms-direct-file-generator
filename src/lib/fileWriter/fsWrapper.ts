export interface FileSystem {
  existsSync(path: string): boolean;
  mkdirSync(path: string, options: { recursive: boolean }): void;
  writeFileSync(path: string, data: string, encoding: string): void;
}

export const nodeFs: FileSystem = {
  existsSync: require("fs").existsSync,
  mkdirSync: require("fs").mkdirSync,
  writeFileSync: require("fs").writeFileSync,
};
