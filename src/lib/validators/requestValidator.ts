import { Request } from "../types";

export function validateRequest(request: Request): string[] {
  const errors: string[] = [];
  if (!request.fileType) errors.push("fileType is required");
  if (typeof request.canInlineEdit !== "boolean") errors.push("canInlineEdit must be boolean");
  // Add more validation as needed
  return errors;
}
