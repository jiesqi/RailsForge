import { access, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  GetDashboardResponse,
  GetDatabaseHealthResponse,
  GetSystemInfoResponse,
  ListDatabaseTablesResponse,
  ListGeneratorsResponse,
  ListJobsResponse,
  PreviewGeneratorResponse,
  RunGeneratorBody,
  RunGeneratorResponse,
} from "@workspace/api-zod";
import type { GeneratorInput } from "@workspace/api-zod";

const PROJECT_ROOT = process.cwd();
const OUTPUT_ROOT = path.join(PROJECT_ROOT, "tmp", "railsforge", "generated");
const VERSION = "0.1.0";

type GeneratedFile = {
  path: string;
  action: "create" | "modify" | "conflict";
  content: string;
};

const activity: Array<{
  id: string;
  operation: string;
  status: string;
  detail: string;
  occurredAt: string;
}> = [];

const generators = [
  {
    id: "authentication",
    name: "Authentication Starter",
    description: "Secure sessions, password reset architecture, and protected routes.",
    status: "ready",
    output: "User model, sessions, registrations, tests",
  },
  {
    id: "api-resource",
    name: "API Resource",
    description: "A versioned JSON resource with validation, CRUD, and request tests.",
    status: "ready",
    output: "Model, migration, controller, routes, specs",
  },
  {
    id: "job",
    name: "Background Job",
    description: "An Active Job class with queue selection, retries, and idempotency notes.",
    status: "ready",
    output: "Job class, adapter configuration, tests",
  },
  {
    id: "serializer",
    name: "Serializer / Presenter",
    description: "A focused response boundary for public API fields.",
    status: "ready",
    output: "Serializer class and request coverage",
  },
] as const;

const jobs = [
  {
    name: "EmailJob",
    queue: "mailers",
    retries: "3 attempts",
    description: "Deliver transactional mail without blocking the request.",
    status: "ready",
  },
  {
    name: "CleanupJob",
    queue: "maintenance",
    retries: "1 attempt",
    description: "Remove expired records with an idempotent time window.",
    status: "ready",
  },
  {
    name: "DataExportJob",
    queue: "exports",
    retries: "5 attempts",
    description: "Build a user-scoped export and persist its status.",
    status: "ready",
  },
  {
    name: "ReportGenerationJob",
    queue: "reports",
    retries: "3 attempts",
    description: "Generate a report artifact outside the web request.",
    status: "ready",
  },
  {
    name: "NotificationJob",
    queue: "default",
    retries: "3 attempts",
    description: "Fan out user notifications through a single job boundary.",
    status: "ready",
  },
  {
    name: "WebhookJob",
    queue: "webhooks",
    retries: "8 attempts",
    description: "Deliver signed webhooks with exponential backoff.",
    status: "ready",
  },
] as const;

function recordActivity(operation: string, detail: string, status = "success") {
  const entry = {
    id: `${Date.now()}-${activity.length + 1}`,
    operation,
    status,
    detail,
    occurredAt: new Date().toISOString(),
  };
  activity.unshift(entry);
  return entry;
}

