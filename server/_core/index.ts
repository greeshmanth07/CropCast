import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  app.post("/api/forecast", async (req, res) => {
    try {
      const crop = req.body?.crop || "Tomato";
      const market = req.body?.market || "Guntur";
      const { getPriceForecast } = await import("../forecast/forecast.service");
      const forecast = await getPriceForecast(crop, market);
      res.json(forecast);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to generate price forecast" });
    }
  });

  app.get("/api/forecast/metrics", async (req, res) => {
    try {
      const crop = (req.query.crop as string) || "Tomato";
      const market = (req.query.market as string) || "Guntur";
      const { getValidationMetrics } = await import("../forecast/forecast.service");
      const metrics = await getValidationMetrics(crop, market);
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve validation metrics" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
