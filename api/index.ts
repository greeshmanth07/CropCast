import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();

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

    const { getPriceForecast } = await import("../server/forecast/service");

    const forecast = await getPriceForecast(crop, market);

    res.json(forecast);
  } catch (err: any) {
    console.error("Forecast error:", err);

    res.status(500).json({
      error: err?.message || "Failed to generate price forecast",
    });
  }
});

app.get("/api/forecast/metrics", async (req, res) => {
  try {
    const crop = (req.query.crop as string) || "Tomato";
    const market = (req.query.market as string) || "Guntur";

    const { getValidationMetrics } = await import(
      "../server/forecast/service"
    );

    const metrics = await getValidationMetrics(crop, market);

    res.json(metrics);
  } catch (err: any) {
    console.error("Metrics error:", err);

    res.status(500).json({
      error: err?.message || "Failed to retrieve validation metrics",
    });
  }
});

export default app;