function snakeCase(value: string) {
  return value
    .replace(/([a-z\d])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

function pluralize(value: string) {
  if (value.endsWith("y") && !/[aeiou]y$/.test(value)) {
    return `${value.slice(0, -1)}ies`;
  }
  if (value.endsWith("s")) return `${value}es`;
  return `${value}s`;
}

function className(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function rubyType(type: string) {
  return {
    string: "string",
    text: "text",
    integer: "integer",
    decimal: "decimal",
    boolean: "boolean",
    date: "date",
    datetime: "datetime",
  }[type] ?? "string";
}

function migrationType(type: string) {
  return {
    string: "string",
    text: "text",
    integer: "integer",
    decimal: "decimal",
    boolean: "boolean",
    date: "date",
    datetime: "datetime",
  }[type] ?? "string";
}

function namespaceParts(namespace: string) {
  return namespace.split("::").filter(Boolean);
}

function namespacePath(namespace: string) {
  return namespaceParts(namespace).map(snakeCase).join("/");
}

function buildFiles(input: GeneratorInput): GeneratedFile[] {
  const model = className(input.resourceName);
  const resource = snakeCase(input.resourceName);
  const collection = pluralize(resource);
  const namespace = namespaceParts(input.namespace);
  const namespacedModel = [...namespace, model].join("::");
  const controllerModel = className(collection);
  const controllerClass = `${namespace.join("::")}::${controllerModel}Controller`;
  const controllerDir = namespacePath(input.namespace);
  const base = controllerDir ? `app/controllers/${controllerDir}` : "app/controllers";
  const specBase = controllerDir ? `spec/requests/${controllerDir}` : "spec/requests";
  const migrationName = `${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}_create_${collection}.rb`;
  const fields = input.fields
    .map((field) => `      t.${migrationType(field.type)} :${snakeCase(field.name)}`)
    .join("\n");
  const modelFields = input.fields
    .map((field) => `  validates :${snakeCase(field.name)}, presence: true`)
    .join("\n");
  const schemaFields = input.fields
    .map((field) => `      ${snakeCase(field.name)}: record.${snakeCase(field.name)}`)
    .join(",\n");
  const params = input.fields.map((field) => `:${snakeCase(field.name)}`).join(", ");
  const timestampLine = input.timestamps ? "      t.timestamps" : "";
  const crudMethods = input.crud
    ? [
        "    def update",
        `      record = ${namespacedModel}.find(params[:id])`,
        `      if record.update(${resource}_params)`,
        "        render json: record",
        "      else",
        "        render json: { errors: record.errors }, status: :unprocessable_entity",
        "      end",
        "    end",
        "",
        "    def destroy",
        `      ${namespacedModel}.find(params[:id]).destroy!`,
        "      head :no_content",
        "    end",
        "",
      ]
    : [];
  const controller = [
    ...namespace.map((part) => `module ${part}`),
    `  class ${controllerModel}Controller < ApplicationController`,
    "    def index",
    `      records = ${namespacedModel}.all`,
    "      render json: records",
    "    end",
    "",
    "    def show",
    `      render json: ${namespacedModel}.find(params[:id])`,
    "    end",
    "",
    "    def create",
    `      record = ${namespacedModel}.new(${resource}_params)`,
    "      if record.save",
    "        render json: record, status: :created",
    "      else",
    "        render json: { errors: record.errors }, status: :unprocessable_entity",
    "      end",
    "    end",
    "",
    ...crudMethods,
    "    private",
    "",
    `    def ${resource}_params`,
    `      params.require(:${resource}).permit(${params})`,
    "    end",
    "  end",
    ...namespace.map(() => "end"),
  ].join("\n");
  const serializer = [
    `class ${model}Serializer`,
    "  def self.call(record)",
    "    {",
    schemaFields || "      id: record.id",
    "    }",
    "  end",
    "end",
  ].join("\n");
  const files: GeneratedFile[] = [
    {
      path: `app/models/${resource}.rb`,
      action: "create",
      content: `class ${model} < ApplicationRecord\n${modelFields || "  # Add validations for your domain fields."}\nend\n`,
    },
    {
      path: `db/migrate/${migrationName}`,
      action: "create",
      content: `class Create${model} < ActiveRecord::Migration[7.1]\n  def change\n    create_table :${collection} do |t|\n${fields || "      # Add columns with --fields."}${fields && timestampLine ? "\n" : ""}${timestampLine}\n    end\n  end\nend\n`,
    },
    { path: `${base}/${collection}_controller.rb`, action: "create", content: `${controller}\n` },
    { path: `app/serializers/${resource}_serializer.rb`, action: "create", content: `${serializer}\n` },
    {
      path: `${specBase}/${collection}_spec.rb`,
      action: "create",
      content: `require "rails_helper"\n\nRSpec.describe "${controllerClass}", type: :request do\n  describe "GET /${collection}" do\n    it "returns a collection" do\n      get "/api/v1/${collection}"\n      expect(response).to have_http_status(:ok)\n    end\n  end\nend\n`,
    },
    {
      path: `spec/models/${resource}_spec.rb`,
      action: "create",
      content: `require "rails_helper"\n\nRSpec.describe ${model}, type: :model do\n  it "is valid with generated fields" do\n    record = described_class.new\n    expect(record).to respond_to(:${snakeCase(input.fields[0]?.name ?? "id")})\n  end\nend\n`,
    },
    { path: "config/routes.rb", action: "modify", content: `namespace :api do\n  namespace :v1 do\n    resources :${collection}\n  end\nend\n` },
    {
      path: `docs/api/${collection}.md`,
      action: "create",
      content: `# ${model} API\n\nGenerated by RailsForge.\n\n- GET /api/v1/${collection}\n- GET /api/v1/${collection}/:id\n- POST /api/v1/${collection}\n${input.crud ? `- PATCH /api/v1/${collection}/:id\n- DELETE /api/v1/${collection}/:id\n` : ""}\nGenerated fields: ${input.fields.map((field) => `\`${snakeCase(field.name)}\` (${rubyType(field.type)})`).join(", ") || "none"}.\n`,
    },
  ];
  return files;
}

async function conflictsFor(files: GeneratedFile[]) {
  return Promise.all(
    files.map(async (file) => {
      const target = path.join(OUTPUT_ROOT, file.path);
      try {
        await access(target);
        return { ...file, action: "conflict" as const };
      } catch {
        return file;
      }
    }),
  );
}

export async function generatorPreview(input: GeneratorInput) {
  const files = await conflictsFor(buildFiles(input));
  return PreviewGeneratorResponse.parse({
    resourceName: className(input.resourceName),
    files,
    migration: files.find((file) => file.path.startsWith("db/migrate/"))?.path ?? "",
    routes: files.find((file) => file.path === "config/routes.rb")?.content ?? "",
    warnings: [
      "Generation writes to tmp/railsforge/generated until a Rails project workspace is configured.",
      "Review the routes and strong parameters before committing generated code.",
      ...(files.some((file) => file.action === "conflict")
        ? ["One or more files already exist in the generation workspace."]
        : []),
    ],
  });
}

export async function generateResource(input: GeneratorInput) {
  const preview = await generatorPreview(input);
  const conflicts = preview.files.filter((file) => file.action === "conflict");
  if (conflicts.length > 0) {
    throw new Error(`Generation stopped: ${conflicts.map((file) => file.path).join(", ")} already exist.`);
  }

  await Promise.all(
    preview.files.map(async (file) => {
      const target = path.join(OUTPUT_ROOT, file.path);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, file.content, "utf8");
    }),
  );

  const entry = recordActivity(
    "API resource generated",
    `${preview.resourceName} generated ${preview.files.length} files`,
  );
  return RunGeneratorResponse.parse({ generated: true, files: preview.files, activity: entry });
}

export function listGenerators() {
  return ListGeneratorsResponse.parse(generators);
}

export function listJobs() {
  return ListJobsResponse.parse(jobs);
}

async function projectTables() {
  const schemaPath = path.join(PROJECT_ROOT, "db", "schema.rb");
  try {
    const schema = await stat(schemaPath);
    if (!schema.isFile()) return [];
    const content = await (await import("node:fs/promises")).readFile(schemaPath, "utf8");
    return [...content.matchAll(/create_table "([^"]+)"/g)].map((match) => match[1]);
  } catch {
    return [];
  }
}

export async function databaseTables() {
  const names = await projectTables();
  return ListDatabaseTablesResponse.parse(
    await Promise.all(
      names.map(async (name) => {
        const migrationDir = path.join(PROJECT_ROOT, "db", "migrate");
        let indexes = 0;
        try {
          const files = await readdir(migrationDir);
          indexes = files.filter((file) => file.includes(name)).length;
        } catch {
          indexes = 0;
        }
        return { name, rows: 0, size: "schema only", indexes };
      }),
    ),
  );
}

export async function databaseHealth() {
  const configured = Boolean(process.env.DATABASE_URL);
  const tables = await databaseTables();
  return GetDatabaseHealthResponse.parse({
    status: configured ? "configured" : "not configured",
    adapter: "PostgreSQL",
    database: process.env.PGDATABASE ?? "not configured",
    host: process.env.PGHOST ?? "not configured",
    port: Number(process.env.PGPORT ?? 5432),
    environment: process.env.NODE_ENV ?? "development",
    tables: tables.length,
  });
}

export async function systemInfo() {
  const database = await databaseHealth();
  return GetSystemInfoResponse.parse({
    version: VERSION,
    ruby: "Not detected",
    rails: "Not detected",
    node: process.version,
    databaseAdapter: database.adapter,
    databaseStatus: database.status,
    redisStatus: process.env.REDIS_URL ? "configured" : "not configured",
    jobAdapter: "Active Job / Sidekiq ready",
    environment: process.env.NODE_ENV ?? "development",
    platform: `${process.platform} ${process.arch}`,
  });
}

export async function dashboard() {
  const database = await databaseHealth();
  return GetDashboardResponse.parse({
    version: VERSION,
    environment: process.env.NODE_ENV ?? "development",
    ruby: "Not detected",
    rails: "Not detected",
    database: database.status,
    redis: process.env.REDIS_URL ? "configured" : "not configured",
    jobProcessor: "Active Job / Sidekiq ready",
    migrationStatus: database.tables > 0 ? "schema detected" : "not configured",
    generatorCount: generators.length,
    recentActivity: activity.slice(0, 8),
  });
}

export function healthActivity() {
  return activity;
}