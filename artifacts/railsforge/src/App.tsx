import { useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BookOpen,
  Boxes,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Code2,
  Database,
  FileCode2,
  FolderCog,
  Hammer,
  Layers3,
  LoaderCircle,
  Menu,
  Network,
  Play,
  Plus,
  RefreshCw,
  ServerCog,
  Settings2,
  ShieldCheck,
  Terminal,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import {
  getGetDashboardQueryKey,
  getGetDatabaseHealthQueryKey,
  getGetSystemInfoQueryKey,
  getListDatabaseTablesQueryKey,
  getListGeneratorsQueryKey,
  getListJobsQueryKey,
  useGetDashboard,
  useGetDatabaseHealth,
  useGetSystemInfo,
  useHealthCheck,
  useListDatabaseTables,
  useListGenerators,
  useListJobs,
  usePreviewGenerator,
  useRunGenerator,
} from "@workspace/api-client-react";
import { Route, Switch, useLocation, Router as WouterRouter } from "wouter";

type FieldType = "string" | "text" | "integer" | "decimal" | "boolean" | "date" | "datetime";
type FormField = { name: string; type: FieldType };

const nav = [
  { href: "/", label: "Dashboard", icon: Layers3 },
  { href: "/generators", label: "Generators", icon: Hammer },
  { href: "/database", label: "Database", icon: Database },
  { href: "/jobs", label: "Background Jobs", icon: Zap },
  { href: "/documentation", label: "Documentation", icon: BookOpen },
  { href: "/system", label: "System Info", icon: ServerCog },
];

function AppShell({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const health = useHealthCheck();
  const active = nav.find((item) => item.href === location)?.label ?? "RailsForge";

  return (
    <div className="rf-shell">
      <aside className={`rf-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="rf-brand">
          <div className="rf-brand-mark"><Hammer size={18} strokeWidth={2.5} /></div>
          <div>
            <div className="rf-brand-name">RailsForge</div>
            <div className="rf-brand-version">v0.1.0</div>
          </div>
          <button className="rf-icon-button rf-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <div className="rf-project">
          <div className="rf-project-label">WORKSPACE</div>
          <div className="rf-project-row"><div className="rf-project-dot" /><span>railsforge</span><ChevronRight size={14} /></div>
        </div>
        <nav className="rf-nav" aria-label="Main navigation">
          <div className="rf-nav-label">WORKBENCH</div>
          {nav.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return <button key={item.href} className={`rf-nav-item ${location === item.href ? "is-active" : ""}`} onClick={() => { navigate(item.href); setMobileOpen(false); }}><Icon size={17} /><span>{item.label}</span>{item.href === "/generators" && <span className="rf-nav-count">4</span>}</button>;
          })}
          <div className="rf-nav-label rf-nav-label-lower">REFERENCE</div>
          {nav.slice(4).map((item) => {
            const Icon = item.icon;
            return <button key={item.href} className={`rf-nav-item ${location === item.href ? "is-active" : ""}`} onClick={() => { navigate(item.href); setMobileOpen(false); }}><Icon size={17} /><span>{item.label}</span></button>;
          })}
        </nav>
        <div className="rf-sidebar-bottom">
          <div className="rf-health-mini"><span className={`rf-health-dot ${health.data?.status === "ok" ? "is-good" : ""}`} /><span>API server</span><span className="rf-health-state">{health.data?.status === "ok" ? "online" : "checking"}</span></div>
          <button className="rf-nav-item" onClick={() => navigate("/system")}><Settings2 size={17} /><span>Settings</span></button>
          <div className="rf-user"><div className="rf-avatar">RF</div><div><strong>Local project</strong><span>Development mode</span></div><CircleHelp size={16} /></div>
        </div>
      </aside>
      <div className="rf-main">
        <header className="rf-topbar">
          <button className="rf-icon-button rf-mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="rf-breadcrumb"><span>RailsForge</span><ChevronRight size={14} /><strong>{active}</strong></div>
          <div className="rf-top-actions"><span className="rf-shortcut"><Terminal size={14} /> <kbd>⌘</kbd><kbd>K</kbd></span><button className="rf-icon-button" aria-label="Open documentation"><BookOpen size={17} /></button><div className="rf-top-status"><span className="rf-health-dot is-good" /> Ready</div></div>
        </header>
        <main className="rf-content">{children}</main>
      </div>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="rf-page-header"><div><div className="rf-eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function StatusPill({ value }: { value?: string | null }) {
  const good = value === "success" || value === "ready" || value === "ok" || value === "configured" || value === "schema detected";
  return <span className={`rf-status ${good ? "is-good" : "is-muted"}`}><span className="rf-status-dot" />{value ?? "pending"}</span>;
}

function Metric({ label, value, detail, icon: Icon, tone = "orange" }: { label: string; value: string; detail?: string; icon: typeof Boxes; tone?: string }) {
  return <div className="rf-metric"><div className={`rf-metric-icon tone-${tone}`}><Icon size={17} /></div><div className="rf-metric-copy"><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div></div>;
}

function Dashboard() {
  const { data, isLoading, refetch } = useGetDashboard();
  if (isLoading) return <LoadingState label="Loading project overview" />;
  const overview = data;
  return <div className="rf-page">
    <PageHeader eyebrow="PROJECT OVERVIEW" title="Good morning, developer." description="A clear view of your Rails project health and the tools available to you." action={<button className="rf-button rf-button-ghost" onClick={() => refetch()}><RefreshCw size={15} /> Refresh status</button>} />
    <div className="rf-banner"><div className="rf-banner-icon"><Hammer size={21} /></div><div><strong>Forge better Rails applications.</strong><span>Generate resources safely, inspect your database, and keep background work visible.</span></div><button className="rf-banner-link" onClick={() => window.location.assign("/documentation")}>Read the guide <ArrowUpRight size={15} /></button></div>
    <section className="rf-section"><div className="rf-section-heading"><div><h2>Project health</h2><p>Live signals from this RailsForge workspace.</p></div><StatusPill value={overview?.environment} /></div>
      <div className="rf-metrics-grid">
        <Metric label="Rails version" value={overview?.rails ?? "—"} detail="Runtime detected" icon={Code2} />
        <Metric label="Ruby version" value={overview?.ruby ?? "—"} detail="Runtime detected" icon={FileCode2} tone="purple" />
        <Metric label="Database" value={overview?.database ?? "—"} detail={overview?.migrationStatus} icon={Database} tone="blue" />
        <Metric label="Job processor" value={overview?.jobProcessor?.split(" / ")[0] ?? "—"} detail={overview?.redis} icon={Zap} tone="green" />
      </div>
    </section>
    <div className="rf-dashboard-columns">
      <section className="rf-card"><div className="rf-card-header"><div><h2>Recent activity</h2><p>Actions taken in this workspace.</p></div><Clock3 size={17} className="rf-muted-icon" /></div>
        {(overview?.recentActivity?.length ?? 0) > 0 ? <div className="rf-activity-list">{overview?.recentActivity.map((item) => <div className="rf-activity-row" key={item.id}><div className="rf-activity-icon"><Check size={14} /></div><div><strong>{item.operation}</strong><span>{item.detail}</span></div><time>{relativeTime(item.occurredAt)}</time></div>)}</div> : <EmptyState icon={Clock3} title="No activity yet" description="Run a generator or inspect a project to see activity here." />}
      </section>
      <section className="rf-card"><div className="rf-card-header"><div><h2>Available tools</h2><p>Start with a focused workflow.</p></div><Boxes size={17} className="rf-muted-icon" /></div><div className="rf-tool-list">
        {([
          ["API resource", "Build a versioned CRUD endpoint", "/generators", Hammer],
          ["Database explorer", "Inspect tables and migrations", "/database", Database],
          ["Job examples", "Learn the queue patterns", "/jobs", Zap],
        ] as [string, string, string, LucideIcon][]).map(([title, desc, href, Icon]) => <button className="rf-tool-row" key={title} onClick={() => window.location.assign(href)}><span className="rf-tool-icon"><Icon size={16} /></span><span><strong>{title}</strong><small>{desc}</small></span><ArrowUpRight size={15} /></button>)}
      </div></section>
    </div>
  </div>;
}

function GeneratorPage() {
  const queryClient = useQueryClient();
  const { data: generators, isLoading } = useListGenerators();
  const [resourceName, setResourceName] = useState("Product");
  const [namespace, setNamespace] = useState("Api::V1");
  const [crud, setCrud] = useState(true);
  const [timestamps, setTimestamps] = useState(true);
  const [fields, setFields] = useState<FormField[]>([{ name: "name", type: "string" }, { name: "price", type: "decimal" }, { name: "active", type: "boolean" }]);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState("");
  const previewMutation = usePreviewGenerator({ mutation: { onSuccess: (result) => { setPreview(result); setError(""); }, onError: (issue) => setError(issue instanceof Error ? issue.message : "Unable to preview this resource.") } });
  const runMutation = useRunGenerator({ mutation: { onSuccess: (result) => { setPreview({ ...preview, files: result.files }); setError(""); queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); }, onError: (issue) => setError(issue instanceof Error ? issue.message : "Unable to generate this resource.") } });
  const input = useMemo(() => ({ resourceName, fields, crud, namespace, timestamps }), [resourceName, fields, crud, namespace, timestamps]);
  const previewIt = () => previewMutation.mutate({ data: input });
  const addField = () => setFields((current) => [...current, { name: `field_${current.length + 1}`, type: "string" }]);
  return <div className="rf-page">
    <PageHeader eyebrow="GENERATOR WORKBENCH" title="Generate with confidence." description="Preview every file before RailsForge writes it. Generated output is kept in a safe workspace for review." action={<div className="rf-page-actions"><button className="rf-button rf-button-ghost" onClick={() => { setPreview(null); setError(""); }}><RefreshCw size={15} /> Reset</button><button className="rf-button rf-button-primary" onClick={previewIt} disabled={previewMutation.isPending}><Play size={15} /> {previewMutation.isPending ? "Previewing..." : "Preview changes"}</button></div>} />
    <div className="rf-generator-layout">
      <section className="rf-card rf-form-card"><div className="rf-card-header"><div><h2>API resource</h2><p>Define the shape of the Rails resource you need.</p></div><span className="rf-step">01</span></div>
        <label className="rf-label">Resource name<input className="rf-input" value={resourceName} onChange={(event) => setResourceName(event.target.value)} placeholder="Product" /></label>
        <label className="rf-label">API namespace<input className="rf-input" value={namespace} onChange={(event) => setNamespace(event.target.value)} placeholder="Api::V1" /></label>
        <div className="rf-field-heading"><div><span className="rf-label">Fields</span><small>Use Rails types</small></div><button className="rf-small-button" onClick={addField}><Plus size={14} /> Add field</button></div>
        <div className="rf-fields">{fields.map((field, index) => <div className="rf-field-row" key={`${index}-${field.name}`}><input className="rf-input" value={field.name} onChange={(event) => setFields((current) => current.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} /><select className="rf-input rf-select" value={field.type} onChange={(event) => setFields((current) => current.map((item, i) => i === index ? { ...item, type: event.target.value as FieldType } : item))}>{["string", "text", "integer", "decimal", "boolean", "date", "datetime"].map((type) => <option value={type} key={type}>{type}</option>)}</select><button className="rf-icon-button rf-danger-icon" onClick={() => setFields((current) => current.filter((_, i) => i !== index))} aria-label={`Remove ${field.name}`}><Trash2 size={15} /></button></div>)}</div>
        <div className="rf-checks"><label><input type="checkbox" checked={crud} onChange={(event) => setCrud(event.target.checked)} /><span>Include CRUD actions</span></label><label><input type="checkbox" checked={timestamps} onChange={(event) => setTimestamps(event.target.checked)} /><span>Add timestamps</span></label></div>
        {isLoading ? <div className="rf-inline-note"><LoaderCircle size={14} className="rf-spin" /> Loading generator catalog</div> : <div className="rf-generator-catalog"><span className="rf-label">Available generators</span>{generators?.map((generator) => <div className="rf-catalog-row" key={generator.id}><span className="rf-catalog-dot" /><span>{generator.name}</span><StatusPill value={generator.status} /></div>)}</div>}
      </section>
      <section className="rf-card rf-preview-card"><div className="rf-card-header"><div><h2>Generation preview</h2><p>Nothing is written until you explicitly apply it.</p></div><span className="rf-step">02</span></div>
        {error && <div className="rf-error"><X size={15} />{error}</div>}
        {!preview ? <div className="rf-preview-empty"><div className="rf-empty-orbit"><FileCode2 size={22} /></div><h3>Preview your first resource</h3><p>RailsForge will show files, routes, migration changes, and conflicts here.</p><button className="rf-button rf-button-primary" onClick={previewIt} disabled={previewMutation.isPending}>{previewMutation.isPending ? "Building preview..." : "Build preview"}</button></div> : <div className="rf-preview-body"><div className="rf-preview-summary"><div><span>RESOURCE</span><strong>{preview.resourceName}</strong></div><div><span>FILES</span><strong>{preview.files.length}</strong></div><div><span>CONFLICTS</span><strong className={preview.files.some((file: any) => file.action === "conflict") ? "rf-text-danger" : ""}>{preview.files.filter((file: any) => file.action === "conflict").length}</strong></div></div><div className="rf-file-list">{preview.files.map((file: any) => <div className="rf-file-row" key={file.path}><span className={`rf-file-state ${file.action}`}><FileCode2 size={14} /></span><code>{file.path}</code><span>{file.action}</span></div>)}</div><div className="rf-code-block"><div className="rf-code-top"><span>config/routes.rb</span><span>Ruby</span></div><pre>{preview.routes}</pre></div><div className="rf-warning"><ShieldCheck size={15} /><span>{preview.warnings?.[0]}</span></div><button className="rf-button rf-button-primary rf-apply-button" onClick={() => runMutation.mutate({ data: input })} disabled={runMutation.isPending || preview.files.some((file: any) => file.action === "conflict")}><Check size={15} />{runMutation.isPending ? "Generating files..." : "Generate files"}</button></div>}
      </section>
    </div>
  </div>;
}

function DatabasePage() {
  const health = useGetDatabaseHealth();
  const tables = useListDatabaseTables();
  return <div className="rf-page"><PageHeader eyebrow="DATABASE UTILITIES" title="Know what your app knows." description="Inspect the connection state and schema surface before you touch a migration." action={<button className="rf-button rf-button-ghost" onClick={() => { void health.refetch(); void tables.refetch(); }}><RefreshCw size={15} /> Refresh</button>} /><div className="rf-health-grid"><div className="rf-card rf-health-hero"><div className="rf-card-header"><div><h2>Connection health</h2><p>Safe metadata only. Credentials are never displayed.</p></div><StatusPill value={health.data?.status} /></div><div className="rf-health-big"><div className={`rf-health-ring ${health.data?.status === "configured" ? "is-good" : ""}`}><Database size={26} /></div><div><strong>{health.data?.status === "configured" ? "PostgreSQL connected" : "PostgreSQL not configured"}</strong><span>{health.data?.environment ?? "development"} environment</span></div></div><div className="rf-health-details"><div><span>Adapter</span><strong>{health.data?.adapter ?? "—"}</strong></div><div><span>Host</span><strong>{health.data?.host ?? "—"}</strong></div><div><span>Port</span><strong>{health.data?.port ?? "—"}</strong></div><div><span>Tables detected</span><strong>{health.data?.tables ?? 0}</strong></div></div></div><div className="rf-card rf-insight-card"><div className="rf-insight-icon"><ShieldCheck size={18} /></div><h3>Safe by default</h3><p>RailsForge masks sensitive connection details and reads schema metadata without exposing passwords or connection strings.</p><button className="rf-text-button" onClick={() => window.location.assign("/documentation")}>Read database docs <ArrowUpRight size={14} /></button></div></div><section className="rf-card rf-table-card"><div className="rf-card-header"><div><h2>Tables</h2><p>Tables found in the current Rails project schema.</p></div><span className="rf-count">{tables.data?.length ?? 0}</span></div>{(tables.data?.length ?? 0) > 0 ? <div className="rf-data-table"><div className="rf-table-head"><span>Table</span><span>Rows</span><span>Size</span><span>Indexes</span></div>{tables.data?.map((table) => <div className="rf-table-row" key={table.name}><strong>{table.name}</strong><span>{table.rows}</span><span>{table.size}</span><span>{table.indexes}</span></div>)}</div> : <EmptyState icon={Database} title="No schema detected" description="Add a Rails project schema.rb to this workspace, then refresh to inspect its tables." />}</section></div>;
}

function JobsPage() {
  const { data: jobs, isLoading } = useListJobs();
  return <div className="rf-page"><PageHeader eyebrow="BACKGROUND JOBS" title="Make async work visible." description="Patterns for Active Job and Sidekiq that keep request cycles fast and failures explainable." action={<button className="rf-button rf-button-primary" onClick={() => window.location.assign("/documentation")}><BookOpen size={15} /> Read job guide</button>} /><div className="rf-job-intro"><div className="rf-job-intro-icon"><Zap size={21} /></div><div><strong>Active Job is the boundary. Sidekiq is the engine.</strong><p>These examples are intentionally small and production-minded: queue selection, retries, logging, and idempotency are part of the shape.</p></div></div><section className="rf-card"><div className="rf-card-header"><div><h2>Example jobs</h2><p>Ready-to-copy patterns for a Rails application.</p></div><span className="rf-count">{jobs?.length ?? 0}</span></div>{isLoading ? <LoadingState label="Loading job examples" /> : <div className="rf-jobs-grid">{jobs?.map((job) => <div className="rf-job-card" key={job.name}><div className="rf-job-card-top"><div className="rf-job-icon"><Code2 size={15} /></div><StatusPill value={job.status} /></div><h3>{job.name}</h3><p>{job.description}</p><div className="rf-job-meta"><span><Network size={13} />{job.queue}</span><span><RefreshCw size={13} />{job.retries}</span></div></div>)}</div>}</section></div>;
}

function DocsPage() {
  const sections = [["Getting started", "Use RailsForge to preview changes before they land in your project."], ["CLI", "railsforge help\nrailsforge doctor\nrailsforge api Product --fields name:string price:decimal --crud"], ["Authentication", "railsforge auth preview\nrailsforge auth install"], ["Database", "railsforge db:health\nrailsforge db:tables\nrailsforge db:backup"], ["Background jobs", "railsforge jobs:list\nrailsforge jobs:install\nrailsforge jobs:run ExampleJob"], ["Safety", "Preview is the default. Conflicting files are never overwritten silently. Generated output is staged under tmp/railsforge/generated until you review it."]];
  return <div className="rf-page"><PageHeader eyebrow="DOCUMENTATION" title="The RailsForge field guide." description="Short, practical notes for moving from a blank Rails project to a deliberate foundation." action={<button className="rf-button rf-button-ghost" onClick={() => window.open("https://guides.rubyonrails.org/", "_blank")}><ArrowUpRight size={15} /> Rails guides</button>} /><div className="rf-docs-layout"><aside className="rf-doc-nav"><span>ON THIS PAGE</span>{sections.map(([title]) => <button key={title}>{title}<ChevronRight size={14} /></button>)}</aside><div className="rf-docs-content">{sections.map(([title, body], index) => <article className="rf-doc-section" key={title}><div className="rf-doc-number">0{index + 1}</div><div><h2>{title}</h2>{body.includes("\n") ? <pre className="rf-doc-code">{body}</pre> : <p>{body}</p>}</div></article>)}</div></div></div>;
}

function SystemPage() {
  const { data, isLoading, refetch } = useGetSystemInfo();
  const rows = data ? [["RailsForge version", data.version], ["Ruby", data.ruby], ["Rails", data.rails], ["Node", data.node], ["Database adapter", data.databaseAdapter], ["Database status", data.databaseStatus], ["Redis status", data.redisStatus], ["Job adapter", data.jobAdapter], ["Environment", data.environment], ["Platform", data.platform]] : [];
  return <div className="rf-page"><PageHeader eyebrow="SYSTEM INFO" title="Know the environment." description="Runtime details and service readiness for the current development workspace." action={<button className="rf-button rf-button-ghost" onClick={() => refetch()}><RefreshCw size={15} /> Refresh</button>} /><div className="rf-system-layout"><section className="rf-card"><div className="rf-card-header"><div><h2>Runtime details</h2><p>Values are detected from the current process.</p></div><ServerCog size={18} className="rf-muted-icon" /></div>{isLoading ? <LoadingState label="Reading runtime details" /> : <div className="rf-system-list">{rows.map(([label, value]) => <div className="rf-system-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>}</section><section className="rf-card rf-system-note"><div className="rf-insight-icon"><FolderCog size={18} /></div><h3>Configuration stays local</h3><p>RailsForge keeps project defaults in configuration files and expects secrets to come from the environment, never from generated code.</p><div className="rf-config-line"><code>config/railsforge.yml</code><span>planned</span></div><div className="rf-config-line"><code>RAILS_ENV</code><span>environment variable</span></div></section></div></div>;
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof Database; title: string; description: string }) {
  return <div className="rf-empty-state"><Icon size={22} /><h3>{title}</h3><p>{description}</p></div>;
}

function LoadingState({ label }: { label: string }) {
  return <div className="rf-loading"><LoaderCircle size={20} className="rf-spin" /><span>{label}</span></div>;
}

function relativeTime(value: string) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  return minutes < 60 ? `${minutes}m ago` : `${Math.floor(minutes / 60)}h ago`;
}

function Router() {
  return <AppShell><Switch><Route path="/" component={Dashboard} /><Route path="/generators" component={GeneratorPage} /><Route path="/database" component={DatabasePage} /><Route path="/jobs" component={JobsPage} /><Route path="/documentation" component={DocsPage} /><Route path="/system" component={SystemPage} /><Route component={() => <EmptyState icon={CircleHelp} title="Page not found" description="That RailsForge route does not exist." />} /></Switch></AppShell>;
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><Router /></WouterRouter></QueryClientProvider>;
}