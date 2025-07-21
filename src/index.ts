
import type { Request, Response, NextFunction } from "express";
import type { Request as FileRequest, SuccessResponse, ErrorResponse } from "./lib/types";
import express from "express";
import { logRequest, logError, logResponse } from "./lib/utils/logger";
import { getFileGenerator } from "./lib/fileType/factory";
import { nodeFs } from "./lib/fileWriter/fsWrapper";

const app = express();
app.use(express.json());
app.use(logRequest);

app.post("/api/generate", async (req: Request, res: Response) => {
  try {
    const request = req.body;
    const generator = getFileGenerator(request.fileType);
    const filePath = await generator(request, nodeFs);
    // Return relative file path for API response
    const relFilePath = filePath.replace(process.cwd() + require('path').sep, '').replace(/\\/g, '/');
    const response = { success: true, filePath: relFilePath };
    logResponse(res, response);
    return res.status(200).json(response);
  } catch (err) {
    logError(err as Error, req);
    const response = { success: false, error: "An error occurred while generating the file." };
    logResponse(res, response);
    return res.status(500).json(response);
  }
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logError(err, req);
  const response = { success: false, error: err.message };
  logResponse(res, response);
  res.status(500).json(response);
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
  });
}

export default app; // Export the app for testing purposes
