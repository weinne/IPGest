import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  // For API routes, only use the /api prefix
  app.use("/api", async (req, res, next) => {
    try {
      // Check if this is an API route
      const server = await registerRoutes(app);
      next();
    } catch (err) {
      next(err);
    }
  });

  // API error handler
  app.use("/api", (err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error(err);
  });

  // Static files for uploads
  app.use('/uploads', express.static('uploads'));

  // Setup frontend serving - either Vite dev server or static files
  if (app.get("env") === "development") {
    const server = await registerRoutes(app);
    await setupVite(app, server);

    server.listen({
      port: 5000,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port 5000`);
    });
  } else {
    const server = await registerRoutes(app);
    serveStatic(app);

    server.listen({
      port: 5000,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port 5000`);
    });
  }
})();