import { Router, type IRouter } from "express";
import {
  GetDashboardResponse,
  GetDatabaseHealthResponse,
  GetSystemInfoResponse,
  ListDatabaseTablesResponse,
  ListGeneratorsResponse,
  ListJobsResponse,
  PreviewGeneratorBody,
  PreviewGeneratorResponse,
  RunGeneratorBody,
  RunGeneratorResponse,
} from "@workspace/api-zod";
import {
  dashboard,
  databaseHealth,
  databaseTables,
  generateResource,
  generatorPreview,
  listGenerators,
  listJobs,
  systemInfo,
} from "../lib/railsforge";

const router: IRouter = Router();

router.get("/dashboard", async (_req, res): Promise<void> => {
  res.json(GetDashboardResponse.parse(await dashboard()));
});

router.get("/system", async (_req, res): Promise<void> => {
  res.json(GetSystemInfoResponse.parse(await systemInfo()));
});

router.get("/generators", (_req, res): void => {
  res.json(ListGeneratorsResponse.parse(listGenerators()));
});

router.post("/generators/preview", async (req, res): Promise<void> => {
  const parsed = PreviewGeneratorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid generator input", details: parsed.error.issues.map((issue) => issue.message) });
    return;
  }
  try {
    res.json(PreviewGeneratorResponse.parse(await generatorPreview(parsed.data)));
  } catch (error) {
    req.log.warn({ error }, "Generator preview failed");
    res.status(400).json({ error: error instanceof Error ? error.message : "Unable to preview generator" });
  }
});

router.post("/generators/generate", async (req, res): Promise<void> => {
  const parsed = RunGeneratorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid generator input", details: parsed.error.issues.map((issue) => issue.message) });
    return;
  }
  try {
    res.json(RunGeneratorResponse.parse(await generateResource(parsed.data)));
  } catch (error) {
    req.log.warn({ error }, "Generator execution failed");
    res.status(400).json({ error: error instanceof Error ? error.message : "Unable to generate resource" });
  }
});

router.get("/database/health", async (_req, res): Promise<void> => {
  res.json(GetDatabaseHealthResponse.parse(await databaseHealth()));
});

router.get("/database/tables", async (_req, res): Promise<void> => {
  res.json(ListDatabaseTablesResponse.parse(await databaseTables()));
});

router.get("/jobs", (_req, res): void => {
  res.json(ListJobsResponse.parse(listJobs()));
});

export default router;