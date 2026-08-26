import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { getPriceForecast, getValidationMetrics } from "./forecast/service";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const trpcHandler = createExpressMiddleware({
  router: appRouter,
  createContext,
  onError({ error, path }) {
    console.error(`[tRPC error on ${path}]:`, error);
  },
});

app.use("/api/trpc", trpcHandler);
app.use("/trpc", trpcHandler);

app.post(["/api/forecast", "/forecast"], async (req, res) => {
  try {
    const crop = req.body?.crop || "Tomato";
    const market = req.body?.market || "Guntur";
    const forecast = await getPriceForecast(crop, market);
    res.json(forecast);
  } catch (err: any) {
    console.error("Forecast error:", err);
    res.status(500).json({
      error: err?.message || "Failed to generate price forecast",
    });
  }
});

app.get(["/api/forecast/metrics", "/forecast/metrics"], async (req, res) => {
  try {
    const crop = (req.query.crop as string) || "Tomato";
    const market = (req.query.market as string) || "Guntur";
    const metrics = await getValidationMetrics(crop, market);
    res.json(metrics);
  } catch (err: any) {
    console.error("Metrics error:", err);
    res.status(500).json({
      error: err?.message || "Failed to retrieve validation metrics",
    });
  }
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Serverless Error]", err);
  res.status(500).json({
    error: err?.message || "A server error occurred",
  });
});

export default app;