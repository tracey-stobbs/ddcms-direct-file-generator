import express from "express";
import { z } from "zod";
const ConfigSchema = z.object({
  nodeEnv: z.enum(["development", "production", "test"]).default("development"),
  port: z.coerce.number().int().min(1).max(65535).default(3001),
  logLevel: z.enum(["error", "warn", "info", "debug"]).default("info"),
  outputPath: z.string().default("./output"),
  devLogRequests: z.coerce.boolean().default(true),
  devEnableCors: z.coerce.boolean().default(true)
});
function loadConfig() {
  const rawConfig = {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    logLevel: process.env.LOG_LEVEL,
    outputPath: process.env.OUTPUT_PATH,
    devLogRequests: process.env.DEV_LOG_REQUESTS,
    devEnableCors: process.env.DEV_ENABLE_CORS
  };
  try {
    return ConfigSchema.parse(rawConfig);
  } catch (error) {
    console.error("Configuration validation failed:", error);
    process.exit(1);
  }
}
const config = loadConfig();
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["ERROR"] = 0] = "ERROR";
  LogLevel2[LogLevel2["WARN"] = 1] = "WARN";
  LogLevel2[LogLevel2["INFO"] = 2] = "INFO";
  LogLevel2[LogLevel2["DEBUG"] = 3] = "DEBUG";
  return LogLevel2;
})(LogLevel || {});
const LogLevelMap = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
  /* DEBUG */
};
class Logger {
  level;
  constructor() {
    this.level = LogLevelMap[config.logLevel] ?? 2;
  }
  log(level, message, ...args) {
    if (level <= this.level) {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      const levelName = LogLevel[level];
      const prefix = `[${timestamp}] [${levelName}]`;
      switch (level) {
        case 0:
          console.error(prefix, message, ...args);
          break;
        case 1:
          console.warn(prefix, message, ...args);
          break;
        case 2:
          console.info(prefix, message, ...args);
          break;
        case 3:
          console.debug(prefix, message, ...args);
          break;
      }
    }
  }
  error(message, ...args) {
    this.log(0, message, ...args);
  }
  warn(message, ...args) {
    this.log(1, message, ...args);
  }
  info(message, ...args) {
    this.log(2, message, ...args);
  }
  debug(message, ...args) {
    this.log(3, message, ...args);
  }
}
const logger = new Logger();
const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
if (config.devEnableCors && config.nodeEnv === "development") {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });
}
if (config.devLogRequests && config.nodeEnv === "development") {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      body: req.body,
      query: req.query,
      params: req.params
    });
    next();
  });
}
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    environment: config.nodeEnv,
    version: "1.0.0"
  });
});
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    error: "API endpoint not implemented yet"
  });
});
app.use((err, req, res, _next) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: config.nodeEnv === "development" ? err.message : "Internal server error"
  });
});
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found"
  });
});
const server = app.listen(config.port, () => {
  logger.info(`DDCMS Direct File Creator started on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Output directory: ${config.outputPath}`);
});
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});
process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});
export {
  app as default
};
//# sourceMappingURL=app.js.map
